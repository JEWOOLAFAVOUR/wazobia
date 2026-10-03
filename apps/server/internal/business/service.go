package business

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

// Service covers player-owned businesses (guide.md Phase 6, §17):
// create → stock (owner invests) → sell (revenue) → hire/payroll → withdraw.
// Every cash movement is one Postgres TX with ledger debit/credit.
type Service struct {
	DB *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service { return &Service{DB: db} }

// License fee in kobo (₦20,000): affordable after a few shifts, still meaningful.
const licenseFeeKobo = 2000000

// Wholesale cost = 60% of retail reference price.
const wholesaleNum, wholesaleDen = 6, 10

// Payroll cooldown between employee shifts.
const shiftCooldown = 30 * time.Second

func (s *Service) Routes(requireAuth func(http.HandlerFunc) http.HandlerFunc, mux interface {
	Get(string, http.HandlerFunc)
	Post(string, http.HandlerFunc)
}) {
	mux.Get("/api/businesses", s.handleList)
	mux.Get("/api/businesses/mine", requireAuth(s.handleMine))
	mux.Get("/api/businesses/{id}", s.handleDetail)
	mux.Post("/api/businesses", requireAuth(s.handleCreate))
	mux.Post("/api/businesses/{id}/products", requireAuth(s.handleAddProduct))
	mux.Post("/api/businesses/{id}/restock", requireAuth(s.handleRestock))
	mux.Post("/api/businesses/{id}/buy", requireAuth(s.handleBuy))
	mux.Post("/api/businesses/{id}/hire", requireAuth(s.handleHire))
	mux.Post("/api/businesses/{id}/work", requireAuth(s.handleWork))
	mux.Post("/api/businesses/{id}/withdraw", requireAuth(s.handleWithdraw))
	mux.Post("/api/businesses/{id}/open", requireAuth(s.handleOpen))
}

var (
	errPoor     = errStr("insufficient funds")
	errGone     = errStr("not found")
	errForbidden = errStr("forbidden")
	errConflict = errStr("conflict")
	errClosed   = errStr("closed")
	errStock    = errStr("out of stock")
	errCooldown = errStr("cooldown")
)

type errStr string

func (e errStr) Error() string { return string(e) }

type bizOut struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Kind     string `json:"kind"`
	Zone     string `json:"zone"`
	CashKobo int64  `json:"cashKobo,omitempty"`
	Open     bool   `json:"open"`
	Owner    bool   `json:"owner,omitempty"`
}

