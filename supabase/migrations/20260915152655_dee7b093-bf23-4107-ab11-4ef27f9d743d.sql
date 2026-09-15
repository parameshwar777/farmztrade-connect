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