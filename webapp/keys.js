// webapp/keys.js

import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { ethers } from 'ethers';
import FounderKeyABI from './src/abis/FounderKeyABI.json'; // Ensure this path and file are correct

// --- CONFIGURATION ---
const FOUNDER_KEY_CONTRACT_ADDRESS = "0x4dFFD443beed3B0e46d17009ec50c73FAF3B13ea";
const APE_RPC_URL = "https://ape-mainnet.g.alchemy.com/v2/vsd8ZH4Ouc0w_2YRow5MQ93Z3dIMAayQ"; // Using Alchemy
const APECHAIN_CHAIN_ID = 33139;
const PROJECT_ID = 'f653591549f67bc5dc45ead5e636a12e';
const metadata = { name: 'Degen Pets Founder Keys', description: 'Mint your Degen Pets Founder Key', url: window.location.origin, icons: [`${window.location.origin}/favicon.png`] };

const TOTAL_SALE_SUPPLY_KEYS = 200; // Public sale supply

// --- DOM Elements ---
const connectBtn = document.getElementById('keyConnectBtn');
const disconnectBtn = document.getElementById('keyDisconnectBtn');
const walletStatus = document.getElementById('keyWalletStatus');
const mintControlsBox = document.getElementById('keyMintControls');
const mintKeyBtn = document.getElementById('mintKeyBtn');
const keyQuantityInput = document.getElementById('keyQuantityInput'); // We'll read it but mint 1 for now
const keyMintStatus = document.getElementById('keyMintStatus');
const keyApeBalanceSpan = document.getElementById('keyApeBalance'); // APE (Native) Balance
const keysMintedSpan = document.getElementById('keysMinted');
const keyMintPriceSpan = document.getElementById('keyMintPrice');
const keyProgressBar = document.getElementById('keyMintProgressBar');
const yearSpan = document.getElementById('year');

// --- Application State ---
let wcProviderKeys = null;
let ethersProviderKeys = null;
let activeRawProviderKeys = null;
let signerKeys = null;
let userAddressKeys = null;
let founderKeyContract = null;
let currentMintPrice = ethers.BigNumber.from(0); // Store fetched mint price
let updateIntervalKeys = null;

// --- Helper Functions ---
function shortenAddress(addr) { return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''; }

function setStatusKeys(message, isError) {
    if (!walletStatus) return;
    walletStatus.textContent = message;
    walletStatus.style.color = isError ? '#ff4d4d' : 'rgba(255, 255, 255, 0.7)';
    console.log(`DEBUG KEYS: Status - ${message}`);
}
function setKeyMintStatus(message, isError) {
    if (!keyMintStatus) return;
    keyMintStatus.textContent = message;
    keyMintStatus.className = isError ? 'contribution-status error' : 'contribution-status';
    console.log(`DEBUG KEYS: Mint Status - ${message}`);
}

// --- Initialization ---
async function initializeKeyPage() {
    console.log("DEBUG KEYS: Initializing Founder Keys Page...");
    if(yearSpan) yearSpan.textContent = new Date().getFullYear();
    const contractAddressDisplay = document.getElementById('presaleContractLink'); // Reusing ID from presale.html example
    if(contractAddressDisplay && FOUNDER_KEY_CONTRACT_ADDRESS && FOUNDER_KEY_CONTRACT_ADDRESS !== "0x4dFFD443beed3B0e46d17009ec50c73FAF3B13ea") {
         contractAddressDisplay.textContent = shortenAddress(FOUNDER_KEY_CONTRACT_ADDRESS);
         contractAddressDisplay.href = `https://apescan.io/address/${FOUNDER_KEY_CONTRACT_ADDRESS}`;
    } else if (contractAddressDisplay) {
        contractAddressDisplay.parentElement.textContent = "Contract address not configured.";
    }


    await initializeWCProviderKeys();
    setupKeyListeners();
    setStatusKeys("Ready. Connect wallet to mint.", false);
    resetAppKeysUi(); // Set initial UI
}

