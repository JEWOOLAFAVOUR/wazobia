package social

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

// Service covers social life (guide.md Phase 7, social.md):
// friendships, organizations and ticketed events.
// Ticket money moves through the same ledger as everything else.
type Service struct {
	DB *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service { return &Service{DB: db} }

func (s *Service) Routes(requireAuth func(http.HandlerFunc) http.HandlerFunc, mux interface {
	Get(string, http.HandlerFunc)
	Post(string, http.HandlerFunc)
}) {
	mux.Get("/api/friends", requireAuth(s.handleFriends))
	mux.Post("/api/friends/request", requireAuth(s.handleFriendRequest))
	mux.Post("/api/friends/accept", requireAuth(s.handleFriendAccept))
	mux.Post("/api/friends/decline", requireAuth(s.handleFriendDecline))
	mux.Post("/api/friends/remove", requireAuth(s.handleFriendRemove))

	mux.Get("/api/orgs", s.handleOrgs)
	mux.Post("/api/orgs", requireAuth(s.handleOrgCreate))
	mux.Get("/api/orgs/{id}", s.handleOrgDetail)
	mux.Post("/api/orgs/{id}/join", requireAuth(s.handleOrgJoin))
	mux.Post("/api/orgs/{id}/leave", requireAuth(s.handleOrgLeave))

	mux.Get("/api/events", s.handleEvents)
	mux.Get("/api/events/mine", requireAuth(s.handleMyEvents))
	mux.Post("/api/events", requireAuth(s.handleEventCreate))
	mux.Post("/api/events/{id}/attend", requireAuth(s.handleAttend))
}

var (
	errGone     = errStr("not found")
	errConflict = errStr("conflict")
	errPoor     = errStr("insufficient funds")
	errFull     = errStr("event full")
)

type errStr string

func (e errStr) Error() string { return string(e) }

// pair orders two user ids so each friendship has exactly one row.
func pair(a, b string) (string, string) {
	if a < b {
		return a, b
	}
	return b, a
}

type friendOut struct {
	UserID      string `json:"userId"`
	DisplayName string `json:"displayName"`
}

func (s *Service) handleFriends(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	friends := []friendOut{}
	rows, _ := s.DB.Query(ctx, `
		SELECT CASE WHEN f.user_low=$1 THEN f.user_high ELSE f.user_low END AS other,
		       COALESCE(u.display_name, u.email)
		FROM friendships f JOIN users u ON u.id = CASE WHEN f.user_low=$1 THEN f.user_high ELSE f.user_low END
		WHERE (f.user_low=$1 OR f.user_high=$1) AND f.status='accepted'`, uid)
	for rows.Next() {
		var f friendOut
		_ = rows.Scan(&f.UserID, &f.DisplayName)
		friends = append(friends, f)
	}
	rows.Close()
	pendingIn := []friendOut{}
	rows2, _ := s.DB.Query(ctx, `
		SELECT u.id, COALESCE(u.display_name, u.email)
		FROM friendships f JOIN users u ON u.id=f.requested_by
		WHERE (f.user_low=$1 OR f.user_high=$1) AND f.status='pending' AND f.requested_by<>$1`, uid)
	for rows2.Next() {
		var f friendOut
		_ = rows2.Scan(&f.UserID, &f.DisplayName)
		pendingIn = append(pendingIn, f)
	}
	rows2.Close()
	pendingOut := []friendOut{}
	rows3, _ := s.DB.Query(ctx, `
		SELECT CASE WHEN f.user_low=$1 THEN f.user_high ELSE f.user_low END,
		       COALESCE(u.display_name, u.email)
		FROM friendships f
		JOIN users u ON u.id = CASE WHEN f.user_low=$1 THEN f.user_high ELSE f.user_low END
		WHERE (f.user_low=$1 OR f.user_high=$1) AND f.status='pending' AND f.requested_by=$1`, uid)
	for rows3.Next() {
		var f friendOut
		_ = rows3.Scan(&f.UserID, &f.DisplayName)
		pendingOut = append(pendingOut, f)
	}
	rows3.Close()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"friends": friends, "pendingIn": pendingIn, "pendingOut": pendingOut,
	})
}

