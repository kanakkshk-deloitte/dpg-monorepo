import { DpgScoringClient } from './providers/dpg_scoring/client';
import type { MatchScoreClient, MatchScoreClientConfig } from './match_score.types';

export function createMatchScoreClient(
  config: MatchScoreClientConfig
): MatchScoreClient {
  switch (config.provider) {
    case 'dpg_scoring':
      return new DpgScoringClient(config);
  }
}