async function initializeWCProviderKeys() {
    if (!PROJECT_ID) { console.error("PROJECT_ID missing for Keys page!"); return; }
    try {
        console.log("DEBUG KEYS: Init WC Provider...");
        wcProviderKeys = await EthereumProvider.init({ projectId: PROJECT_ID, chains: [APECHAIN_CHAIN_ID], showQrModal: true, // showQrModal needs to be true for wcProvider.connect() to work
            rpcMap: { [APECHAIN_CHAIN_ID]: APE_RPC_URL }, metadata });
        wcProviderKeys.on('disconnect', handleDisconnectKeys); // WC session disconnect
        console.log("DEBUG KEYS: WC Provider initialized.");
    } catch (e) { console.error("Init WC Error (Keys):", e); wcProviderKeys = null; setStatusKeys("Error initializing WalletConnect.", true); }
}

// --- UI Reset ---
function resetAppKeysUi() {
    connectBtn?.classList.remove('hidden');
    disconnectBtn?.classList.add('hidden');
    mintControlsBox?.classList.add('hidden');
    if(keyQuantityInput) keyQuantityInput.value = '1'; // Default to 1
    setKeyMintStatus("", false);
    if(keyApeBalanceSpan) keyApeBalanceSpan.textContent = '--';
    if(keysMintedSpan) keysMintedSpan.textContent = '0';
    if(keyProgressBar) keyProgressBar.style.width = '0%';
    if(keyMintPriceSpan) keyMintPriceSpan.textContent = 'Loading...';
    if(mintKeyBtn) mintKeyBtn.disabled = false; // Ensure mint button is enabled on reset
}

function resetAppKeysState() {
    console.log("DEBUG KEYS: Resetting Presale App State.");
    ethersProviderKeys = null; activeRawProviderKeys = null; signerKeys = null; userAddressKeys = null;
    founderKeyContract = null; currentMintPrice = ethers.BigNumber.from(0);
    if(updateIntervalKeys) clearInterval(updateIntervalKeys); updateIntervalKeys = null;
}


// --- Wallet Connection ---
async function onConnectClickKeys() {
    console.log("DEBUG KEYS: Connect clicked.");
    resetAppKeysState(); // Reset state before connection attempt
    resetAppKeysUi();    // Reset UI
    setStatusKeys("Connecting...", false);
    if (typeof window.ethereum !== 'undefined') {
        console.log("DEBUG KEYS: Injected provider detected.");
        await connectInjectedKeys(window.ethereum);
    } else if (wcProviderKeys) {
        console.log("DEBUG KEYS: Using WalletConnect fallback.");
        await connectWalletConnectKeys();
    } else { setStatusKeys("No wallet provider found.", true); }
}

async function connectInjectedKeys(provider) {
    try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts[0]) throw new Error("No accounts returned.");
        activeRawProviderKeys = provider;
        ethersProviderKeys = new ethers.providers.Web3Provider(provider, 'any');
        await handleConnectionSuccessKeys();
    } catch (e) { console.error("Injected connect error (Keys):", e); setStatusKeys(e.code === 4001 ? "Connection rejected." : "Connection error.", true); resetAppKeysUi(); }
}

async function connectWalletConnectKeys() {
    if (!wcProviderKeys) { setStatusKeys("WalletConnect unavailable.", true); return; }
    try {
        console.log("DEBUG KEYS: Calling wcProviderKeys.connect()...");
        await wcProviderKeys.connect(); // This should trigger QR modal
         // Check if connection was successful after modal interaction (or if event fired)
        if (wcProviderKeys.connected && wcProviderKeys.accounts?.length > 0) {
             console.log("DEBUG KEYS: WC Provider connected, handling success...");
             activeRawProviderKeys = wcProviderKeys;
             ethersProviderKeys = new ethers.providers.Web3Provider(wcProviderKeys, 'any');
             await handleConnectionSuccessKeys();
         } else {
            console.log("DEBUG KEYS: WC Provider connect method finished, but not fully connected or no accounts. Relying on 'connect' event or user action.");
            // If 'connect' event is not reliable, may need to call handleConnectionSuccess after this if wcProvider.accounts exists
         }
    } catch (e) { console.error("WC connect error (Keys):", e); setStatusKeys(e.message?.includes('closed modal') || e.message?.includes('User closed modal') ? "Connection cancelled." : "WalletConnect error.", true); resetAppKeysUi(); }
}


