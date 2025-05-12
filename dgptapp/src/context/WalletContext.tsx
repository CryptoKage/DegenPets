// src/context/WalletContext.tsx (Full Version - Using Wagmi State - Added Logs for Verify)
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
    createWeb3Modal,
    defaultConfig,
    useWeb3Modal,
} from '@web3modal/ethers/react';
import { BrowserProvider, Signer, Eip1193Provider } from 'ethers';
import { SiweMessage } from 'siwe';

// --- Import Wagmi hooks ---
import { useAccount, useDisconnect, useConnectorClient } from 'wagmi';
// --- End Wagmi hooks ---

// --- Config ---
const APECHAIN_CURTIS_TESTNET_CHAIN_ID = 33111;
const APECHAIN_CURTIS_TESTNET_RPC_URL = "https://apechain-curtis.public.blastapi.io";
const APECHAIN_NETWORK_INFO = { chainId: APECHAIN_CURTIS_TESTNET_CHAIN_ID, name: 'ApeChain Curtis', currency: 'APE', explorerUrl: "https://curtis.apescan.io/", rpcUrl: APECHAIN_CURTIS_TESTNET_RPC_URL };
const APECHAIN_ID = APECHAIN_CURTIS_TESTNET_CHAIN_ID;
const PROJECT_ID = 'f653591549f67bc5dc45ead5e636a12e';
const metadata = {
    name: 'Degen Pets App (Testnet)',
    description: 'Degen Pets - Cybernetic Trading Sim (Curtis Testnet)',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://testnet.degenpets.com',
    icons: typeof window !== 'undefined' ? [`${window.location.origin}/favicon.png`] : ['https://testnet.degenpets.com/favicon.png']
};
const API_BASE_URL = "http://localhost:8000";
// --- End Config ---

// === TOP LEVEL SETUP FOR WEB3MODAL ===
const ethersConfig = defaultConfig({ metadata, enableEIP6963: true, enableInjected: true, enableCoinbase: true });
createWeb3Modal({ ethersConfig, chains: [APECHAIN_NETWORK_INFO], projectId: PROJECT_ID, themeMode: 'dark', themeVariables: { /*...*/ } });
// === END TOP LEVEL SETUP ===

// Define the full context shape again
interface IWalletContext {
    connectWallet: () => Promise<void>;
    disconnectWallet: () => Promise<void>;
    ethersProvider: BrowserProvider | null;
    signer: Signer | null;
    userAddress: string | undefined;
    currentChainId: number | undefined; // Use this name externally for consistency
    isConnected: boolean;
    isLoading: boolean;
    authToken: string | null;
    signIn: () => Promise<boolean>;
    signOut: () => Promise<void>;
    isAuthenticating: boolean;
}

const WalletContext = createContext<IWalletContext | undefined>(undefined);

