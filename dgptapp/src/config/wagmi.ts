// src/config/wagmi.ts
import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains'; // Import base chains
import { connectorsForWallets } from '@rainbow-me/rainbowkit'; // If using RainbowKit later, keep, else remove
// Or import connectors directly if not using RainbowKit/Web3Modal connectors initially
// import { injected, walletConnect, metaMask } from 'wagmi/connectors'

// --- Define Custom ApeChain Curtis Testnet Chain for Viem/Wagmi ---
import { type Chain } from 'viem';

export const apechainCurtis = {
  id: 33111, // Curtis Chain ID
  name: 'ApeChain Curtis',
  nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://apechain-curtis.public.blastapi.io'] },
    public: { http: ['https://apechain-curtis.public.blastapi.io'] }, // Can add fallback RPCs here
  },
  blockExplorers: {
    default: { name: 'Apescan Curtis', url: 'https://curtis.apescan.io/' },
  },
  testnet: true,
} as const satisfies Chain; // Use satisfies for type safety
// --- End Chain Definition ---


// --- Wagmi Configuration ---
// If using Web3Modal's connectors: Web3Modal handles connector injection via defaultConfig
// If setting up Wagmi standalone first (before Web3Modal integration):
/*
const connectors = connectorsForWallets( // Example if using RainbowKit's list
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, walletConnectWallet],
    },
  ],
  { appName: 'Degen Pets App', projectId: 'YOUR_PROJECT_ID' } // Use your WC Project ID
);
*/

// Let's try configuring Wagmi standalone first to ensure its core works
export const wagmiConfig = createConfig({
  chains: [apechainCurtis, mainnet], // Include mainnet just for example, can be removed if only Curtis
  connectors: [
    // Use Wagmi's connectors directly for this test
    // injected(), // Handles MetaMask and other browser wallets
    // walletConnect({ projectId: 'f653591549f67bc5dc45ead5e636a12e' }), // Use your WC Project ID
    // metaMask(), // Explicit MetaMask connector
  ],
  // Configure transports (how Wagmi talks to RPC)
  transports: {
    [apechainCurtis.id]: http(), // Use default HTTP transport for Curtis
    [mainnet.id]: http(),       // Use default HTTP transport for Mainnet
  },
  ssr: true, // Enable SSR support for Next.js is generally good practice
});