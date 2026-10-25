import createClient, { type Client } from "openapi-fetch";
import type { paths } from "./schema";
import { getConfig } from "../config";

let apiClientInstance: Client<paths> | null = null;

export function getApiClient(): Client<paths> {
  if (!apiClientInstance) {
    const config = getConfig();
    apiClientInstance = createClient<paths>({
      baseUrl: config.api_base_url,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  return apiClientInstance;
}

export function resetApiClient(): void {
  apiClientInstance = null;
}
