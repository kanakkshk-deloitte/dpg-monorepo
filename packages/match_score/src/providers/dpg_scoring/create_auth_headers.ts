import crypto from 'node:crypto';

export interface DpgScoringAuthConfig {
  keyId: string;
  secret: string;
}

export interface DpgScoringAuthInput {
  method: string;
  path: string;
}

export function createDpgScoringAuthHeaders(
  { method, path }: DpgScoringAuthInput,
  { keyId, secret }: DpgScoringAuthConfig
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();
  const baseString = [method.toUpperCase(), path, timestamp, nonce].join('\n');
  const signature =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(baseString).digest('hex');

  return {
    'Content-Type': 'application/json',
    'x-dpg-key': keyId,
    'x-dpg-timestamp': timestamp,
    'x-dpg-nonce': nonce,
    'x-dpg-signature': signature,
  };
}