func (s *Service) userIDByEmail(ctx context.Context, email string) (string, error) {
	var id string
	err := s.DB.QueryRow(ctx, `SELECT id FROM users WHERE email=$1`, email).Scan(&id)
	return id, err
}

// resolveTarget accepts either a userId or an email, so clients holding
// display names from the friends list can still act on the right player.
func (s *Service) resolveTarget(ctx context.Context, email, userID string) (string, error) {
	if userID != "" {
		var exists bool
		if err := s.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id=$1)`, userID).Scan(&exists); err == nil && exists {
			return userID, nil
		}
	}
	return s.userIDByEmail(ctx, email)
}

type friendReq struct {
	Email  string `json:"email"`
	UserID string `json:"userId"`
}

func (s *Service) handleFriendRequest(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req friendReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || (req.Email == "" && req.UserID == "") {
		http.Error(w, "email or userId required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	other, err := s.resolveTarget(ctx, req.Email, req.UserID)
	if err != nil {
		http.Error(w, "no player with that email", http.StatusNotFound)
		return
	}
	if other == uid {
		http.Error(w, "cannot friend yourself", http.StatusBadRequest)
		return
	}
	low, high := pair(uid, other)
	_, err = s.DB.Exec(ctx, `INSERT INTO friendships (user_low, user_high, status, requested_by) VALUES ($1,$2,'pending',$3) ON CONFLICT (user_low, user_high) DO NOTHING`, low, high, uid)
	if err != nil {
		http.Error(w, "request failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) handleFriendAccept(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req friendReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || (req.Email == "" && req.UserID == "") {
		http.Error(w, "email or userId required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	other, err := s.resolveTarget(ctx, req.Email, req.UserID)
	if err != nil {
		http.Error(w, "no player with that email", http.StatusNotFound)
		return
	}
	low, high := pair(uid, other)
	cmd, _ := s.DB.Exec(ctx, `UPDATE friendships SET status='accepted', updated_at=now() WHERE user_low=$1 AND user_high=$2 AND status='pending' AND requested_by<>$3`, low, high, uid)
	if cmd.RowsAffected() == 0 {
		http.Error(w, "no pending request from them", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) handleFriendDecline(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req friendReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || (req.Email == "" && req.UserID == "") {
		http.Error(w, "email or userId required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	other, err := s.resolveTarget(ctx, req.Email, req.UserID)
	if err != nil {
		http.Error(w, "no player with that email", http.StatusNotFound)
		return
	}
	low, high := pair(uid, other)
	_, _ = s.DB.Exec(ctx, `DELETE FROM friendships WHERE user_low=$1 AND user_high=$2 AND status='pending'`, low, high)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) handleFriendRemove(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req friendReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || (req.Email == "" && req.UserID == "") {
		http.Error(w, "email or userId required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	other, err := s.resolveTarget(ctx, req.Email, req.UserID)
	if err != nil {
		http.Error(w, "no player with that email", http.StatusNotFound)
		return
	}
	low, high := pair(uid, other)
	_, _ = s.DB.Exec(ctx, `DELETE FROM friendships WHERE user_low=$1 AND user_high=$2`, low, high)
	w.WriteHeader(http.StatusNoContent)
}

type orgOut struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Kind        string `json:"kind"`
	Description string `json:"description"`
	Members     int    `json:"members"`
	Mine        bool   `json:"mine,omitempty"`
}

func (s *Service) handleOrgs(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, _ := s.DB.Query(ctx, `SELECT o.id, o.name, o.kind, o.description, (SELECT COUNT(*) FROM organization_members m WHERE m.org_id=o.id) FROM organizations o ORDER BY o.created_at DESC LIMIT 50`)
	defer rows.Close()
	out := []orgOut{}
	for rows.Next() {
		var o orgOut
		_ = rows.Scan(&o.ID, &o.Name, &o.Kind, &o.Description, &o.Members)
		out = append(out, o)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (s *Service) handleOrgCreate(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req struct {
		Name        string `json:"name"`
		Kind        string `json:"kind"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "name required", http.StatusBadRequest)
		return
	}
	switch req.Kind {
	case "club", "church", "mosque", "association", "business", "other":
	default:
		req.Kind = "club"
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var id string
	if err := s.DB.QueryRow(ctx, `INSERT INTO organizations (owner_user_id, name, kind, description) VALUES ($1,$2,$3,$4) RETURNING id`, uid, req.Name, req.Kind, req.Description).Scan(&id); err != nil {
		http.Error(w, "create failed", http.StatusInternalServerError)
		return
	}
	_, _ = s.DB.Exec(ctx, `INSERT INTO organization_members (org_id, user_id, role) VALUES ($1,$2,'owner')`, id, uid)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func (s *Service) handleOrgDetail(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	id := chi.URLParam(r, "id")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var o orgOut
	if err := s.DB.QueryRow(ctx, `SELECT id, name, kind, description FROM organizations WHERE id=$1`, id).Scan(&o.ID, &o.Name, &o.Kind, &o.Description); err != nil {
		http.Error(w, "organization not found", http.StatusNotFound)
		return
	}
	rows, _ := s.DB.Query(ctx, `SELECT u.id, COALESCE(u.display_name, u.email), m.role FROM organization_members m JOIN users u ON u.id=m.user_id WHERE m.org_id=$1 ORDER BY m.joined_at`, id)
	defer rows.Close()
	members := []map[string]string{}
	for rows.Next() {
		var uid, name, role string
		_ = rows.Scan(&uid, &name, &role)
		members = append(members, map[string]string{"userId": uid, "name": name, "role": role})
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"id": o.ID, "name": o.Name, "kind": o.Kind, "description": o.Description, "members": members,
	})
}

