-- Wazobia slice 3: daily life (guide.md Phase 5).
-- Money in kobo. Wages are system sources; rent/food/transport are sinks (§12).

ALTER TABLE players ADD COLUMN IF NOT EXISTS energy INT NOT NULL DEFAULT 100 CHECK (energy >= 0 AND energy <= 100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_work_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'shift',
  pay_kobo BIGINT NOT NULL CHECK (pay_kobo >= 0),
  energy_cost INT NOT NULL DEFAULT 10 CHECK (energy_cost >= 0),
  cooldown_seconds INT NOT NULL DEFAULT 30,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS employment (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  hired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS homes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rent_kobo BIGINT NOT NULL CHECK (rent_kobo >= 0),
  energy_bonus INT NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT ''
);

INSERT INTO jobs (id, title, kind, pay_kobo, energy_cost, cooldown_seconds, description) VALUES
  ('delivery', 'Delivery Rider', 'shift', 350000, 10, 30, 'Accept a delivery, navigate Yaba, get paid per run.'),
  ('shop-worker', 'Shop Worker', 'shift', 250000, 10, 30, 'Stock shelves and serve customers at the Corner Shop.'),
  ('restaurant-worker', 'Restaurant Worker', 'shift', 280000, 10, 30, 'Serve jollof at Mama Put Spot.'),
  ('driver', 'Danfo Driver', 'shift', 400000, 15, 60, 'Run the Yaba loop. Fuel is on you.'),
  ('teacher', 'Teacher', 'salary', 600000, 15, 120, 'Teach at the community school. Steady pay.'),
  ('developer', 'Junior Developer', 'salary', 800000, 15, 120, 'Ship code from a Yaba tech hub.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO homes (id, name, rent_kobo, energy_bonus, description) VALUES
  ('shared', 'Shared Apartment', 0, 0, 'Where everyone starts.'),
  ('single-room', 'Single Room', 2000000, 10, 'Your own door that locks.'),
  ('self-contain', 'Self-Contain', 15000000, 25, 'Room + kitchen + bathroom. Big upgrade.'),
  ('mini-flat', 'Mini Flat', 40000000, 40, 'Two rooms. You have arrived.')
ON CONFLICT (id) DO NOTHING;
