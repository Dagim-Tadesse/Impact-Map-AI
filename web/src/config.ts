export interface AppConfig {
  api_base_url: string;
  data_base_url: string;
  region_id: string;
  data_version: string;
  model_version: string;
  app_version: string;
  features: {
    correlated_mode: boolean;
    landslide: boolean;
    forecast: boolean;
    accounts: boolean;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  api_base_url: "https://impactmap-api.onrender.com",
  data_base_url: "https://impactmap-api.onrender.com/data",
  region_id: "awash_01",
  data_version: "d20261025a",
  model_version: "m20261026a",
  app_version: "f35a798",
  features: {
    correlated_mode: false,
    landslide: false,
    forecast: false,
    accounts: false,
  },
};

let activeConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (activeConfig) {
    return activeConfig;
  }

  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to load /config.json: HTTP ${res.status}`);
    }
    const data = (await res.json()) as AppConfig;
    activeConfig = {
      ...DEFAULT_CONFIG,
      ...data,
      features: {
        ...DEFAULT_CONFIG.features,
        ...(data.features || {}),
      },
    };
    return activeConfig;
  } catch (err) {
    console.warn("Using fallback default config due to fetch error:", err);
    activeConfig = DEFAULT_CONFIG;
    return activeConfig;
  }
}

export function getConfig(): AppConfig {
  if (!activeConfig) {
    return DEFAULT_CONFIG;
  }
  return activeConfig;
}
