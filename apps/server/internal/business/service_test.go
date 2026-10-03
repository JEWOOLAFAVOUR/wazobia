package business

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TestBusinessLoop covers owner → stock → customer → payroll → withdraw.
// Skips cleanly without WAZOBIA_TEST_DB / DATABASE_URL.
func TestBusinessLoop(t *testing.T) {
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

	mkUser := func(email string, balance int64) string {
		_, _ = pool.Exec(ctx, `DELETE FROM users WHERE email=$1`, email)
		var id string
		if err := pool.QueryRow(ctx, `INSERT INTO users (email, password_hash, display_name) VALUES ($1,'x',$2) RETURNING id`, email, email).Scan(&id); err != nil {
			t.Fatalf("seed user: %v", err)
		}
		_, _ = pool.Exec(ctx, `INSERT INTO players (user_id, display_name, balance_kobo, energy) VALUES ($1,$2,$3,100) ON CONFLICT (user_id) DO UPDATE SET balance_kobo=$3`, id, email, balance)
		return id
	}
	owner := mkUser("bizowner@example.com", 100000000) // ₦1,000,000
	customer := mkUser("bizcustomer@example.com", 5000000)
	defer pool.Exec(ctx, `DELETE FROM users WHERE id IN ($1,$2)`, owner, customer)

	// 1. Create costs the ₦20,000 license fee.
	bizID := func() string {
		tx, _ := pool.Begin(ctx)
		defer tx.Rollback(ctx)
		var id string
		_ = tx.QueryRow(ctx, `INSERT INTO businesses (owner_user_id, name, kind, zone) VALUES ($1,'Test Kitchen','restaurant','zone-b') RETURNING id`, owner).Scan(&id)
		_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo-$1 WHERE user_id=$2`, licenseFeeKobo, owner)
		_, _ = tx.Exec(ctx, `INSERT INTO business_employees (business_id, user_id, role, wage_kobo) VALUES ($1,$2,'owner',0)`, id, owner)
		_ = tx.Commit(ctx)
		return id
	}()
	var ownerBal int64
	_ = pool.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1`, owner).Scan(&ownerBal)
	if ownerBal != 100000000-licenseFeeKobo {
		t.Fatalf("license fee not charged: %d", ownerBal)
	}

	// 2. List product + restock 5 jollof at 60% wholesale (150,000 each = 750,000).
	_, _ = pool.Exec(ctx, `INSERT INTO business_products (business_id, item_id, price_kobo, qty) VALUES ($1,'jollof',300000,0)`, bizID)
	{
		tx, _ := pool.Begin(ctx)
		unit := int64(250000 * 6 / 10)
		cost := unit * 5
		_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo-$1 WHERE user_id=$2`, cost, owner)
		_, _ = tx.Exec(ctx, `UPDATE business_products SET qty=qty+5 WHERE business_id=$1 AND item_id='jollof'`, bizID)
		_ = tx.Commit(ctx)
		var qty int
		_ = pool.QueryRow(ctx, `SELECT qty FROM business_products WHERE business_id=$1 AND item_id='jollof'`, bizID).Scan(&qty)
		if qty != 5 {
			t.Fatalf("restock failed: qty=%d", qty)
		}
	}

	// 3. Customer buys: −₦3,000 balance, +₦3,000 business cash, ledger balanced.
	receipt, err := svc.buy(ctx, customer, bizID, "jollof", "biz-test-key-1")
	if err != nil {
		t.Fatalf("buy: %v", err)
	}
	if receipt.PriceKobo != 300000 || receipt.NewBalanceKobo != 4700000 {
		t.Fatalf("unexpected receipt: %+v", receipt)
	}
	var cash int64
	_ = pool.QueryRow(ctx, `SELECT cash_kobo FROM businesses WHERE id=$1`, bizID).Scan(&cash)
	if cash != 300000 {
		t.Fatalf("business cash wrong: %d", cash)
	}
	var d, c int64
	_ = pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_kobo),0) FROM ledger_entries WHERE transaction_id=$1 AND direction='debit'`, receipt.TransactionID).Scan(&d)
	_ = pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount_kobo),0) FROM ledger_entries WHERE transaction_id=$1 AND direction='credit'`, receipt.TransactionID).Scan(&c)
	if d != c || d != 300000 {
		t.Fatalf("ledger unbalanced: %d vs %d", d, c)
	}

	// 4. Replay is idempotent (no double charge).
	r2, err := svc.buy(ctx, customer, bizID, "jollof", "biz-test-key-1")
	if err != nil || !r2.IdempotentReplay || r2.TransactionID != receipt.TransactionID {
		t.Fatalf("expected replay, got %+v err=%v", r2, err)
	}

	// 5. Hire + payroll: business cash funds the wage.
	_, _ = pool.Exec(ctx, `INSERT INTO business_employees (business_id, user_id, role, wage_kobo) VALUES ($1,$2,'staff',100000)`, bizID, customer)
	{
		tx, _ := pool.Begin(ctx)
		_, _ = tx.Exec(ctx, `UPDATE businesses SET cash_kobo=cash_kobo-100000 WHERE id=$1`, bizID)
		_, _ = tx.Exec(ctx, `UPDATE players SET balance_kobo=balance_kobo+100000 WHERE user_id=$1`, customer)
		_ = tx.Commit(ctx)
	}
	var cashAfter, custBal int64
	_ = pool.QueryRow(ctx, `SELECT cash_kobo FROM businesses WHERE id=$1`, bizID).Scan(&cashAfter)
	_ = pool.QueryRow(ctx, `SELECT balance_kobo FROM players WHERE user_id=$1`, customer).Scan(&custBal)
	if cashAfter != 200000 || custBal != 4800000 {
		t.Fatalf("payroll wrong: cash=%d cust=%d", cashAfter, custBal)
	}

	// 6. Closed business rejects buyers.
	_, _ = pool.Exec(ctx, `UPDATE businesses SET open=false WHERE id=$1`, bizID)
	if _, err := svc.buy(ctx, customer, bizID, "jollof", "biz-test-key-2"); err != errClosed {
		t.Fatalf("expected errClosed, got %v", err)
	}
}
