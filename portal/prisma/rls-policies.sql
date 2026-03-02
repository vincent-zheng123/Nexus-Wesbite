-- ============================================================
-- NEXUS — Supabase Row Level Security Policies
-- ============================================================
-- Run this in the Supabase SQL Editor AFTER the Prisma
-- migration has been applied (npx prisma migrate dev).
--
-- Architecture note:
--   The portal (Next.js + Prisma) and n8n both use the
--   SERVICE ROLE key, which bypasses RLS automatically.
--   These policies block access via the ANON key as a safety
--   net — no direct table reads are possible without the
--   service role key.
-- ============================================================

-- ─── Enable RLS on all data tables ──────────────────────────

ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_config        ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_followups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;

-- ─── Block all anon/authenticated access ────────────────────
-- With RLS enabled and NO policy, access is denied by default.
-- Service role key is exempt from RLS — Prisma and n8n continue
-- to work without any changes.
--
-- No explicit DENY policies are needed; RLS-enabled tables
-- with no matching policy default to no access for non-service
-- roles. The blocks below are explicit for clarity.

-- leads: only accessible via service role
CREATE POLICY "leads_service_only" ON leads
  FOR ALL
  TO anon, authenticated
  USING (false);

-- call_logs: only accessible via service role
CREATE POLICY "call_logs_service_only" ON call_logs
  FOR ALL
  TO anon, authenticated
  USING (false);

-- appointments: only accessible via service role
CREATE POLICY "appointments_service_only" ON appointments
  FOR ALL
  TO anon, authenticated
  USING (false);

-- followups: only accessible via service role
CREATE POLICY "followups_service_only" ON followups
  FOR ALL
  TO anon, authenticated
  USING (false);

-- client_config: only accessible via service role
CREATE POLICY "client_config_service_only" ON client_config
  FOR ALL
  TO anon, authenticated
  USING (false);

-- scheduled_followups: only accessible via service role
CREATE POLICY "scheduled_followups_service_only" ON scheduled_followups
  FOR ALL
  TO anon, authenticated
  USING (false);

-- outreach_attempts: only accessible via service role
CREATE POLICY "outreach_attempts_service_only" ON outreach_attempts
  FOR ALL
  TO anon, authenticated
  USING (false);

-- automation_runs: only accessible via service role
CREATE POLICY "automation_runs_service_only" ON automation_runs
  FOR ALL
  TO anon, authenticated
  USING (false);

-- clients: only accessible via service role
CREATE POLICY "clients_service_only" ON clients
  FOR ALL
  TO anon, authenticated
  USING (false);

-- users: only accessible via service role
CREATE POLICY "users_service_only" ON users
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ─── Verification ───────────────────────────────────────────
-- After running, verify in Supabase SQL Editor using the
-- anon key role:
--
--   SET ROLE anon;
--   SELECT * FROM leads LIMIT 1;
--   -- Expected: "new row violates row-level security policy"
--   RESET ROLE;
--
-- Service role access should still work via Prisma.
-- ============================================================
