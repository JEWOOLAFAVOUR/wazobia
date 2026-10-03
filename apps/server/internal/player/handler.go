package player

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/auth"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler serves durable player state. Movement/presence stay on WebSocket+Redis.
type Handler struct {
	DB *pgxpool.Pool
}

func (h *Handler) Routes(requireAuth func(http.HandlerFunc) http.HandlerFunc, mux interface {
	Get(string, http.HandlerFunc)
},
) {
	mux.Get("/api/player", requireAuth(h.handleGet))
}

func (h *Handler) handleGet(w http.ResponseWriter, r *http.Request) {
	uid, _ := auth.UserIDFromContext(r.Context())
	if h.DB == nil {
		// Starter state per intro.md §5 (no DB in local preview).
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"userId": uid, "balance": 50000, "currency": "NGN",
			"home": "Shared apartment", "job": nil,
		})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var balance int64
	var home, displayName string
	err := h.DB.QueryRow(ctx, `SELECT balance_kobo, home, display_name FROM players WHERE user_id=$1`, uid).Scan(&balance, &home, &displayName)
	if err != nil {
		http.Error(w, "player not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"userId": uid, "balanceKobo": balance, "home": home, "displayName": displayName,
	})
}
