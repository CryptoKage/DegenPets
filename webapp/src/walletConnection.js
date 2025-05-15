// webapp/src/walletConnection.js
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { ethers } from 'ethers';
import {
    ALCHEMY_APECHAIN_RPC_URL,
    APECHAIN_CHAIN_ID,
    APECHAIN_NETWORK_INFO,
    PROJECT_ID,
    METADATA
} from './config.js';
import { typeLine, shortenAddress } from './uiHelpers.js'; // resetUI is not used here directly

let onScanReadyCallback; // Callback to checker.js when connection is ready for scan

// --- Module State ---
export let wcProvider = null;         // WalletConnect provider instance
export let ethersProvider = null;     // Ethers.js wrapper provider
export let activeRawProvider = null;  // The currently active raw provider (MetaMask or WalletConnect)
export let signer = null;             // Ethers.js signer instance
export let userAddress = null;        // Connected user's address

// DOM Elements this module directly interacts with (passed via initConnectionModule)
let connectBtnEl, disconnectBtnEl, walletOutputEl, walletInputSectionEl;

// Original text for the connect button, to restore it
const CONNECT_BUTTON_TEXT_DEFAULT = "[Connect Wallet to Check]";
const CONNECT_BUTTON_TEXT_CONNECTING = "Connecting...";

export function initConnectionModule(
    domElements, // { connectBtn, disconnectBtn, walletOutput, walletInputSection }
    scanCallback  // Function to call when wallet is connected and on correct network
) {
    connectBtnEl = domElements.connectBtn;
    disconnectBtnEl = domElements.disconnectBtn;
    walletOutputEl = domElements.walletOutput; // For typeLine messages
    walletInputSectionEl = domElements.walletInputSection; // To show/hide wallet input
    onScanReadyCallback = scanCallback;

    connectBtnEl?.addEventListener('click', onConnectClick);
    disconnectBtnEl?.addEventListener('click', handleProviderDisconnect);

    initializeWCProvider(); // Initialize WalletConnect provider attempt
}

async function initializeWCProvider() {
    if (!PROJECT_ID) {
        console.error("FATAL: WalletConnect PROJECT_ID missing!");
        typeLine("⚠️ WalletConnect features unavailable: Configuration error.", true);
        return;
    }
    try {
        console.log("Initializing WalletConnect Provider...");
        wcProvider = await EthereumProvider.init({
            projectId: PROJECT_ID,
            chains: [APECHAIN_CHAIN_ID],
            showQrModal: true, // Set to false if you implement a custom QR modal
            rpcMap: { [APECHAIN_CHAIN_ID]: ALCHEMY_APECHAIN_RPC_URL },
            metadata: METADATA,
        });
        console.log("WalletConnect Provider initialized.", wcProvider);

        // Check for existing WalletConnect session that might be auto-restored
        if (wcProvider.session || (wcProvider.accounts && wcProvider.accounts.length > 0)) {
            console.log("WalletConnect: Existing session or accounts found on init. Attempting to restore connection details.");
            // The 'connect' event might fire if session is restored by SDK,
            // or we might need to proactively set up if accounts are present.
            // For now, relying on the 'connect' event. If issues persist with WC auto-reconnect,
            // we might need to call handleConnectionSuccess() here if wcProvider.accounts exist.
        }

        wcProvider.on('connect', async (payload) => {
            console.log("WalletConnect Event: 'connect'", payload);
            activeRawProvider = wcProvider; // Set WalletConnect as the active provider
            ethersProvider = new ethers.providers.Web3Provider(wcProvider, 'any'); // Wrap it with Ethers
            await handleConnectionSuccess();
        });

        wcProvider.on('disconnect', () => {
            console.log("WalletConnect Event: 'disconnect' (from wcProvider.on('disconnect'))");
            // This event means WalletConnect itself has disconnected (e.g., user disconnected from WC modal)
            // We must ensure our app state reflects this.
            if (activeRawProvider === wcProvider) { // Only if WC was the active provider
                 handleProviderDisconnect(); // Our main app disconnect logic
            }
        });
        console.log("WalletConnect event listeners attached.");
    } catch (e) {
        console.error("Error initializing WalletConnect Provider:", e);
        wcProvider = null; // Ensure wcProvider is null if init fails
        typeLine("⚠️ WalletConnect features may be unavailable. Error during initialization.", true);
    }
}

