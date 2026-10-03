package economy

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TestPurchaseFlow exercises the full atomic path against a real Postgres.
// Requires WAZOBIA_TEST_DB (e.g. postgres://wazobia:wazobia@localhost:5432/wazobia).
// Skips cleanly in CI without a database.
func TestPurchaseFlow(t *testing.T) {
	dsn := os.Getenv("WAZOBIA_TEST_DB")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		t.Skip("no DATABASE_URL / WAZOBIA_TEST_DB; skipping integration test")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
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

	email := "testbuyer@example.com"
	var userID string
	_ = pool.QueryRow(ctx, `DELETE FROM users WHERE email=$1`, email).Scan(&userID)
	err = pool.QueryRow(ctx, `INSERT INTO users (email, password_hash, display_name) VALUES ($1,'x','Tester') RETURNING id`, email).Scan(&userID)
	if err != nil {
		t.Fatalf("seed user: %v", err)
	}
	_, _ = pool.Exec(ctx, `INSERT INTO players (user_id, display_name, balance_kobo) VALUES ($1,'Tester',1000000) ON CONFLICT (user_id) DO UPDATE SET balance_kobo=1000000`, userID)

	// 1. Successful purchase (bread = 80,000 kobo).
	r1, err := svc.purchase(ctx, userID, "shop-1", "bread", "test-key-1")
	if err != nil {
		t.Fatalf("purchase: %v", err)
	}
	if r1.NewBalanceKobo != 920000 {
		t.Fatalf("expected 920000, got %d", r1.NewBalanceKobo)
	}
	if r1.NewQty != 1 {
		t.Fatalf("expected qty 1, got %d", r1.NewQty)
	}

	// 2. Idempotent replay with same key.
	r2, err := svc.purchase(ctx, userID, "shop-1", "bread", "test-key-1")
	if err != nil {
		t.Fatalf("replay: %v", err)
	}
	if !r2.IdempotentReplay || r2.TransactionID != r1.TransactionID {
		t.Fatal("expected idempotent replay of same transaction")
	}
	var balance int64
	_ = pool.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1`, userID).Scan(&balance)
	if balance != 920000 {
		t.Fatalf("replay double-charged: balance=%d", balance)
	}

	// 3. Ledger balanced: debit == credit for this transaction.
	var debits, credits int64
	_ = pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_kobo),0) FROM ledger_entries WHERE transaction_id=$1 AND direction='debit'`, r1.TransactionID).Scan(&debits)
	_ = pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_kobo),0) FROM ledger_entries WHERE transaction_id=$1 AND direction='credit'`, r1.TransactionID).Scan(&credits)
	if debits != credits || debits != 80000 {
		t.Fatalf("ledger unbalanced: debit=%d credit=%d", debits, credits)
	}

	// 4. Insufficient funds: drain then attempt jollof (250,000).
	_, _ = pool.Exec(ctx, `UPDATE players SET balance_kobo=100 WHERE user_id=$1`, userID)
	if _, err := svc.purchase(ctx, userID, "rest-1", "jollof", "test-key-poor"); err != errFunds {
		t.Fatalf("expected errFunds, got %v", err)
	}

	_, _ = pool.Exec(ctx, `DELETE FROM users WHERE id=$1`, userID)
}
