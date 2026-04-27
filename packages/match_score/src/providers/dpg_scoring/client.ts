import { createDpgScoringAuthHeaders } from './create_auth_headers';
import type {
  DpgScoringClientConfig,
  MatchScoreClient,
  MatchScoreRequest,
  MatchScoreResult,
} from '../../match_score.types';

const DEFAULT_DPG_SCORING_PATH = 'api/v1/scores/match';

export class DpgScoringClient implements MatchScoreClient {
  constructor(private readonly config: DpgScoringClientConfig) {}

  async calculate(input: MatchScoreRequest): Promise<MatchScoreResult> {
    const path = this.config.path ?? DEFAULT_DPG_SCORING_PATH;
    const url = new URL(path, this.config.baseUrl);
    console.log(`Sending request to DPG Scoring at ${url.toString()}`);
    console.log("path", path);
    const headers = createDpgScoringAuthHeaders(
      { method: 'POST', path: url.pathname },
      { keyId: this.config.keyId, secret: this.config.secret }
    );

    const payload = {
      ...(this.config.version ? { version: this.config.version } : {}),
      ...(this.config.promptVersion
        ? { promptVersion: this.config.promptVersion }
        : {}),
      itemA: input.itemA,
      itemB: input.itemB,
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    const rawResponse = tryParseJson(rawText);

    if (!response.ok) {
      throw new Error(
        `Match score service error ${response.status}: ${rawText || response.statusText}`
      );
    }

    return {
      provider: 'dpg_scoring',
      score: extractNumeric(rawResponse, ['score']),
      band: extractString(rawResponse, ['band']),
      confidence: extractNumeric(rawResponse, ['confidence']),
      version: extractString(rawResponse, ['version']),
      prompt_version: extractString(rawResponse, ['promptVersion']),
      model_provider: extractString(rawResponse, ['provider']),
      model: extractString(rawResponse, ['model']),
      reasoning: extractString(rawResponse, ['reasoning']),
      signals: extractSignals(rawResponse),
      raw_response: rawResponse,
    };
  }
}

function tryParseJson(input: string): unknown {
  if (!input) {
    return null;
  }

  try {
    return JSON.parse(input) as unknown;
  } catch {
    return input;
  }
}

function extractNumeric(value: unknown, keys: string[]): number | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function extractString(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return undefined;
}

function extractSignals(
  value: unknown
): Array<{ name: string; impact: string; summary: string }> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  if (!Array.isArray(record.signals)) {
    return undefined;
  }

  const signals = record.signals
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((entry) => ({
      name: typeof entry.name === 'string' ? entry.name : '',
      impact: typeof entry.impact === 'string' ? entry.impact : '',
      summary: typeof entry.summary === 'string' ? entry.summary : '',
    }))
    .filter((entry) => entry.name && entry.impact && entry.summary);

  return signals.length > 0 ? signals : undefined;
}