async function onConnectClick() {
    console.log("Connect button clicked.");
    if (walletOutputEl) walletOutputEl.innerHTML = ""; // Clear previous messages
    typeLine("Attempting to connect wallet...", false);

    if (connectBtnEl) {
        connectBtnEl.disabled = true;
        connectBtnEl.textContent = CONNECT_BUTTON_TEXT_CONNECTING;
    }

    try {
        // Prioritize MetaMask (or other injected EIP-1193 providers)
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            console.log("MetaMask (injected provider) detected.");
            typeLine("Connecting via browser wallet (MetaMask)...", false);
            await connectInjected(window.ethereum);
        } else if (wcProvider) { // Fallback to WalletConnect
            console.log("No injected provider or not MetaMask. Using WalletConnect fallback.");
            typeLine("Opening WalletConnect...", false);
            await connectWalletConnect();
        } else {
            // This case means WalletConnect also failed to initialize
            console.error("No wallet provider available (MetaMask not found and WalletConnect init failed).");
            typeLine("❌ No wallet provider found. Please install MetaMask or ensure WalletConnect can initialize.", true);
            if (connectBtnEl) {
                connectBtnEl.disabled = false;
                connectBtnEl.textContent = CONNECT_BUTTON_TEXT_DEFAULT;
            }
        }
    } catch (error) {
        // This catch is a fallback, specific connection methods should handle their own errors primarily
        console.error("Error during onConnectClick dispatch:", error);
        typeLine(`❌ Wallet connection failed: ${error.message || 'Unknown error'}.`, true);
        if (connectBtnEl) {
            connectBtnEl.disabled = false;
            connectBtnEl.textContent = CONNECT_BUTTON_TEXT_DEFAULT;
        }
    }
}

async function connectInjected(injectedProvider) {
    try {
        typeLine("Requesting accounts from browser wallet...", false);
        const accounts = await injectedProvider.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts returned from wallet.");
        }
        console.log("Injected provider accounts received:", accounts);
        activeRawProvider = injectedProvider; // Set MetaMask (or injected) as active
        ethersProvider = new ethers.providers.Web3Provider(activeRawProvider, 'any');
        await handleConnectionSuccess();
    } catch (error) {
        console.error("Injected provider connection error:", error);
        if (error.code === 4001) { // User rejected the request
            typeLine("❌ Wallet connection request rejected by user.", true);
        } else if (error.code === -32002) { // Request already pending
            typeLine("⏳ Connection request already pending. Please check your wallet application.", true);
        } else {
            typeLine(`❌ Browser Wallet Connection Error: ${error.message || 'Unknown error'}.`, true);
        }
        // Reset connect button state as connection failed or was cancelled
        if (connectBtnEl) {
            connectBtnEl.disabled = false;
            connectBtnEl.textContent = CONNECT_BUTTON_TEXT_DEFAULT;
        }
        if (disconnectBtnEl) disconnectBtnEl.classList.add('hidden');
    }
}

