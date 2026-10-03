package life

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/auth"
)

// Service covers daily life (guide.md Phase 5): jobs, food, housing,
// transport and the world clock. Money moves through the same ledger
// as purchases: wages are system sources, rent/food/transport are sinks.
type Service struct {
	DB *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service { return &Service{DB: db} }

func (s *Service) Routes(requireAuth func(http.HandlerFunc) http.HandlerFunc, mux interface {
	Get(string, http.HandlerFunc)
	Post(string, http.HandlerFunc)
}) {
	mux.Get("/api/life/status", requireAuth(s.handleStatus))
	mux.Get("/api/jobs", s.handleJobs)
	mux.Post("/api/jobs/hire", requireAuth(s.handleHire))
	mux.Post("/api/jobs/work", requireAuth(s.handleWork))
	mux.Post("/api/inventory/eat", requireAuth(s.handleEat))
	mux.Get("/api/homes", s.handleHomes)
	mux.Post("/api/housing/rent", requireAuth(s.handleRent))
	mux.Post("/api/transport/ride", requireAuth(s.handleRide))
	mux.Get("/api/world/clock", s.handleClock)
}

func (s *Service) handleStatus(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var energy int
	var home, zone, displayName string
	var balance int64
	if err := s.DB.QueryRow(ctx, `SELECT energy, home, zone, display_name, balance_kobo FROM players WHERE user_id=$1`, uid).Scan(&energy, &home, &zone, &displayName, &balance); err != nil {
		http.Error(w, "player not found", http.StatusNotFound)
		return
	}
	var jobID, jobTitle *string
	_ = s.DB.QueryRow(ctx, `SELECT e.job_id, j.title FROM employment e JOIN jobs j ON j.id=e.job_id WHERE e.user_id=$1`, uid).Scan(&jobID, &jobTitle)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"energy": energy, "home": home, "zone": zone,
		"displayName": displayName, "balanceKobo": balance,
		"jobId": jobID, "jobTitle": jobTitle,
	})
}

type jobOut struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Kind            string `json:"kind"`
	PayKobo         int64  `json:"payKobo"`
	EnergyCost      int    `json:"energyCost"`
	CooldownSeconds int    `json:"cooldownSeconds"`
	Description     string `json:"description"`
}

func (s *Service) handleJobs(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, _ := s.DB.Query(ctx, `SELECT id, title, kind, pay_kobo, energy_cost, cooldown_seconds, description FROM jobs ORDER BY pay_kobo`)
	defer rows.Close()
	out := []jobOut{}
	for rows.Next() {
		var j jobOut
		_ = rows.Scan(&j.ID, &j.Title, &j.Kind, &j.PayKobo, &j.EnergyCost, &j.CooldownSeconds, &j.Description)
		out = append(out, j)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (s *Service) handleHire(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req struct {
		JobID string `json:"jobId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.JobID == "" {
		http.Error(w, "jobId required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var exists bool
	if err := s.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM jobs WHERE id=$1)`, req.JobID).Scan(&exists); err != nil || !exists {
		http.Error(w, "unknown job", http.StatusNotFound)
		return
	}
	_, _ = s.DB.Exec(ctx, `INSERT INTO employment (user_id, job_id) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET job_id=$2, hired_at=now()`, uid, req.JobID)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"jobId": req.JobID})
}

type workReceipt struct {
	TransactionID  string `json:"transactionId"`
	JobID          string `json:"jobId"`
	PayKobo        int64  `json:"payKobo"`
	NewBalanceKobo int64  `json:"newBalanceKobo"`
	NewEnergy      int    `json:"newEnergy"`
	RetryAfterSecs int    `json:"retryAfterSecs,omitempty"`
}

func (s *Service) handleWork(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	receipt, retryAfter, err := s.work(ctx, uid)
	if err != nil {
		switch err {
		case errNoJob:
			http.Error(w, "take a job first", http.StatusBadRequest)
		case errTired:
			http.Error(w, "too tired — eat something first", http.StatusConflict)
		case errCooldown:
			w.Header().Set("Retry-After", itoa(retryAfter))
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]int{"retryAfterSecs": retryAfter})
		default:
			http.Error(w, "work failed", http.StatusInternalServerError)
		}
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(receipt)
}

var (
	errNoJob    = errStr("no job")
	errTired    = errStr("too tired")
	errCooldown = errStr("cooldown")
	errPoor     = errStr("insufficient funds")
	errGone     = errStr("not found")
)

type errStr string

func (e errStr) Error() string { return string(e) }

