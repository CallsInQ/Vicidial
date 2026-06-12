import { z } from "zod";

export const appConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  QDIALER_API_HOST: z.string().default("127.0.0.1"),
  QDIALER_API_PORT: z.coerce.number().int().positive().default(8787),
  QDIALER_MODE: z.enum(["mock", "live"]).default("mock"),
  QDIALER_MIGRATIONS_DIR: z.string().default("db/qdialer-postgres"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  VICI_DB_READONLY_URL: z.string().optional(),
  VICIDIAL_API_BASE_URL: z.string().url().optional(),
  VICIDIAL_API_USER: z.string().optional(),
  VICIDIAL_API_PASS: z.string().optional()
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export const config: AppConfig = appConfigSchema.parse(process.env);