async function connectWalletConnect() {
    if (!wcProvider) {
        typeLine("❌ WalletConnect is not initialized. Cannot connect.", true);
        if (connectBtnEl) {
            connectBtnEl.disabled = false;
            connectBtnEl.textContent = CONNECT_BUTTON_TEXT_DEFAULT;
        }
        return;
    }

    try {
        // If WalletConnect provider is already connected (e.g. session restored),
        // its 'connect' event should handle calling handleConnectionSuccess.
        // Calling wcProvider.connect() will open the modal if not connected,
        // or might re-establish connection if a session exists.
        if (walletOutputEl) walletOutputEl.innerHTML = "<p>Scan QR code with WalletConnect or select mobile wallet...</p>";
        await wcProvider.connect();
        console.log("wcProvider.connect() call completed. Waiting for 'connect' event or resolution.");
        // Note: Actual setup happens in wcProvider.on('connect', ...) listener
    } catch (error) {
        console.error("WalletConnect .connect() method error:", error);
        if (error.message?.toLowerCase().includes('user closed modal')) {
            typeLine("❌ WalletConnect connection cancelled by user.", true);
        } else if (error.message?.toLowerCase().includes('modal closed')) { // Alternative message
             typeLine("❌ WalletConnect connection cancelled.", true);
        }
        else {
            typeLine(`❌ WalletConnect Error: ${error.message || 'Unknown error'}.`, true);
        }
        // Reset connect button state
        if (connectBtnEl) {
            connectBtnEl.disabled = false;
            connectBtnEl.textContent = CONNECT_BUTTON_TEXT_DEFAULT;
        }
    }
}

async function handleConnectionSuccess() {
    if (!ethersProvider || !activeRawProvider) {
        console.error("handleConnectionSuccess called without a valid provider setup.");
        typeLine("❌ Internal error during wallet connection.", true);
        await handleProviderDisconnect(); // Attempt to reset state
        return;
    }
    console.log("Handling successful connection setup...");
    try {
        signer = ethersProvider.getSigner();
        userAddress = await signer.getAddress();
        if (!userAddress) {
            throw new Error("Could not retrieve address from signer.");
        }
        console.log("Wallet successfully connected. Address:", userAddress);

        if (connectBtnEl) connectBtnEl.classList.add('hidden'); // Hide connect, show disconnect
        if (disconnectBtnEl) disconnectBtnEl.classList.remove('hidden');
        if (walletInputSectionEl) walletInputSectionEl.classList.remove('hidden'); // Show wallet input field
        if (walletOutputEl) walletOutputEl.innerHTML = ''; // Clear "Connecting..." messages
        typeLine(`[Wallet Connected: ${shortenAddress(userAddress)}]`, false);

        attachProviderListeners(activeRawProvider); // Set up listeners for account/chain changes for active provider
        await checkAndSwitchNetwork(); // Proceed to check network and then call scan callback

    } catch (error) {
        console.error("Error during final stage of connection success:", error);
        typeLine(`❌ Error finalizing connection: ${error.message || 'Unknown error'}.`, true);
        await handleProviderDisconnect(); // Disconnect fully if final setup fails
    }
}

async function checkAndSwitchNetwork() {
    if (!ethersProvider || !userAddress) {
        console.error("Cannot check/switch network: Provider or userAddress missing.");
        typeLine("❌ Internal error: Missing provider information for network check.", true);
        return;
    }
    console.log("Verifying network...");
    try {
        const network = await ethersProvider.getNetwork();
        console.log("Current network:", network);
        if (network.chainId !== APECHAIN_CHAIN_ID) {
            typeLine(`⚠️ Wallet is on wrong network (ID: ${network.chainId}). Requesting switch to ApeChain (ID: ${APECHAIN_CHAIN_ID})...`, true);
            await attemptSwitchNetwork(); // Request switch
            const newNetwork = await ethersProvider.getNetwork(); // Re-check network
            if (newNetwork.chainId !== APECHAIN_CHAIN_ID) {
                typeLine(`❌ Failed to switch to ApeChain. Scan aborted. Please switch manually.`, true);
                // UI update to reflect connected but wrong network state:
                if (walletOutputEl) walletOutputEl.innerHTML = `<p>[Wallet Connected: ${shortenAddress(userAddress)}]</p><p style="color:red;">⚠️ Please switch to ApeChain (ID: ${APECHAIN_CHAIN_ID}) in your wallet.</p>`;
                // Connect button remains hidden, disconnect shown
                return; // Stop here, do not call onScanReadyCallback
            } else {
                typeLine(`[Network Switched to ApeChain]`, false);
                console.log("Network OK after switch. Calling onScanReadyCallback for connected wallet scan.");
                if (onScanReadyCallback) onScanReadyCallback(ethersProvider, userAddress);
            }
        } else {
            typeLine(`[Network OK: ApeChain]`, false);
            console.log("Network OK. Calling onScanReadyCallback for connected wallet scan.");
            if (onScanReadyCallback) onScanReadyCallback(ethersProvider, userAddress);
        }
    } catch (error) {
        console.error("Network check/switch process error:", error);
        typeLine(`❌ Network Error: ${error.message || 'Unknown error during network check/switch'}.`, true);
        // Consider if a full disconnect is appropriate or just inform user
        // For now, keep connected state but inform user of network issue.
        // If error is severe, handleProviderDisconnect() might be called by a listener.
    }
}