func (s *Service) work(ctx context.Context, userID string) (*workReceipt, int, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return nil, 0, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var jobID string
	if err := tx.QueryRow(ctx, `SELECT job_id FROM employment WHERE user_id=$1`, userID).Scan(&jobID); err != nil {
		return nil, 0, errNoJob
	}
	var pay int64
	var cost, cooldown int
	if err := tx.QueryRow(ctx, `SELECT pay_kobo, energy_cost, cooldown_seconds FROM jobs WHERE id=$1`, jobID).Scan(&pay, &cost, &cooldown); err != nil {
		return nil, 0, errNoJob
	}
	var balance int64
	var energy int
	var lastWork *time.Time
	if err := tx.QueryRow(ctx, `SELECT balance_kobo, energy, last_work_at FROM players WHERE user_id=$1 FOR UPDATE`, userID).Scan(&balance, &energy, &lastWork); err != nil {
		return nil, 0, errGone
	}
	if lastWork != nil {
		wait := cooldown - int(time.Since(*lastWork).Seconds())
		if wait > 0 {
			return nil, wait, errCooldown
		}
	}
	if energy < cost {
		return nil, 0, errTired
	}
	newEnergy := energy - cost
	newBalance := balance + pay
	if _, err := tx.Exec(ctx, `UPDATE players SET balance_kobo=$1, energy=$2, last_work_at=now(), updated_at=now() WHERE user_id=$3`, newBalance, newEnergy, userID); err != nil {
		return nil, 0, err
	}
	playerAcct, err := ensureAccount(ctx, tx, "player", userID)
	if err != nil {
		return nil, 0, err
	}
	systemAcct, err := ensureAccount(ctx, tx, "system", "00000000-0000-0000-0000-000000000000")
	if err != nil {
		return nil, 0, err
	}
	var txID string
	meta := `{"user_id":"` + userID + `","job_id":"` + jobID + `","pay_kobo":` + itoa64(pay) + `,"balance_after_kobo":` + itoa64(newBalance) + `}`
	if err := tx.QueryRow(ctx, `INSERT INTO transactions (type, reference, status, metadata) VALUES ('wage',$1,'committed',$2) RETURNING id`, "work:"+jobID, meta).Scan(&txID); err != nil {
		return nil, 0, err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO ledger_entries (transaction_id, account_id, amount_kobo, direction) VALUES ($1,$2,$3,'debit'), ($1,$4,$3,'credit')`, txID, systemAcct, pay, playerAcct); err != nil {
		return nil, 0, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, 0, err
	}
	return &workReceipt{TransactionID: txID, JobID: jobID, PayKobo: pay, NewBalanceKobo: newBalance, NewEnergy: newEnergy}, 0, nil
}

// Energy restored per food item.
var foodEnergy = map[string]int{"jollof": 35, "bread": 25, "water": 10}

func (s *Service) handleEat(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req struct {
		ItemID string `json:"itemId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ItemID == "" {
		http.Error(w, "itemId required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "eat failed", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()
	var qty int
	if err := tx.QueryRow(ctx, `SELECT qty FROM player_inventory WHERE user_id=$1 AND item_id=$2`, uid, req.ItemID).Scan(&qty); err != nil || qty <= 0 {
		http.Error(w, "no such food in inventory", http.StatusNotFound)
		return
	}
	var energy int
	var home string
	if err := tx.QueryRow(ctx, `SELECT energy, home FROM players WHERE user_id=$1 FOR UPDATE`, uid).Scan(&energy, &home); err != nil {
		http.Error(w, "player not found", http.StatusNotFound)
		return
	}
	gain, ok := foodEnergy[req.ItemID]
	if !ok {
		gain = 20
	}
	_ = home
	newEnergy := energy + gain
	if newEnergy > 100 {
		newEnergy = 100
	}
	_, _ = tx.Exec(ctx, `UPDATE player_inventory SET qty=qty-1 WHERE user_id=$1 AND item_id=$2`, uid, req.ItemID)
	_, _ = tx.Exec(ctx, `DELETE FROM player_inventory WHERE user_id=$1 AND item_id=$2 AND qty<=0`, uid, req.ItemID)
	_, _ = tx.Exec(ctx, `UPDATE players SET energy=$1, updated_at=now() WHERE user_id=$2`, newEnergy, uid)
	_ = tx.Commit(ctx)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"itemId": req.ItemID, "newEnergy": newEnergy, "remaining": qty - 1})
}

