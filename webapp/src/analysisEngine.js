// webapp/src/analysisEngine.js
import { ethers } from 'ethers';
import {
    CULT_TOKEN_ADDRESS, BAYC_SHADOW_ADDRESS, MAYC_SHADOW_ADDRESS,
    ALL_NFTS_TO_CHECK, WALLET_CHECK_API_URL, // Assuming all trigger addrs are in ALL_NFTS_TO_CHECK or config
    erc20Abi, nftAbi,
    // Import specific trigger addresses directly if needed for clarity in trigger logic
    ZARDS_ADDRESS, HOPS_ADDRESS, GOBS_ADDRESS, MINO_ADDRESS, NEKITO_ADDRESS,
    DSNRS_ADDRESS, OOGIES_ADDRESS, FROSTBYTE_ADDRESS, RILLAZ_ADDRESS, MUNKEE_ADDRESS,
    TG_ADDRESS, GS_ADDRESS, YUREI_ADDRESS, APES_ON_APES_ADDRESS, WYATT_NFT_ADDRESS, DRIFTERS_ADDRESS
} from './config.js'; //APE_ART_COLLECTION_ADDRESSES
import { PET_DATA } from './petData.js';
import { typeLine } from './uiHelpers.js';

// --- Helper Function for Delays ---
async function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// --- Helper Function for GOB! Spam ---
async function displayGoblinSpam() { typeLine("GOB! GOB! GOB! GOB!", false); await delay(100); for (let i = 0; i < 5; i++) { typeLine("GOB! GOB! GOB! GOB! GOB! GOB!", false); await delay(80); } await delay(300); }

// --- Helper function to fetch wallet age data from backend (Robust Return) ---
async function fetchFirstTransactionTimestamp(addressToCheck) {
    const apiUrl = `${WALLET_CHECK_API_URL}${addressToCheck}`; console.log("Calling backend for wallet age:", apiUrl);
    let responseText;
    try {
        const response = await fetch(apiUrl); console.log(`DEBUG FETCH: Backend Response Status: ${response.status}`);
        responseText = await response.text(); console.log("DEBUG FETCH: Raw Backend Response Text:", responseText);
        if (!response.ok) {
            try { const errData = JSON.parse(responseText); if (errData && (errData.error || errData.message)) return { timestamp: null, message: errData.message || null, error: errData.error || `Backend HTTP Error: ${response.status}` }; }
            catch (e) { /* Ignore if error response isn't JSON */ }
            return { timestamp: null, message: null, error: `Backend check failed: ${response.status} - ${responseText.substring(0,100)}`};
        }
        const data = JSON.parse(responseText); console.log("DEBUG FETCH: Parsed Backend Data:", data);
        if (data?.first_tx_timestamp) { const ts = parseInt(data.first_tx_timestamp, 10); if (!isNaN(ts) && ts > 0) { return { timestamp: ts, message: null, error: null }; } else { console.warn("Invalid timestamp:", data.first_tx_timestamp); return { timestamp: null, message: "Invalid format", error: null }; } }
        else if (data?.message === "No transactions found") { return { timestamp: null, message: "No tx history", error: null }; }
        else if (data?.error) { console.error("Backend error:", data.error); return { timestamp: null, message: null, error: data.error }; }
        else { console.warn("Unexpected format from backend:", data); return { timestamp: null, message: "Unexpected response format", error: null }; }
    } catch (err) {
        console.error("fetchFirstTransactionTimestamp Exception:", err);
        if (err instanceof SyntaxError && typeof responseText !== 'undefined') { console.error("JSON Parsing failed for raw text:", responseText); return { error: "Backend non-JSON response" }; }
        return { error: err.message };
    }
}


