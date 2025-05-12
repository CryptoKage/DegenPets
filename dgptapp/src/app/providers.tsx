// src/app/providers.tsx
'use client'; // This component uses client-side libraries/hooks

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/config/wagmi'; // Import our Wagmi config

// Create React Query Client
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
         {/* Your existing WalletProvider (Web3Modal) will go here */}
         {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}