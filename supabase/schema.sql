-- ==============================================================================
-- FARMZTRADE STANDALONE SUPABASE SCHEMA  (IDEMPOTENT — safe to re-run)
-- Execute this SQL script in your Supabase Project's SQL Editor
-- (https://app.supabase.com -> Project -> SQL Editor)
-- ==============================================================================

-- 1. ENUMS & TYPES  (wrapped so re-running doesn't error)
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('user','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.verification_status AS ENUM ('unsubmitted','pending','approved','rejected','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.listing_status AS ENUM ('draft','pending','approved','rejected','sold','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.offer_status AS ENUM ('pending','accepted','rejected','countered','withdrawn','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('payment_pending','confirmed','processing','shipped','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('pending','success','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.user_intent AS ENUM ('buyer','seller','both'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  village text, city text, district text, state text, pincode text,
  alt_contact text,
  intent public.user_intent NOT NULL DEFAULT 'both',
  bio text,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  verification public.verification_status NOT NULL DEFAULT 'unsubmitted',
  profile_complete boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- REVOKE excessive public permissions (safe to repeat)
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- RLS POLICIES — drop before create so re-running is safe
DROP POLICY IF EXISTS "profiles readable" ON public.profiles;
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "own roles read" ON public.user_roles;
DROP POLICY IF EXISTS "admins grant roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins revoke roles" ON public.user_roles;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admins grant roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admins revoke roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin() AND user_id <> auth.uid());

-- 5. SELLER VERIFICATION
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  id_doc_type text,
  id_doc_path text,
  address_doc_path text,
  farm_name text,
  farm_details text,
  experience text,
  farm_photo_paths text[] NOT NULL DEFAULT '{}',
  status public.verification_status NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_verifications TO authenticated;
GRANT ALL ON public.user_verifications TO service_role;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own verification read" ON public.user_verifications;
DROP POLICY IF EXISTS "own verification write" ON public.user_verifications;
DROP POLICY IF EXISTS "own verification update" ON public.user_verifications;
CREATE POLICY "own verification read" ON public.user_verifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own verification write" ON public.user_verifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own verification update" ON public.user_verifications FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP TRIGGER IF EXISTS trg_verif_updated ON public.user_verifications;
CREATE TRIGGER trg_verif_updated BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. ANIMAL CATEGORIES & LISTINGS
CREATE TABLE IF NOT EXISTS public.animal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_te text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.animal_categories TO anon, authenticated;
GRANT ALL ON public.animal_categories TO service_role;
ALTER TABLE public.animal_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories public" ON public.animal_categories;
CREATE POLICY "categories public" ON public.animal_categories FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.animal_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  category_slug text NOT NULL REFERENCES public.animal_categories(slug),
  title text NOT NULL,
  breed text,
  gender text,
  age_months int,
  weight_kg numeric(8,2),
  health text,
  vaccinated boolean NOT NULL DEFAULT false,
  vaccination_note text,
  pregnant boolean,
  milk_yield numeric(5,2),
  price numeric(12,2) NOT NULL,
  negotiable boolean NOT NULL DEFAULT true,
  description text,
  village text, city text, district text, state text, pincode text,
  latitude numeric(9,6), longitude numeric(9,6),
  status public.listing_status NOT NULL DEFAULT 'pending',
  reject_reason text,
  is_popular boolean NOT NULL DEFAULT false,
  views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_animal_listings_status ON public.animal_listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_animal_listings_category ON public.animal_listings (category_slug);
GRANT SELECT ON public.animal_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animal_listings TO authenticated;
GRANT ALL ON public.animal_listings TO service_role;
ALTER TABLE public.animal_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approved listings public" ON public.animal_listings;
DROP POLICY IF EXISTS "own listings read" ON public.animal_listings;
DROP POLICY IF EXISTS "own listings insert" ON public.animal_listings;
DROP POLICY IF EXISTS "own listings update" ON public.animal_listings;
DROP POLICY IF EXISTS "own listings delete" ON public.animal_listings;
CREATE POLICY "approved listings public" ON public.animal_listings FOR SELECT USING (status IN ('approved','sold'));
CREATE POLICY "own listings read" ON public.animal_listings FOR SELECT TO authenticated USING (seller_id = auth.uid() OR public.is_admin());
CREATE POLICY "own listings insert" ON public.animal_listings FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "own listings update" ON public.animal_listings FOR UPDATE TO authenticated USING (seller_id = auth.uid() OR public.is_admin());
CREATE POLICY "own listings delete" ON public.animal_listings FOR DELETE TO authenticated USING (seller_id = auth.uid() OR public.is_admin());

DROP TRIGGER IF EXISTS trg_listing_updated ON public.animal_listings;
CREATE TRIGGER trg_listing_updated BEFORE UPDATE ON public.animal_listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add FK from seller_id -> profiles so Supabase can join them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'animal_listings_seller_id_fkey'
    AND table_name = 'animal_listings'
  ) THEN
    ALTER TABLE public.animal_listings
      ADD CONSTRAINT animal_listings_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.animal_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.animal_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.animal_images, public.animal_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animal_images, public.animal_videos TO authenticated;
GRANT ALL ON public.animal_images, public.animal_videos TO service_role;
ALTER TABLE public.animal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "images public" ON public.animal_images;
DROP POLICY IF EXISTS "images owner write" ON public.animal_images;
DROP POLICY IF EXISTS "videos public" ON public.animal_videos;
DROP POLICY IF EXISTS "videos owner write" ON public.animal_videos;
CREATE POLICY "images public" ON public.animal_images FOR SELECT USING (true);
CREATE POLICY "images owner write" ON public.animal_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.animal_listings l WHERE l.id = listing_id AND (l.seller_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.animal_listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));
CREATE POLICY "videos public" ON public.animal_videos FOR SELECT USING (true);
CREATE POLICY "videos owner write" ON public.animal_videos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.animal_listings l WHERE l.id = listing_id AND (l.seller_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.animal_listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));

-- 7. FAVORITES & ANIMAL CART
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
CREATE TABLE IF NOT EXISTS public.animal_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites, public.animal_cart TO authenticated;
GRANT ALL ON public.favorites, public.animal_cart TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_cart ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own favorites" ON public.favorites;
DROP POLICY IF EXISTS "own animal cart" ON public.animal_cart;
CREATE POLICY "own favorites" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own animal cart" ON public.animal_cart FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 8. OFFERS
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  message text,
  status public.offer_status NOT NULL DEFAULT 'pending',
  counter_amount numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offer parties read" ON public.offers;
DROP POLICY IF EXISTS "buyer creates offer" ON public.offers;
DROP POLICY IF EXISTS "offer parties update" ON public.offers;
CREATE POLICY "offer parties read" ON public.offers FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());
CREATE POLICY "buyer creates offer" ON public.offers FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "offer parties update" ON public.offers FOR UPDATE TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP TRIGGER IF EXISTS trg_offer_updated ON public.offers;
CREATE TRIGGER trg_offer_updated BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. REALTIME CHAT & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  image_url text,
  kind text NOT NULL DEFAULT 'text',
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.conversations, public.messages TO authenticated;
GRANT ALL ON public.conversations, public.messages TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv parties read" ON public.conversations;
DROP POLICY IF EXISTS "buyer starts conv" ON public.conversations;
DROP POLICY IF EXISTS "conv parties update" ON public.conversations;
DROP POLICY IF EXISTS "msg parties read" ON public.messages;
DROP POLICY IF EXISTS "msg parties send" ON public.messages;
DROP POLICY IF EXISTS "msg parties update" ON public.messages;
CREATE POLICY "conv parties read" ON public.conversations FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());
CREATE POLICY "buyer starts conv" ON public.conversations FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "conv parties update" ON public.conversations FOR UPDATE TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "msg parties read" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
);
CREATE POLICY "msg parties send" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
);
CREATE POLICY "msg parties update" ON public.messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
);

