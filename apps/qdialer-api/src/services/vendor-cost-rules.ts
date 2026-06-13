import type { Pool, PoolClient } from "pg";
import type { VendorCostRule, VendorCostRuleInput } from "@qdialer/shared";

type Queryable = Pool | PoolClient;

type VendorCostRuleRow = {
  id: string;
  vendor_name: string;
  source_type: VendorCostRule["sourceType"];
  source_id: string;
  cost_mode: VendorCostRule["costMode"];
  cost_cents: number;
  billable_duration_seconds: number;
  acquisition_statuses: string[];
  active: boolean;
};

const defaultTenant = {
  name: "qDialer Default Agency",
  slug: "default"
};

function normalizeStatuses(statuses: string[]): string[] {
  const normalized = statuses.map((status) => status.trim().toUpperCase()).filter(Boolean);
  return normalized.length > 0 ? Array.from(new Set(normalized)) : ["SALE"];
}

function mapVendorCostRule(row: VendorCostRuleRow): VendorCostRule {
  return {
    id: row.id,
    vendorName: row.vendor_name,
    sourceType: row.source_type,
    sourceId: row.source_id,
    costMode: row.cost_mode,
    costCents: row.cost_cents,
    billableDurationSeconds: row.billable_duration_seconds,
    acquisitionStatuses: normalizeStatuses(row.acquisition_statuses ?? []),
    active: row.active
  };
}

export async function ensureDefaultTenantId(db: Queryable): Promise<string> {
  const inserted = await db.query<{ id: string }>(
    `
      INSERT INTO qdialer_tenants (name, slug)
      VALUES ($1, $2)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `,
    [defaultTenant.name, defaultTenant.slug]
  );

  if (inserted.rows[0]) {
    return inserted.rows[0].id;
  }

  const existing = await db.query<{ id: string }>("SELECT id FROM qdialer_tenants WHERE slug = $1", [defaultTenant.slug]);
  const tenant = existing.rows[0];
  if (!tenant) {
    throw new Error("Unable to resolve qDialer default tenant.");
  }

  return tenant.id;
}

async function fetchVendorCostRuleById(db: Queryable, tenantId: string, id: string): Promise<VendorCostRule | null> {
  const result = await db.query<VendorCostRuleRow>(
    `
      SELECT
        rules.id::text,
        sources.vendor_name,
        sources.source_type,
        sources.source_id,
        rules.cost_mode,
        rules.cost_cents,
        rules.billable_duration_seconds,
        rules.acquisition_statuses,
        (rules.active AND sources.active) AS active
      FROM qdialer_vendor_cost_rules rules
      JOIN qdialer_vendor_sources sources ON sources.id = rules.vendor_source_id
      WHERE sources.tenant_id = $1
        AND rules.id = $2
    `,
    [tenantId, id]
  );

  return result.rows[0] ? mapVendorCostRule(result.rows[0]) : null;
}

async function upsertVendorSource(db: Queryable, tenantId: string, input: VendorCostRuleInput): Promise<string> {
  const result = await db.query<{ id: string }>(
    `
      INSERT INTO qdialer_vendor_sources (tenant_id, vendor_name, source_type, source_id, active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tenant_id, source_type, source_id)
      DO UPDATE SET
        vendor_name = EXCLUDED.vendor_name,
        active = EXCLUDED.active,
        updated_at = now()
      RETURNING id
    `,
    [tenantId, input.vendorName.trim(), input.sourceType, input.sourceId.trim(), input.active]
  );

  const source = result.rows[0];
  if (!source) {
    throw new Error("Unable to create or update qDialer vendor source.");
  }

  return source.id;
}

export async function listVendorCostRules(pool: Pool): Promise<VendorCostRule[]> {
  const tenantId = await ensureDefaultTenantId(pool);
  const result = await pool.query<VendorCostRuleRow>(
    `
      SELECT
        rules.id::text,
        sources.vendor_name,
        sources.source_type,
        sources.source_id,
        rules.cost_mode,
        rules.cost_cents,
        rules.billable_duration_seconds,
        rules.acquisition_statuses,
        (rules.active AND sources.active) AS active
      FROM qdialer_vendor_cost_rules rules
      JOIN qdialer_vendor_sources sources ON sources.id = rules.vendor_source_id
      WHERE sources.tenant_id = $1
      ORDER BY sources.vendor_name ASC, rules.created_at DESC
    `,
    [tenantId]
  );

  return result.rows.map(mapVendorCostRule);
}

export async function createVendorCostRule(pool: Pool, input: VendorCostRuleInput): Promise<VendorCostRule> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const tenantId = await ensureDefaultTenantId(client);
    const vendorSourceId = await upsertVendorSource(client, tenantId, {
      ...input,
      acquisitionStatuses: normalizeStatuses(input.acquisitionStatuses)
    });

    const inserted = await client.query<{ id: string }>(
      `
        INSERT INTO qdialer_vendor_cost_rules (
          vendor_source_id,
          cost_mode,
          cost_cents,
          billable_duration_seconds,
          acquisition_statuses,
          active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id::text
      `,
      [
        vendorSourceId,
        input.costMode,
        input.costCents,
        input.billableDurationSeconds,
        normalizeStatuses(input.acquisitionStatuses),
        input.active
      ]
    );

    const ruleId = inserted.rows[0]?.id;
    if (!ruleId) {
      throw new Error("Unable to create qDialer vendor cost rule.");
    }

    const rule = await fetchVendorCostRuleById(client, tenantId, ruleId);
    if (!rule) {
      throw new Error("Unable to reload qDialer vendor cost rule after create.");
    }

    await client.query("COMMIT");
    return rule;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateVendorCostRule(
  pool: Pool,
  id: string,
  patch: Partial<VendorCostRuleInput>
): Promise<VendorCostRule | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const tenantId = await ensureDefaultTenantId(client);
    const existing = await fetchVendorCostRuleById(client, tenantId, id);

    if (!existing) {
      await client.query("ROLLBACK");
      return null;
    }

    const next: VendorCostRuleInput = {
      vendorName: patch.vendorName ?? existing.vendorName,
      sourceType: patch.sourceType ?? existing.sourceType,
      sourceId: patch.sourceId ?? existing.sourceId,
      costMode: patch.costMode ?? existing.costMode,
      costCents: patch.costCents ?? existing.costCents,
      billableDurationSeconds: patch.billableDurationSeconds ?? existing.billableDurationSeconds,
      acquisitionStatuses: patch.acquisitionStatuses ?? existing.acquisitionStatuses,
      active: patch.active ?? existing.active
    };

    const vendorSourceId = await upsertVendorSource(client, tenantId, {
      ...next,
      acquisitionStatuses: normalizeStatuses(next.acquisitionStatuses)
    });

    await client.query(
      `
        UPDATE qdialer_vendor_cost_rules
        SET
          vendor_source_id = $2,
          cost_mode = $3,
          cost_cents = $4,
          billable_duration_seconds = $5,
          acquisition_statuses = $6,
          active = $7,
          updated_at = now()
        WHERE id = $1
      `,
      [
        id,
        vendorSourceId,
        next.costMode,
        next.costCents,
        next.billableDurationSeconds,
        normalizeStatuses(next.acquisitionStatuses),
        next.active
      ]
    );

    const updated = await fetchVendorCostRuleById(client, tenantId, id);
    await client.query("COMMIT");
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
