-- FARMZTRADE: run this in your own Supabase project's SQL editor (safe to run once, in order).

-- ===== supabase/migrations/20260915152655_dee7b093-bf23-4107-ab11-4ef27f9d743d.sql =====
-- Animal categories: admin write access
GRANT INSERT, UPDATE, DELETE ON public.animal_categories TO authenticated;
GRANT ALL ON public.animal_categories TO service_role;

CREATE POLICY "animal cats admin" ON public.animal_categories
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Feed products: seller listings with admin approval
ALTER TABLE public.feed_products
  ADD COLUMN seller_id uuid,
  ADD COLUMN status text NOT NULL DEFAULT 'approved',
  ADD COLUMN reject_reason text;

ALTER TABLE public.feed_products ALTER COLUMN status SET DEFAULT 'pending';

CREATE INDEX feed_products_seller_idx ON public.feed_products (seller_id);
CREATE INDEX feed_products_status_idx ON public.feed_products (status);

CREATE OR REPLACE FUNCTION public.feed_products_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid feed product status: %', NEW.status;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_feedprod_validate
  BEFORE INSERT OR UPDATE ON public.feed_products
  FOR EACH ROW EXECUTE FUNCTION public.feed_products_validate();

DROP POLICY "feed products public" ON public.feed_products;

CREATE POLICY "feed products public" ON public.feed_products
  FOR SELECT TO anon, authenticated
  USING (status = 'approved' AND active = true);

CREATE POLICY "feed products own read" ON public.feed_products
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "feed products own insert" ON public.feed_products
  FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid() AND status = 'pending');

CREATE POLICY "feed products own update" ON public.feed_products
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "feed products own delete" ON public.feed_products
  FOR DELETE TO authenticated
  USING (seller_id = auth.uid());
-- ===== supabase/migrations/20260921131414_e996fdd8-fc94-4d49-ba62-f6da5ea18914.sql =====
CREATE TABLE public.vet_doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  hospital_name text,
  specialization text,
  about text,
  available_hours text,
  address_line text,
  village text,
  city text,
  district text,
  state text,
  pincode text,
  latitude numeric,
  longitude numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vet_doctors TO authenticated;
GRANT SELECT ON public.vet_doctors TO anon;
GRANT ALL ON public.vet_doctors TO service_role;

ALTER TABLE public.vet_doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active doctors" ON public.vet_doctors
  FOR SELECT USING (active = true);

CREATE POLICY "Doctors can view their own entry" ON public.vet_doctors
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Doctors can add their own entry" ON public.vet_doctors
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own entry" ON public.vet_doctors
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can delete their own entry" ON public.vet_doctors
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all doctors" ON public.vet_doctors
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX idx_vet_doctors_city ON public.vet_doctors (city);
CREATE INDEX idx_vet_doctors_district ON public.vet_doctors (district);
CREATE INDEX idx_vet_doctors_user ON public.vet_doctors (user_id);

CREATE TRIGGER trg_vet_doctors_updated BEFORE UPDATE ON public.vet_doctors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.vet_doctors;