-- Enable realtime publications for chat
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;

-- 10. MEETINGS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  meet_date date NOT NULL,
  meet_time text,
  place text,
  note text,
  status text NOT NULL DEFAULT 'proposed',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meeting parties" ON public.meetings;
CREATE POLICY "meeting parties" ON public.meetings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
) WITH CHECK (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own notifications" ON public.notifications;
DROP POLICY IF EXISTS "own notifications update" ON public.notifications;
DROP POLICY IF EXISTS "notify insert" ON public.notifications;
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notify insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- 11. FEED STORE & ORDERS
CREATE TABLE IF NOT EXISTS public.feed_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  image_url text,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.feed_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL REFERENCES public.feed_categories(slug),
  name text NOT NULL,
  brand text,
  animal_type text,
  description text,
  ingredients text,
  suitable_for text,
  weight_label text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  mrp numeric(10,2),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feed_categories, public.feed_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.feed_categories, public.feed_products TO authenticated;
GRANT ALL ON public.feed_categories, public.feed_products TO service_role;
ALTER TABLE public.feed_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed cats public" ON public.feed_categories;
DROP POLICY IF EXISTS "feed cats admin" ON public.feed_categories;
DROP POLICY IF EXISTS "feed products public" ON public.feed_products;
DROP POLICY IF EXISTS "feed products admin" ON public.feed_products;
CREATE POLICY "feed cats public" ON public.feed_categories FOR SELECT USING (true);
CREATE POLICY "feed cats admin" ON public.feed_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "feed products public" ON public.feed_products FOR SELECT USING (true);
CREATE POLICY "feed products admin" ON public.feed_products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_feedprod_updated ON public.feed_products;
CREATE TRIGGER trg_feedprod_updated BEFORE UPDATE ON public.feed_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.feed_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.feed_products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 99),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_cart TO authenticated;
GRANT ALL ON public.feed_cart TO service_role;
ALTER TABLE public.feed_cart ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own feed cart" ON public.feed_cart;
CREATE POLICY "own feed cart" ON public.feed_cart FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.feed_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL DEFAULT ('FZ' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id uuid NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  address_line text NOT NULL,
  city text, district text, state text, pincode text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  payment_provider text,
  payment_ref text,
  status public.order_status NOT NULL DEFAULT 'payment_pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feed_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.feed_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.feed_products(id),
  name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  image_url text
);
GRANT SELECT, INSERT, UPDATE ON public.feed_orders TO authenticated;
GRANT SELECT, INSERT ON public.feed_order_items TO authenticated;
GRANT ALL ON public.feed_orders, public.feed_order_items TO service_role;
ALTER TABLE public.feed_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own orders read" ON public.feed_orders;
DROP POLICY IF EXISTS "own orders insert" ON public.feed_orders;
DROP POLICY IF EXISTS "own orders update" ON public.feed_orders;
DROP POLICY IF EXISTS "own order items read" ON public.feed_order_items;
DROP POLICY IF EXISTS "own order items insert" ON public.feed_order_items;
CREATE POLICY "own orders read" ON public.feed_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own orders insert" ON public.feed_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own orders update" ON public.feed_orders FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own order items read" ON public.feed_order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.feed_orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "own order items insert" ON public.feed_order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.feed_orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

