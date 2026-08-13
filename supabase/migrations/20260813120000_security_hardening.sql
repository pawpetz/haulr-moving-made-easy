-- Security hardening pass.
--
-- 1) profiles / mover_profiles / vehicles were readable by the `anon` role
--    (i.e. anyone on the internet, no login required), exposing customer
--    contact info and mover license/insurance numbers publicly. Restrict
--    reads to authenticated users only.
--
-- 2) The jobs "update own jobs" policy let ANY authenticated user modify a
--    REQUESTED/SEARCHING job (not just approved movers), meaning a plain
--    customer account could assign themselves as the mover on someone
--    else's job. Require an APPROVED mover profile to claim an open job,
--    and add a WITH CHECK so the resulting row must still belong to the
--    customer, the claiming mover, or an admin.

-- 1) Remove public/anon read access to PII-bearing tables.
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.mover_profiles FROM anon;
REVOKE SELECT ON public.vehicles FROM anon;

DROP POLICY IF EXISTS "profiles readable" ON public.profiles;
CREATE POLICY "profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "movers readable" ON public.mover_profiles;
CREATE POLICY "movers readable by authenticated" ON public.mover_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "vehicles readable" ON public.vehicles;
CREATE POLICY "vehicles readable by authenticated" ON public.vehicles
  FOR SELECT TO authenticated USING (true);

-- NOTE: this is a stopgap, not the end state. Any authenticated user can
-- still read every other user's PII (phone, address, license, insurance).
-- Before real users sign up, split these tables into a public-safe view
-- (name, photo, rating, jobs_completed, service_area) for job cards /
-- mover listings, and keep phone/address/license/insurance visible only
-- to the row owner and admins.

-- 2) Close the open-job claiming loophole.
DROP POLICY IF EXISTS "update own jobs" ON public.jobs;
CREATE POLICY "update own jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (
    customer_user_id = auth.uid()
    OR mover_user_id = auth.uid()
    OR (
      status IN ('REQUESTED', 'SEARCHING')
      AND EXISTS (
        SELECT 1 FROM public.mover_profiles m
        WHERE m.user_id = auth.uid() AND m.status = 'APPROVED'
      )
    )
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    customer_user_id = auth.uid()
    OR mover_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );
