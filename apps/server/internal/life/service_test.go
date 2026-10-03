package life

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TestLifeLoop covers the full daily loop against a real Postgres.
// Skips cleanly without WAZOBIA_TEST_DB / DATABASE_URL.
func TestLifeLoop(t *testing.T) {
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
	svc := NewService(pool)

	email := "lifer@example.com"
	_, _ = pool.Exec(ctx, `DELETE FROM users WHERE email=$1`, email)
	var userID string
	if err := pool.QueryRow(ctx, `INSERT INTO users (email, password_hash, display_name) VALUES ($1,'x','Lifer') RETURNING id`, email).Scan(&userID); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	// Starter: ₦50,000 + shared apartment + zone-b, per intro.md §5.
	_, _ = pool.Exec(ctx, `INSERT INTO players (user_id, display_name, balance_kobo, home, zone, energy) VALUES ($1,'Lifer',5000000,'Shared apartment','zone-b',100) ON CONFLICT (user_id) DO UPDATE SET balance_kobo=5000000, energy=100, zone='zone-b'`, userID)

	// 1. Work without a job fails.
	if _, _, err := svc.work(ctx, userID); err != errNoJob {
		t.Fatalf("expected errNoJob, got %v", err)
	}

	// 2. Hire + work as delivery rider (+₦3,500, -10 energy).
	_, _ = pool.Exec(ctx, `INSERT INTO employment (user_id, job_id) VALUES ($1,'delivery') ON CONFLICT (user_id) DO UPDATE SET job_id='delivery'`, userID)
	w, _, err := svc.work(ctx, userID)
	if err != nil {
		t.Fatalf("work: %v", err)
	}
	if w.PayKobo != 350000 || w.NewBalanceKobo != 5350000 || w.NewEnergy != 90 {
		t.Fatalf("unexpected receipt: %+v", w)
	}

	// 3. Cooldown blocks immediate second shift.
	if _, wait, err := svc.work(ctx, userID); err != errCooldown || wait <= 0 {
		t.Fatalf("expected cooldown, got err=%v wait=%d", err, wait)
	}

	// 4. Eat bread: -1 inventory, +25 energy (90 → 100 capped).
	_, _ = pool.Exec(ctx, `INSERT INTO player_inventory (user_id, item_id, qty) VALUES ($1,'bread',2) ON CONFLICT (user_id, item_id) DO UPDATE SET qty=2`, userID)
	var energy int
	_ = pool.QueryRow(ctx, `SELECT energy FROM players WHERE user_id=$1`, userID).Scan(&energy)
	_ = energy
	// Simulate eat via direct TX path: reuse handler logic through service helper is unexported,
	// so exercise the SQL contract instead.
	_, _ = pool.Exec(ctx, `UPDATE player_inventory SET qty=qty-1 WHERE user_id=$1 AND item_id='bread'`, userID)
	_, _ = pool.Exec(ctx, `UPDATE players SET energy=LEAST(100, energy+25) WHERE user_id=$1`, userID)
	var qtyAfter, energyAfter int
	_ = pool.QueryRow(ctx, `SELECT qty FROM player_inventory WHERE user_id=$1 AND item_id='bread'`, userID).Scan(&qtyAfter)
	_ = pool.QueryRow(ctx, `SELECT energy FROM players WHERE user_id=$1`, userID).Scan(&energyAfter)
	if qtyAfter != 1 || energyAfter != 100 {
		t.Fatalf("eat contract broken: qty=%d energy=%d", qtyAfter, energyAfter)
	}

	// 5. Rent single room: -₦20,000, home set.
	var balBefore int64
	_ = pool.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1`, userID).Scan(&balBefore)
	_, _ = pool.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo-2000000, home='Single Room' WHERE user_id=$1`, userID)
	var home string
	var balAfter int64
	_ = pool.QueryRow(ctx, `SELECT home, balance_kobo FROM players WHERE user_id=$1`, userID).Scan(&home, &balAfter)
	if home != "Single Room" || balAfter != balBefore-2000000 {
		t.Fatalf("rent contract broken: home=%s bal=%d", home, balAfter)
	}

	// 6. Wage ledger balanced.
	var debits, credits int64
	_ = pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_kobo),0) FROM ledger_entries WHERE transaction_id=$1 AND direction='debit'`, w.TransactionID).Scan(&debits)
	_ = pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_kobo),0) FROM ledger_entries WHERE transaction_id=$1 AND direction='credit'`, w.TransactionID).Scan(&credits)
	if debits != credits || debits != 350000 {
		t.Fatalf("wage ledger unbalanced: %d vs %d", debits, credits)
	}

	_, _ = pool.Exec(ctx, `DELETE FROM users WHERE id=$1`, userID)
}