func (s *Service) handleCreate(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req struct {
		Name string `json:"name"`
		Kind string `json:"kind"`
		Zone string `json:"zone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "name required", http.StatusBadRequest)
		return
	}
	if req.Kind == "" {
		req.Kind = "shop"
	}
	if req.Zone == "" {
		req.Zone = "zone-b"
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "create failed", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()
	var balance int64
	if err := tx.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1 FOR UPDATE`, uid).Scan(&balance); err != nil {
		http.Error(w, "player not found", http.StatusNotFound)
		return
	}
	if balance < licenseFeeKobo {
		http.Error(w, "need ₦20,000 license fee — work a few shifts first", http.StatusPaymentRequired)
		return
	}
	var bizID string
	if err := tx.QueryRow(ctx, `INSERT INTO businesses (owner_user_id, name, kind, zone) VALUES ($1,$2,$3,$4) RETURNING id`, uid, req.Name, req.Kind, req.Zone).Scan(&bizID); err != nil {
		http.Error(w, "create failed", http.StatusInternalServerError)
		return
	}
	_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo-$1, updated_at=now() WHERE user_id=$2`, licenseFeeKobo, uid)
	_, _ = tx.Exec(ctx, `INSERT INTO business_employees (business_id, user_id, role, wage_kobo) VALUES ($1,$2,'owner',0)`, bizID, uid)
	if err := s.ledger(ctx, tx, "license", "license:"+bizID, uid, "", licenseFeeKobo, map[string]string{"business_id": bizID}); err != nil {
		http.Error(w, "create failed", http.StatusInternalServerError)
		return
	}
	_ = tx.Commit(ctx)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"id": bizID})
}

func (s *Service) handleList(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, _ := s.DB.Query(ctx, `SELECT id, name, kind, zone, open FROM businesses ORDER BY created_at DESC LIMIT 50`)
	defer rows.Close()
	out := []bizOut{}
	for rows.Next() {
		var b bizOut
		_ = rows.Scan(&b.ID, &b.Name, &b.Kind, &b.Zone, &b.Open)
		out = append(out, b)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (s *Service) handleMine(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, _ := s.DB.Query(ctx, `SELECT b.id, b.name, b.kind, b.zone, b.cash_kobo, b.open FROM businesses b WHERE b.owner_user_id=$1 OR EXISTS (SELECT 1 FROM business_employees e WHERE e.business_id=b.id AND e.user_id=$1) ORDER BY b.created_at DESC`, uid, uid)
	defer rows.Close()
	out := []bizOut{}
	for rows.Next() {
		var b bizOut
		var ownerID string
		_ = rows.Scan(&b.ID, &b.Name, &b.Kind, &b.Zone, &b.CashKobo, &b.Open)
		_ = s.DB.QueryRow(ctx, `SELECT owner_user_id FROM businesses WHERE id=$1`, b.ID).Scan(&ownerID)
		b.Owner = ownerID == uid
		out = append(out, b)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

type productOut struct {
	ItemID    string `json:"itemId"`
	Name      string `json:"name"`
	PriceKobo int64  `json:"priceKobo"`
	Qty       int    `json:"qty"`
}

func (s *Service) handleDetail(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	id := chi.URLParam(r, "id")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var b bizOut
	var ownerID string
	if err := s.DB.QueryRow(ctx, `SELECT id, name, kind, zone, cash_kobo, open, owner_user_id FROM businesses WHERE id=$1`, id).Scan(&b.ID, &b.Name, &b.Kind, &b.Zone, &b.CashKobo, &b.Open, &ownerID); err != nil {
		http.Error(w, "business not found", http.StatusNotFound)
		return
	}
	rows, _ := s.DB.Query(ctx, `SELECT p.item_id, i.name, p.price_kobo, p.qty FROM business_products p JOIN items i ON i.id=p.item_id WHERE p.business_id=$1 ORDER BY i.name`, id)
	defer rows.Close()
	menu := []productOut{}
	for rows.Next() {
		var m productOut
		_ = rows.Scan(&m.ItemID, &m.Name, &m.PriceKobo, &m.Qty)
		menu = append(menu, m)
	}
	staff, _ := s.staffCount(ctx, id)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"id": b.ID, "name": b.Name, "kind": b.Kind, "zone": b.Zone,
		"open": b.Open, "staff": staff, "menu": menu,
	})
}

func (s *Service) staffCount(ctx context.Context, bizID string) (int, error) {
	var n int
	err := s.DB.QueryRow(ctx, `SELECT COUNT(*) FROM business_employees WHERE business_id=$1`, bizID).Scan(&n)
	return n, err
}

// ownerOf returns true when uid owns the business (checked inside tx where given).
func ownerOf(ctx context.Context, q interface {
	QueryRow(context.Context, string, ...interface{}) pgx.Row
}, bizID, uid string) bool {
	var owner string
	if err := q.QueryRow(ctx, `SELECT owner_user_id FROM businesses WHERE id=$1`, bizID).Scan(&owner); err != nil {
		return false
	}
	return owner == uid
}

func (s *Service) handleAddProduct(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	var req struct {
		ItemID    string `json:"itemId"`
		PriceKobo int64  `json:"priceKobo"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ItemID == "" || req.PriceKobo < 0 {
		http.Error(w, "itemId + priceKobo required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var exists bool
	if err := s.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM items WHERE id=$1)`, req.ItemID).Scan(&exists); err != nil || !exists {
		http.Error(w, "unknown item", http.StatusNotFound)
		return
	}
	if !ownerOf(ctx, s.DB, id, uid) {
		http.Error(w, "owner only", http.StatusForbidden)
		return
	}
	_, _ = s.DB.Exec(ctx, `INSERT INTO business_products (business_id, item_id, price_kobo, qty) VALUES ($1,$2,$3,0) ON CONFLICT (business_id, item_id) DO UPDATE SET price_kobo=$3`, id, req.ItemID, req.PriceKobo)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) handleRestock(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	var req struct {
		ItemID string `json:"itemId"`
		Qty    int    `json:"qty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ItemID == "" || req.Qty <= 0 || req.Qty > 1000 {
		http.Error(w, "itemId + qty (1..1000) required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "restock failed", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if !ownerOf(ctx, tx, id, uid) {
		http.Error(w, "owner only", http.StatusForbidden)
		return
	}
	var retail int64
	if err := tx.QueryRow(ctx, `SELECT price_kobo FROM items WHERE id=$1`, req.ItemID).Scan(&retail); err != nil {
		http.Error(w, "unknown item", http.StatusNotFound)
		return
	}
	var listed bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM business_products WHERE business_id=$1 AND item_id=$2)`, id, req.ItemID).Scan(&listed); err != nil || !listed {
		http.Error(w, "add the product with a price first", http.StatusBadRequest)
		return
	}
	unit := retail * wholesaleNum / wholesaleDen
	cost := unit * int64(req.Qty)
	var balance int64
	if err := tx.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1 FOR UPDATE`, uid).Scan(&balance); err != nil {
		http.Error(w, "player not found", http.StatusNotFound)
		return
	}
	if balance < cost {
		http.Error(w, "owner cannot cover wholesale cost", http.StatusPaymentRequired)
		return
	}
	_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo-$1, updated_at=now() WHERE user_id=$2`, cost, uid)
	_, _ = tx.Exec(ctx, `UPDATE business_products SET qty=qty+$1 WHERE business_id=$2 AND item_id=$3`, req.Qty, id, req.ItemID)
	if err := s.ledger(ctx, tx, "restock", "restock:"+id+":"+req.ItemID, uid, "", cost, map[string]string{"business_id": id, "qty": itoa(req.Qty)}); err != nil {
		http.Error(w, "restock failed", http.StatusInternalServerError)
		return
	}
	_ = tx.Commit(ctx)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"itemId": req.ItemID, "added": req.Qty, "costKobo": cost})
}

type buyReceipt struct {
	TransactionID    string `json:"transactionId"`
	BusinessID       string `json:"businessId"`
	ItemID           string `json:"itemId"`
	PriceKobo        int64  `json:"priceKobo"`
	NewBalanceKobo   int64  `json:"newBalanceKobo"`
	NewQty           int    `json:"newQty"`
	IdempotentReplay bool   `json:"idempotentReplay,omitempty"`
}

func (s *Service) handleBuy(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	var req struct {
		ItemID         string `json:"itemId"`
		IdempotencyKey string `json:"idempotencyKey"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ItemID == "" {
		http.Error(w, "itemId required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	receipt, err := s.buy(ctx, uid, id, req.ItemID, req.IdempotencyKey)
	if err != nil {
		switch err {
		case errPoor:
			http.Error(w, "insufficient funds", http.StatusPaymentRequired)
		case errStock:
			http.Error(w, "out of stock", http.StatusConflict)
		case errClosed:
			http.Error(w, "business is closed", http.StatusConflict)
		case errGone:
			http.Error(w, "unknown business or item", http.StatusNotFound)
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

func (s *Service) buy(ctx context.Context, userID, bizID, itemID, idemKey string) (*buyReceipt, error) {
	if idemKey == "" {
		idemKey = "none"
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if idemKey != "none" {
		var existingID string
		var meta map[string]interface{}
		err := tx.QueryRow(ctx, `SELECT id, metadata FROM transactions WHERE idempotency_key=$1`, idemKey).Scan(&existingID, &meta)
		if err == nil {
			if meta["user_id"] != userID {
				return nil, errConflict
			}
			return &buyReceipt{
				TransactionID: existingID, BusinessID: str(meta["business_id"]), ItemID: str(meta["item_id"]),
				PriceKobo: num(meta["price_kobo"]), NewBalanceKobo: num(meta["balance_after_kobo"]),
				NewQty: int(num(meta["qty_after"])), IdempotentReplay: true,
			}, nil
		}
	}
	var open bool
	if err := tx.QueryRow(ctx, `SELECT open FROM businesses WHERE id=$1`, bizID).Scan(&open); err != nil {
		return nil, errGone
	}
	if !open {
		return nil, errClosed
	}
	var price int64
	var stock int
	if err := tx.QueryRow(ctx, `SELECT price_kobo, qty FROM business_products WHERE business_id=$1 AND item_id=$2 FOR UPDATE`, bizID, itemID).Scan(&price, &stock); err != nil {
		return nil, errGone
	}
	if stock <= 0 {
		return nil, errStock
	}
	var balance int64
	if err := tx.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1 FOR UPDATE`, userID).Scan(&balance); err != nil {
		return nil, errGone
	}
	if balance < price {
		return nil, errPoor
	}
	newBalance := balance - price
	_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=$1, updated_at=now() WHERE user_id=$2`, newBalance, userID)
	_, _ = tx.Exec(ctx, `UPDATE business_products SET qty=qty-1 WHERE business_id=$1 AND item_id=$2`, bizID, itemID)
	_, _ = tx.Exec(ctx, `UPDATE businesses SET cash_kobo=cash_kobo+$1 WHERE id=$2`, price, bizID)
	var newQty int
	_ = tx.QueryRow(ctx, `
		INSERT INTO player_inventory (user_id, item_id, qty) VALUES ($1,$2,1)
		ON CONFLICT (user_id, item_id) DO UPDATE SET qty=player_inventory.qty+1
		RETURNING qty`, userID, itemID).Scan(&newQty)

	playerAcct, err := ensureAccount(ctx, tx, "player", userID)
	if err != nil {
		return nil, err
	}
	bizAcct, err := ensureAccount(ctx, tx, "business", bizID)
	if err != nil {
		return nil, err
	}
	var keyArg interface{}
	if idemKey != "none" {
		keyArg = idemKey
	}
	var txID string
	meta := map[string]interface{}{
		"user_id": userID, "business_id": bizID, "item_id": itemID,
		"price_kobo": price, "balance_after_kobo": newBalance, "qty_after": newQty,
	}
	metaJSON, _ := json.Marshal(meta)
	if err := tx.QueryRow(ctx, `
		INSERT INTO transactions (type, reference, idempotency_key, status, metadata)
		VALUES ('biz_purchase', $1, $2, 'committed', $3) RETURNING id`,
		bizID+":"+itemID, keyArg, string(metaJSON)).Scan(&txID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO ledger_entries (transaction_id, account_id, amount_kobo, direction) VALUES ($1,$2,$3,'debit'), ($1,$4,$3,'credit')`, txID, playerAcct, price, bizAcct); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &buyReceipt{TransactionID: txID, BusinessID: bizID, ItemID: itemID, PriceKobo: price, NewBalanceKobo: newBalance, NewQty: newQty}, nil
}

func (s *Service) handleHire(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	var req struct {
		Email    string `json:"email"`
		WageKobo int64  `json:"wageKobo"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" || req.WageKobo < 0 {
		http.Error(w, "email + wageKobo required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "hire failed", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if !ownerOf(ctx, tx, id, uid) {
		http.Error(w, "owner only", http.StatusForbidden)
		return
	}
	var hireID string
	if err := tx.QueryRow(ctx, `SELECT id FROM users WHERE email=$1`, req.Email).Scan(&hireID); err != nil {
		http.Error(w, "no player with that email", http.StatusNotFound)
		return
	}
	if hireID == uid {
		http.Error(w, "owner is already on payroll", http.StatusBadRequest)
		return
	}
	_, _ = tx.Exec(ctx, `INSERT INTO business_employees (business_id, user_id, role, wage_kobo) VALUES ($1,$2,'staff',$3) ON CONFLICT (business_id, user_id) DO UPDATE SET wage_kobo=$3`, id, hireID, req.WageKobo)
	_ = tx.Commit(ctx)
	w.WriteHeader(http.StatusNoContent)
}

// Employee shift: wage moves from business cash to the worker (ledger).
func (s *Service) handleWork(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "shift failed", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()
	var wage int64
	var lastShift *time.Time
	if err := tx.QueryRow(ctx, `SELECT wage_kobo, last_shift_at FROM business_employees WHERE business_id=$1 AND user_id=$2`, id, uid).Scan(&wage, &lastShift); err != nil {
		http.Error(w, "only staff can work shifts", http.StatusForbidden)
		return
	}
	if lastShift != nil && time.Since(*lastShift) < shiftCooldown {
		http.Error(w, "shift cooling down", http.StatusTooManyRequests)
		return
	}
	var cash int64
	if err := tx.QueryRow(ctx, `SELECT cash_kobo FROM businesses WHERE id=$1 FOR UPDATE`, id).Scan(&cash); err != nil {
		http.Error(w, "business not found", http.StatusNotFound)
		return
	}
	if cash < wage {
		http.Error(w, "business cannot cover payroll", http.StatusConflict)
		return
	}
	_, _ = tx.Exec(ctx, `UPDATE businesses SET cash_kobo=cash_kobo-$1 WHERE id=$2`, wage, id)
	_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo+$1, updated_at=now() WHERE user_id=$2`, wage, uid)
	_, _ = tx.Exec(ctx, `UPDATE business_employees SET last_shift_at=now() WHERE business_id=$1 AND user_id=$2`, id, uid)
	workerAcct, err := ensureAccount(ctx, tx, "player", uid)
	if err != nil {
		http.Error(w, "shift failed", http.StatusInternalServerError)
		return
	}
	bizAcct, err := ensureAccount(ctx, tx, "business", id)
	if err != nil {
		http.Error(w, "shift failed", http.StatusInternalServerError)
		return
	}
	var txID string
	meta := `{"user_id":"` + uid + `","business_id":"` + id + `","wage_kobo":` + itoa64(wage) + `}`
	_ = tx.QueryRow(ctx, `INSERT INTO transactions (type, reference, status, metadata) VALUES ('payroll',$1,'committed',$2) RETURNING id`, "shift:"+id, meta).Scan(&txID)
	_, _ = tx.Exec(ctx, `INSERT INTO ledger_entries (transaction_id, account_id, amount_kobo, direction) VALUES ($1,$2,$3,'debit'), ($1,$4,$3,'credit')`, txID, bizAcct, wage, workerAcct)
	_ = tx.Commit(ctx)
	var newBalance int64
	_ = s.DB.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1`, uid).Scan(&newBalance)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"wageKobo": wage, "newBalanceKobo": newBalance, "transactionId": txID})
}

func (s *Service) handleWithdraw(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	var req struct {
		AmountKobo int64 `json:"amountKobo"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.AmountKobo <= 0 {
		http.Error(w, "amountKobo required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "withdraw failed", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if !ownerOf(ctx, tx, id, uid) {
		http.Error(w, "owner only", http.StatusForbidden)
		return
	}
	var cash int64
	if err := tx.QueryRow(ctx, `SELECT cash_kobo FROM businesses WHERE id=$1 FOR UPDATE`, id).Scan(&cash); err != nil {
		http.Error(w, "business not found", http.StatusNotFound)
		return
	}
	if cash < req.AmountKobo {
		http.Error(w, "insufficient business cash", http.StatusConflict)
		return
	}
	_, _ = tx.Exec(ctx, `UPDATE businesses SET cash_kobo=cash_kobo-$1 WHERE id=$2`, req.AmountKobo, id)
	_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo+$1, updated_at=now() WHERE user_id=$2`, req.AmountKobo, uid)
	ownerAcct, err := ensureAccount(ctx, tx, "player", uid)
	if err != nil {
		http.Error(w, "withdraw failed", http.StatusInternalServerError)
		return
	}
	bizAcct, err := ensureAccount(ctx, tx, "business", id)
	if err != nil {
		http.Error(w, "withdraw failed", http.StatusInternalServerError)
		return
	}
	var txID string
	meta := `{"user_id":"` + uid + `","business_id":"` + id + `","amount_kobo":` + itoa64(req.AmountKobo) + `}`
	_ = tx.QueryRow(ctx, `INSERT INTO transactions (type, reference, status, metadata) VALUES ('withdraw',$1,'committed',$2) RETURNING id`, "withdraw:"+id, meta).Scan(&txID)
	_, _ = tx.Exec(ctx, `INSERT INTO ledger_entries (transaction_id, account_id, amount_kobo, direction) VALUES ($1,$2,$3,'debit'), ($1,$4,$3,'credit')`, txID, bizAcct, req.AmountKobo, ownerAcct)
	_ = tx.Commit(ctx)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"amountKobo": req.AmountKobo, "transactionId": txID})
}

