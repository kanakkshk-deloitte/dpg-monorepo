import * as React from 'react';
import { ChevronLeft, PlugZap } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getConfiguredWalletProviders,
  getRegisteredWalletProviders,
  getWalletProvider,
} from '@/engine/wallet/wallet-registry';
import type { WalletImportContext, WalletImportResult } from '@/engine/wallet/types';

interface WalletImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: WalletImportContext;
  onImported: (result: WalletImportResult) => void;
}

export function WalletImportModal({ open, onOpenChange, context, onImported }: WalletImportModalProps) {
  const providers = React.useMemo(() => getRegisteredWalletProviders(), [open]);
  const configuredProviders = React.useMemo(() => getConfiguredWalletProviders(), [open]);
  const [selectedProviderName, setSelectedProviderName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setSelectedProviderName(null);
    }
  }, [open]);

  const selectedProvider = selectedProviderName ? getWalletProvider(selectedProviderName) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0 sm:max-h-[90vh]">
        <div className="flex max-h-[85vh] flex-col sm:max-h-[90vh]">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>Import Credentials</DialogTitle>
            <DialogDescription>
              Choose a wallet provider and import verified profile details into this form.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {!selectedProvider ? (
              <div className="space-y-4">
                {providers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No wallet providers are registered.</p>
                ) : (
                  providers.map((provider) => {
                    const configured = provider.isConfigured();
                    return (
                      <Card key={provider.name} className="gap-4 py-4">
                        <CardHeader className="px-4">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <PlugZap className="h-4 w-4" />
                            {provider.label}
                          </CardTitle>
                          <CardDescription>{provider.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center">
                          <p className="text-xs text-muted-foreground">
                            {configured
                              ? 'Ready to import.'
                              : provider.getConfigurationHint?.() ?? 'Provider is not configured.'}
                          </p>
                          <Button disabled={!configured} onClick={() => setSelectedProviderName(provider.name)}>
                            Use {provider.label}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })
                )}

                {configuredProviders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Configure at least one provider before importing credentials.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="ghost" className="w-fit" onClick={() => setSelectedProviderName(null)}>
                  <ChevronLeft className="h-4 w-4" />
                  Back to providers
                </Button>
                <selectedProvider.component
                  context={context}
                  onCancel={() => onOpenChange(false)}
                  onSuccess={(result) => {
                    onImported(result);
                    onOpenChange(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
