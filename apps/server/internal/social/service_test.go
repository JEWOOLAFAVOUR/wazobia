package social

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TestSocialLoop covers friends → org → ticketed event against real Postgres.
// Skips cleanly without WAZOBIA_TEST_DB / DATABASE_URL.
func TestSocialLoop(t *testing.T) {
	dsn := os.Getenv("WAZOBIA_TEST_DB")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		t.Skip("no DATABASE_URL / WAZOBIA_TEST_DB; skipping integration test")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Skipf("cannot connect: %v", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		t.Skipf("db unreachable: %v", err)
	}

	mkUser := func(email string, balance int64) string {
		_, _ = pool.Exec(ctx, `DELETE FROM users WHERE email=$1`, email)
		var id string
		if err := pool.QueryRow(ctx, `INSERT INTO users (email, password_hash, display_name) VALUES ($1,'x',$2) RETURNING id`, email, email).Scan(&id); err != nil {
			t.Fatalf("seed user: %v", err)
		}
		_, _ = pool.Exec(ctx, `INSERT INTO players (user_id, display_name, balance_kobo, energy) VALUES ($1,$2,$3,100) ON CONFLICT (user_id) DO UPDATE SET balance_kobo=$3`, id, email, balance)
		return id
	}
	a := mkUser("sociala@example.com", 5000000)
	b := mkUser("socialb@example.com", 5000000)
	defer pool.Exec(ctx, `DELETE FROM users WHERE id IN ($1,$2)`, a, b)

	// 1. Request + accept.
	low, high := pair(a, b)
	_, err = pool.Exec(ctx, `INSERT INTO friendships (user_low, user_high, status, requested_by) VALUES ($1,$2,'pending',$3)`, low, high, a)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	cmd, _ := pool.Exec(ctx, `UPDATE friendships SET status='accepted' WHERE user_low=$1 AND user_high=$2 AND status='pending' AND requested_by<>$3`, low, high, b)
	if cmd.RowsAffected() != 1 {
		t.Fatal("accept failed")
	}
	var status string
	_ = pool.QueryRow(ctx, `SELECT status FROM friendships WHERE user_low=$1 AND user_high=$2`, low, high).Scan(&status)
	if status != "accepted" {
		t.Fatalf("status=%s", status)
	}

	// 2. Org create + join.
	var orgID string
	_ = pool.QueryRow(ctx, `INSERT INTO organizations (owner_user_id, name, kind) VALUES ($1,'Yaba Runners','club') RETURNING id`, a).Scan(&orgID)
	_, _ = pool.Exec(ctx, `INSERT INTO organization_members (org_id, user_id, role) VALUES ($1,$2,'owner')`, orgID, a)
	_, _ = pool.Exec(ctx, `INSERT INTO organization_members (org_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, orgID, b)
	var members int
	_ = pool.QueryRow(ctx, `SELECT COUNT(*) FROM organization_members WHERE org_id=$1`, orgID).Scan(&members)
	if members != 2 {
		t.Fatalf("members=%d", members)
	}

	// 3. Ticketed event: attend moves ₦5,000 a→creator, capacity enforced.
	var eventID string
	_ = pool.QueryRow(ctx, `INSERT INTO events (creator_user_id, title, venue, starts_at, capacity, ticket_kobo) VALUES ($1,'Street Party','zone-c', now() + interval '1 day', 2, 500000) RETURNING id`, a).Scan(&eventID)
	attend := func(uid string) error {
		tx, _ := pool.Begin(ctx)
		defer tx.Rollback(ctx)
		var n int
		_ = tx.QueryRow(ctx, `SELECT COUNT(*) FROM event_attendees WHERE event_id=$1`, eventID).Scan(&n)
		if n >= 2 {
			return errFull
		}
		var already bool
		_ = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM event_attendees WHERE event_id=$1 AND user_id=$2)`, eventID, uid).Scan(&already)
		if already {
			return nil
		}
		_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo-500000 WHERE user_id=$1`, uid)
		_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo+500000 WHERE user_id=$1`, a)
		_, _ = tx.Exec(ctx, `INSERT INTO event_attendees (event_id, user_id, paid_kobo) VALUES ($1,$2,500000)`, eventID, uid)
		return tx.Commit(ctx)
	}
	if err := attend(b); err != nil {
		t.Fatalf("attend: %v", err)
	}
	var balB, balA int64
	_ = pool.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1`, b).Scan(&balB)
	_ = pool.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1`, a).Scan(&balA)
	if balB != 4500000 || balA != 5500000 {
		t.Fatalf("ticket money wrong: b=%d a=%d", balB, balA)
	}
	// Creator auto-seat + b fills capacity 2 → third user rejected.
	c := mkUser("socialc@example.com", 5000000)
	defer pool.Exec(ctx, `DELETE FROM users WHERE id=$1`, c)
	_, _ = pool.Exec(ctx, `INSERT INTO event_attendees (event_id, user_id, paid_kobo) VALUES ($1,$2,0) ON CONFLICT DO NOTHING`, eventID, a)
	if err := attend(c); err != errFull {
		t.Fatalf("expected errFull, got %v", err)
	}
}
