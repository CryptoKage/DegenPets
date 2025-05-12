// webapp/checker.js - Main Orchestrator (Corrected State Declarations)

import { ethers } from 'ethers'; // For isAddress in onScanAddressClick and read-only provider
import {
    ALCHEMY_APECHAIN_RPC_URL, // Used by onScanAddressClick for read-only provider
    APECHAIN_CHAIN_ID,
    // PET_DATA and ALL_NFTS_TO_CHECK are imported by analysisEngine & uiHelpers
} from './src/config.js';
import {
    shortenAddress, typeLine,
    finalizeResults as uiFinalizeResults, // Alias to avoid name clash
    showFinalScore as uiShowFinalScore,   // Alias
    resetUI as uiResetUI,                 // Alias
    // startGoldRain, resizeCanvas, drawRain are called by uiShowFinalScore from uiHelpers
} from './src/uiHelpers.js';
import {
    initConnectionModule,
    handleProviderDisconnect as extHandleProviderDisconnect, // From walletConnection
    // Expose state from walletConnection module
    ethersProvider as wcEthersProvider,
    userAddress as wcUserAddress,
    activeRawProvider as wcActiveRawProvider // To pass to handleAccountsChanged
} from './src/walletConnection.js';
import { performWalletAnalysis } from './src/analysisEngine.js';
import html2canvas from 'html2canvas';

// --- DOM Element References ---
console.log("DEBUG: checker.js: Script start, getting DOM elements...");
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const walletInput = document.getElementById('walletInput');
const checkAddressBtn = document.getElementById('checkAddressBtn');
const scannedWalletInfo = document.getElementById('scannedWalletInfo');
const walletOutput = document.getElementById('walletOutput');
const resultArea = document.getElementById('resultArea');
const petSection = document.getElementById('petSection');
const petImage = document.getElementById('petImage');
const petText = document.getElementById('petText');
const scoreList = document.getElementById('scoreList');
const mintPass = document.getElementById('mintPass');
const bonusButtons = document.getElementById('bonusButtons');
const shareScoreBtn = document.getElementById('shareScoreBtn');
const walletInputSection = document.querySelector('.wallet-input-section');

// goldRainCanvas is used by uiHelpers directly via getElementById

console.log("DEBUG: checker.js: DOM Elements", { connectBtn,disconnectBtn,walletInput,checkAddressBtn,scannedWalletInfo,walletOutput,resultArea,petSection,petImage,petText,scoreList,mintPass,bonusButtons,shareScoreBtn,walletInputSection });


// --- Application State (Managed by checker.js) ---
// Declare these ONCE at the module scope with 'let'
let totalScore = 0;
let determinedPet = null;
let scoreDetails = []; // This will be an array, passed by reference effectively
let cultFound = false;
// scannedAddress and isCheckingConnectedWallet are handled by onScanAddressClick and walletConnection module respectively

// Wrapper for resetUI from uiHelpers to pass all checker.js DOM elements
function fullResetUI(clearOutput = true) {
    // Ensure all DOM elements are passed correctly
    uiResetUI(clearOutput, {
        walletOutput, scoreList, mintPass, scannedWalletInfo, resultArea,
        petSection, bonusButtons, disconnectBtn, connectBtn, checkAddressBtn, walletInput
    });
}

function resetCheckerScanState(clearOutput = true) { // Renamed to be more specific
    console.log("Resetting checker scan-specific application state.");
    totalScore = 0;
    determinedPet = null;
    scoreDetails = []; // Re-initialize as new empty array
    cultFound = false;

    // Ensure gold rain stops if it was part of UI module tied to these states
    const grCanvas = document.getElementById('goldRainCanvas');
    if(grCanvas) grCanvas.classList.add('hidden'); // Assuming startGoldRain adds/removes this
    document.body.classList.remove('cult-3d-handshake');

    if(clearOutput && walletOutput) walletOutput.innerHTML = "";
    if(scannedWalletInfo) scannedWalletInfo.textContent = "";
}

