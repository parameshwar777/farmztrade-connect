-- ENUMS
CREATE TYPE public.app_role AS ENUM ('user','admin');
CREATE TYPE public.verification_status AS ENUM ('unsubmitted','pending','approved','rejected','suspended');
CREATE TYPE public.listing_status AS ENUM ('draft','pending','approved','rejected','sold','suspended');
CREATE TYPE public.offer_status AS ENUM ('pending','accepted','rejected','countered','withdrawn','expired');
CREATE TYPE public.order_status AS ENUM ('payment_pending','confirmed','processing','shipped','delivered','cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending','success','failed','cancelled');
CREATE TYPE public.user_intent AS ENUM ('buyer','seller','both');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
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
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- SELLER VERIFICATION
CREATE TABLE public.user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  id_doc_path text, address_doc_path text,
  farm_name text, farm_details text, experience text,
  farm_photo_paths text[] NOT NULL DEFAULT '{}',
  status public.verification_status NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_verifications TO authenticated;
GRANT ALL ON public.user_verifications TO service_role;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own verification read" ON public.user_verifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own verification write" ON public.user_verifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own verification update" ON public.user_verifications FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE TRIGGER trg_verif_updated BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CATEGORIES
CREATE TABLE public.animal_categories (
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
CREATE POLICY "categories public" ON public.animal_categories FOR SELECT USING (true);

-- LISTINGS
CREATE TABLE public.animal_listings (
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
CREATE INDEX ON public.animal_listings (status, created_at DESC);
CREATE INDEX ON public.animal_listings (category_slug);
GRANT SELECT ON public.animal_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animal_listings TO authenticated;
GRANT ALL ON public.animal_listings TO service_role;
ALTER TABLE public.animal_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved listings public" ON public.animal_listings FOR SELECT USING (status IN ('approved','sold'));
CREATE POLICY "own listings read" ON public.animal_listings FOR SELECT TO authenticated USING (seller_id = auth.uid() OR public.is_admin());
CREATE POLICY "own listings insert" ON public.animal_listings FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "own listings update" ON public.animal_listings FOR UPDATE TO authenticated USING (seller_id = auth.uid() OR public.is_admin());
CREATE POLICY "own listings delete" ON public.animal_listings FOR DELETE TO authenticated USING (seller_id = auth.uid() OR public.is_admin());
CREATE TRIGGER trg_listing_updated BEFORE UPDATE ON public.animal_listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.animal_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.animal_videos (
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
CREATE POLICY "images public" ON public.animal_images FOR SELECT USING (true);
CREATE POLICY "images owner write" ON public.animal_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.animal_listings l WHERE l.id = listing_id AND (l.seller_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.animal_listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));
CREATE POLICY "videos public" ON public.animal_videos FOR SELECT USING (true);
CREATE POLICY "videos owner write" ON public.animal_videos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.animal_listings l WHERE l.id = listing_id AND (l.seller_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.animal_listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));

-- FAVORITES / INTERESTED
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
CREATE TABLE public.animal_cart (
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
CREATE POLICY "own favorites" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own animal cart" ON public.animal_cart FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- OFFERS
CREATE TABLE public.offers (
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
CREATE POLICY "offer parties read" ON public.offers FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());
CREATE POLICY "buyer creates offer" ON public.offers FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "offer parties update" ON public.offers FOR UPDATE TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE TRIGGER trg_offer_updated BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CHAT
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.animal_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);
CREATE TABLE public.messages (
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
CREATE INDEX ON public.messages (conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.conversations, public.messages TO authenticated;
GRANT ALL ON public.conversations, public.messages TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- MEETINGS
CREATE TABLE public.meetings (
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
CREATE POLICY "meeting parties" ON public.meetings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
) WITH CHECK (created_by = auth.uid());

-- NOTIFICATIONS
CREATE TABLE public.notifications (
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
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notify insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- FEED STORE
CREATE TABLE public.feed_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  image_url text,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.feed_products (
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
CREATE POLICY "feed cats public" ON public.feed_categories FOR SELECT USING (true);
CREATE POLICY "feed cats admin" ON public.feed_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "feed products public" ON public.feed_products FOR SELECT USING (true);
CREATE POLICY "feed products admin" ON public.feed_products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_feedprod_updated BEFORE UPDATE ON public.feed_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.feed_cart (
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
CREATE POLICY "own feed cart" ON public.feed_cart FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.feed_orders (
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
CREATE TABLE public.feed_order_items (
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
CREATE POLICY "own orders read" ON public.feed_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own orders insert" ON public.feed_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own orders update" ON public.feed_orders FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own order items read" ON public.feed_order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.feed_orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "own order items insert" ON public.feed_order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.feed_orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE TRIGGER trg_order_updated BEFORE UPDATE ON public.feed_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REPORTS
CREATE TABLE public.reports (
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
CREATE POLICY "reports read" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_admin());
CREATE POLICY "reports insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports admin update" ON public.reports FOR UPDATE TO authenticated USING (public.is_admin());

CREATE TABLE public.admin_actions (
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
CREATE POLICY "admin actions" ON public.admin_actions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin actions insert" ON public.admin_actions FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- new signup -> profile + role
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name)
  VALUES (NEW.id, NEW.phone, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED
INSERT INTO public.animal_categories (slug, name, name_te, sort_order, image_url) VALUES
 ('cow','Cow','ఆవు',1,'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=400&q=70'),
 ('buffalo','Buffalo','బర్రె',2,'https://images.unsplash.com/photo-1594768816441-1dd241ffaa62?w=400&q=70'),
 ('goat','Goat','మేక',3,'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=400&q=70'),
 ('sheep','Sheep','గొర్రె',4,'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=400&q=70'),
 ('chicken','Chicken','కోడి',5,'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&q=70'),
 ('dogs','Dogs','కుక్క',6,'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=70'),
 ('cats','Cats','పిల్లి',7,'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=70'),
 ('horses','Horses','గుర్రం',8,'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&q=70');

INSERT INTO public.profiles (id, full_name, phone, city, district, state, verification, profile_complete, rating, avatar_url, intent) VALUES
 ('11111111-1111-1111-1111-111111111111','Ramesh Babu','+919988877665','Guntur','Guntur','Andhra Pradesh','approved',true,4.8,'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=200&q=70','both'),
 ('22222222-2222-2222-2222-222222222222','Lakshmi Devi','+919812345670','Vijayawada','Krishna','Andhra Pradesh','approved',true,4.6,'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=70','seller'),
 ('33333333-3333-3333-3333-333333333333','Venkat Reddy','+919845612300','Ongole','Prakasam','Andhra Pradesh','approved',true,4.9,'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=70','both');

INSERT INTO public.animal_listings (id, seller_id, category_slug, title, breed, gender, age_months, weight_kg, health, vaccinated, vaccination_note, pregnant, milk_yield, price, description, village, city, district, state, pincode, status, is_popular, views) VALUES
 ('a0000001-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','buffalo','Murrah Buffalo','Murrah','Female',36,480,'Healthy, good milker',true,'FMD, HS',false,10,85000,'Healthy Murrah buffalo with good milk capacity. Calm temperament, hand milked twice daily.','Kankipadu','Guntur','Guntur','Andhra Pradesh','522001','approved',true,412),
 ('a0000002-0000-4000-8000-000000000002','22222222-2222-2222-2222-222222222222','goat','Boer Goat','Boer','Male',18,35,'Healthy, all vaccinated',true,'PPR, FMD',null,null,22000,'Well grown Boer male goat. Good for breeding, raised on natural grazing.','Gannavaram','Vijayawada','Krishna','Andhra Pradesh','521101','approved',true,268),
 ('a0000003-0000-4000-8000-000000000003','33333333-3333-3333-3333-333333333333','cow','Gir Cow','Gir','Female',48,420,'Excellent health',true,'FMD, Brucella',true,12,65000,'Pure Gir cow, second lactation, A2 milk. Very docile and easy to handle.','Chimakurthy','Ongole','Prakasam','Andhra Pradesh','523001','approved',true,531),
 ('a0000004-0000-4000-8000-000000000004','22222222-2222-2222-2222-222222222222','goat','Sirohi Goat','Sirohi','Female',12,28,'Healthy',true,'PPR',false,null,20000,'Young Sirohi doe, good growth rate, dewormed regularly.','Addanki','Prakasam','Prakasam','Andhra Pradesh','523201','approved',false,142),
 ('a0000005-0000-4000-8000-000000000005','11111111-1111-1111-1111-111111111111','dogs','Labrador Retriever','Labrador','Male',6,18,'Vaccinated, dewormed',true,'DHPPi, Anti-rabies',null,null,35000,'Playful Labrador puppy, home raised with parents on site.','Tadepalli','Guntur','Guntur','Andhra Pradesh','522501','approved',false,320),
 ('a0000006-0000-4000-8000-000000000006','33333333-3333-3333-3333-333333333333','cats','Persian Cat','Persian','Female',8,4,'Healthy, litter trained',true,'Tricat',null,null,18000,'Sweet Persian queen, fully litter trained and used to children.','Kurnool','Kurnool','Kurnool','Andhra Pradesh','518001','approved',false,187),
 ('a0000007-0000-4000-8000-000000000007','22222222-2222-2222-2222-222222222222','chicken','Country Chicken (Natu Kodi)','Aseel Cross','Male',7,3,'Healthy free range',false,null,null,null,900,'Free range country chicken raised on natural feed. Sold per bird.','Nuzvid','Vijayawada','Krishna','Andhra Pradesh','521201','approved',false,96),
 ('a0000008-0000-4000-8000-000000000008','33333333-3333-3333-3333-333333333333','horses','Marwari Horse','Marwari','Male',60,400,'Strong, well trained',true,'Tetanus, EIA tested',null,null,265000,'Well trained Marwari stallion, good for events and riding.','Ongole','Ongole','Prakasam','Andhra Pradesh','523002','approved',true,241),
 ('a0000009-0000-4000-8000-000000000009','11111111-1111-1111-1111-111111111111','sheep','Nellore Sheep','Nellore Jodipi','Male',14,42,'Healthy',true,'PPR, ET',null,null,16500,'Tall Nellore ram, excellent body structure for breeding.','Kavali','Nellore','Nellore','Andhra Pradesh','524201','approved',false,73),
 ('a000000a-0000-4000-8000-00000000000a','22222222-2222-2222-2222-222222222222','buffalo','Jaffarabadi Buffalo','Jaffarabadi','Female',54,610,'Healthy heavy milker',true,'FMD, HS',false,14,125000,'Heavy Jaffarabadi buffalo, 14 litres per day, third lactation.','Machilipatnam','Machilipatnam','Krishna','Andhra Pradesh','521001','approved',false,158);

INSERT INTO public.animal_images (listing_id, url, sort_order) VALUES
 ('a0000001-0000-4000-8000-000000000001','https://images.unsplash.com/photo-1594768816441-1dd241ffaa62?w=1000&q=75',0),
 ('a0000001-0000-4000-8000-000000000001','https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1000&q=75',1),
 ('a0000002-0000-4000-8000-000000000002','https://images.unsplash.com/photo-1524024973431-2ad916746881?w=1000&q=75',0),
 ('a0000002-0000-4000-8000-000000000002','https://images.unsplash.com/photo-1560819965-c2b8ee8e1e2b?w=1000&q=75',1),
 ('a0000003-0000-4000-8000-000000000003','https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=1000&q=75',0),
 ('a0000003-0000-4000-8000-000000000003','https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1000&q=75',1),
 ('a0000004-0000-4000-8000-000000000004','https://images.unsplash.com/photo-1533318087102-b3ad366ed041?w=1000&q=75',0),
 ('a0000005-0000-4000-8000-000000000005','https://images.unsplash.com/photo-1552053831-71594a27632d?w=1000&q=75',0),
 ('a0000006-0000-4000-8000-000000000006','https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1000&q=75',0),
 ('a0000007-0000-4000-8000-000000000007','https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=1000&q=75',0),
 ('a0000008-0000-4000-8000-000000000008','https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1000&q=75',0),
 ('a0000009-0000-4000-8000-000000000009','https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=1000&q=75',0),
 ('a000000a-0000-4000-8000-00000000000a','https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1000&q=75',0);

INSERT INTO public.feed_categories (slug, name, sort_order, image_url) VALUES
 ('cattle-feed','Cattle Feed',1,'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&q=70'),
 ('goat-feed','Goat Feed',2,'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=400&q=70'),
 ('sheep-feed','Sheep Feed',3,'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=400&q=70'),
 ('chicken-feed','Chicken Feed',4,'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&q=70'),
 ('dog-food','Dog Food',5,'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=70'),
 ('cat-food','Cat Food',6,'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=70'),
 ('horse-feed','Horse Feed',7,'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&q=70');

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
 ('horse-feed','Horse Energy Mix','EquiFarm','Horse','Oats and barley based energy mix for working horses.','Oats, barley, molasses, mineral mix','Working and riding horses','40 kg',2150,2400,18,4.4,'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=75');