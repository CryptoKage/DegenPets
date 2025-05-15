// webapp/src/walletConnection.js
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { ethers } from 'ethers';
import {
    ALCHEMY_APECHAIN_RPC_URL, // <<< USE ALCHEMY
    APECHAIN_CHAIN_ID,
    APECHAIN_NETWORK_INFO,    // <<< This now uses Alchemy from config.js
    PROJECT_ID,
    METADATA
} from './config.js'; // Import all needed from config
import { typeLine, resetUI as uiResetUI, shortenAddress } from './uiHelpers.js'; // Assuming resetUI for connection elements

let onScanReadyCallback;

// --- Module State ---
export let wcProvider = null;
export let ethersProvider = null;
export let activeRawProvider = null;
export let signer = null;
export let userAddress = null;
// isCheckingConnectedWallet is managed by checker.js

// DOM Elements this module directly interacts with
let connectBtnEl, disconnectBtnEl, walletOutputEl, walletInputSectionEl;

export function initConnectionModule(
    domElements, // { connectBtn, disconnectBtn, walletOutput }
    scanCallback
) {
    connectBtnEl = domElements.connectBtn;
    disconnectBtnEl = domElements.disconnectBtn;
    walletOutputEl = domElements.walletOutput;
    walletInputSectionEl = domElements.walletInputSection;
    onScanReadyCallback = scanCallback;


    connectBtnEl?.addEventListener('click', onConnectClick);
    disconnectBtnEl?.addEventListener('click', handleProviderDisconnect); // Use module's disconnect

    initializeWCProvider();
}

async function initializeWCProvider() {
    if (!PROJECT_ID) {
        console.error("FATAL: WC PROJECT_ID missing!");
        typeLine("⚠️ WalletConnect features unavailable due to missing Project ID.", true); // Use typeLine if available, otherwise console
        return;
    }
    try {
        console.log("Init WC Provider...");
        wcProvider = await EthereumProvider.init({
            projectId: PROJECT_ID,
            chains: [APECHAIN_CHAIN_ID],
            showQrModal: true, // Usually true for initial setup, false if you have a custom modal
            rpcMap: { [APECHAIN_CHAIN_ID]: ALCHEMY_APECHAIN_RPC_URL },
            metadata: METADATA,
            // Optional: enable session persistence if supported by the version
            // relayUrl: 'wss://relay.walletconnect.com', // Default relay, often not needed to specify
        });
        console.log("WC Provider initialized.", wcProvider);

        // --- ADD THIS BLOCK TO CHECK FOR EXISTING SESSION ---
        if (wcProvider.session) {
            console.log("WalletConnect: Existing session found:", wcProvider.session);
            // If a session exists, WalletConnect might automatically try to restore it,
            // or you might already have accounts.
            // The 'connect' event might fire automatically if a session is restored.
            // For now, we'll just log it. If 'connect' event doesn't fire,
            // we might need to call handleConnectionSuccess() here if accounts are present.
            // e.g., if (wcProvider.accounts && wcProvider.accounts.length > 0) {
            //    console.log("WalletConnect: Accounts found in existing session, attempting to handle connection success.");
            //    activeRawProvider = wcProvider; // Assume wcProvider is the one to use
            //    ethersProvider = new ethers.providers.Web3Provider(wcProvider, 'any');
            //    await handleConnectionSuccess(); // This sets up signer, userAddress etc.
            // }
        } else if (wcProvider.accounts && wcProvider.accounts.length > 0) {
            // Some versions might populate accounts directly if a session is restored without a formal 'session' object
             console.log("WalletConnect: Accounts found on init, attempting to handle connection success.", wcProvider.accounts);
             activeRawProvider = wcProvider;
             ethersProvider = new ethers.providers.Web3Provider(wcProvider, 'any');
             await handleConnectionSuccess();
        }
        // --- END OF ADDED BLOCK ---

        wcProvider.on('connect', async (payload) => {
            console.log("WC Event: connect", payload);
            activeRawProvider = wcProvider;
            ethersProvider = new ethers.providers.Web3Provider(wcProvider, 'any');
            await handleConnectionSuccess();
        });
        wcProvider.on('disconnect', () => { // WalletConnect's own disconnect event
            console.log("WC Event: disconnect (from wcProvider.on('disconnect'))");
            // Call your main disconnect handler to clean up your app's state
            handleProviderDisconnect();
        });
        // wcProvider.on('session_delete', ...); // Another event you could listen to
        // wcProvider.on('session_update', ...);
        // wcProvider.on('display_uri', (uri) => { console.log("WC display_uri:", uri); /* if showQrModal is false */ });


        console.log("WC Listeners attached.");
    } catch (e) {
        console.error("Init WC Error:", e);
        wcProvider = null; // Ensure wcProvider is null if init fails
        typeLine("⚠️ WalletConnect features unavailable. Error during initialization.", true);
    }
}

