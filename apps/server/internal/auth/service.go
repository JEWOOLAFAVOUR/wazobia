package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	DB        *pgxpool.Pool
	JWTSecret string
}

func NewService(db *pgxpool.Pool, secret string) *Service {
	return &Service{DB: db, JWTSecret: secret}
}

func (s *Service) RegisterRoutes(mux interface {
	Post(string, http.HandlerFunc)
	Get(string, http.HandlerFunc)
}) {
	mux.Post("/api/auth/register", s.handleRegister)
	mux.Post("/api/auth/login", s.handleLogin)
	mux.Post("/api/auth/logout", s.handleLogout)
	mux.Get("/api/me", s.handleMe)
}

type registerReq struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

func (s *Service) handleRegister(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	var req registerReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" || len(req.Password) < 8 {
		http.Error(w, "email + password (min 8 chars) required", http.StatusBadRequest)
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var userID string
	err := s.DB.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, display_name)
		VALUES ($1, $2, $3)
		RETURNING id`,
		req.Email, string(hash), req.DisplayName,
	).Scan(&userID)
	if err != nil {
		http.Error(w, "email already in use", http.StatusConflict)
		return
	}
	// Starter player state per intro.md §5: ₦50,000, shared apartment, no job.
	_, _ = s.DB.Exec(ctx, `
		INSERT INTO players (user_id, display_name, balance_kobo, home)
		VALUES ($1, $2, 5000000, 'Shared apartment')`,
		userID, req.DisplayName,
	)
	s.setSession(w, userID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"userId": userID})
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Service) handleLogin(w http.ResponseWriter, r *http.Request) {
	if s.DB == nil {
		http.Error(w, "database not configured", http.StatusServiceUnavailable)
		return
	}
	var req loginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var userID, hash string
	err := s.DB.QueryRow(ctx, `SELECT id, password_hash FROM users WHERE email=$1`, req.Email).Scan(&userID, &hash)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	s.setSession(w, userID)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"userId": userID})
}

func (s *Service) handleLogout(w http.ResponseWriter, _ *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "wazobia_at", Value: "", Path: "/", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) handleMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := UserIDFromContext(r.Context())
	if !ok {
		// Fall back to cookie check for plain net/http wiring without middleware.
		uid, err := s.userIDFromRequest(r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		userID = uid
	}
	if s.DB == nil {
		_ = json.NewEncoder(w).Encode(map[string]string{"userId": userID})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var email, displayName string
	_ = s.DB.QueryRow(ctx, `SELECT email, display_name FROM users WHERE id=$1`, userID).Scan(&email, &displayName)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"userId": userID, "email": email, "displayName": displayName})
}

func (s *Service) setSession(w http.ResponseWriter, userID string) {
	secret := s.JWTSecret
	if secret == "" {
		secret = "dev-only-change-me"
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	})
	signed, _ := token.SignedString([]byte(secret))
	http.SetCookie(w, &http.Cookie{
		Name:     "wazobia_at",
		Value:    signed,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400,
	})
}

func (s *Service) userIDFromRequest(r *http.Request) (string, error) {
	c, err := r.Cookie("wazobia_at")
	if err != nil {
		return "", err
	}
	secret := s.JWTSecret
	if secret == "" {
		secret = "dev-only-change-me"
	}
	token, err := jwt.Parse(c.Value, func(t *jwt.Token) (interface{}, error) { return []byte(secret), nil })
	if err != nil || !token.Valid {
		return "", err
	}
	sub, _ := token.Claims.(jwt.MapClaims)["sub"].(string)
	return sub, nil
}
