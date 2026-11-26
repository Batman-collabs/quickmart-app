CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  tagline TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  unit TEXT NOT NULL,
  price INT NOT NULL,
  mrp INT NOT NULL,
  emoji TEXT NOT NULL,
  card_bg TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
  delivery_mins INT NOT NULL DEFAULT 8,
  description TEXT NOT NULL DEFAULT '',
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  is_flash_deal BOOLEAN NOT NULL DEFAULT FALSE,
  stock INT NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT NOT NULL,
  eta_mins INT NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  item_total INT NOT NULL,
  delivery_fee INT NOT NULL,
  handling_fee INT NOT NULL,
  discount INT NOT NULL DEFAULT 0,
  grand_total INT NOT NULL,
  total_savings INT NOT NULL DEFAULT 0,
  coupon_code TEXT,
  address_snapshot JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'confirmed',
  eta_seconds_remaining INT NOT NULL DEFAULT 480,
  rider_name TEXT NOT NULL,
  rider_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_emoji TEXT NOT NULL,
  unit TEXT NOT NULL,
  price INT NOT NULL,
  mrp INT NOT NULL,
  quantity INT NOT NULL
);

INSERT INTO users (id, name, email, phone, role, password_hash) VALUES
  ('usr-admin', 'QuickMart Store Manager', 'admin@quickmart.app', '+91 98000 00001', 'admin', 'qm_seed_admin_salt_2026:e179d5f4af16403c63cc5365a6793a182858c372c0500f59f638f1be80fb9f88ee4e78783dfcc75015bc8443ad3ad0e56b890813bc74af7b05739442e775cbec'),
  ('usr-demo', 'Aayush Sharma', 'aayush@quickmart.app', '+91 98765 43210', 'customer', 'qm_seed_user_salt_2026:3200ead79a46be25ca7117faf13e64a24561c9aa19a6d75582b6bdbddc2cc98f3066e8c6d75cd3e52d13754a7c8af83e3c6e5c0a5638c3786dbd703051a4201f')
ON CONFLICT (id) DO NOTHING;