async function onConnectClick() {
    console.log("Connect clicked in walletConnection module.");
    // Expect checker.js to call its own resetEverythingChecker() before this
    if (walletOutputEl) walletOutputEl.innerHTML = "<p>Connecting...</p>";

    if (typeof window.ethereum !== 'undefined') {
        console.log("Injected provider detected."); typeLine("Connecting via browser wallet...");
        await connectInjected(window.ethereum);
    } else if (wcProvider) {
        console.log("Using WC fallback."); typeLine("Opening WalletConnect...");
        await connectWalletConnect();
    } else { console.error("No provider available."); typeLine("❌ No wallet found.", true); }
}

async function connectInjected(injectedProvider) {
    try {
        typeLine("Requesting accounts...");
        const accounts = await injectedProvider.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) throw new Error("No accounts.");
        console.log("Injected accounts:", accounts);
        activeRawProvider = injectedProvider;
        ethersProvider = new ethers.providers.Web3Provider(activeRawProvider, 'any');
        await handleConnectionSuccess();
    } catch (error) {
        console.error("Injected connect error:", error);
        if (error.code === 4001) typeLine("❌ Request rejected.", true);
        else typeLine(`❌ Error: ${error.message}`, true);
        if (connectBtnEl) connectBtnEl.classList.remove('hidden');
        if (disconnectBtnEl) disconnectBtnEl.classList.add('hidden');
    }
}

async function connectWalletConnect() {
    if (!wcProvider || wcProvider.connected) { console.warn("WC connect req invalid."); return; }
    if (walletOutputEl) walletOutputEl.innerHTML = "<p>Scan QR code...</p>";
    try { await wcProvider.connect(); console.log("WC connect called."); }
    catch (error) { console.error("WC connect error:", error); if (error.message?.toLowerCase().includes('user closed modal')) typeLine("❌ Connection cancelled.", true); else typeLine(`❌ WC Error: ${error.message || 'Unknown'}.`, true); if (connectBtnEl) connectBtnEl.classList.remove('hidden'); if (disconnectBtnEl) disconnectBtnEl.classList.add('hidden');}
}

async function handleConnectionSuccess() {
    if (!ethersProvider || !activeRawProvider) { console.error("handleConn Success missing provider."); return; }
    console.log("Handling conn success...");
    try {
        signer = ethersProvider.getSigner(); userAddress = await signer.getAddress();
        if (!userAddress) throw new Error("No address.");
        console.log("Wallet Connected:", userAddress);
        if (connectBtnEl) connectBtnEl.classList.add('hidden');
        if (disconnectBtnEl) disconnectBtnEl.classList.remove('hidden');
        if (walletInputSectionEl) walletInputSectionEl.classList.remove('hidden');
        if (walletOutputEl) walletOutputEl.innerHTML = '';
        typeLine(`[Wallet Connected: ${shortenAddress(userAddress)}]`);
        attachProviderListeners(activeRawProvider);
        console.log("Checking network for connected wallet...");
        await checkAndSwitchNetwork();
    } catch (error) { console.error("Final connection error:", error); typeLine(`❌ Setup Error: ${error.message}`, true); await handleProviderDisconnect(); }
}

async function checkAndSwitchNetwork() {
    if (!ethersProvider || !userAddress) { console.error("Cannot check network."); return; }
    console.log("Entering checkAndSwitchNetwork...");
    try {
        const network = await ethersProvider.getNetwork(); console.log("Network:", network);
        if (network.chainId !== APECHAIN_CHAIN_ID) {
            typeLine(`⚠️ Wrong network (ID: ${network.chainId}). Requesting switch...`, true);
            await attemptSwitchNetwork(); const newNetwork = await ethersProvider.getNetwork();
            if (newNetwork.chainId !== APECHAIN_CHAIN_ID) { typeLine(`❌ Switch failed. Scan aborted.`, true); if(walletOutputEl) walletOutputEl.innerHTML = `<p>[Wallet Connected: ${shortenAddress(userAddress)}]</p><p style="color:red;">⚠️ Switch to ApeChain (ID ${APECHAIN_CHAIN_ID}).</p>`; if(connectBtnEl) connectBtnEl.classList.add('hidden'); if(disconnectBtnEl) disconnectBtnEl.classList.remove('hidden'); return; }
            else { typeLine(`[Network Switched]`); console.log("Network OK after switch, calling onScanReadyCallback..."); if (onScanReadyCallback) onScanReadyCallback(ethersProvider, userAddress); }
        } else { typeLine(`[Network OK: ApeChain]`); console.log("Network OK, calling onScanReadyCallback..."); if (onScanReadyCallback) onScanReadyCallback(ethersProvider, userAddress); }
    } catch (error) { console.error("Network check/switch error:", error); typeLine(`❌ Network Error: ${error.message}`, true); await handleProviderDisconnect(); }
}