function resetEverythingChecker(clearOutput = true) {
    resetCheckerScanState(clearOutput); // Resets score, pet etc.
    fullResetUI(clearOutput); // Resets DOM elements handled by uiHelpers
}


// --- Scan Address Button Handler (Uses its own read-only provider) ---
async function onScanAddressClick() {
    console.log("DEBUG: Scan Address button clicked.");
    if (!walletInput) { console.error("Input element missing."); return; }
    const addressFromInput = walletInput.value.trim();
    if (!ethers.utils.isAddress(addressFromInput)) { alert("Invalid address format."); return; }

    resetEverythingChecker(true);
    if (resultArea) resultArea.classList.add('hidden');
    if (scannedWalletInfo) { scannedWalletInfo.classList.remove('hidden'); scannedWalletInfo.textContent = `Scanning address: ${shortenAddress(addressFromInput)}...`; }
    else { typeLine(`Scanning address: ${shortenAddress(addressFromInput)}...`); }

    const currentScannedAddress = addressFromInput;
    const currentIsCheckingConnectedWallet = false; // This is an input scan

    let providerForScan = null;

    console.log("DEBUG SCAN: Checking if existing provider can be used...");
    console.log("DEBUG SCAN: wcUserAddress (from walletConnection.js):", wcUserAddress);
    console.log("DEBUG SCAN: wcEthersProvider (from walletConnection.js) exists:", !!wcEthersProvider);

    if (wcUserAddress && wcEthersProvider) { // Check if user is actually connected
        console.log("DEBUG SCAN: Connected provider exists. Checking its network...");
        try {
            const network = await wcEthersProvider.getNetwork();
            console.log("DEBUG SCAN: Connected provider network:", network.chainId);
            if (network.chainId === APECHAIN_CHAIN_ID) {
                console.log("DEBUG SCAN: Using existing connected provider for input scan.");
                providerForScan = wcEthersProvider;
            } else {
                console.log("DEBUG SCAN: Connected provider is on WRONG network. Cannot use for input scan.");
                typeLine("⚠️ Your connected wallet is on the wrong network. Switch to ApeChain to enable this scan.", true);
                if (checkAddressBtn) checkAddressBtn.disabled = false; if (walletInput) walletInput.disabled = false;
                return; // Stop if connected but on wrong chain
            }
        } catch (e) {
            console.warn("DEBUG SCAN: Error checking connected provider network:", e);
            // If error, force fallback to new provider attempt
            providerForScan = null;
        }
    } else {
        console.log("DEBUG SCAN: Not connected or provider from connection not available.");
    }

    if (!providerForScan) {
        console.log("DEBUG SCAN: Attempting NEW read-only provider (Alchemy)...");
        if (!ALCHEMY_APECHAIN_RPC_URL) { console.error("FATAL: ALCHEMY_APECHAIN_RPC_URL is undefined!"); typeLine("❌ Config Error: RPC URL missing.", true); if (checkAddressBtn) checkAddressBtn.disabled = false; if (walletInput) walletInput.disabled = false; return; }
        try {
            // This is the part that fails with ERR_NAME_NOT_RESOLVED for you for direct calls
            const readOnlyProvider = new ethers.providers.JsonRpcProvider(ALCHEMY_APECHAIN_RPC_URL);
            await readOnlyProvider.getNetwork();
            console.log("DEBUG SCAN: NEW Read-only provider (Alchemy) connected successfully.");
            providerForScan = readOnlyProvider;
        } catch (providerError) {
            console.error("DEBUG SCAN: Failed to create/connect NEW read-only provider:", providerError);
            typeLine(`❌ Network connection failed for scan. Please ensure your primary wallet (e.g., MetaMask) is connected to ApeChain to enable scanning other addresses.`, true);
            if(scannedWalletInfo) scannedWalletInfo.textContent = `Error. Connect wallet to scan.`;
            if (checkAddressBtn) checkAddressBtn.disabled = false; if (walletInput) walletInput.disabled = false;
            return;
        }
    }

    if (providerForScan) {
        console.log("DEBUG SCAN: Proceeding with scan using provider:", providerForScan === wcEthersProvider ? "Connected Provider" : "New Read-Only Provider");
        await runDegenCheck(providerForScan, currentScannedAddress, currentIsCheckingConnectedWallet);
    } else {
        console.error("DEBUG SCAN: CRITICAL - Could not determine a provider for the scan.");
        typeLine("❌ Scan failed: Could not establish network connection.", true);
        if (checkAddressBtn) checkAddressBtn.disabled = false; if (walletInput) walletInput.disabled = false;
    }
}