// ***** Comprehensive Analysis Function with Corrected Trigger Logic *****
export async function performWalletAnalysis(provider, address, stateToUpdate) {
    typeLine("[1/5 Fetching Wallet Age...]");
    const dataFetchPromises = {}; dataFetchPromises.walletAge = fetchFirstTransactionTimestamp(address); await delay(150);
    typeLine("[2/5 Fetching Balances...]"); const cultContract = new ethers.Contract(CULT_TOKEN_ADDRESS, erc20Abi, provider); dataFetchPromises.cultBalanceRaw = cultContract.balanceOf(address).catch(e => { console.warn("CULT balance fail:", e); return ethers.BigNumber.from(0); }); dataFetchPromises.cultDecimals = cultContract.decimals().catch(e => { console.warn("CULT decimals fail:", e); return 18; });
    const nftBalancePromises = []; for (const name in ALL_NFTS_TO_CHECK) { const nftData = ALL_NFTS_TO_CHECK[name]; if (ethers.utils.isAddress(nftData.address)) { const nftContract = new ethers.Contract(nftData.address, nftAbi, provider); nftBalancePromises.push( nftContract.balanceOf(address).then(b => ({ name, balance: b, config: nftData })).catch(e => { console.warn(`NFT ${name} fail:`, e); return { name, balance: ethers.BigNumber.from(0), config: nftData }; }) ); } else { console.warn(`Skipping ${name}: Invalid address ${nftData.address}`); } } dataFetchPromises.nftBalances = Promise.allSettled(nftBalancePromises);
    const fetchedResults = await Promise.allSettled(Object.values(dataFetchPromises)); const fetchedData = {}; Object.keys(dataFetchPromises).forEach((key, i) => { fetchedData[key] = (fetchedResults[i].status === 'fulfilled') ? fetchedResults[i].value : null; }); console.log("DEBUG: Fetched Data:", fetchedData); await delay(150);
    typeLine("[3/5 Processing Data...]"); const ageData = fetchedData.walletAge; if (ageData?.timestamp) { const date = new Date(ageData.timestamp * 1000); typeLine(`[Wallet Age: ${date.toISOString().split('T')[0]}]`); const cutoff = new Date("2024-12-31T23:59:59Z"); if (date < cutoff) { stateToUpdate.totalScore += 10; stateToUpdate.scoreDetails.push({ text: "Early Wallet: +10 pts", highlight: false }); typeLine("[Early Bonus Added!]"); } else { typeLine("[Wallet started post-cutoff]"); } } else if (ageData?.message) { typeLine(`[Wallet Age: ${ageData.message}]`); } else if (ageData?.error) { typeLine(`[Age Error: ${ageData.error}]`, true); } else { typeLine("[Age: Unavailable]"); }
    let cultBalance = 0; if (fetchedData.cultBalanceRaw && fetchedData.cultDecimals) { cultBalance = parseFloat(ethers.utils.formatUnits(fetchedData.cultBalanceRaw, fetchedData.cultDecimals)); typeLine(`[$CULT: ${cultBalance.toFixed(2)}]`); if (cultBalance > 0) { stateToUpdate.cultFound = true; document.body.classList.add('cult-3d-handshake'); const pts = Math.min(Math.floor(cultBalance / 150000) * 1, 50); if(pts > 0){ stateToUpdate.totalScore += pts; stateToUpdate.scoreDetails.push({text:`$CULT: +${pts} pts`, highlight:false}); typeLine("[CULT Points Added!]"); } } else { stateToUpdate.cultFound = false; document.body.classList.remove('cult-3d-handshake'); } } else { typeLine("[⚠️ CULT Check Failed or Decimals Missing]"); } await delay(100);
    const nftBalances = {}; if (fetchedData.nftBalances) { fetchedData.nftBalances.forEach(r => { if (r.status === 'fulfilled' && r.value) { const { name, balance, config } = r.value; if(config && ethers.utils.isAddress(config.address)) nftBalances[config.address.toLowerCase()] = { name, balance, config }; } }); } console.log("DEBUG: Processed NFT Balances:", nftBalances);
    const getBalance = (addr) => nftBalances[addr?.toLowerCase()]?.balance || ethers.BigNumber.from(0); const holdsNft = (addr) => getBalance(addr).gt(0);
    let basiliskPointsAwarded = false; if (holdsNft(DRIFTERS_ADDRESS)) { typeLine("Drifters Collection Detected!", true); await delay(200); if (!basiliskPointsAwarded) { stateToUpdate.totalScore += 25; stateToUpdate.scoreDetails.push({ text: "Roko's Basilisk: +25 pts", highlight: true }); basiliskPointsAwarded = true; } typeLine("Not-A-Eye: Sees You (Basilisk.exe)", true); await delay(500); } if (holdsNft(WYATT_NFT_ADDRESS)) { typeLine("Wyatt NFT Detected!", true); await delay(200); if (!basiliskPointsAwarded) { stateToUpdate.totalScore += 25; stateToUpdate.scoreDetails.push({ text: "Roko's Basilisk: +25 pts", highlight: true }); basiliskPointsAwarded = true; } typeLine("Not-A-Eye: Sees You (Basilisk.exe)", true); await delay(500); } if (holdsNft(APES_ON_APES_ADDRESS)) { typeLine("... ... ...", false); await delay(300); typeLine("Ape On Ape detected .. ..", false); await delay(300); typeLine("LFG", false); await delay(200); typeLine("LFG", false); await delay(400); typeLine("LLLLLLL FFFFFF GGGGGG   #InDankWeTrust", false); await delay(500); } if (holdsNft(BAYC_SHADOW_ADDRESS) || holdsNft(MAYC_SHADOW_ADDRESS)) { console.log("DEBUG: Yuga Asset! Heist.exe..."); await delay(800); typeLine("!! ALERT !! Yuga Asset!", true); await delay(500); typeLine("Initiating Heist.exe...", true); await delay(900); typeLine("Bypassing firewall...", true); await delay(500); typeLine("Heist active.", true); await delay(500); typeLine("Pizza...", true); await delay(350); typeLine("SHADOW. ABORT!", true); await delay(500); typeLine("No heist.", true); await delay(300); typeLine("WoMp wOmP.", true); await delay(400); }

    typeLine("[4/5 Determining Pet...]");
    stateToUpdate.determinedPet = null;
    const baycCount = getBalance(BAYC_SHADOW_ADDRESS).toNumber(); const maycCount = getBalance(MAYC_SHADOW_ADDRESS).toNumber();
    const totalShadowsCount = baycCount + maycCount;
    console.log(`DEBUG Trigger Data: Cult=${cultBalance.toFixed(0)}, Shadows=${totalShadowsCount}`);

    // --- UPDATED Pet Trigger Priority Order ---
    // STAGE 1: Highest Priority - $CULT +/- Shadow combinations
    if (totalShadowsCount >= 1) { // Must hold at least one shadow for these CULT-based Apes/Invo/Visor
        if (cultBalance >= 3000000) {
            stateToUpdate.determinedPet = "Invo";
        } else if (cultBalance >= 1500000) { // Covers 1.5M to 2,999,999 CULT + Shadow
            stateToUpdate.determinedPet = "Ape (Cult)";
        } else if (cultBalance >= 500000) { // Covers 500k to 1,499,999 CULT + Shadow
            stateToUpdate.determinedPet = "Visor";
        }
        // If CULT < 500k but has shadows, they don't get Invo, Ape (Cult), or Visor from this block.
        // They might still get Ape (Red), Ape (Blue), or Blob below.
    } else { // No shadows held, check for Visor based on CULT only
        if (cultBalance >= 500000) {
            stateToUpdate.determinedPet = "Visor";
        }
    }

    // STAGE 2: Shadow NFT Count Triggers (if a pet wasn't determined by CULT+Shadow logic)
    if (!stateToUpdate.determinedPet) {
        if (totalShadowsCount >= 6) stateToUpdate.determinedPet = "Ape (Red)";
        else if (totalShadowsCount >= 1) stateToUpdate.determinedPet = "Ape (Blue)";
        // Blob is triggered if MAYC is held and no other Ape/Shadow-based pet was assigned above
        else if (holdsNft(MAYC_SHADOW_ADDRESS)) stateToUpdate.determinedPet = "Blob";
    }

    // STAGE 3: "Most Held from Primary NFT List" (if still no pet determined)
    if (!stateToUpdate.determinedPet) {
        let maxHeldCount = 0; let potentialPets = [];
        for (const name in ALL_NFTS_TO_CHECK) { const nftConfig = ALL_NFTS_TO_CHECK[name]; if (nftConfig.isPrimary && nftConfig.triggersPet && ethers.utils.isAddress(nftConfig.address)) { const balance = getBalance(nftConfig.address).toNumber(); if (balance > maxHeldCount) { maxHeldCount = balance; potentialPets = [nftConfig.triggersPet]; } else if (balance === maxHeldCount && maxHeldCount > 0) { potentialPets.push(nftConfig.triggersPet); } } }
        if (maxHeldCount > 0) { for (const name in ALL_NFTS_TO_CHECK) { const nftConfig = ALL_NFTS_TO_CHECK[name]; if (nftConfig.isPrimary && nftConfig.triggersPet && potentialPets.includes(nftConfig.triggersPet) && getBalance(nftConfig.address).toNumber() === maxHeldCount) { stateToUpdate.determinedPet = nftConfig.triggersPet; console.log(`DEBUG: Pet by 'Most Held' (${maxHeldCount}): ${stateToUpdate.determinedPet}`); break; } } }
    }

    // STAGE 4: Default Fallback
    if (!stateToUpdate.determinedPet) { stateToUpdate.determinedPet = "Crab"; console.log("DEBUG: Defaulting to Crab."); }
    else { console.log(`DEBUG: Final Pet Determined: ${stateToUpdate.determinedPet}`); }

    if (stateToUpdate.determinedPet === "Goblin") { console.log("DEBUG: Goblin determined, running gob spam"); await displayGoblinSpam(); }
    typeLine(`[Determined Pet: ${stateToUpdate.determinedPet}]`); await delay(150);

    typeLine("[5/5 Calculating Points...]");
    let primaryPointsAdded = 0; let secondaryPointsAdded = 0; let goblinPointsApplied = false;
    for(const name in ALL_NFTS_TO_CHECK) { const config = ALL_NFTS_TO_CHECK[name]; if (config && ethers.utils.isAddress(config.address)) { const balance = getBalance(config.address); if (balance.gt(0)) { const pointsToAdd = config.points || 0; if (pointsToAdd > 0) { if (config.triggersPet === "Goblin") { if (!goblinPointsApplied) { stateToUpdate.totalScore += pointsToAdd; stateToUpdate.scoreDetails.push({ text: `Goblin Affinity (Gobs/Minotaurs): +${pointsToAdd} pts`, highlight: true }); primaryPointsAdded += pointsToAdd; goblinPointsApplied = true; console.log(`DEBUG: Added ${pointsToAdd} pts for Goblin from ${name}`); } else { console.log(`DEBUG: Skipping duplicate Goblin pts for ${name}`); } } else { stateToUpdate.totalScore += pointsToAdd; stateToUpdate.scoreDetails.push({ text: `${name}: +${pointsToAdd} pts`, highlight: config.isPrimary || pointsToAdd >= 10 }); if (config.isPrimary) primaryPointsAdded += pointsToAdd; else secondaryPointsAdded += pointsToAdd; console.log(`DEBUG: Added ${pointsToAdd} pts for ${name}`); } } } } }
    console.log(`DEBUG: Points Complete. Primary Total: ${primaryPointsAdded}, Secondary Total: ${secondaryPointsAdded}`); await delay(150);
}
// ***** END OF Analysis Function *****