export async function handleProviderDisconnect() {
  console.log("Handling disconnect."); activeRawProvider?.removeAllListeners?.();
  if (activeRawProvider === wcProvider && wcProvider?.connected) { try { await wcProvider.disconnect(); } catch (e) { console.warn("WC disconnect error:", e); } }
  ethersProvider = null; activeRawProvider = null; signer = null; userAddress = null;
  if (connectBtnEl) connectBtnEl.classList.remove('hidden');
  if (walletInputSectionEl) walletInputSectionEl.classList.add('hidden');
  if (disconnectBtnEl) disconnectBtnEl.classList.add('hidden');
  if (walletOutputEl) walletOutputEl.innerHTML = ""; typeLine("[Wallet Disconnected]");
  // Notify checker.js to fully reset its UI for results etc.
  // This can be done by checker.js observing the exported userAddress becoming null.
}

function attachProviderListeners(provider) {
    if (!provider?.on) { console.warn("Cannot attach listeners."); return; }
    console.log("Attaching listeners..."); provider.removeAllListeners?.();
    provider.on('accountsChanged', handleAccountsChanged); provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleProviderDisconnect); console.log("Listeners attached.");
}

async function handleAccountsChanged(accounts) {
    console.log("Accounts Changed:", accounts); if (!activeRawProvider) return;
    if (!accounts || accounts.length === 0) { handleProviderDisconnect(); }
    else if (accounts[0].toLowerCase() !== userAddress?.toLowerCase()) {
        typeLine(`[Account Switched: ${shortenAddress(accounts[0])}]`);
        ethersProvider = new ethers.providers.Web3Provider(activeRawProvider, 'any');
        signer = ethersProvider.getSigner(); userAddress = await signer.getAddress();
        console.log("Context updated. Re-checking..."); await checkAndSwitchNetwork();
    }
}

function handleChainChanged(chainId) {
    console.log("Chain Changed:", chainId); if (!userAddress) return;
    const numChainId = Number(chainId); if (isNaN(numChainId)) { console.error("Invalid chainId:", chainId); return; }
    if (numChainId !== APECHAIN_CHAIN_ID) {
        typeLine(`⚠️ Wrong network (ID: ${numChainId}). Switch back.`, true);
        if(walletOutputEl) walletOutputEl.innerHTML = `<p>[Wallet Connected: ${shortenAddress(userAddress)}]</p><p style="color:red;">⚠️ Switch back to ApeChain.</p>`;
        if(connectBtnEl) connectBtnEl.classList.add('hidden'); if(disconnectBtnEl) disconnectBtnEl.classList.remove('hidden');
        // Notify checker.js to clear scan results
    } else { typeLine(`[Network OK: ApeChain]`); if (onScanReadyCallback && ethersProvider && userAddress) onScanReadyCallback(ethersProvider, userAddress); }
}

async function attemptSwitchNetwork() {
    if (!ethersProvider?.send) { typeLine("❌ Cannot switch.", true); return Promise.reject("No provider send"); }
    typeLine(`[Requesting switch via wallet...]`);
    try {
        await ethersProvider.send('wallet_switchEthereumChain', [{ chainId: APECHAIN_NETWORK_INFO.chainId }]); // Use APECHAIN_NETWORK_INFO from config
        console.log("Switch request sent."); return Promise.resolve();
    } catch (switchError) {
        console.error("Switch Error:", switchError);
        if (switchError.code === 4902){ typeLine("[Requesting add network...]"); try { await ethersProvider.send('wallet_addEthereumChain', [APECHAIN_NETWORK_INFO]); console.log("Add request sent."); return Promise.resolve(); } catch (addError) { console.error("Add Error:", addError); typeLine("❌ Failed add.", true); return Promise.reject(addError); }
        } else { typeLine(`❌ Switch failed: ${switchError.message || '?'}.`, true); return Promise.reject(switchError); }
    }
}