import { extractImportCandidates } from './import-mapping';

const VC_WALLET_URL = import.meta.env.VITE_VC_WALLET_URL?.trim();
const VC_WALLET_API_KEY = import.meta.env.VITE_VC_WALLET_API_KEY?.trim();

type JsonRecord = Record<string, unknown>;

export interface WalletCredential {
  id: string;
  issuer?: string;
  issuanceDate?: string;
  validUntil?: string;
  credentialSchema?: JsonRecord;
  credentialSubject?: JsonRecord;
  [key: string]: unknown;
}

export interface WalletCredentialData {
  id: number;
  metadata?: JsonRecord;
  credentials: WalletCredential[];
  [key: string]: unknown;
}

export interface WalletResponse {
  total: number;
  credentials: WalletCredentialData[];
}

export interface VerifyCodeResponse {
  message: string;
  token?: string;
}

class WalletApi {
  private authToken: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeApiKey = false,
    includeAuthToken = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (includeApiKey && VC_WALLET_API_KEY) {
      headers['x-api-key'] = VC_WALLET_API_KEY;
    }

    if (includeAuthToken && this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message ?? `HTTP error ${response.status}`
      );
    }

    return response.json() as Promise<T>;
  }

  async requestCode(identifier: string, type: 'email' | 'phone'): Promise<{ message: string }> {
    return this.request('/api/v1/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ identifier, type }),
    });
  }

  async verifyCode(identifier: string, code: string): Promise<VerifyCodeResponse> {
    return this.request('/api/v1/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ identifier, code }),
    });
  }

  async getVerifiedCredentials(identifier: string): Promise<WalletResponse> {
    const encodedIdentifier = encodeURIComponent(identifier);
    return this.request(
      `/api/v1/verified-credentials?identifier=${encodedIdentifier}&page=1&limit=50`,
      { method: 'GET' },
      true,
      true
    );
  }

  transformSelectedCredential(
    credentialData: WalletCredentialData,
    credential: WalletCredential
  ): {
    data: Record<string, unknown>;
    candidates: Record<string, unknown>;
    rawPayload: JsonRecord;
    metadata: Record<string, unknown>;
    summary: string;
  } {
    const rawPayload = {
      credentialData,
      credential,
      credentialSubject: credential.credentialSubject ?? {},
      metadata: credentialData.metadata ?? {},
    };
    const schemaTitle =
      typeof credential.credentialSchema?.title === 'string'
        ? credential.credentialSchema.title
        : 'Credential';
    const orgName =
      typeof credentialData.metadata?.orgName === 'string'
        ? credentialData.metadata.orgName
        : 'wallet';

    return {
      data: {},
      candidates: extractImportCandidates(rawPayload),
      rawPayload,
      metadata: {
        credentialId: credential.id,
        schemaTitle,
        orgName,
        provider: 'dhiway-wallet',
      },
      summary: `${schemaTitle} from ${orgName}`,
    };
  }
}

export const walletApi = VC_WALLET_URL ? new WalletApi(VC_WALLET_URL) : null;

export function isWalletConfigured(): boolean {
  return Boolean(VC_WALLET_URL && VC_WALLET_API_KEY);
}
