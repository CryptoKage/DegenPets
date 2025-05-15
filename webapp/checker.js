// webapp/checker.js - Main Orchestrator (Corrected State Declarations)

import { ethers } from 'ethers'; // For isAddress in onScanAddressClick and read-only provider
import {
    ALCHEMY_APECHAIN_RPC_URL, // Used by onScanAddressClick for read-only provider
    APECHAIN_CHAIN_ID,
    DEGEN_PET_NFT_CONTRACT_ADDRESS,
    DEGEN_PET_NFT_ABI 
    // PET_DATA and ALL_NFTS_TO_CHECK are imported by analysisEngine & uiHelpers
} from './src/config.js';
import {
    shortenAddress, typeLine,
    finalizeResults as uiFinalizeResults, // Alias to avoid name clash
    showFinalScore as uiShowFinalScore,   // Alias
    resetUI as uiResetUI,                 // Alias
    // startGoldRain, resizeCanvas, drawRain are called by uiShowFinalScore from uiHelpers
} from './src/uiHelpers.js';
import { PET_DATA } from './src/petData.js';
import {
    initConnectionModule,
wcEthersProvider, // <<< RENAME IMPORT for clarity if 'ethersProvider' is used locally
    signer as wcSigner,         // <<< RENAME IMPORT for clarity
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
const mintScoreActualButton = document.getElementById('mintScoreActualButton');

// goldRainCanvas is used by uiHelpers directly via getElementById

console.log("DEBUG: checker.js: DOM Elements", { connectBtn,disconnectBtn,walletInput,checkAddressBtn,scannedWalletInfo,walletOutput,resultArea,petSection,petImage,petText,scoreList,mintPass,bonusButtons,shareScoreBtn,walletInputSection });


// --- Application State (Managed by checker.js) ---
// Declare these ONCE at the module scope with 'let'
let totalScore = 0;
let determinedPet = null;
let scoreDetails = []; // This will be an array, passed by reference effectively
let cultFound = false;
let scannedAddress = null; // <<< ADD THIS DECLARATION
let isCheckingConnectedWallet = false;
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
    const currentisCheckingConnectedWallet = false; // This is an input scan

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
        await runDegenCheck(providerForScan, currentScannedAddress, currentisCheckingConnectedWallet);
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

// --- NEW: Minting Functionality ---
async function handleMintDegenPetNFT() {
    console.log("handleMintDegenPetNFT called");
    if (!wcSigner) { // Use the imported signer from walletConnection.js
        typeLine("Please connect your wallet first to mint!", true);
        // Optionally, trigger wallet connection logic from walletConnection.js
        // connectBtn.click(); // Or a more direct function if available
        return;
    }

    if (totalScore === null || totalScore === undefined) { // Use the module-level totalScore
        typeLine("Degen score not calculated yet. Please complete a scan first.", true);
        return;
    }
    if (totalScore < 50) { // Assuming 50 is still the threshold
        typeLine(`Your score of ${totalScore} is not high enough for presale/mint. Need 50+ pts.`, true);
        return;
    }

    // Use mintPass element for messages during minting, or walletOutput
    const mintMessageArea = mintPass; // Or walletOutput, or a new dedicated element
    const originalMintButtonText = mintScoreActualButton.textContent;

    try {
        mintScoreActualButton.disabled = true;
        mintScoreActualButton.textContent = "Minting...";
        typeLine("Preparing your Degen Pet NFT...", false); // Use typeLine for consistency

        // 1. Initialize Contract with Ethers.js using wcSigner
        const degenPetsContract = new ethers.Contract(
            DEGEN_PET_NFT_CONTRACT_ADDRESS,
            DEGEN_PET_NFT_ABI,
            wcSigner // Use the signer from walletConnection.js
        );

        // 2. Get the current mint price
        const currentMintPriceBigNumber = await degenPetsContract.mintPrice();
        const currentMintPriceAPE = ethers.utils.formatUnits(currentMintPriceBigNumber, 18);
        typeLine(`Mint price: ${currentMintPriceAPE} APE. Confirm in your wallet...`, false);

        // 3. Call the mintCard function
        console.log("Initiating mintCard transaction...");
        const mintTransaction = await degenPetsContract.mintCard({
            value: currentMintPriceBigNumber
        });

        typeLine(`Mint transaction sent! Waiting for confirmation: ${mintTransaction.hash}`, false);
        console.log("Transaction sent, hash:", mintTransaction.hash);

        // 4. Wait for the transaction to be mined
        const receipt = await mintTransaction.wait();
        console.log("Transaction confirmed:", receipt);
        typeLine("Mint successful! Recording your achievement...", false);

        // 5. Get the tokenId from the transaction receipt events
        let mintedTokenId = null;
        if (receipt.events) {
            // ERC721A emits "ConsecutiveTransfer" for mints
            // args: fromTokenId, toTokenId, fromAddress, toAddress
            const consecutiveTransferEvent = receipt.events.find(e => e.event === "ConsecutiveTransfer");
            if (consecutiveTransferEvent && consecutiveTransferEvent.args) {
                mintedTokenId = consecutiveTransferEvent.args.fromTokenId.toString(); // For a single mint, fromTokenId is the ID
                console.log("Found tokenId from ConsecutiveTransfer event:", mintedTokenId);
            } else {
                // Fallback for standard ERC721 Transfer event (if ERC721A's isn't found for some reason)
                const transferEvent = receipt.events.find(e => e.event === "Transfer" && e.args.from === ethers.constants.AddressZero);
                if (transferEvent && transferEvent.args) {
                    mintedTokenId = transferEvent.args.tokenId.toString();
                    console.log("Found tokenId from Transfer event:", mintedTokenId);
                }
            }
        }

        if (!mintedTokenId) {
            typeLine("Mint successful, but could not automatically retrieve Token ID. Please check a block explorer.", true);
            console.error("Could not find Token ID from transaction events.", receipt.events);
            mintScoreActualButton.textContent = originalMintButtonText;
            mintScoreActualButton.disabled = false;
            return;
        }
        
        typeLine(`NFT Minted! Token ID: ${mintedTokenId}. Saving score...`, false);

        // 6. Call our backend to record the mint info
        const backendResponse = await fetch('/api/record-mint-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tokenId: mintedTokenId,
                userScore: totalScore // Use the module-level totalScore
            }),
        });

        const backendResult = await backendResponse.json();

        if (backendResponse.ok) {
            typeLine(`Degen Pet NFT (ID: ${mintedTokenId}) minted and score ${totalScore} recorded! View on marketplaces soon.`, false);
            console.log("Backend record successful:", backendResult);
            // You could add a link to Apescan for the token here
            // e.g., `Your NFT: https://apescan.io/token/${DEGEN_PET_NFT_CONTRACT_ADDRESS}?a=${mintedTokenId}`
        } else {
            typeLine(`NFT Minted (ID: ${mintedTokenId}), but failed to record score automatically: ${backendResult.error}. Please contact support.`, true);
            console.error("Backend record failed:", backendResult);
        }

        mintScoreActualButton.textContent = "Minted!"; // Or original text
        // Consider keeping it disabled or re-enabling after a delay, or if max mints per wallet not reached

    } catch (error) {
        console.error("Minting process failed:", error);
        let userMessage = `Minting failed: ${error.message || "Unknown error. Check console."}`;
        if (error.code === 4001) { 
            userMessage = "Transaction rejected by user.";
        } else if (error.data && error.data.message) { // Ethers.js often wraps contract reverts in error.data
             userMessage = `Minting failed: ${error.data.message}`;
        } else if (error.message && error.message.includes("insufficient funds")) {
            userMessage = "Minting failed: Insufficient APE for transaction.";
        } else if (error.message && error.message.includes("DPAC__MaxMintsPerWalletReached")) { // Matches your contract's error
             userMessage = "Minting failed: Max mints per wallet reached.";
        }
        typeLine(userMessage, true);
        mintScoreActualButton.textContent = originalMintButtonText;
        mintScoreActualButton.disabled = false;
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
        (connectedProviderParam, connectedAddressParam) => {
            // When walletConnection says it's ready, run the check for the connected wallet
            runDegenCheck(wcEthersProvider, wcUserAddress, true); // true because it's for connected wallet
        }
    );

    // Attach listener for the manual address scan button
    checkAddressBtn?.addEventListener('click', onScanAddressClick);

    // Share score button listener