// --- Degen Check Core Logic ---
async function runDegenCheck(providerToCheck, addressToScan, isScanForConnectedWallet) {
    console.log(`Entering runDegenCheck for address: ${addressToScan}`);
    if (!addressToScan || !providerToCheck) { typeLine("❌ Scan Error: Missing info.", true); return; }

    try { console.log("DEBUG: RPC Check..."); const bn = await providerToCheck.getBlockNumber(); console.log("DEBUG: RPC OK! Block:", bn); typeLine(`[RPC OK - Block: ${bn}]`); }
    catch (rpcError) { console.error("FATAL: RPC failed:", rpcError); typeLine(`❌ RPC Error: ${rpcError.message}. Scan aborted.`, true); resetEverythingChecker(false); return; }

    console.log(`Starting Scan for: ${addressToScan}`);
    // Reset UI for results part specifically
    if (resultArea) resultArea.classList.add('hidden'); if (petSection) petSection.classList.add('hidden');
    if (scoreList) scoreList.innerHTML = ""; if (mintPass) mintPass.innerHTML = "";
    if (bonusButtons) bonusButtons.classList.add('hidden');
    document.body.classList.remove('cult-3d-handshake');
    const grCanvas = document.getElementById('goldRainCanvas'); if(grCanvas) grCanvas.classList.add('hidden');

    // Initialize/Reset state for THIS scan
    let currentScanState = {
        totalScore: 0,
        scoreDetails: [], // Fresh array for each scan
        determinedPet: null,
        cultFound: false
    };

    // Update UI based on scan type
    if (walletOutput) walletOutput.innerHTML = ""; // Clear previous scan lines
    if (isScanForConnectedWallet && wcUserAddress) { // Use wcUserAddress (imported from walletConnection)
        typeLine(`[Wallet Connected: ${shortenAddress(wcUserAddress)}]`);
    } else if (scannedWalletInfo) {
        scannedWalletInfo.textContent = `Scanning: ${shortenAddress(addressToScan)}...`;
        scannedWalletInfo.classList.remove('hidden');
    }
    typeLine("[Initiating Scan...]");
    if(connectBtn) connectBtn.disabled = true; if(disconnectBtn) disconnectBtn.disabled = true;
    if(checkAddressBtn) checkAddressBtn.disabled = true; if(walletInput) walletInput.disabled = true;

    try {
        // Pass the state object to be modified
        await performWalletAnalysis(providerToCheck, addressToScan, currentScanState);

        // After performWalletAnalysis, update the module-level variables
        // so showFinalScore (called via uiFinalizeResults) can access them.
        totalScore = currentScanState.totalScore;
        scoreDetails = currentScanState.scoreDetails; // Reference to the array modified by performWalletAnalysis
        determinedPet = currentScanState.determinedPet;
        cultFound = currentScanState.cultFound;

    } catch (error) { console.error("Error during analysis:", error); typeLine("❌ Analysis error.", true); }
    finally {
        if(connectBtn) connectBtn.disabled = false;
        if(disconnectBtn) disconnectBtn.disabled = !isScanForConnectedWallet; // Use current scan context
        if(checkAddressBtn) checkAddressBtn.disabled = false;
        if(walletInput) walletInput.disabled = false;

        // Pass current (now updated) module-level state values to finalizeResults
        uiFinalizeResults(addressToScan, totalScore, determinedPet, isScanForConnectedWallet, addressToScan,
            // Pass the showFinalScore function from uiHelpers, binding necessary DOM elements
            (addr, tScore, dPet, isConn, sAddr) => uiShowFinalScore(addr, tScore, dPet, isConn, sAddr, scoreDetails, // Pass module-level scoreDetails
                { resultArea, petSection, petImage, petText, scoreList, mintPass, bonusButtons, scannedWalletInfo, userAddressFromChecker: wcUserAddress }
            )
        );
    }
}

