
-- match_reminders: drop permissive policy, add service_role-only policy
DROP POLICY IF EXISTS "Allow edge functions full access on match_reminders" ON public.match_reminders;
CREATE POLICY "Service role only" ON public.match_reminders
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- prediction_cache: drop permissive policy, add service_role-only policy
DROP POLICY IF EXISTS "Allow edge functions full access" ON public.prediction_cache;
CREATE POLICY "Service role only" ON public.prediction_cache
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- telegram_user_settings: drop permissive policy, add service_role-only policy
DROP POLICY IF EXISTS "Allow edge functions full access" ON public.telegram_user_settings;
CREATE POLICY "Service role only" ON public.telegram_user_settings
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- match_results: restrict INSERT and UPDATE to service_role only
DROP POLICY IF EXISTS "Allow edge functions to insert results" ON public.match_results;
DROP POLICY IF EXISTS "Allow edge functions to update results" ON public.match_results;
CREATE POLICY "Service role insert only" ON public.match_results
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Service role update only" ON public.match_results
  FOR UPDATE USING ((auth.jwt() ->> 'role') = 'service_role');
