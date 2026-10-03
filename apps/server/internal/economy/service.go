package economy

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/auth"
)

// Service owns money movement. Every purchase is one Postgres TX:
// lock player + stock → check funds → mutate → ledger entries → commit.
// Client never sets balances directly (guide.md §40).
type Service struct {
	DB *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service { return &Service{DB: db} }

func (s *Service) Routes(requireAuth func(http.HandlerFunc) http.HandlerFunc, mux interface {
	Get(string, http.HandlerFunc)
	Post(string, http.HandlerFunc)
}) {
	mux.Get("/api/wallet", requireAuth(s.handleWallet))
	mux.Get("/api/shops", s.handleShops)
	mux.Get("/api/shops/{id}", s.handleShop)
	mux.Post("/api/purchases", requireAuth(s.handlePurchase))
}

type Receipt struct {
	TransactionID    string `json:"transactionId"`
	ShopID           string `json:"shopId"`
	ItemID           string `json:"itemId"`
	PriceKobo        int64  `json:"priceKobo"`
	NewBalanceKobo   int64  `json:"newBalanceKobo"`
	NewQty           int    `json:"newQty"`
	IdempotentReplay bool   `json:"idempotentReplay,omitempty"`
}

func (s *Service) handleWallet(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var balance int64
	var home, displayName string
	if err := s.DB.QueryRow(ctx, `SELECT balance_kobo, home, display_name FROM players WHERE user_id=$1`, uid).Scan(&balance, &home, &displayName); err != nil {
		http.Error(w, "player not found", http.StatusNotFound)
		return
	}
	inv, _ := s.inventory(ctx, uid)
	txs, _ := s.recentTx(ctx, uid)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"balanceKobo": balance, "home": home, "displayName": displayName,
		"inventory": inv, "recent": txs,
	})
}