// --- Event Listener Attachments & Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: checker.js: DOMContentLoaded fired.");
    const yearElement = document.getElementById('year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
    else console.warn("Year element missing");

    // Initialize wallet connection module, passing DOM elements and the scan callback
    initConnectionModule(
        { connectBtn, disconnectBtn, walletOutput, walletInputSection },
        // This is the callback that walletConnection.js will call when ready to scan
        (connectedProvider, connectedAddress) => {
            // When walletConnection says it's ready, run the check for the connected wallet
            runDegenCheck(connectedProvider, connectedAddress, true); // true because it's for connected wallet
        }
    );

    // Attach listener for the manual address scan button
    checkAddressBtn?.addEventListener('click', onScanAddressClick);

    // Share score button listener
    shareScoreBtn?.addEventListener('click', () => {
        console.log("DEBUG: Share Score Clicked");
        typeLine("[Generating image...]");
        const currentScoreForShare = totalScore;
        const currentPetForShare = determinedPet || "Crab";
        // Use the address that was actually scanned for the filename
        const addressForFilename = IsCheckingConnectedWallet ? wcUserAddress : scannedAddress;

        setTimeout(() => {
            const scoreElement = document.querySelector("#scoreBreakdown");
            const petElement = document.querySelector("#petSection");
            if (!scoreElement || !petElement) { console.error("Screenshot elements missing"); typeLine("❌ Screenshot Error.", true); return; }
            const options = { scale: window.devicePixelRatio || 2, backgroundColor: '#0f0f1a', useCORS: true, logging: false };
            html2canvas(scoreElement, options).then(canvas1 => {
                html2canvas(petElement, options).then(canvas2 => {
                    const combinedCanvas = document.createElement('canvas'); const padding = 20 * options.scale;
                    combinedCanvas.width = Math.max(canvas1.width, canvas2.width); combinedCanvas.height = canvas1.height + canvas2.height + padding;
                    const ctx = combinedCanvas.getContext('2d'); if (!ctx) { console.error("No canvas context"); return; }
                    ctx.fillStyle = options.backgroundColor; ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
                    ctx.drawImage(canvas1, 0, 0); ctx.drawImage(canvas2, 0, canvas1.height + padding);
                    const link = document.createElement('a');
                    link.download = `DegenCheck_${addressForFilename ? shortenAddress(addressForFilename) : 'Wallet'}_Score${currentScoreForShare}_${Date.now()}.png`;
                    link.href = combinedCanvas.toDataURL("image/png"); link.click(); typeLine("[✅ Score image saved! Now share it...]");
                    try { const siteUrl = encodeURIComponent("https://degenpets.com/checker.html"); const tweetText = encodeURIComponent( `Just checked my Degen Score on @YourProjectXHandle!\n` + `Score: ${currentScoreForShare} pts\n` + `Pet Affinity: ${currentPetForShare}\n\n` + `Check yours! #DegenPets #ApeChain #DegenScore` ); const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${siteUrl}`; console.log("DEBUG: Opening Twitter Intent URL:", twitterIntentUrl); window.open(twitterIntentUrl, '_blank');
                    } catch (e) { console.error("Error opening Twitter intent:", e); typeLine("❌ Could not open Twitter share window.", true); }
                }).catch(e => { console.error("Screenshot pet err:", e); typeLine("❌ Screenshot Error (pet).", true); })
            }).catch(e => { console.error("Screenshot score err:", e); typeLine("❌ Screenshot Error (score).", true); })
        }, 200);
    });

    console.log("DEBUG: checker.js: Main event listeners attached.");
    resetEverythingChecker(); // Set initial UI state for checker
    typeLine("System Online // Ready");
    console.log("DEBUG: checker.js: DOMContentLoaded handler finished.");
});