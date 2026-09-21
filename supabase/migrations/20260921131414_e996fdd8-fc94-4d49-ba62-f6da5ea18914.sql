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