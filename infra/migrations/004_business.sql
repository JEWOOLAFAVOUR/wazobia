-- Wazobia slice 4: player-owned businesses (guide.md Phase 6, §17).
-- Money in kobo. Every cash movement goes through the ledger.

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'shop',
  zone TEXT NOT NULL DEFAULT 'zone-b',
  cash_kobo BIGINT NOT NULL DEFAULT 0 CHECK (cash_kobo >= 0),
  reputation INT NOT NULL DEFAULT 0,
  open BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_employees (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff',
  wage_kobo BIGINT NOT NULL DEFAULT 100000 CHECK (wage_kobo >= 0),
  last_shift_at TIMESTAMPTZ,
  hired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, user_id)
);

CREATE TABLE IF NOT EXISTS business_products (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  price_kobo BIGINT NOT NULL CHECK (price_kobo >= 0),
  qty INT NOT NULL DEFAULT 0 CHECK (qty >= 0),
  PRIMARY KEY (business_id, item_id)
);
