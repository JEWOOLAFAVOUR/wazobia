-- Wazobia slice 2: player economy (guide.md §12-15, §36-37).
-- Money in kobo (integer). Ledger is truth; players.balance_kobo is cached wallet.

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'food',
  price_kobo BIGINT NOT NULL CHECK (price_kobo >= 0)
);

CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL DEFAULT 'zone-b',
  kind TEXT NOT NULL DEFAULT 'shop',
  open BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS shop_stock (
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  qty INT NOT NULL DEFAULT 0 CHECK (qty >= 0),
  PRIMARY KEY (shop_id, item_id)
);

CREATE TABLE IF NOT EXISTS player_inventory (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  qty INT NOT NULL DEFAULT 0 CHECK (qty >= 0),
  PRIMARY KEY (user_id, item_id)
);

-- Seed: match world handler building IDs.
INSERT INTO items (id, name, kind, price_kobo) VALUES
  ('jollof', 'Jollof Rice', 'food', 250000),
  ('bread', 'Agege Bread', 'food', 80000),
  ('water', 'Bottled Water', 'food', 30000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO shops (id, name, zone, kind, open) VALUES
  ('rest-1', 'Mama Put Spot', 'zone-b', 'restaurant', TRUE),
  ('shop-1', 'Corner Shop', 'zone-b', 'shop', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_stock (shop_id, item_id, qty) VALUES
  ('rest-1', 'jollof', 100),
  ('rest-1', 'water', 200),
  ('shop-1', 'bread', 150),
  ('shop-1', 'water', 200),
  ('shop-1', 'jollof', 20)
ON CONFLICT (shop_id, item_id) DO NOTHING;

-- One account per owner (player/business/system) per currency for ledger entries.
CREATE UNIQUE INDEX IF NOT EXISTS ux_accounts_owner ON accounts(owner_type, owner_id, currency);