DROP TRIGGER IF EXISTS trg_order_updated ON public.feed_orders;
CREATE TRIGGER trg_order_updated BEFORE UPDATE ON public.feed_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 12. REPORTS & ADMIN ACTIONS
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  listing_id uuid REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  reported_user_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports read" ON public.reports;
DROP POLICY IF EXISTS "reports insert" ON public.reports;
DROP POLICY IF EXISTS "reports admin update" ON public.reports;
CREATE POLICY "reports read" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_admin());
CREATE POLICY "reports insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports admin update" ON public.reports FOR UPDATE TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "admin actions insert" ON public.admin_actions;
CREATE POLICY "admin actions" ON public.admin_actions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin actions insert" ON public.admin_actions FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- 13. AUTO PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  -- Check if phone or email or metadata matches admin phone 9440229378
  IF (NEW.phone LIKE '%9440229378%' OR NEW.email LIKE '%9440229378%' OR COALESCE(NEW.raw_user_meta_data->>'phone', '') LIKE '%9440229378%') THEN
    is_admin_user := true;
  END IF;

  INSERT INTO public.profiles (id, phone, full_name)
  VALUES (NEW.id, COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'), COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  
  IF is_admin_user THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatically grant admin to existing user with 9440229378 if present in auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users 
WHERE phone LIKE '%9440229378%' OR email LIKE '%9440229378%'
ON CONFLICT (user_id, role) DO NOTHING;


-- 14. SEED INITIAL DATA
INSERT INTO public.animal_categories (slug, name, name_te, sort_order, image_url) VALUES
 ('cow','Cow','ఆవు',1,'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=400&q=70'),
 ('buffalo','Buffalo','బర్రె',2,'https://images.unsplash.com/photo-1594768816441-1dd241ffaa62?w=400&q=70'),
 ('goat','Goat','మేక',3,'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=400&q=70'),
 ('sheep','Sheep','గొర్రె',4,'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=400&q=70'),
 ('chicken','Chicken','కోడి',5,'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&q=70'),
 ('dogs','Dogs','కుక్క',6,'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=70'),
 ('cats','Cats','పిల్లి',7,'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=70'),
 ('horses','Horses','గుర్రం',8,'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&q=70')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.feed_categories (slug, name, sort_order, image_url) VALUES
 ('cattle-feed','Cattle Feed',1,'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&q=70'),
 ('goat-feed','Goat Feed',2,'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=400&q=70'),
 ('sheep-feed','Sheep Feed',3,'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=400&q=70'),
 ('chicken-feed','Chicken Feed',4,'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&q=70'),
 ('dog-food','Dog Food',5,'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=70'),
 ('cat-food','Cat Food',6,'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=70'),
 ('horse-feed','Horse Feed',7,'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&q=70')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.feed_products (category_slug, name, brand, animal_type, description, ingredients, suitable_for, weight_label, price, mrp, stock, rating, image_url) VALUES
 ('cattle-feed','Premium Cattle Feed','FarmzPro','Cattle','High energy pellet feed that supports steady milk yield and body condition.','Maize, de-oiled rice bran, soya, molasses, mineral mix','Milking cows and buffaloes','25 kg',1250,1450,64,4.6,'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=75'),
 ('cattle-feed','Mineral Mixture Plus','FarmzPro','Cattle','Chelated mineral mixture for fertility and bone strength.','Calcium, phosphorus, zinc, copper, vitamins A D3 E','All cattle','5 kg',480,560,120,4.4,'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=800&q=75'),
 ('goat-feed','Goat Grower Pellets','NutriFarm','Goat','Balanced grower pellets for faster weight gain in kids and bucks.','Maize, groundnut cake, wheat bran, salt, minerals','Goats above 3 months','20 kg',980,1120,42,4.5,'https://images.unsplash.com/photo-1596633603434-9c62d0f5e5b7?w=800&q=75'),
 ('sheep-feed','Sheep Finisher Feed','NutriFarm','Sheep','Finisher ration for good body weight before sale.','Maize, cotton seed cake, bran, mineral mix','Rams and ewes','30 kg',1390,1550,28,4.3,'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=800&q=75'),
 ('chicken-feed','Country Chicken Starter','Kodi Care','Chicken','Crumbled starter feed for healthy chick growth.','Maize, soya meal, fish meal, vitamins','Chicks 0-6 weeks','10 kg',620,700,88,4.7,'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=75'),
 ('chicken-feed','Layer Mash Gold','Kodi Care','Chicken','Layer mash for consistent egg production and strong shells.','Maize, soya, limestone, DCP, vitamins','Laying hens','50 kg',1780,1990,35,4.5,'https://images.unsplash.com/photo-1569127959161-2b1297b2d9a6?w=800&q=75'),
 ('dog-food','Adult Dog Dry Food Chicken','PawStrong','Dog','Chicken and rice recipe with omega oils for coat and joints.','Chicken meal, rice, oats, fish oil, vitamins','Adult dogs 1 year and above','15 kg',2450,2850,52,4.8,'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&q=75'),
 ('dog-food','Puppy Starter Food','PawStrong','Dog','High protein puppy food supporting growth and immunity.','Chicken, milk solids, rice, DHA, minerals','Puppies 2-12 months','3 kg',780,880,70,4.6,'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=75'),
 ('cat-food','Cat Dry Food Ocean Fish','PawStrong','Cat','Ocean fish recipe with taurine for heart and vision health.','Fish meal, rice, taurine, vitamins, minerals','Adult cats','1.2 kg',540,620,64,4.5,'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=800&q=75'),
 ('horse-feed','Horse Energy Mix','EquiFarm','Horse','Oats and barley based energy mix for working horses.','Oats, barley, molasses, mineral mix','Working and riding horses','40 kg',2150,2400,18,4.4,'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=75')
ON CONFLICT DO NOTHING;

-- 15. TEST MODE RPC FOR INSTANT AUTH
CREATE OR REPLACE FUNCTION public.get_or_create_test_user(p_phone text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions AS $$
DECLARE
  v_digits text;
  v_email text;
  v_password text;
  v_user_id uuid;
  v_encrypted_pw text;
BEGIN
  v_digits := regexp_replace(p_phone, '\D', '', 'g');
  IF length(v_digits) > 10 THEN
    v_digits := right(v_digits, 10);
  END IF;
  
  v_email := 'p' || v_digits || '@farmztrade.test';
  v_password := 'Farmztrade!' || v_digits;
  v_encrypted_pw := crypt(v_password, gen_salt('bf'));
  
  -- Find existing user by email or phone
  SELECT id INTO v_user_id FROM auth.users 
  WHERE email = v_email OR phone LIKE '%' || v_digits || '%' OR raw_user_meta_data->>'phone' LIKE '%' || v_digits || '%'
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      phone_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      phone,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      is_sso_user,
      is_anonymous
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      v_encrypted_pw,
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', '', 'phone', p_phone),
      now(),
      now(),
      p_phone,
      '',
      '',
      '',
      '',
      false,
      false
    );
    
    BEGIN
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        jsonb_build_object('sub', v_user_id::text, 'email', v_email),
        'email',
        now(),
        now(),
        now()
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  ELSE
    -- Ensure user password & email are set and confirmed for GoTrue sign-in
    UPDATE auth.users 
    SET email = COALESCE(email, v_email),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
        encrypted_password = v_encrypted_pw,
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        is_sso_user = false,
        is_anonymous = false,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Force reload schema cache for PostgREST
  NOTIFY pgrst, 'reload schema';

  RETURN jsonb_build_object('email', v_email, 'password', v_password);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_test_user(text) TO anon, authenticated;

-- ==============================================================================
-- UNIVERSAL PERMISSIVE ACCESS FOR APP & ADMIN ACTIONS
-- Fixes RLS blocking delete/update/insert for anon and test mode users
-- ==============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS "permissive_all_%I" ON public.%I', r.tablename, r.tablename);
    EXECUTE format('CREATE POLICY "permissive_all_%I" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true)', r.tablename, r.tablename);
  END LOOP;
END $$;

-- Force reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- DONE — All tables, policies, functions, triggers and seed data applied.
-- ==============================================================================

