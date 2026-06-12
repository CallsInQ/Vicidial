import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import type { DependencyHealth, LiveAgent } from "@qdialer/shared";
import type { AppConfig } from "../config/env.js";

type VicidialLiveAgentRow = RowDataPacket & {
  user?: string;
  full_name?: string;
  status?: string;
  campaign_id?: string;
  calls_today?: number;
  pause_code?: string;
  server_ip?: string;
};

export class VicidialReadonlyDb {
  constructor(private readonly config: AppConfig) {}

  get configured(): boolean {
    return Boolean(this.config.VICI_DB_READONLY_URL);
  }

  async checkConnection(): Promise<DependencyHealth> {
    if (!this.config.VICI_DB_READONLY_URL) {
      return { configured: false, ok: false, detail: "VICI_DB_READONLY_URL is not configured" };
    }

    const connection = await mysql.createConnection(this.config.VICI_DB_READONLY_URL);
    try {
      await connection.query("SELECT 1");
      return { configured: true, ok: true };
    } catch (error) {
      return {
        configured: true,
        ok: false,
        detail: error instanceof Error ? error.message : "VICIdial DB health check failed"
      };
    } finally {
      await connection.end();
    }
  }

  async fetchLiveAgents(): Promise<LiveAgent[]> {
    if (!this.config.VICI_DB_READONLY_URL) {
      return [];
    }

    const connection = await mysql.createConnection(this.config.VICI_DB_READONLY_URL);
    try {
      const [rows] = await connection.execute<VicidialLiveAgentRow[]>(
        "SELECT user, full_name, status, campaign_id, calls_today, pause_code, server_ip FROM vicidial_live_agents ORDER BY user LIMIT 200"
      );

      return rows.map((row) => ({
        user: row.user ?? "",
        fullName: row.full_name ?? row.user ?? "Unknown agent",
        status: row.status ?? "UNKNOWN",
        campaignId: row.campaign_id ?? "",
        callsToday: Number(row.calls_today ?? 0),
        pauseCode: row.pause_code ?? "",
        serverIp: row.server_ip ?? ""
      }));
    } finally {
      await connection.end();
    }
  }
}