// === Provider Component ===
export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [ethersProvider, setEthersProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

    // --- Wagmi Hooks for Base State ---
    const { address, isConnected, chain } = useAccount();
    const wagmiChainId = chain?.id;
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { data: connectorClient } = useConnectorClient();
    // --- End Wagmi Hooks ---

    // --- Web3Modal Hook for UI ---
    const { open: openModal } = useWeb3Modal();
    // --- End Web3Modal Hook ---

    // Optional log for debugging renders
    // console.log(`Full WalletProvider RENDER: isConnected=${isConnected}, chainId=${wagmiChainId}, address=${address}, authToken=${authToken}, isAuthenticating=${isAuthenticating}`);

    // Effect to setup Ethers provider/signer based on Wagmi state
    useEffect(() => {
        const setupEthers = async () => {
            if (isConnected && connectorClient && wagmiChainId === APECHAIN_ID && address) {
                const newEthersProvider = new BrowserProvider(connectorClient.transport, wagmiChainId);
                setEthersProvider(newEthersProvider);
                try { const newSigner = await newEthersProvider.getSigner(address); setSigner(newSigner); }
                catch (error) { console.error("Error getting signer:", error); setSigner(null); }
            } else {
                setEthersProvider(null); setSigner(null);
                if (!isConnected || (isConnected && wagmiChainId !== APECHAIN_ID)) { setAuthToken(null); }
            }
        };
        setupEthers();
    }, [isConnected, connectorClient, wagmiChainId, address]);


    // Connect Wallet Action (opens modal)
    const connectWallet = useCallback(async () => {
        if (isLoading) return; setIsLoading(true); console.log("ConnectWallet: Opening modal...");
        try { await openModal(); } catch (error: any) { console.error("ConnectWallet Error:", error); } finally { setIsLoading(false); }
    }, [isLoading, openModal]);

    // Sign In Logic
    // Sign In Logic
    const signIn = useCallback(async (): Promise<boolean> => {
        console.log("signIn function: Called");

        if (!signer || !address || wagmiChainId !== APECHAIN_ID) {
            console.error(`SIWE Error: Wallet not connected correctly. Signer: ${!!signer}, Address: ${address}, ChainID: ${wagmiChainId} (Expected: ${APECHAIN_ID})`);
            return false;
        }

        const currentAuthToken = authToken;
        if (currentAuthToken) {
            console.log("signIn function: Exit - Already authenticated.");
            return true;
        }

        console.log("SIWE Info: Starting sign-in process...");
        setIsAuthenticating(true);
        let success = false;
        let messageToSign: string | undefined;
        let signature: string | undefined;

        try {
            console.log("SIWE Info: Fetching nonce...");
            const nonceResponse = await fetch(`${API_BASE_URL}/auth/nonce`);
            if (!nonceResponse.ok) { const e = await nonceResponse.text(); throw new Error(`Nonce fetch failed: ${nonceResponse.status} ${e}`); }
            const { nonce } = await nonceResponse.json();
            if (!nonce) throw new Error('Nonce not received.');
            console.log("SIWE Info: Nonce received:", nonce);

            const siweMessage = new SiweMessage({
                domain: window.location.host,
                address: address,
                statement: 'Sign in with Ethereum to the Degen Pets App.',
                uri: window.location.origin,
                version: '1',
                chainId: wagmiChainId,
                nonce: nonce,
            });
            messageToSign = siweMessage.prepareMessage();
            console.log("SIWE Info: Message prepared.");

            console.log("SIWE Info: Requesting signature...");
            if (!signer) throw new Error("Signer unavailable.");
            signature = await signer.signMessage(messageToSign);

            // <<< ADDED LOGS >>>
            console.log("SIWE Info: Signature obtained! Value:", signature);
            console.log("SIWE Info: messageToSign Value:", messageToSign);
            // <<< END ADDED LOGS >>>

            if (!messageToSign || !signature) {
                throw new Error("Failed to prepare message or get signature before sending.")
            }

            console.log("SIWE Info: Preparing to send signature for verification...");
            const requestBody = { message: messageToSign, signature: signature };
            console.log("SIWE Info: Sending request body:", JSON.stringify(requestBody));
            const verifyUrl = `${API_BASE_URL}/auth/verify`;
            console.log("SIWE Info: Posting to URL:", verifyUrl);

            // <<< ADDED SPECIFIC TRY/CATCH AROUND FETCH >>>
            try {
                const verifyResponse = await fetch(verifyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    credentials: 'include',
                });
                console.log(`SIWE Info: Verify response status: ${verifyResponse.status}`);
                if (!verifyResponse.ok) { const errorText = await verifyResponse.text(); console.error("SIWE Error: Verify response error text:", errorText); throw new Error(`Verify failed: ${verifyResponse.status}`); }

                const playerProfile = await verifyResponse.json();
                console.log("SIWE Success:", playerProfile);
                setAuthToken(`session_active_for_${address}`);
                success = true;
            } catch (fetchError: any) {
                 console.error("SIWE Error: FAILED during fetch/verify step:", fetchError); // Log specific fetch error
                 throw fetchError; // Re-throw to be caught by outer catch
            }
            // <<< END SPECIFIC TRY/CATCH >>>

        } catch (error: any) { // Outer catch block
             if (error.code === 4001 || error.message?.includes("rejected")) { console.warn("SIWE Warning: User rejected signature request."); }
             else { console.error("SIWE Error: Outer catch block error:", error); } // Log the actual error object
             setAuthToken(null);
             success = false;
        } finally {
             console.log("SIWE Info: signIn finally block, setting isAuthenticating=false");
             setIsAuthenticating(false);
        }

         console.log(`SIWE Info: signIn returning ${success}.`);
         return success;

    }, [signer, address, wagmiChainId, authToken]);

    // Sign Out Logic
    const signOut = useCallback(async () => {
        console.log("signOut called"); try { await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }); } catch (e) { console.error("Backend logout error:", e); } setAuthToken(null);
    }, []);

    // Disconnect Wallet Action
     const disconnectWallet = useCallback(async () => {
        if (isLoading) return; setIsLoading(true); console.log("disconnectWallet called");
        try { await signOut(); wagmiDisconnect(); } catch (e) { console.error("Disconnect error:", e); } finally { setIsLoading(false); }
    }, [isLoading, signOut, wagmiDisconnect]);

    // Effect for Session Check
    useEffect(() => {
        const checkInitialAuth = async () => {
             if (isConnected && address && !authToken && !isAuthenticating) {
                setIsAuthenticating(true); try { const r = await fetch(`${API_BASE_URL}/players/me`, {credentials: 'include'}); if(r.ok) { const p = await r.json(); console.log("Session Check: Valid", p); setAuthToken(`session_active_for_${address}`); } else { console.log("Session Check: Invalid"); setAuthToken(null); } } catch(e) { console.error("Session Check Error:", e); setAuthToken(null); } finally { setIsAuthenticating(false); }
            }
        };
        const timer = setTimeout(checkInitialAuth, 500); return () => clearTimeout(timer);
    }, [isConnected, address, authToken, isAuthenticating]);


    // --- Context Provider Value ---
    return (
        <WalletContext.Provider value={{
            connectWallet,
            disconnectWallet,
            ethersProvider, // Expose the ethers provider instance
            signer,         // Expose the ethers signer instance
            userAddress: address, // Expose address from Wagmi
            currentChainId: wagmiChainId, // Expose chainId from Wagmi
            isConnected, // Expose isConnected from Wagmi
            isLoading,
            authToken,
            signIn,
            signOut,
            isAuthenticating,
        }}>
            {children}
        </WalletContext.Provider>
    );
};

// --- Custom Hook ---
export const useWallet = (): IWalletContext => {
    const context = useContext(WalletContext);
    if (context === undefined) { throw new Error('useWallet must be used within a WalletProvider'); }
    return context;
};