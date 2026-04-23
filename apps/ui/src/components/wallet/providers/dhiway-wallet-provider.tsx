import * as React from 'react';
import { Loader2, Mail, Phone, ShieldCheck, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { registerWalletProvider } from '@/engine/wallet/wallet-registry';
import type { WalletImportProviderProps, WalletProvider } from '@/engine/wallet/types';
import {
  isWalletConfigured,
  walletApi,
  type WalletCredential,
  type WalletCredentialData,
} from '@/lib/wallet-api';

type FlowStep = 'identifier' | 'verify' | 'credentials';

interface IdentifierOption {
  value: string;
  type: 'email' | 'phone';
  label: string;
}

function getIdentifierOptions({ email, phoneNumber }: WalletImportProviderProps['context']['user']): IdentifierOption[] {
  const options: IdentifierOption[] = [];
  if (email) {
    options.push({ value: email, type: 'email', label: email });
  }
  if (phoneNumber) {
    options.push({ value: phoneNumber, type: 'phone', label: phoneNumber });
  }
  return options;
}

function getSchemaTitle(credential: WalletCredential): string {
  const title = credential.credentialSchema?.title;
  return typeof title === 'string' && title.trim() ? title : 'Credential';
}

function getProviderLabel(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getPreviewFields(subject: Record<string, unknown> | undefined): string[] {
  if (!subject) return [];
  return Object.values(subject)
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
    .slice(0, 3)
    .map((value) => String(value));
}

function DhiwayWalletProvider({ context, onSuccess, onCancel }: WalletImportProviderProps) {
  const [step, setStep] = React.useState<FlowStep>('identifier');
  const [isLoading, setIsLoading] = React.useState(false);
  const [identifier, setIdentifier] = React.useState('');
  const [identifierType, setIdentifierType] = React.useState<'email' | 'phone'>('email');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [credentialGroups, setCredentialGroups] = React.useState<WalletCredentialData[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const identifierOptions = React.useMemo(() => getIdentifierOptions(context.user), [context.user]);

  React.useEffect(() => {
    if (identifierOptions.length === 1) {
      setIdentifier(identifierOptions[0].value);
      setIdentifierType(identifierOptions[0].type);
    }
  }, [identifierOptions]);

  const requestCode = async () => {
    if (!walletApi || !identifier) return;
    setIsLoading(true);
    setError(null);

    try {
      await walletApi.requestCode(identifier, identifierType);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!walletApi || !identifier || !verificationCode.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await walletApi.verifyCode(identifier, verificationCode.trim());
      if (response.token) {
        walletApi.setAuthToken(response.token);
      }
      const credentials = await walletApi.getVerifiedCredentials(identifier);
      setCredentialGroups(credentials.credentials);
      setStep('credentials');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = (credentialData: WalletCredentialData, credential: WalletCredential) => {
    if (!walletApi) return;
    const result = walletApi.transformSelectedCredential(credentialData, credential);
    onSuccess({
      data: result.data,
      candidates: result.candidates,
      rawPayload: result.rawPayload,
      metadata: result.metadata,
      providerName: 'dhiway-wallet',
      providerLabel: 'Dhiway Wallet',
      summary: result.summary,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">Dhiway Wallet</p>
            <p className="text-sm text-muted-foreground">
              Verify your identity and import one of your issued credentials.
            </p>
          </div>
        </div>
      </div>

      {step === 'identifier' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Choose an identifier</p>
            {identifierOptions.length > 1 ? (
              <Select
                value={identifier}
                onValueChange={(value) => {
                  const selected = identifierOptions.find((option) => option.value === value);
                  setIdentifier(value);
                  if (selected) setIdentifierType(selected.type);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select email or phone" />
                </SelectTrigger>
                <SelectContent>
                  {identifierOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border px-3 py-2 text-sm">
                {identifier || 'No identifier available'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {identifierType === 'email' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            A verification code will be sent to your selected {identifierType}.
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Enter verification code</p>
            <Input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="Enter the code you received"
            />
          </div>
          <Button variant="outline" onClick={() => setStep('identifier')}>
            Change identifier
          </Button>
        </div>
      )}

      {step === 'credentials' && (
        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
          {credentialGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No verified credentials were found.</p>
          ) : (
            credentialGroups.map((credentialData) => (
                <Card key={credentialData.id} className="gap-4 py-4">
                  <CardHeader className="px-4">
                  <CardTitle className="text-base">
                    {getProviderLabel(credentialData.metadata?.orgName, 'Credential issuer')}
                  </CardTitle>
                  <CardDescription>
                    {getProviderLabel(credentialData.metadata?.issuedBy, 'Wallet credential')}
                  </CardDescription>
                  </CardHeader>
                <CardContent className="space-y-3 px-4">
                  {credentialData.credentials.map((credential) => (
                    <div key={credential.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{getSchemaTitle(credential)}</p>
                          {credential.issuanceDate ? (
                            <p className="text-xs text-muted-foreground">
                              Issued {new Date(credential.issuanceDate).toLocaleDateString()}
                            </p>
                          ) : null}
                        </div>
                        <Badge variant="secondary">Verified</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {getPreviewFields(credential.credentialSubject).map((field) => (
                          <span key={`${credential.id}-${field}`}>{field}</span>
                        ))}
                      </div>
                      <Button className="mt-3" size="sm" onClick={() => handleImport(credentialData, credential)}>
                        Import this credential
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        {step === 'identifier' ? (
          <Button onClick={requestCode} disabled={!identifier || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Send code
          </Button>
        ) : step === 'verify' ? (
          <Button onClick={verifyCode} disabled={!verificationCode.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Verify and fetch credentials
          </Button>
        ) : null}
      </div>
    </div>
  );
}

const provider: WalletProvider = {
  name: 'dhiway-wallet',
  label: 'Dhiway Wallet',
  description: 'Import verified credentials using email or phone verification.',
  component: DhiwayWalletProvider,
  isConfigured: isWalletConfigured,
  getConfigurationHint: () => 'Missing VITE_VC_WALLET_URL or VITE_VC_WALLET_API_KEY.',
};

registerWalletProvider(provider);