func (s *Service) handleOrgJoin(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var exists bool
	if err := s.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM organizations WHERE id=$1)`, id).Scan(&exists); err != nil || !exists {
		http.Error(w, "organization not found", http.StatusNotFound)
		return
	}
	_, _ = s.DB.Exec(ctx, `INSERT INTO organization_members (org_id, user_id) VALUES ($1,$2) ON CONFLICT (org_id, user_id) DO NOTHING`, id, uid)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) handleOrgLeave(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	_, _ = s.DB.Exec(ctx, `DELETE FROM organization_members WHERE org_id=$1 AND user_id=$2`, id, uid)
	w.WriteHeader(http.StatusNoContent)
}

type eventOut struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Venue      string `json:"venue"`
	StartsAt   string `json:"startsAt"`
	Capacity   int    `json:"capacity"`
	TicketKobo int64  `json:"ticketKobo"`
	Going      int    `json:"going"`
	Attending  bool   `json:"attending,omitempty"`
}

func (s *Service) handleEvents(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, _ := s.DB.Query(ctx, `SELECT e.id, e.title, e.venue, e.starts_at, e.capacity, e.ticket_kobo, (SELECT COUNT(*) FROM event_attendees a WHERE a.event_id=e.id) FROM events e WHERE e.starts_at > now() - interval '1 day' ORDER BY e.starts_at LIMIT 50`)
	defer rows.Close()
	out := []eventOut{}
	for rows.Next() {
		var e eventOut
		var at time.Time
		_ = rows.Scan(&e.ID, &e.Title, &e.Venue, &at, &e.Capacity, &e.TicketKobo, &e.Going)
		e.StartsAt = at.Format(time.RFC3339)
		out = append(out, e)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (s *Service) handleMyEvents(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, _ := s.DB.Query(ctx, `SELECT e.id, e.title, e.venue, e.starts_at, e.capacity, e.ticket_kobo, (SELECT COUNT(*) FROM event_attendees a WHERE a.event_id=e.id) FROM events e JOIN event_attendees a ON a.event_id=e.id WHERE a.user_id=$1 ORDER BY e.starts_at`, uid)
	defer rows.Close()
	out := []eventOut{}
	for rows.Next() {
		var e eventOut
		var at time.Time
		_ = rows.Scan(&e.ID, &e.Title, &e.Venue, &at, &e.Capacity, &e.TicketKobo, &e.Going)
		e.StartsAt = at.Format(time.RFC3339)
		e.Attending = true
		out = append(out, e)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (s *Service) handleEventCreate(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	uid, _ := auth.UserIDFromContext(r.Context())
	var req struct {
		Title       string `json:"title"`
		Venue       string `json:"venue"`
		Description string `json:"description"`
		StartsAt    string `json:"startsAt"`
		Capacity    int    `json:"capacity"`
		TicketKobo  int64  `json:"ticketKobo"`
		OrgID       string `json:"orgId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Title == "" {
		http.Error(w, "title required", http.StatusBadRequest)
		return
	}
	starts := time.Now().Add(24 * time.Hour)
	if req.StartsAt != "" {
		if t, err := time.Parse(time.RFC3339, req.StartsAt); err == nil {
			starts = t
		}
	}
	if req.Capacity <= 0 || req.Capacity > 10000 {
		req.Capacity = 50
	}
	if req.TicketKobo < 0 {
		req.TicketKobo = 0
	}
	if req.Venue == "" {
		req.Venue = "yaba"
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var orgArg interface{}
	if req.OrgID != "" {
		orgArg = req.OrgID
	}
	var id string
	if err := s.DB.QueryRow(ctx, `INSERT INTO events (creator_user_id, org_id, title, venue, description, starts_at, capacity, ticket_kobo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, uid, orgArg, req.Title, req.Venue, req.Description, starts, req.Capacity, req.TicketKobo).Scan(&id); err != nil {
		http.Error(w, "create failed", http.StatusInternalServerError)
		return
	}
	// Creator auto-attends free of charge.
	_, _ = s.DB.Exec(ctx, `INSERT INTO event_attendees (event_id, user_id, paid_kobo) VALUES ($1,$2,0) ON CONFLICT DO NOTHING`, id, uid)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"id": id})
}

// Attend buys a ticket: attendee pays, creator receives, capacity enforced.
func (s *Service) handleAttend(w http.ResponseWriter, r *http.Request) {
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
		http.Error(w, "attend failed", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()
	var creator string
	var ticket int64
	var capacity int
	if err := tx.QueryRow(ctx, `SELECT creator_user_id, ticket_kobo, capacity FROM events WHERE id=$1 FOR UPDATE`, id).Scan(&creator, &ticket, &capacity); err != nil {
		http.Error(w, "event not found", http.StatusNotFound)
		return
	}
	var already bool
	_ = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM event_attendees WHERE event_id=$1 AND user_id=$2)`, id, uid).Scan(&already)
	if already {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"eventId": id, "replay": true})
		return
	}
	var going int
	_ = tx.QueryRow(ctx, `SELECT COUNT(*) FROM event_attendees WHERE event_id=$1`, id).Scan(&going)
	if going >= capacity {
		http.Error(w, "event is full", http.StatusConflict)
		return
	}
	if ticket > 0 {
		var balance int64
		if err := tx.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1 FOR UPDATE`, uid).Scan(&balance); err != nil {
			http.Error(w, "player not found", http.StatusNotFound)
			return
		}
		if balance < ticket {
			http.Error(w, "insufficient funds for ticket", http.StatusPaymentRequired)
			return
		}
		_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo-$1, updated_at=now() WHERE user_id=$2`, ticket, uid)
		_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo+$1, updated_at=now() WHERE user_id=$2`, ticket, creator)
		attendeeAcct, err := ensureAccount(ctx, tx, "player", uid)
		if err != nil {
			http.Error(w, "attend failed", http.StatusInternalServerError)
			return
		}
		creatorAcct, err := ensureAccount(ctx, tx, "player", creator)
		if err != nil {
			http.Error(w, "attend failed", http.StatusInternalServerError)
			return
		}
		var txID string
		meta := `{"user_id":"` + uid + `","event_id":"` + id + `","ticket_kobo":` + itoa64(ticket) + `}`
		_ = tx.QueryRow(ctx, `INSERT INTO transactions (type, reference, status, metadata) VALUES ('ticket',$1,'committed',$2) RETURNING id`, "ticket:"+id, meta).Scan(&txID)
		_, _ = tx.Exec(ctx, `INSERT INTO ledger_entries (transaction_id, account_id, amount_kobo, direction) VALUES ($1,$2,$3,'debit'), ($1,$4,$3,'credit')`, txID, attendeeAcct, ticket, creatorAcct)
	}
	_, _ = tx.Exec(ctx, `INSERT INTO event_attendees (event_id, user_id, paid_kobo) VALUES ($1,$2,$3)`, id, uid, ticket)
	_ = tx.Commit(ctx)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"eventId": id, "paidKobo": ticket})
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
