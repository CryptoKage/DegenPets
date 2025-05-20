// webapp/src/uiHelpers.js
import { PET_DATA } from './petData.js'; // PET_DATA is needed by showFinalScore

// --- DOM Element Getters (or pass elements as args) ---
// It's often cleaner to get elements once in the main script and pass them,
// but for simplicity here, some might be re-queried if not passed.
// Consider passing all DOM elements needed by showFinalScore as parameters.

export function shortenAddress(addr) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export function typeLine(text, isError = false) {
    // IMPORTANT: This function needs 'walletOutput' to be passed or globally accessible
    // For now, let's assume it's globally accessible or we'll pass it from checker.js
    const walletOutput = document.getElementById('walletOutput'); // Re-query or pass
    console.log(`DEBUG: typeLine: "${text}"`);
    if (!walletOutput) { console.warn("typeLine: walletOutput element not found!"); return; }
    const line = document.createElement('p');
    line.style.cssText = "margin:0; font-family:'Roboto Mono',monospace; font-size:0.9em; opacity:0; word-break:break-word;";
    if (isError) {
        line.style.color = "#ff4d4d"; line.textContent = `❌ ${text}`; line.style.opacity = 1;
    } else {
        line.style.color = "#00ff88"; line.textContent = ""; let i = 0; const interval = setInterval(() => { if (!line.parentNode) { clearInterval(interval); return; } line.style.opacity = 1; line.textContent = text.slice(0, i++) + "█"; if (i > text.length) { clearInterval(interval); if (line) line.textContent = text; } }, 35);
    }
    walletOutput.insertBefore(line, walletOutput.firstChild);
    while (walletOutput.children.length > 25) { if (walletOutput.lastChild) walletOutput.removeChild(walletOutput.lastChild); else break; }
}

let rainIntervalUiHelper = null; // Renamed to avoid conflict if main.js has one
let goldRainDropsUiHelper = []; // Renamed

export function resizeCanvas() {
    const goldRainCanvas = document.getElementById('goldRainCanvas'); // Re-query or pass
    if (!goldRainCanvas) return; goldRainCanvas.width = window.innerWidth; goldRainCanvas.height = window.innerHeight;
}

export function drawRain() {
    const goldRainCanvas = document.getElementById('goldRainCanvas'); // Re-query or pass
    if (!goldRainCanvas || !goldRainDropsUiHelper) { if (rainIntervalUiHelper) clearInterval(rainIntervalUiHelper); return; }
    const ctx = goldRainCanvas.getContext('2d'); const drops = goldRainDropsUiHelper;
    if (!ctx || !drops || drops.length === 0) return; ctx.clearRect(0, 0, goldRainCanvas.width, goldRainCanvas.height); ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFFF00'; ctx.shadowBlur = 10;
    for (let i = 0; i < drops.length; i++) { let d = drops[i]; if (!d) continue; ctx.fillRect(d.x, d.y, 2, d.length); d.y += d.speed; if (d.y > goldRainCanvas.height) { if (goldRainDropsUiHelper[i]) goldRainDropsUiHelper[i] = { x: Math.random() * goldRainCanvas.width, y: -20, length: Math.random() * 20 + 10, speed: Math.random() * 5 + 2 }; } }
}

export function startGoldRain() {
    const goldRainCanvas = document.getElementById('goldRainCanvas'); // Re-query or pass
    if (!goldRainCanvas) return; const ctx = goldRainCanvas.getContext('2d'); if (!ctx) return;
    console.log("Starting gold rain."); goldRainCanvas.classList.remove('hidden'); goldRainDropsUiHelper = []; resizeCanvas();
    window.removeEventListener('resize', resizeCanvas); window.addEventListener('resize', resizeCanvas);
    if (rainIntervalUiHelper) clearInterval(rainIntervalUiHelper);
    for (let i = 0; i < 100; i++) goldRainDropsUiHelper.push({ x: Math.random() * goldRainCanvas.width, y: Math.random() * goldRainCanvas.height - goldRainCanvas.height, length: Math.random() * 20 + 10, speed: Math.random() * 5 + 2 });
    rainIntervalUiHelper = setInterval(drawRain, 33);
    setTimeout(() => { console.log("Stopping gold rain."); if (rainIntervalUiHelper) clearInterval(rainIntervalUiHelper); rainIntervalUiHelper = null; if (goldRainCanvas) goldRainCanvas.classList.add('hidden'); if (ctx) ctx.shadowBlur = 0; goldRainDropsUiHelper = []; window.removeEventListener('resize', resizeCanvas); }, 10000);
}

export function finalizeResults(addressChecked, totalScore, determinedPet, isCheckingConnectedWallet, scannedAddress, showFinalScoreFunc) {
    // Pass state to showFinalScoreFunc
    console.log(`Finalizing for ${addressChecked}. Score: ${totalScore}`);
    setTimeout(() => {
        typeLine("[Scan Complete]");
        showFinalScoreFunc(addressChecked, totalScore, determinedPet, isCheckingConnectedWallet, scannedAddress);
    }, 300);
}