func (s *Service) handleHomes(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, _ := s.DB.Query(ctx, `SELECT id, name, rent_kobo, energy_bonus, description FROM homes ORDER BY rent_kobo`)
	defer rows.Close()
	out := []map[string]interface{}{}
	for rows.Next() {
		var id, name, desc string
		var rent int64
		var bonus int
		_ = rows.Scan(&id, &name, &rent, &bonus, &desc)
		out = append(out, map[string]interface{}{"id": id, "name": name, "rentKobo": rent, "energyBonus": bonus, "description": desc})
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (s *Service) handleRent(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req struct {
		HomeID string `json:"homeId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.HomeID == "" {
		http.Error(w, "homeId required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "rent failed", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()
	var name string
	var rent int64
	var bonus int
	if err := tx.QueryRow(ctx, `SELECT name, rent_kobo, energy_bonus FROM homes WHERE id=$1`, req.HomeID).Scan(&name, &rent, &bonus); err != nil {
		http.Error(w, "unknown home", http.StatusNotFound)
		return
	}
	var balance int64
	var energy int
	if err := tx.QueryRow(ctx, `SELECT balance_kobo, energy FROM players WHERE user_id=$1 FOR UPDATE`, uid).Scan(&balance, &energy); err != nil {
		http.Error(w, "player not found", http.StatusNotFound)
		return
	}
	if balance < rent {
		http.Error(w, "insufficient funds", http.StatusPaymentRequired)
		return
	}
	newBalance := balance - rent
	newEnergy := energy + bonus
	if newEnergy > 100 {
		newEnergy = 100
	}
	_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=$1, home=$2, energy=$3, updated_at=now() WHERE user_id=$4`, newBalance, name, newEnergy, uid)
	playerAcct, err := ensureAccount(ctx, tx, "player", uid)
	if err != nil {
		http.Error(w, "rent failed", http.StatusInternalServerError)
		return
	}
	systemAcct, err := ensureAccount(ctx, tx, "system", "00000000-0000-0000-0000-000000000000")
	if err != nil {
		http.Error(w, "rent failed", http.StatusInternalServerError)
		return
	}
	var txID string
	meta := `{"user_id":"` + uid + `","home_id":"` + req.HomeID + `","rent_kobo":` + itoa64(rent) + `}`
	_ = tx.QueryRow(ctx, `INSERT INTO transactions (type, reference, status, metadata) VALUES ('rent',$1,'committed',$2) RETURNING id`, "rent:"+req.HomeID, meta).Scan(&txID)
	_, _ = tx.Exec(ctx, `INSERT INTO ledger_entries (transaction_id, account_id, amount_kobo, direction) VALUES ($1,$2,$3,'debit'), ($1,$4,$3,'credit')`, txID, playerAcct, rent, systemAcct)
	_ = tx.Commit(ctx)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"homeId": req.HomeID, "home": name, "newBalanceKobo": newBalance, "newEnergy": newEnergy, "transactionId": txID})
}

var validZones = map[string]bool{"zone-a": true, "zone-b": true, "zone-c": true, "zone-d": true}

// Danfo fare in kobo (flat intra-Yaba for the MVP slice).
const rideFareKobo = 30000

func (s *Service) handleRide(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req struct {
		ToZone string `json:"toZone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || !validZones[req.ToZone] {
		http.Error(w, "toZone must be zone-a..zone-d", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		http.Error(w, "ride failed", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()
	var balance int64
	var zone string
	if err := tx.QueryRow(ctx, `SELECT balance_kobo, zone FROM players WHERE user_id=$1 FOR UPDATE`, uid).Scan(&balance, &zone); err != nil {
		http.Error(w, "player not found", http.StatusNotFound)
		return
	}
	if zone == req.ToZone {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"zone": zone, "fareKobo": 0, "message": "already here"})
		return
	}
	if balance < rideFareKobo {
		http.Error(w, "insufficient funds for fare", http.StatusPaymentRequired)
		return
	}
	newBalance := balance - rideFareKobo
	_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=$1, zone=$2, updated_at=now() WHERE user_id=$3`, newBalance, req.ToZone, uid)
	playerAcct, err := ensureAccount(ctx, tx, "player", uid)
	if err != nil {
		http.Error(w, "ride failed", http.StatusInternalServerError)
		return
	}
	systemAcct, err := ensureAccount(ctx, tx, "system", "00000000-0000-0000-0000-000000000000")
	if err != nil {
		http.Error(w, "ride failed", http.StatusInternalServerError)
		return
	}
	var txID string
	meta := `{"user_id":"` + uid + `","to_zone":"` + req.ToZone + `","fare_kobo":` + itoa64(rideFareKobo) + `}`
	_ = tx.QueryRow(ctx, `INSERT INTO transactions (type, reference, status, metadata) VALUES ('transport',$1,'committed',$2) RETURNING id`, "ride:"+req.ToZone, meta).Scan(&txID)
	_, _ = tx.Exec(ctx, `INSERT INTO ledger_entries (transaction_id, account_id, amount_kobo, direction) VALUES ($1,$2,$3,'debit'), ($1,$4,$3,'credit')`, txID, playerAcct, rideFareKobo, systemAcct)
	_ = tx.Commit(ctx)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"zone": req.ToZone, "fareKobo": rideFareKobo, "newBalanceKobo": newBalance, "transactionId": txID})
}

// City clock: day count + phase name so every day feels slightly different (social.md §19).
var epoch = time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

func (s *Service) handleClock(w http.ResponseWriter, _ *http.Request) {
	now := time.Now()
	day := int(now.Sub(epoch).Hours()/24) + 1
	h := now.Hour()
	phase := "quiet"
	switch {
	case h >= 5 && h < 11:
		phase = "morning"
	case h >= 11 && h < 15:
		phase = "afternoon"
	case h >= 15 && h < 19:
		phase = "evening"
	case h >= 19 && h < 23:
		phase = "nightlife"
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"day": day, "phase": phase, "hour": h})
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
	neg := n < 0
	if neg {
		n = -n
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	if neg {
		s = "-" + s
	}
	return s
}