INSERT INTO addresses (id, user_id, label, line1, line2, eta_mins) VALUES
  ('addr-demo-1', 'usr-demo', 'Home', 'Flat 402, Emerald Heights', 'Sector 2, HSR Layout, Bengaluru', 8),
  ('addr-demo-2', 'usr-demo', 'Work', 'Floor 5, Orion Tech Park', 'Outer Ring Road, Bellandur', 10),
  ('addr-admin-1', 'usr-admin', 'Home', 'Dark Store Hub #04', 'HSR Layout Sector 2, Bengaluru', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, short_name, emoji, bg_color, accent_color, tagline, sort_order) VALUES
  ('fruits-veg', 'Fruits & Vegetables', 'Fruits & Veg', '🥑', '#E9F8EC', '#15803D', 'Farm-fresh daily picks', 1),
  ('dairy-bread', 'Dairy, Bread & Eggs', 'Dairy & Eggs', '🥛', '#EBF4FF', '#1D4ED8', 'Morning essentials chilled', 2),
  ('snacks-drinks', 'Munchies & Cold Drinks', 'Snacks', '🍿', '#FFF3E5', '#C2410C', 'Cravings sorted in 8 mins', 3),
  ('instant-food', 'Instant & Frozen Food', 'Instant Food', '🍜', '#FFEBF0', '#BE123C', 'Ready in minutes', 4),
  ('tea-coffee', 'Tea, Coffee & Health', 'Tea & Coffee', '☕', '#F5EDE4', '#78350F', 'Brews & energizing sips', 5),
  ('staples', 'Atta, Rice & Dal', 'Atta & Dal', '🌾', '#FEF7DF', '#A16207', 'Pantry staples & oils', 6),
  ('personal-care', 'Bath & Personal Care', 'Self Care', '🧴', '#F3E8FF', '#7E22CE', 'Daily grooming & hygiene', 7),
  ('cleaning', 'Home & Cleaning', 'Cleaning', '🧽', '#E6F9F7', '#0F766E', 'Sparkling home supplies', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, brand, category_id, unit, price, mrp, emoji, card_bg, rating, delivery_mins, description, highlights, is_bestseller, is_flash_deal, stock) VALUES
  ('p1', 'Fresh Hybrid Tomato', 'FarmFresh', 'fruits-veg', '500 g', 29, 42, '🍅', '#FFF0EE', 4.8, 8, 'Handpicked juicy red tomatoes sourced directly from local farms every morning.', '["Pesticide-checked","Hygienically packed","Rich in Vitamin C"]'::jsonb, TRUE, TRUE, 25),
  ('p2', 'Robusta Banana', 'FarmFresh', 'fruits-veg', '6 pcs', 38, 50, '🍌', '#FFFBE6', 4.7, 8, 'Naturally ripened sweet Robusta bananas, ideal for smoothies and quick energy.', '["Carbide-free","Zero preservatives","Fresh harvest"]'::jsonb, TRUE, FALSE, 30),
  ('p3', 'Hass Avocado Imported', 'GreenLeaf', 'fruits-veg', '1 pc (200 g)', 119, 165, '🥑', '#ECFDF3', 4.6, 9, 'Creamy, rich Hass avocado ready for guacamole, salads, and avocado toast.', '["Rich in healthy fats","Ready-to-eat in 1 day","Imported quality"]'::jsonb, FALSE, TRUE, 12),
  ('p4', 'Red Onion', 'FarmFresh', 'fruits-veg', '1 kg', 49, 68, '🧅', '#FCEBF3', 4.5, 8, 'Crisp, pungent Nasik red onions sorted for size and freshness.', '["Sorted & cleaned","Daily kitchen staple","Long shelf life"]'::jsonb, FALSE, FALSE, 40),
  ('p5', 'Amul Taaza Toned Milk', 'Amul', 'dairy-bread', '500 ml', 27, 28, '🥛', '#EFF6FF', 4.9, 7, 'Pasteurised toned milk delivered chilled at 4°C straight from cold storage.', '["3% Milk Fat","Chilled delivery","Rich in calcium"]'::jsonb, TRUE, FALSE, 50),
  ('p6', 'Harvest Gold Brown Bread', 'Harvest Gold', 'dairy-bread', '400 g', 45, 50, '🍞', '#FEF3E2', 4.7, 8, 'Soft whole-wheat brown bread baked fresh daily for wholesome sandwiches.', '["Whole wheat","Soft & fresh","Zero trans fat"]'::jsonb, TRUE, FALSE, 18),
  ('p7', 'Farm White Eggs (Pack of 6)', 'Eggoz', 'dairy-bread', '6 pcs', 58, 72, '🥚', '#FFF8EC', 4.8, 8, 'UV-sanitized, herbal-fed white eggs packed in a shock-proof tray.', '["100% herbal feed","UV sanitized","6g protein per egg"]'::jsonb, FALSE, TRUE, 22),
  ('p8', 'Amul Pasteurised Butter', 'Amul', 'dairy-bread', '100 g', 58, 60, '🧈', '#FFF9DB', 4.9, 8, 'Classic salted Amul butter — utter butterly delicious for toast and parathas.', '["Rich creamy taste","Cold-chain stored","Pure milk fat"]'::jsonb, FALSE, FALSE, 35),
  ('p9', 'Lay’s India’s Magic Masala', 'Lay’s', 'snacks-drinks', '50 g', 20, 20, '🍟', '#EBF3FF', 4.8, 7, 'Crispy potato chips tossed in iconic bold Indian masala seasoning.', '["Crunchy wafers","Party favorite","Sealed freshness"]'::jsonb, TRUE, FALSE, 60),
  ('p10', 'Coca-Cola Zero Sugar Can', 'Coca-Cola', 'snacks-drinks', '300 ml', 38, 40, '🥤', '#FFECEE', 4.7, 7, 'Ice-cold zero-sugar Coca-Cola in a sleek aluminum can.', '["Delivered chilled","Zero sugar","300 ml can"]'::jsonb, FALSE, TRUE, 42),
  ('p11', '4700BC Himalayan Salt Popcorn', '4700BC', 'snacks-drinks', '75 g', 49, 65, '🍿', '#FFF2E2', 4.6, 8, 'Gourmet airy popcorn lightly dusted with mineral-rich Himalayan pink salt.', '["Whole grain corn","Non-GMO","Light & crunchy"]'::jsonb, FALSE, FALSE, 20),
  ('p12', 'Red Bull Energy Drink', 'Red Bull', 'snacks-drinks', '250 ml', 115, 125, '⚡', '#EEF2FF', 4.8, 8, 'Vitalizes body and mind — served chilled for instant focus.', '["Chilled delivery","Taurine & B-vitamins","250 ml can"]'::jsonb, FALSE, FALSE, 28),
  ('p13', 'Maggi 2-Minute Masala Noodles', 'Maggi', 'instant-food', '4 x 70 g', 56, 60, '🍜', '#FFF7DC', 4.9, 7, 'India’s favorite midnight masala noodles in a convenient 4-pack.', '["Ready in 2 mins","Iconic Tastemaker","Family 4-pack"]'::jsonb, TRUE, FALSE, 48),
  ('p14', 'McCain French Fries', 'McCain', 'instant-food', '420 g', 112, 135, '🍟', '#FFF0E5', 4.7, 9, 'Golden crispy restaurant-style french fries ready in 3 minutes.', '["Air-fryer friendly","Zero trans fat","Frozen crisp"]'::jsonb, FALSE, TRUE, 16),
  ('p15', 'Epigamia Greek Yogurt Strawberry', 'Epigamia', 'instant-food', '85 g', 45, 55, '🍓', '#FFEAF0', 4.7, 8, 'Thick, high-protein Greek yogurt swirled with real strawberry puree.', '["High protein","No preservatives","Real fruit"]'::jsonb, FALSE, FALSE, 19),
  ('p16', 'Nescafe Classic Instant Coffee', 'Nescafe', 'tea-coffee', '45 g jar', 149, 175, '☕', '#F4EAE0', 4.8, 8, 'Rich, aromatic 100% pure coffee granules for your daily hot or iced brew.', '["100% pure coffee","Rich crema","Glass jar"]'::jsonb, TRUE, FALSE, 25),
  ('p17', 'Tata Tea Gold', 'Tata Tea', 'tea-coffee', '250 g', 132, 155, '🫖', '#FAF0E6', 4.8, 8, 'Blend of Assam CTC leaves with 15% gently rolled long leaves for rich aroma.', '["Assam CTC + long leaf","Rich kadak taste","250 g pack"]'::jsonb, FALSE, FALSE, 30),
  ('p18', 'Aashirvaad Shudh Chakki Atta', 'Aashirvaad', 'staples', '5 kg', 245, 295, '🌾', '#FFF8DF', 4.9, 10, '100% whole wheat chakki atta for soft, fluffy rotis that stay fresh longer.', '["0% Maida","MP Sharbati wheat","Soft rotis"]'::jsonb, FALSE, TRUE, 20),
  ('p19', 'India Gate Basmati Rice Classic', 'India Gate', 'staples', '1 kg', 179, 220, '🍚', '#F4F8FF', 4.8, 9, '2-year aged extra-long slender basmati grains for biryani and pulao.', '["2-year aged","Non-sticky grains","Aromatic"]'::jsonb, FALSE, FALSE, 22),
  ('p20', 'Fortune Sunlite Refined Oil', 'Fortune', 'staples', '1 L', 139, 165, '🌻', '#FFFBE0', 4.7, 9, 'Light, easy-to-digest sunflower oil enriched with Vitamins A & D.', '["Light on stomach","Vitamin A & D","1L pouch"]'::jsonb, FALSE, FALSE, 30),
  ('p21', 'Dove Cream Beauty Bathing Bar', 'Dove', 'personal-care', '3 x 100 g', 168, 198, '🧼', '#F2F6FF', 4.8, 9, 'Gentle cleanser with 1/4 moisturising cream for soft, nourished skin.', '["pH neutral","Dermatologist recommended","Value 3-pack"]'::jsonb, FALSE, FALSE, 24),
  ('p22', 'Minimalist SPF 50 Sunscreen', 'Minimalist', 'personal-care', '50 g', 379, 399, '🧴', '#F4EDFF', 4.7, 10, 'Lightweight broad-spectrum PA++++ sunscreen with zero white cast.', '["SPF 50 PA++++","No white cast","With Multi-Vitamins"]'::jsonb, FALSE, TRUE, 15),
  ('p23', 'Vim Dishwash Gel Lemon', 'Vim', 'cleaning', '500 ml', 99, 119, '🍋', '#EBFCEB', 4.8, 8, 'Concentrated lemon power gel that cuts tough grease in just one spoon.', '["100 lemons power","Gentle on hands","Streak-free shine"]'::jsonb, FALSE, FALSE, 28),
  ('p24', 'Surf Excel Matic Liquid Top Load', 'Surf Excel', 'cleaning', '1 L', 205, 240, '🫧', '#E8F4FF', 4.8, 9, 'Low-foam liquid detergent engineered for tough stain removal in machines.', '["No residue","Color safe","Fresh fragrance"]'::jsonb, FALSE, FALSE, 20)
ON CONFLICT (id) DO NOTHING;