// --- Post-Connection Setup ---
async function handleConnectionSuccessKeys() {
    console.log("DEBUG KEYS: Handling connection success...");
    if (!ethersProviderKeys) { setStatusKeys("Provider error after connection.", true); return; }
    try {
        signerKeys = ethersProviderKeys.getSigner();
        userAddressKeys = await signerKeys.getAddress();
        if (!userAddressKeys) throw new Error("No address found.");

        const network = await ethersProviderKeys.getNetwork();
        if (network.chainId !== APECHAIN_CHAIN_ID) {
            setStatusKeys(`Wrong Network! Switch to ApeChain.`, true);
            // await attemptSwitchNetworkKeys(); // Implement if needed
            handleDisconnectKeys(); // Disconnect if on wrong network
            return;
        }
        console.log("DEBUG KEYS: Connected as:", userAddressKeys);
        setStatusKeys(`Connected: ${shortenAddress(userAddressKeys)}`, false);
        connectBtn.classList.add('hidden');
        disconnectBtn.classList.remove('hidden');
        mintControlsBox.classList.remove('hidden');

        founderKeyContract = new ethers.Contract(FOUNDER_KEY_CONTRACT_ADDRESS, FounderKeyABI, signerKeys);
        attachProviderListenersKeys(activeRawProviderKeys);
        startKeyUiUpdates();
    } catch (e) { console.error("Setup Error (Keys):", e); setStatusKeys(`Error: ${e.message}`, true); await handleDisconnectKeys(); }
}

// --- Disconnect Logic ---
async function handleDisconnectKeys() {
    console.log("DEBUG KEYS: Handling disconnect.");
    activeRawProviderKeys?.removeAllListeners?.();
    if (activeRawProviderKeys === wcProviderKeys && wcProviderKeys?.connected) { try { await wcProviderKeys.disconnect(); } catch (e) { console.warn("WC disconnect error (Keys):", e); } }
    resetAppKeysState(); resetAppKeysUi();
    setStatusKeys("Disconnected. Connect wallet to mint.", false);
}

// --- Event Listeners ---
function setupKeyListeners() { connectBtn?.addEventListener('click', onConnectClickKeys); disconnectBtn?.addEventListener('click', handleDisconnectKeys); mintKeyBtn?.addEventListener('click', handleMintKey); }
function attachProviderListenersKeys(provider) { if (!provider?.on) return; provider.removeAllListeners?.(); provider.on('accountsChanged', handleAccountsChangedKeys); provider.on('chainChanged', handleChainChangedKeys); provider.on('disconnect', handleDisconnectKeys); console.log("DEBUG KEYS: Attached provider listeners."); }
async function handleAccountsChangedKeys(accounts) { console.log("Accounts Changed (Keys):", accounts); if (!accounts || accounts.length === 0) { handleDisconnectKeys(); } else if (accounts[0].toLowerCase() !== userAddressKeys?.toLowerCase()) { setStatusKeys("Account changed. Re-initializing...", false); await handleConnectionSuccessKeys(); } }
function handleChainChangedKeys(chainId) { console.log("Chain Changed (Keys):", chainId); const numChainId = Number(chainId); if (numChainId !== APECHAIN_CHAIN_ID) { setStatusKeys(`Wrong Network! Switch back to ApeChain.`, true); handleDisconnectKeys(); } else { setStatusKeys("Network correct. Refreshing data...", false); startKeyUiUpdates(); } }

// --- UI Updates ---
function startKeyUiUpdates() { if (updateIntervalKeys) clearInterval(updateIntervalKeys); updateKeyMintData(); updateUserApeBalanceKeys(); updateIntervalKeys = setInterval(() => { updateKeyMintData(); updateUserApeBalanceKeys(); }, 15000); }

async function updateKeyMintData() {
    if (!founderKeyContract) { console.log("DEBUG KEYS: Key contract not ready for UI update."); return; }
    console.log("DEBUG KEYS: Updating Key Mint data...");
    try {
        const [numSold, priceRaw] = await Promise.all([
            founderKeyContract.numSoldKeys().catch(e => {console.error("Err numSoldKeys", e); return null;}),
            founderKeyContract.mintPriceApe().catch(e => {console.error("Err mintPriceApe", e); return null;})
        ]);

        if (numSold !== null) {
            const mintedCount = numSold.toNumber(); // numSoldKeys is uint256
            if(keysMintedSpan) keysMintedSpan.textContent = mintedCount.toString();
            if(keyProgressBar) { const progress = Math.min((mintedCount / TOTAL_SALE_SUPPLY_KEYS) * 100, 100); keyProgressBar.style.width = `${progress.toFixed(2)}%`; }
        } else if(keysMintedSpan) { keysMintedSpan.textContent = 'N/A'; if(keyProgressBar) keyProgressBar.style.width = '0%';}

        if (priceRaw !== null) {
            currentMintPrice = priceRaw; // Store BigNumber
            const price = ethers.utils.formatUnits(priceRaw, 18); // Assuming APE has 18 decimals
            if(keyMintPriceSpan) keyMintPriceSpan.textContent = `${parseFloat(price).toFixed(4)}`;
        } else if(keyMintPriceSpan) { keyMintPriceSpan.textContent = 'N/A'; }

    } catch (error) { console.error("Error updating key mint data:", error); if(keysMintedSpan) keysMintedSpan.textContent = 'Error'; if(keyMintPriceSpan) keyMintPriceSpan.textContent = 'Error'; if(keyProgressBar) keyProgressBar.style.width = '0%'; }
}

