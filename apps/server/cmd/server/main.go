// Wazobia authoritative server — modular monolith (guide.md §9-10).
// Browser renders; server owns money, inventory, ownership, persistent state (§64).
package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	infra_websocket "github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/infrastructure/websocket"
	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/auth"
	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/economy"
	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/life"
	infra_pg "github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/infrastructure/postgres"
	infra_redis "github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/infrastructure/redis"
	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/platform/config"
	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/platform/logging"
	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/player"
	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/presence"
	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/world"
)

func main() {
	log := logging.New()
	cfg := config.Load()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pg, err := infra_pg.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("postgres connect failed", "err", err)
	}
	rdb := infra_redis.Connect(cfg.RedisAddr)
	hub := infra_websocket.NewHub(rdb)

	authSvc := auth.NewService(pg, cfg.JWTSecret)
	playerH := &player.Handler{DB: pg}
	worldH := &world.Handler{}
	presenceSvc := presence.NewService(rdb)
	economySvc := economy.NewService(pg)
	lifeSvc := life.NewService(pg)

	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.RealIP, middleware.Logger, middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("ok"))
	})
	r.Get("/readyz", func(w http.ResponseWriter, _ *http.Request) {
		// Ready when HTTP serves; DB/Redis optional in dev preview.
		w.Write([]byte("ready"))
	})
	authSvc.RegisterRoutes(r)
	playerH.Routes(authSvc.RequireAuth, r)
	worldH.Routes(r)
	presenceSvc.Routes(r)
	economySvc.Routes(authSvc.RequireAuth, r)
	lifeSvc.Routes(authSvc.RequireAuth, r)
	r.Get("/ws", hub.ServeWS)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: r}
	go func() {
		log.Info("wazobia server listening", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("listen failed", "err", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	_ = srv.Shutdown(shutdownCtx)
}