export async function handleProviderDisconnect() {
    console.log("Handling provider disconnect (app-level).");
    activeRawProvider?.removeAllListeners?.(); // Clean up listeners from the disconnected provider

    if (activeRawProvider === wcProvider && wcProvider?.connected) {
        console.log("WalletConnect was active, attempting to disconnect wcProvider session.");
        try {
            await wcProvider.disconnect(); // Disconnect WalletConnect session
        } catch (e) {
            console.warn("Error during wcProvider.disconnect():", e);
        }
    }

    // Reset all app-level state related to connection
    ethersProvider = null;
    activeRawProvider = null;
    signer = null;
    userAddress = null;

    // Reset UI elements
    if (connectBtnEl) {
        connectBtnEl.classList.remove('hidden');
        connectBtnEl.disabled = false;
        connectBtnEl.textContent = CONNECT_BUTTON_TEXT_DEFAULT;
    }
    if (disconnectBtnEl) disconnectBtnEl.classList.add('hidden');
    if (walletInputSectionEl) walletInputSectionEl.classList.add('hidden');
    if (walletOutputEl) walletOutputEl.innerHTML = ""; // Clear messages
    typeLine("[Wallet Disconnected]", false);

    // Notify checker.js or other modules if they need to react to full disconnect
    // e.g., by checker.js observing that exported 'userAddress' is now null.
    // This will also implicitly stop any ongoing scans or clear results via checker.js logic.
}

function attachProviderListeners(providerToListen) {
    if (!providerToListen?.on) {
        console.warn("Cannot attach listeners: Provider or .on method missing.");
        return;
    }
    console.log("Attaching listeners to active provider:", providerToListen);
    providerToListen.removeAllListeners?.(); // Clear any old listeners first

    // Standard EIP-1193 events
    providerToListen.on('accountsChanged', handleAccountsChanged);
    providerToListen.on('chainChanged', handleChainChanged);
    // 'disconnect' for injected providers (like MetaMask when user locks or disconnects site)
    // WalletConnect has its own 'disconnect' event on wcProvider instance handled in initializeWCProvider
    if (providerToListen !== wcProvider) {
         providerToListen.on('disconnect', (error) => { // EIP-1193 disconnect
            console.log("Injected Provider Event: 'disconnect'", error);
            handleProviderDisconnect();
        });
    }
    console.log("Provider event listeners attached.");
}

async function handleAccountsChanged(accounts) {
    console.log("Provider Event: 'accountsChanged'", accounts);
    if (!activeRawProvider) { // Should not happen if listeners are attached correctly
        console.warn("'accountsChanged' received but no activeRawProvider. Disconnecting.");
        handleProviderDisconnect();
        return;
    }
    if (!accounts || accounts.length === 0) { // All accounts disconnected
        console.log("All accounts disconnected by user.");
        handleProviderDisconnect();
    } else if (accounts[0].toLowerCase() !== userAddress?.toLowerCase()) { // Switched to a new account
        typeLine(`[Account Switched: ${shortenAddress(accounts[0])}]`, false);
        // Re-initialize ethers provider and signer with the new account context
        // For injected providers, the provider instance itself remains the same.
        // For WalletConnect, the wcProvider instance also remains, but its internal state updates.
        ethersProvider = new ethers.providers.Web3Provider(activeRawProvider, 'any');
        signer = ethersProvider.getSigner();
        userAddress = await signer.getAddress(); // Get new address
        console.log("Connection context updated for new account. Re-verifying network...");
        await checkAndSwitchNetwork(); // Re-check network and trigger scan for new account
    }
}

