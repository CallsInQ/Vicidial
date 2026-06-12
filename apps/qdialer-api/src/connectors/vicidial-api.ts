import type { AppConfig } from "../config/env.js";

export class VicidialApiClient {
  constructor(private readonly config: AppConfig) {}

  get configured(): boolean {
    return Boolean(this.config.VICIDIAL_API_BASE_URL && this.config.VICIDIAL_API_USER && this.config.VICIDIAL_API_PASS);
  }

  async call<T>(functionName: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
    if (!this.config.VICIDIAL_API_BASE_URL || !this.config.VICIDIAL_API_USER || !this.config.VICIDIAL_API_PASS) {
      throw new Error("VICIdial API connector is not configured.");
    }

    const url = new URL(this.config.VICIDIAL_API_BASE_URL);
    url.searchParams.set("source", "qdialer");
    url.searchParams.set("user", this.config.VICIDIAL_API_USER);
    url.searchParams.set("pass", this.config.VICIDIAL_API_PASS);
    url.searchParams.set("function", functionName);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`VICIdial API request failed: ${response.status}`);
    }

    const body = await response.text();
    return body as T;
  }
}
