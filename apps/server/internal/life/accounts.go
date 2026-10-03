package life

import (
	"context"

	"github.com/jackc/pgx/v5"
)

// ensureAccount returns the ledger account id, creating it lazily.
// Works on pre-003 DBs (without ux_accounts_owner) via select fallback.
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