// showFinalScore now takes necessary DOM elements and state as parameters
export function showFinalScore(addressChecked, currentTotalScore, currentDeterminedPet, currentIsCheckingConnectedWallet, currentScannedAddress, currentScoreDetails,
    { resultArea, petSection, petImage, petText, scoreList, mintPass, bonusButtons, scannedWalletInfo, userAddressFromChecker }
) {
    console.log(`Displaying results for ${addressChecked}. Pet: ${currentDeterminedPet}. Score: ${currentTotalScore}`);
    if (!resultArea || !petSection || !petImage || !petText || !scoreList || !mintPass || !bonusButtons || !scannedWalletInfo) {
        console.error("showFinalScore: One or more DOM elements missing!");
        return;
        resultArea.classList.remove('hidden');
    }

    resultArea.classList.remove("hidden");
    const petKey = currentDeterminedPet || "Crab";
    const petData = PET_DATA[petKey];

    if (!petData) { console.error(`Data missing for pet: ${petKey}`); petText.innerHTML = `<strong>Error! Pet data missing.</strong>`; petImage.src = ''; }
    else { const imgName = petKey.replace(/[\s()]/g, ''); petImage.src = `/PetPromos/${imgName}promo.png`; petImage.alt = `${petData.name} Pet Image`; petText.innerHTML = `<strong>Pet: ${petData.name}</strong><br>Strategy: ${petData.strategyName}<br><em>${petData.description || ''}</em><br><small>Params: ${petData.params || ''}</small>`; console.log(`DEBUG: Set pet img src: ${petImage.src}`); }
    petSection.classList.remove("hidden");

    scoreList.innerHTML = '';
    currentScoreDetails.sort((a, b) => (a.highlight === b.highlight) ? a.text.localeCompare(b.text) : a.highlight ? -1 : 1);
    if (currentScoreDetails.length === 0) { scoreList.innerHTML = '<li>No specific scoring actions.</li>'; }
    else { currentScoreDetails.forEach(item => { const li = document.createElement('li'); li.innerHTML = item.text; if (item.highlight) li.classList.add('neon-highlight'); scoreList.appendChild(li); }); }
    const totalLi = document.createElement('li'); totalLi.innerHTML = `<strong>Total Score: ${currentTotalScore} pts</strong>`; totalLi.style.cssText = 'margin-top:15px; border-top:1px solid #00f5ff; padding-top:10px;'; scoreList.appendChild(totalLi);

    if (!currentIsCheckingConnectedWallet && currentScannedAddress) { scannedWalletInfo.textContent = `Showing results for: ${shortenAddress(currentScannedAddress)}`; scannedWalletInfo.classList.remove('hidden'); }
    else { scannedWalletInfo.classList.add('hidden'); }

    if (currentIsCheckingConnectedWallet && userAddressFromChecker && userAddressFromChecker.toLowerCase() === addressChecked?.toLowerCase()) { console.log(`DEBUG: Checking eligibility. Score: ${currentTotalScore}`); if (currentTotalScore >= 50) { mintPass.innerHTML = "✅ Apegen Confirmed! Score Mintable."; mintPass.style.color = "#00f5ff"; bonusButtons.classList.remove('hidden'); startGoldRain(); } else { mintPass.innerHTML = `Score ${currentTotalScore} // Need 50+ pts for Presale Access.`; mintPass.style.color = "orange"; bonusButtons.classList.add('hidden'); } }
    else { console.log("DEBUG: Hiding bonus buttons."); mintPass.innerHTML = `Scan complete for ${shortenAddress(addressChecked)}. Connect wallet to check eligibility.`; mintPass.style.color = "grey"; bonusButtons.classList.add('hidden'); }
}


export function resetUI(clearOutput = true, { walletOutput, scoreList, mintPass, scannedWalletInfo, resultArea, petSection, bonusButtons, disconnectBtn, connectBtn, checkAddressBtn, walletInput }) {
    console.log("Resetting UI.");
    if (clearOutput && walletOutput) walletOutput.innerHTML = "";
    if (scoreList) scoreList.innerHTML = "";
    if (mintPass) mintPass.innerHTML = "";
    if (scannedWalletInfo) { scannedWalletInfo.textContent = ""; scannedWalletInfo.classList.add('hidden'); }
    const walletInputSection = document.querySelector('.wallet-input-section'); // Get the section
    if (walletInputSection) walletInputSection.classList.add('hidden');
    if (resultArea) resultArea.classList.add('hidden');
    if (petSection) petSection.classList.add('hidden');
    if (bonusButtons) bonusButtons.classList.add('hidden');
    if (disconnectBtn) disconnectBtn.classList.add('hidden');
    if (connectBtn) { connectBtn.classList.remove('hidden'); connectBtn.disabled = false; }
    if (checkAddressBtn) checkAddressBtn.disabled = false;
    if (walletInput) walletInput.disabled = false;
}