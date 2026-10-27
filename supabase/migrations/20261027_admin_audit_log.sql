-- ==============================================================================
-- CLAWCRAFT STUDIO — ADMIN AUDIT LOG TABLE & SECURITY POLICIES
-- ==============================================================================
-- Idempotent Migration: Creates admin_audit_log table with strict RLS
-- Run this in your Supabase Project SQL Editor.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email text NOT NULL,
  action text NOT NULL,
  target text,
  ip_hash text,
  user_agent text,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Ensure NO public access policies exist.
-- Service-role (backend admin client) bypasses RLS automatically.
-- Anon and authenticated customer roles have ZERO access.
DROP POLICY IF EXISTS "No public read access to admin audit log" ON admin_audit_log;
DROP POLICY IF EXISTS "No public write access to admin audit log" ON admin_audit_log;
DROP POLICY IF EXISTS "Public cannot read admin audit log" ON admin_audit_log;
DROP POLICY IF EXISTS "Public cannot insert admin audit log" ON admin_audit_log;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_email ON admin_audit_log (admin_email);
