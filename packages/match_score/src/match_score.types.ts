export interface MatchScoreItem {
  item_network: string;
  item_domain: string;
  item_type: string;
  item_id: string;
  item_instance_url: string;
  item_schema_url: string;
  item_state: Record<string, unknown>;
  item_latitude?: number | null;
  item_longitude?: number | null;
}

export interface MatchScoreRequest {
  itemA: MatchScoreItem;
  itemB: MatchScoreItem;
}

export interface MatchScoreResult {
  provider: string;
  score?: number;
  band?: string;
  confidence?: number;
  version?: string;
  prompt_version?: string;
  model_provider?: string;
  model?: string;
  reasoning?: string;
  signals?: Array<{
    name: string;
    impact: string;
    summary: string;
  }>;
  raw_response: unknown;
}

export interface MatchScoreClient {
  calculate(input: MatchScoreRequest): Promise<MatchScoreResult>;
}

export type MatchScoreProvider = 'dpg_scoring';

export interface DpgScoringClientConfig {
  baseUrl: string;
  keyId: string;
  secret: string;
  path?: string;
  version?: string;
  promptVersion?: string;
}

export type MatchScoreClientConfig = {
  provider: 'dpg_scoring';
} & DpgScoringClientConfig;