async function handleChainChanged(chainId) { // chainId is usually hex string e.g. "0x..."
    console.log("Provider Event: 'chainChanged'", chainId);
    if (!userAddress) { // If not connected, ignore (should be disconnected already if no userAddress)
        return;
    }
    const numChainId = Number(chainId); // Convert hex to number
    if (isNaN(numChainId)) {
        console.error("Invalid chainId received from 'chainChanged' event:", chainId);
        typeLine("⚠️ Received invalid network ID from wallet.", true);
        return;
    }

    typeLine(`[Network Changed in Wallet to ID: ${numChainId}]`, false);
    if (numChainId !== APECHAIN_CHAIN_ID) {
        typeLine(`⚠️ Wallet now on wrong network. Please switch back to ApeChain (ID: ${APECHAIN_CHAIN_ID}).`, true);
        if (walletOutputEl) { // Update UI to show connected but wrong network
             walletOutputEl.innerHTML = `<p>[Wallet Connected: ${shortenAddress(userAddress)}]</p><p style="color:red;">⚠️ Switched to wrong network! Please switch back to ApeChain.</p>`;
        }
        // Do not call onScanReadyCallback here. User needs to switch back.
        // The UI should reflect that they are connected but on the wrong chain.
        // disconnectBtn should remain visible. checker.js might clear scan results if network is wrong.
    } else {
        // Switched back to the correct network
        typeLine(`[Network Corrected to ApeChain]`, false);
        // Re-verify and potentially re-scan
        // Ensure ethersProvider is still valid (it should be)
        ethersProvider = new ethers.providers.Web3Provider(activeRawProvider, 'any'); // Re-wrap just in case
        console.log("Network corrected. Calling onScanReadyCallback for connected wallet scan.");
        if (onScanReadyCallback && ethersProvider && userAddress) {
            onScanReadyCallback(ethersProvider, userAddress);
        }
    }
}

async function attemptSwitchNetwork() {
    if (!ethersProvider?.send) {
        typeLine("❌ Cannot request network switch: Provider 'send' method missing.", true);
        return Promise.reject(new Error("Provider does not support 'send' for network switch."));
    }
    typeLine(`[Requesting network switch to ApeChain via wallet...]`, false);
    try {
        await ethersProvider.send('wallet_switchEthereumChain', [{ chainId: APECHAIN_NETWORK_INFO.chainId }]);
        console.log("Network switch request sent to wallet.");
        // Note: Successful execution here only means the request was sent.
        // The actual switch confirmation comes from re-checking the network ID after this.
        return Promise.resolve();
    } catch (switchError) {
        console.error("Error sending 'wallet_switchEthereumChain':", switchError);
        if (switchError.code === 4902) { // Chain not added to wallet
            typeLine("[ApeChain not found in wallet. Requesting to add network...]", false);
            try {
                await ethersProvider.send('wallet_addEthereumChain', [APECHAIN_NETWORK_INFO]);
                console.log("Add network request sent to wallet.");
                return Promise.resolve();
            } catch (addError) {
                console.error("Error sending 'wallet_addEthereumChain':", addError);
                typeLine("❌ Failed to request adding ApeChain to wallet.", true);
                return Promise.reject(addError);
            }
        } else {
            typeLine(`❌ Network switch request failed or was rejected: ${switchError.message || 'Unknown reason'}.`, true);
            return Promise.reject(switchError);
        }
    }
}