// checker.js

// Ensure these are accessible in this scope (module-level variables in checker.js)
// let totalScore;
// let determinedPet;
// let scannedAddress; // Address from input field if that was the last scan
// let isCheckingConnectedWallet; // Flag true if last scan was for connected wallet
// import { userAddress as wcUserAddress } from './src/walletConnection.js'; // Connected user's address
// import { PET_DATA } from './src/petData.js';
// import { shortenAddress, typeLine } from './src/uiHelpers.js';
// import html2canvas from 'html2canvas';

// checker.js

shareScoreBtn?.addEventListener('click', () => {
    console.log("DEBUG: Share Score Button Clicked (Text Only)");
    typeLine("[Preparing share link...]");

    // Ensure these module-scoped variables are up-to-date from the last scan
    const currentScoreForShare = totalScore;
    const currentPetKey = determinedPet || "Crab"; // Default if not determined
    const petDataToShare = PET_DATA[currentPetKey]; // PET_DATA must be imported

    if (!petDataToShare) {
        console.error("DEBUG SHARE: Pet data not found for key:", currentPetKey);
        typeLine("❌ Error preparing share link: Pet data missing.", true);
        return;
    }

    // --- Twitter Intent Logic ---
    try {
        const siteUrl = encodeURIComponent("https://degenpets.com/checker.html Powered by @apecoin #Apechain"); // Your live checker page URL
        const tweetText = encodeURIComponent(
            `My Apechain Score: ${currentScoreForShare} pts\n\n` +
            `@Degenpets_ Affinity: ${petDataToShare.name}!\n` + 
            `Strategy: ${petDataToShare.strategyName}\n` +
            `Query yours`
        );
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${siteUrl}`;

        console.log("DEBUG: Opening Twitter Intent URL:", twitterIntentUrl);
        typeLine("[Redirecting to X for sharing...]");
        window.open(twitterIntentUrl, '_blank'); // Open in new tab

    } catch (e) {
        console.error("Error opening Twitter intent:", e);
        typeLine("❌ Could not open Twitter share window.", true);
    }
    // --- END TWITTER INTENT LOGIC ---
});

    // --- Attach listener to the new Mint Score NFT button ---
    if (mintScoreActualButton) {
        mintScoreActualButton.addEventListener('click', handleMintDegenPetNFT);
        console.log("DEBUG: Event listener attached to mintScoreActualButton.");
    } else {
        console.warn("DEBUG: mintScoreActualButton not found in DOM at attach time.");
    }

    console.log("DEBUG: checker.js: Main event listeners attached.");
    resetEverythingChecker(); // Set initial UI state for checker
    typeLine("System Online // Ready");
    console.log("DEBUG: checker.js: DOMContentLoaded handler finished.");
});