func (s *Service) handleOpen(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	var req struct {
		Open bool `json:"open"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "open required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	if !ownerOf(ctx, s.DB, id, uid) {
		http.Error(w, "owner only", http.StatusForbidden)
		return
	}
	if _, err := s.DB.Exec(ctx, `UPDATE businesses SET open=$1 WHERE id=$2`, req.Open, id); err != nil {
		http.Error(w, "business not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ledger records a player↔system movement (license, restock).
func (s *Service) ledger(ctx context.Context, tx pgx.Tx, typ, ref, playerID, _ string, amount int64, extra map[string]string) error {
	playerAcct, err := ensureAccount(ctx, tx, "player", playerID)
	if err != nil {
		return err
	}
	systemAcct, err := ensureAccount(ctx, tx, "system", "00000000-0000-0000-0000-000000000000")
	if err != nil {
		return err
	}
	meta := map[string]string{"user_id": playerID}
	for k, v := range extra {
		meta[k] = v
	}
	metaJSON, _ := json.Marshal(meta)
	var txID string
	if err := tx.QueryRow(ctx, `INSERT INTO transactions (type, reference, status, metadata) VALUES ($1,$2,'committed',$3) RETURNING id`, typ, ref, string(metaJSON)).Scan(&txID); err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `INSERT INTO ledger_entries (transaction_id, account_id, amount_kobo, direction) VALUES ($1,$2,$3,'debit'), ($1,$4,$3,'credit')`, txID, playerAcct, amount, systemAcct)
	return err
}

func ensureAccount(ctx context.Context, tx pgx.Tx, ownerType, ownerID string) (string, error) {
	var id string
	err := tx.QueryRow(ctx, `
		INSERT INTO accounts (owner_type, owner_id, currency) VALUES ($1,$2,'NGN')
		ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET owner_type=EXCLUDED.owner_type
		RETURNING id`, ownerType, ownerID).Scan(&id)
	if err == nil {
		return id, nil
	}
	return id, tx.QueryRow(ctx, `SELECT id FROM accounts WHERE owner_type=$1 AND owner_id=$2 AND currency='NGN' LIMIT 1`, ownerType, ownerID).Scan(&id)
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

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}

func itoa64(n int64) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}
