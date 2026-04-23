import type { WalletProvider } from './types';

const providers = new Map<string, WalletProvider>();

export function registerWalletProvider(provider: WalletProvider): void {
  providers.set(provider.name, provider);
}

export function getWalletProvider(name: string): WalletProvider | undefined {
  return providers.get(name);
}

export function getRegisteredWalletProviders(): WalletProvider[] {
  return [...providers.values()];
}

export function getConfiguredWalletProviders(): WalletProvider[] {
  return getRegisteredWalletProviders().filter((provider) => provider.isConfigured());
}