func (s *Service) inventory(ctx context.Context, uid string) ([]map[string]interface{}, error) {
	rows, err := s.DB.Query(ctx, `SELECT pi.item_id, pi.qty, i.name, i.price_kobo FROM player_inventory pi JOIN items i ON i.id=pi.item_id WHERE pi.user_id=$1`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []map[string]interface{}{}
	for rows.Next() {
		var id, name string
		var qty int
		var price int64
		_ = rows.Scan(&id, &qty, &name, &price)
		out = append(out, map[string]interface{}{"itemId": id, "qty": qty, "name": name, "priceKobo": price})
	}
	return out, nil
}

func (s *Service) recentTx(ctx context.Context, uid string) ([]map[string]interface{}, error) {
	rows, err := s.DB.Query(ctx, `SELECT id, type, status, metadata, created_at FROM transactions WHERE metadata->>'user_id'=$1 ORDER BY created_at DESC LIMIT 10`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []map[string]interface{}{}
	for rows.Next() {
		var id, typ, status string
		var meta map[string]interface{}
		var at time.Time
		_ = rows.Scan(&id, &typ, &status, &meta, &at)
		out = append(out, map[string]interface{}{"id": id, "type": typ, "status": status, "metadata": meta, "at": at})
	}
	return out, nil
}

type shopOut struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Zone string `json:"zone"`
	Kind string `json:"kind"`
	Open bool   `json:"open"`
	Menu []menuItem `json:"menu,omitempty"`
}

type menuItem struct {
	ItemID    string `json:"itemId"`
	Name      string `json:"name"`
	PriceKobo int64  `json:"priceKobo"`
	Qty       int    `json:"qty"`
}

func (s *Service) handleShops(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, _ := s.DB.Query(ctx, `SELECT id, name, zone, kind, open FROM shops ORDER BY id`)
	defer rows.Close()
	out := []shopOut{}
	for rows.Next() {
		var sh shopOut
		_ = rows.Scan(&sh.ID, &sh.Name, &sh.Zone, &sh.Kind, &sh.Open)
		out = append(out, sh)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (s *Service) handleShop(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	id := chi.URLParam(r, "id")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var sh shopOut
	if err := s.DB.QueryRow(ctx, `SELECT id, name, zone, kind, open FROM shops WHERE id=$1`, id).Scan(&sh.ID, &sh.Name, &sh.Zone, &sh.Kind, &sh.Open); err != nil {
		http.Error(w, "shop not found", http.StatusNotFound)
		return
	}
	rows, _ := s.DB.Query(ctx, `SELECT s.item_id, i.name, i.price_kobo, s.qty FROM shop_stock s JOIN items i ON i.id=s.item_id WHERE s.shop_id=$1 ORDER BY i.name`, id)
	defer rows.Close()
	for rows.Next() {
		var m menuItem
		_ = rows.Scan(&m.ItemID, &m.Name, &m.PriceKobo, &m.Qty)
		sh.Menu = append(sh.Menu, m)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(sh)
}

type purchaseReq struct {
	ShopID         string `json:"shopId"`
	ItemID         string `json:"itemId"`
	IdempotencyKey string `json:"idempotencyKey"`
}

func (s *Service) handlePurchase(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req purchaseReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ShopID == "" || req.ItemID == "" {
		http.Error(w, "shopId + itemId required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	receipt, err := s.purchase(ctx, uid, req.ShopID, req.ItemID, req.IdempotencyKey)
	if err != nil {
		switch err {
		case errFunds:
			http.Error(w, "insufficient funds", http.StatusPaymentRequired)
		case errStock:
			http.Error(w, "out of stock", http.StatusConflict)
		case errNotFound:
			http.Error(w, "unknown shop or item", http.StatusNotFound)
		case errConflict:
			http.Error(w, "idempotency key already used", http.StatusConflict)
		default:
			http.Error(w, "purchase failed", http.StatusInternalServerError)
		}
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(receipt)
}

var (
	errFunds    = errStr("insufficient funds")
	errStock    = errStr("out of stock")
	errNotFound = errStr("not found")
	errConflict = errStr("idempotency conflict")
)

type errStr string

func (e errStr) Error() string { return string(e) }

// purchase runs the full atomic ledger transaction.
func (s *Service) purchase(ctx context.Context, userID, shopID, itemID, idemKey string) (*Receipt, error) {
	if idemKey == "" {
		idemKey = "none"
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// Idempotency replay: same key + same user → return original receipt.
	if idemKey != "none" {
		var existingID string
		var meta map[string]interface{}
		var status string
		err := tx.QueryRow(ctx, `SELECT id, metadata, status FROM transactions WHERE idempotency_key=$1`, idemKey).Scan(&existingID, &meta, &status)
		if err == nil {
			if meta["user_id"] != userID {
				return nil, errConflict
			}
			return &Receipt{
				TransactionID:    existingID,
				ShopID:           str(meta["shop_id"]),
				ItemID:           str(meta["item_id"]),
				PriceKobo:        num(meta["price_kobo"]),
				NewBalanceKobo:   num(meta["balance_after_kobo"]),
				NewQty:           int(num(meta["qty_after"])),
				IdempotentReplay: true,
			}, nil
		}
	}

	var open bool
	if err := tx.QueryRow(ctx, `SELECT open FROM shops WHERE id=$1`, shopID).Scan(&open); err != nil {
		return nil, errNotFound
	}
	if !open {
		return nil, errStock
	}
	var price int64
	if err := tx.QueryRow(ctx, `SELECT price_kobo FROM items WHERE id=$1`, itemID).Scan(&price); err != nil {
		return nil, errNotFound
	}
	var stock int
	if err := tx.QueryRow(ctx, `SELECT qty FROM shop_stock WHERE shop_id=$1 AND item_id=$2 FOR UPDATE`, shopID, itemID).Scan(&stock); err != nil {
		return nil, errNotFound
	}
	if stock <= 0 {
		return nil, errStock
	}
	var balance int64
	if err := tx.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1 FOR UPDATE`, userID).Scan(&balance); err != nil {
		return nil, errNotFound
	}
	if balance < price {
		return nil, errFunds
	}

	newBalance := balance - price
	if _, err := tx.Exec(ctx, `UPDATE players SET balance_kobo=$1, updated_at=now() WHERE user_id=$2`, newBalance, userID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `UPDATE shop_stock SET qty=qty-1 WHERE shop_id=$1 AND item_id=$2`, shopID, itemID); err != nil {
		return nil, err
	}
	var newQty int
	if err := tx.QueryRow(ctx, `
		INSERT INTO player_inventory (user_id, item_id, qty) VALUES ($1,$2,1)
		ON CONFLICT (user_id, item_id) DO UPDATE SET qty=player_inventory.qty+1
		RETURNING qty`, userID, itemID).Scan(&newQty); err != nil {
		return nil, err
	}

	// Ledger accounts (one per owner, created lazily).
	var playerAcct, shopAcct string
	if err := tx.QueryRow(ctx, `
		INSERT INTO accounts (owner_type, owner_id, currency) VALUES ('player',$1,'NGN')
		ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET owner_type=EXCLUDED.owner_type
		RETURNING id`, userID).Scan(&playerAcct); err != nil {
		// Fallback for pre-002 DBs without the unique index.
		if err := tx.QueryRow(ctx, `SELECT id FROM accounts WHERE owner_type='player' AND owner_id=$1 AND currency='NGN' LIMIT 1`, userID).Scan(&playerAcct); err != nil {
			return nil, err
		}
	}
	shopUUID := "00000000-0000-0000-0000-000000000000"
	if err := tx.QueryRow(ctx, `
		INSERT INTO accounts (owner_type, owner_id, currency) VALUES ('business',$1,'NGN')
		ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET owner_type=EXCLUDED.owner_type
		RETURNING id`, shopUUID).Scan(&shopAcct); err != nil {
		if err := tx.QueryRow(ctx, `SELECT id FROM accounts WHERE owner_type='business' AND owner_id=$1 AND currency='NGN' LIMIT 1`, shopUUID).Scan(&shopAcct); err != nil {
			return nil, err
		}
	}
	_ = shopID // reference kept in transaction metadata; per-shop accounts land in V2.

	var keyArg interface{}
	if idemKey == "none" {
		keyArg = nil
	} else {
		keyArg = idemKey
	}
	var txID string
	meta := map[string]interface{}{
		"user_id": userID, "shop_id": shopID, "item_id": itemID,
		"price_kobo": price, "balance_after_kobo": newBalance, "qty_after": newQty,
	}
	metaJSON, _ := json.Marshal(meta)
	if err := tx.QueryRow(ctx, `
		INSERT INTO transactions (type, reference, idempotency_key, status, metadata)
		VALUES ('purchase', $1, $2, 'committed', $3) RETURNING id`,
		shopID+":"+itemID, keyArg, string(metaJSON)).Scan(&txID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO ledger_entries (transaction_id, account_id, amount_kobo, direction) VALUES ($1,$2,$3,'debit'), ($1,$4,$3,'credit')`, txID, playerAcct, price, shopAcct); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &Receipt{TransactionID: txID, ShopID: shopID, ItemID: itemID, PriceKobo: price, NewBalanceKobo: newBalance, NewQty: newQty}, nil
}

func str(v interface{}) string {
	s, _ := v.(string)
	return s
}

func num(v interface{}) int64 {
	switch n := v.(type) {
	case float64:
		return int64(n)
	case int64:
		return n
	case int:
		return int64(n)
	case json.Number:
		i, _ := n.Int64()
		return i
	}
	return 0
}

var _ = pgx.ErrNoRows
