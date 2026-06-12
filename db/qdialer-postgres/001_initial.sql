BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS qdialer_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  billing_status text NOT NULL DEFAULT 'trial',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qdialer_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES qdialer_tenants(id) ON DELETE CASCADE,
  hostname text NOT NULL,
  vicidial_base_url text NOT NULL,
  api_mode text NOT NULL DEFAULT 'mock',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qdialer_vendor_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES qdialer_tenants(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('ingroup', 'list', 'webhook')),
  source_id text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, source_type, source_id)
);

CREATE TABLE IF NOT EXISTS qdialer_vendor_cost_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_source_id uuid NOT NULL REFERENCES qdialer_vendor_sources(id) ON DELETE CASCADE,
  cost_mode text NOT NULL CHECK (cost_mode IN ('cpa', 'cpl', 'duration')),
  cost_cents integer NOT NULL CHECK (cost_cents >= 0),
  billable_duration_seconds integer NOT NULL DEFAULT 0 CHECK (billable_duration_seconds >= 0),
  acquisition_statuses text[] NOT NULL DEFAULT ARRAY['SALE'],
  active boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qdialer_status_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES qdialer_tenants(id) ON DELETE CASCADE,
  vicidial_status text NOT NULL,
  category text NOT NULL CHECK (category IN ('acquisition', 'bad_lead', 'callback', 'neutral', 'do_not_call')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, vicidial_status)
);

CREATE TABLE IF NOT EXISTS qdialer_report_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES qdialer_tenants(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('vendor_cost', 'agent_productivity', 'live_floor')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  payload jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qdialer_recording_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES qdialer_tenants(id) ON DELETE CASCADE,
  vicidial_recording_id text NOT NULL,
  lead_id text,
  agent_user text,
  vendor_source_id uuid REFERENCES qdialer_vendor_sources(id) ON DELETE SET NULL,
  review_status text NOT NULL DEFAULT 'open',
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  notes text NOT NULL DEFAULT '',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qdialer_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES qdialer_tenants(id) ON DELETE SET NULL,
  actor_user text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS qdialer_vendor_sources_tenant_idx ON qdialer_vendor_sources(tenant_id);
CREATE INDEX IF NOT EXISTS qdialer_vendor_cost_rules_source_idx ON qdialer_vendor_cost_rules(vendor_source_id);
CREATE INDEX IF NOT EXISTS qdialer_report_snapshots_lookup_idx ON qdialer_report_snapshots(tenant_id, report_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS qdialer_recording_reviews_lookup_idx ON qdialer_recording_reviews(tenant_id, review_status, agent_user);
CREATE INDEX IF NOT EXISTS qdialer_audit_events_lookup_idx ON qdialer_audit_events(tenant_id, entity_type, entity_id, created_at DESC);

COMMIT;