async function updateUserApeBalanceKeys() {
     if (!ethersProviderKeys || !userAddressKeys) return;
     console.log("DEBUG KEYS: Updating user APE balance...");
     try {
         const balanceRaw = await ethersProviderKeys.getBalance(userAddressKeys); // Native APE balance
         const balance = ethers.utils.formatEther(balanceRaw);
         if(keyApeBalanceSpan) keyApeBalanceSpan.textContent = `${parseFloat(balance).toFixed(4)} APE`;
     } catch (error) { console.error("Error fetching APE balance (Keys):", error); if(keyApeBalanceSpan) keyApeBalanceSpan.textContent = 'Error'; }
}

// --- Minting Logic ---
async function handleMintKey() {
    if (!founderKeyContract || !signerKeys || !userAddressKeys ) { setKeyMintStatus("Wallet not connected or contract not ready.", true); return; }
    if (currentMintPrice.isZero()) { setKeyMintStatus("Mint price not loaded yet. Please wait.", true); return; }

    const quantity = 1; // Hardcoded to mint 1 key
    console.log(`DEBUG KEYS: Attempting to mint ${quantity} key(s). Price per key: ${ethers.utils.formatEther(currentMintPrice)} APE`);

    setKeyMintStatus("Preparing to mint...", false);
    mintKeyBtn.disabled = true;

    try {
        // Total cost is just currentMintPrice as quantity is 1
        const totalCostWei = currentMintPrice;

        // Check user's native APE balance for payment + gas
        const userNativeBalanceWei = await ethersProviderKeys.getBalance(userAddressKeys);
        if (userNativeBalanceWei.lt(totalCostWei)) { // Check if less than cost (doesn't account for gas)
            throw new Error(`Insufficient APE balance for mint price. (Need ${ethers.utils.formatEther(totalCostWei)} APE)`);
        }
        console.log(`DEBUG KEYS: User Balance: ${ethers.utils.formatEther(userNativeBalanceWei)} APE. Cost: ${ethers.utils.formatEther(totalCostWei)} APE`);


        setStatusKeys("Confirm mint in wallet...", false);
        const tx = await founderKeyContract.mintFounderKey({
            value: totalCostWei // Send native APE with the transaction
        });

        setStatusKeys("Transaction sent. Waiting for confirmation...", false);
        setKeyMintStatus(`Tx Sent: ${shortenAddress(tx.hash)}... Waiting...`, false);
        await tx.wait(1); // Wait for 1 confirmation

        console.log("DEBUG KEYS: Mint transaction confirmed!");
        setStatusKeys("Mint successful!", false);
        setKeyMintStatus(`✅ ${quantity} Founder Key Minted!`, false);

        updateKeyMintData(); // Refresh data
        updateUserApeBalanceKeys(); // Refresh APE balance
        if(keyQuantityInput) keyQuantityInput.value = '1'; // Reset quantity
        setTimeout(() => { setKeyMintStatus("", false); mintKeyBtn.disabled = false; }, 5000);

    } catch (error) {
        console.error("Minting failed (Keys):", error);
        let message = "Transaction failed.";
        if (error.code === 4001) message = "Transaction rejected by user.";
        else if (error.data?.message) message = error.data.message; // Check for RPC error message
        else if (error.reason) message = error.reason; // Ethers often puts revert reasons here
        else if (error.message) message = error.message;
        setStatusKeys(message, true); setKeyMintStatus(`❌ Error: ${message}`, true);
        mintKeyBtn.disabled = false;
    }
}

// --- Network Switching (Placeholder - implement fully if needed) ---
// async function attemptSwitchNetworkKeys() { /* ... similar to checker.js ... */ }

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', initializeKeyPage);