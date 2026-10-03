-- Wazobia slice 1: auth + player starter state.
-- Postgres is the durable source of truth (guide.md §34). Money in kobo (integer).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  -- Starter: ₦50,000 = 5,000,000 kobo (intro.md §5)
  balance_kobo BIGINT NOT NULL DEFAULT 5000000 CHECK (balance_kobo >= 0),
  home TEXT NOT NULL DEFAULT 'Shared apartment',
  district TEXT NOT NULL DEFAULT 'yaba',
  zone TEXT NOT NULL DEFAULT 'zone-b',
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  z DOUBLE PRECISION NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger skeleton for slice 2 (economy must be transactional + idempotent, §36-37).
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL, -- player | business | system
  owner_id UUID NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  reference TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount_kobo BIGINT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('debit','credit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
