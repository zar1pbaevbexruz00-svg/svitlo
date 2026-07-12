
-- Grants for info & user_roles
GRANT SELECT ON public.info TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.info TO authenticated;
GRANT ALL ON public.info TO service_role;
GRANT INSERT ON public.user_roles TO authenticated;

-- Add info to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.info;

-- Allow authenticated users to write info blobs (relaxed: any staff or first user via claim)
DROP POLICY IF EXISTS info_admin_write ON public.info;
CREATE POLICY info_admin_write ON public.info FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Function: any authenticated user can claim admin role IF no admin exists yet
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  RETURN false;
END; $$;

GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- Also let anon read categories/products/shops (already public since policies exist? verify)
DO $$ BEGIN
  BEGIN GRANT SELECT ON public.products TO anon, authenticated; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN GRANT SELECT ON public.categories TO anon, authenticated; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN GRANT SELECT ON public.shops TO anon, authenticated; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN GRANT SELECT ON public.orders TO anon, authenticated; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
