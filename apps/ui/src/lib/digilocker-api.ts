import { extractImportCandidates } from './import-mapping';

const AGENT_URL = import.meta.env.VITE_AGENT_URL?.trim();
const AGENT_TOKEN = import.meta.env.VITE_AGENT_TOKEN?.trim();

type JsonRecord = Record<string, unknown>;

interface DigiLockerResponse {
  data: {
    credentialSubject: JsonRecord;
  };
}

interface DigiLockerRequestResponse {
  url: string;
}

class DigiLockerApi {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message ?? `HTTP error ${response.status}`
      );
    }

    return response.json() as Promise<T>;
  }

  async initiateRequest(): Promise<DigiLockerRequestResponse> {
    return this.request('/api/v1/discover/digilocker-request', { method: 'GET' });
  }

  async completeAuth(code: string, doctype = 'aadhaar'): Promise<DigiLockerResponse> {
    return this.request('/api/v1/discover/digilocker-auth', {
      method: 'POST',
      body: JSON.stringify({ code, doctype }),
    });
  }

  transformCredentialSubject(subject: JsonRecord): {
    data: Record<string, unknown>;
    candidates: Record<string, unknown>;
    rawPayload: JsonRecord;
  } {
    return {
      data: {},
      candidates: extractImportCandidates(subject),
      rawPayload: subject,
    };
  }
}

export const digiLockerApi = AGENT_URL && AGENT_TOKEN ? new DigiLockerApi(AGENT_URL, AGENT_TOKEN) : null;

export function isDigiLockerConfigured(): boolean {
  return Boolean(AGENT_URL && AGENT_TOKEN);
}
