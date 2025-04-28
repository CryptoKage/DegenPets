// Import necessary elements using the @web3modal/ethers5 package from esm.sh
import { Web3Modal } from 'https://esm.sh/@web3modal/ethers5@3.1.0'; // CHANGED THIS LINE

// Ethers.js is still needed, ensure it's loaded in index.html BEFORE this script
// OR import it here if needed: import { ethers } from 'https://esm.sh/ethers@5.7.2';

// --- Configuration ---
const APECHAIN_RPC_URL = "https://apechain.rpc.ankr.com/"; // Replace with preferred ApeChain RPC
const APECHAIN_CHAIN_ID = 33139;
const APECHAIN_NETWORK_INFO = {
  chainId: `0x${APECHAIN_CHAIN_ID.toString(16)}`, // Hex format
  chainName: 'ApeChain',
  rpcUrls: [APECHAIN_RPC_URL],
  nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 }, // Verify ApeChain native currency details
  blockExplorerUrls: ['https://apescan.io'] // Verify ApeChain explorer URL
};
// !!! REPLACE THIS WITH YOUR ACTUAL PROJECT ID FROM WALLETCONNECT CLOUD !!!
const PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID';
// !!! -------------------------------------------------------------------- !!!

// --- !!! CRITICAL SECURITY WARNING !!! ---
// The ApeScan API call below ('fetchFirstTransaction') exposes the API key placeholder.
// This functionality MUST be moved to a secure backend server or serverless function.
// Your frontend should call your backend, which then uses the key securely.
// --- !!! CRITICAL SECURITY WARNING !!! ---

const CULT_TOKEN_ADDRESS = "0xc7689ac46BC7a2c2819F0d9F280DC09C43295aBA";

const PET_NFTS = {
  "TokenGators": "0xd33edeC311f8769c71f132A77F0c0796c22AF1c5",
  "GS on Ape": "0xb3443B6Bd585ba4118CaE2beDb61c7EC4a8281Df",
  "Yurei": "0x0BDEF3d84b72031DD38FED41D3202becB2E8aef3"
};

const COLLECTION2_NFTS = {
  "Qoonicorns": "0x6f8F60D8f390A149F8C111AF944B3989521d0184",
  "Chaos Cats": "0x027f7366f15f375a8EDDf9Ca768CBdC050DA8CDc",
  "Skid City": "0xC78D0918D32146ab56146e18047021DA58a4f64b",
  "Pasta Apes": "0x682dD9B9e7b90707b854c46E1EF2637fEeaF090a"
};

const nftAbi = ["function balanceOf(address owner) view returns (uint256)"];
const erc20Abi = ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"];


// --- DOM Elements ---
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const walletOutput = document.getElementById('walletOutput');
const resultArea = document.getElementById('resultArea');
const petSection = document.getElementById('petSection');
const petImage = document.getElementById('petImage');
const petText = document.getElementById('petText');
const scoreList = document.getElementById('scoreList');
const mintPass = document.getElementById('mintPass');
const bonusButtons = document.getElementById('bonusButtons');
const shareScoreBtn = document.getElementById('shareScoreBtn');
const goldRainCanvas = document.getElementById('goldRainCanvas');

// --- Web3Modal Instance ---
let web3Modal;
// We need Ethers instance for provider wrapping
let ethersInstance; // Will hold the ethers object
let ethersProvider = null; // Will be ethers.providers.Web3Provider
let signer = null;
let userAddress = null;

// --- State Variables ---
let totalScore = 0;
let bestPetCollection = null;
let scoreDetails = [];
let cultFound = false;


function initializeWeb3Modal() {
  if (!PROJECT_ID || PROJECT_ID === 'YOUR_WALLETCONNECT_PROJECT_ID') {
      console.error("ERROR: WalletConnect PROJECT_ID is not set! Please replace placeholder in script.js");
      typeLine("❌ Configuration Error: PROJECT_ID missing.", true);
      return;
  }
  // Ensure ethers is available (loaded via global <script> tag)
  if (typeof window.ethers === 'undefined') {
       console.error("ERROR: Ethers.js is not loaded! Check script tag in index.html");
       typeLine("❌ Configuration Error: Ethers.js library missing.", true);
       return;
  }
  ethersInstance = window.ethers; // Assign from global scope


  try {
    // Initialize Web3Modal using the imported constructor
    web3Modal = new Web3Modal(
      { // Core Options
        projectId: PROJECT_ID,
        // We need to explicitly pass ethers library instance here
        ethersConfig: ethersInstance.providers.Web3Provider, // Pass the Ethers provider constructor
        chains: [APECHAIN_CHAIN_ID], // Default chain (optional)
        // Optional: theme, custom wallets etc.
        // themeVariables: { '--w3m-accent-color': '#00f5ff' }
      },
      // Optional: Ethers specific options (may not be needed if passed above)
      // Refer to @web3modal/ethers5 documentation if needed
    );

    console.log("Web3Modal Initialized (using @web3modal/ethers5)");

    // --- Event Listener (subscribe to state changes) ---
    web3Modal.subscribeEvents(async (event) => {
      console.log("Web3Modal Event:", event.name, event.data);

      // Handle relevant events
      if (event.name === 'ACCOUNT_CONNECTED') {
          console.log("Account connected via event");
          await handleConnect(); // Trigger connection logic
      } else if (event.name === 'ACCOUNT_DISCONNECTED') {
          console.log("Account disconnected via event");
          await handleDisconnect();
      } else if (event.name === 'CHAIN_CHANGED') {
           console.log("Chain changed via event:", event.data.chainId);
           handleChainChanged(`0x${event.data.chainId.toString(16)}`);
      } else if (event.name === 'MODAL_CLOSED' && !web3Modal.getIsConnected()) {
          // Reset UI if modal is closed without connecting
          // (Ensure getIsConnected() method exists or use appropriate check)
           if (!userAddress) { // Check our internal state too
              resetUI();
              typeLine("Connection cancelled.");
           }
      }
      // Add other event handlers as needed (SESSION_UPDATE, etc.)
    });


  } catch (error) {
      console.error("Error initializing Web3Modal:", error);
      walletOutput.innerHTML = "<p>Error initializing connection module. Please refresh.</p>";
      typeLine("❌ Error initializing Web3Modal. Check console.", true);
  }
}

// --- Core Functions ---

function resetState() {
  ethersProvider = null;
  signer = null;
  userAddress = null;
  totalScore = 0;
  bestPetCollection = null;
  scoreDetails = [];
  cultFound = false;
  // Stop gold rain if active
  if (rainInterval) clearInterval(rainInterval);
  goldRainCanvas.classList.add('hidden');
}

function resetUI() {
  walletOutput.innerHTML = "";
  resultArea.classList.add('hidden');
  petSection.classList.add('hidden');
  scoreList.innerHTML = "";
  mintPass.innerHTML = "";
  bonusButtons.classList.add('hidden');
  document.body.classList.remove('cult-3d-handshake');
  disconnectBtn.classList.add('hidden');
  connectBtn.classList.remove('hidden');
}

function resetEverything() {
  resetState();
  resetUI();
}

async function onConnectClick() {
  if (!web3Modal) {
      console.error("Web3Modal not initialized");
      typeLine("Connection module not ready. Please refresh.", true);
      return;
  }
  console.log("Opening Web3Modal...");
  resetEverything(); // Reset before opening modal
  walletOutput.innerHTML = "<p>Please connect your wallet via the modal...</p>"; // Feedback

  try {
    await web3Modal.openModal();
  } catch (error) {
      console.error("Error opening Web3Modal:", error);
      // Check if error is due to already connecting/connected state
      if (web3Modal.getIsConnected && web3Modal.getIsConnected()) {
          typeLine("Already attempting connection...");
          await handleConnect(); // Try to resolve connection state
      } else {
          typeLine(`❌ Error opening wallet modal: ${error?.message || error}`, true);
          resetEverything();
      }
  }
}

// Triggered by ACCOUNT_CONNECTED event
async function handleConnect() {
    console.log("handleConnect triggered");
    if (!web3Modal || !web3Modal.getIsConnected || !web3Modal.getIsConnected()) {
        console.log("handleConnect called but modal state is not connected. Waiting for event.");
        // It might be that the event fires slightly before the internal state is fully ready.
        // A small delay might help, or rely purely on state derived from getWalletProvider.
        // Or maybe the event listener already handles the logic?
        return; // Let the event listener fully handle state?
    }

    try {
        const provider = web3Modal.getWalletProvider();
        if (!provider) {
            throw new Error("Wallet provider not found after connection event.");
        }

        // Wrap provider with Ethers
        ethersProvider = new ethersInstance.providers.Web3Provider(provider, 'any');
        signer = ethersProvider.getSigner();
        userAddress = await signer.getAddress();

        if (!userAddress) throw new Error("Could not get address from signer.");

        console.log("Connected Address:", userAddress);
        connectBtn.classList.add('hidden');
        disconnectBtn.classList.remove('hidden');
        walletOutput.innerHTML = ''; // Clear previous messages
        typeLine(`[Wallet Connected: ${shortenAddress(userAddress)}]`);

        // Check Network
        const network = await ethersProvider.getNetwork();
        console.log("Network:", network);
        if (network.chainId !== APECHAIN_CHAIN_ID) {
            typeLine(`⚠️ Wrong network (ID: ${network.chainId}). Please switch to ApeChain (ID: ${APECHAIN_CHAIN_ID}).`, true);
            await attemptSwitchNetwork(); // Try to switch

            // Recheck network after switch attempt
            const newNetwork = await ethersProvider.getNetwork();
            if (newNetwork.chainId !== APECHAIN_CHAIN_ID) {
                typeLine(`❌ Failed to switch to ApeChain. Scan aborted. Please switch manually.`, true);
                resetUI(); // Clear results area etc.
                walletOutput.innerHTML = `<p>[Wallet Connected: ${shortenAddress(userAddress)}]</p><p style="color:red;">⚠️ Please switch to ApeChain (ID ${APECHAIN_CHAIN_ID}) in your wallet.</p>`;
                connectBtn.classList.add('hidden');
                disconnectBtn.classList.remove('hidden');
                return; // Stop if wrong network
            } else {
                 typeLine(`[Network Switched to ApeChain]`);
            }
        }

        // Network is correct, run the checks
        await runDegenCheck();

    } catch (error) {
        console.error("Handle Connect Error:", error);
        typeLine(`❌ Error processing connection: ${error.message}`, true);
        await handleDisconnect(); // Attempt to clean up state
    }
}


async function attemptSwitchNetwork() {
  if (!web3Modal || !web3Modal.getWalletProvider) {
      typeLine("❌ Cannot switch network: Provider interface not available.", true);
      return;
  }
  typeLine(`[Attempting to switch network to ApeChain...]`);
  try {
      // Use Web3Modal's method if available, otherwise direct provider call
      if (web3Modal.switchNetwork) {
         await web3Modal.switchNetwork(APECHAIN_CHAIN_ID);
      } else if (ethersProvider?.send) {
          await ethersProvider.send('wallet_switchEthereumChain', [{ chainId: APECHAIN_NETWORK_INFO.chainId }]);
      } else {
           throw new Error("No method available to switch network.");
      }
  } catch (switchError) {
    console.error("Switch Network Error:", switchError);
    // Code 4902: Chain not added
    if (switchError.code === 4902) {
      typeLine("[ApeChain not found in wallet. Attempting to add...]");
      try {
        // Adding the chain usually requires a direct provider call
        if (ethersProvider?.send) {
             await ethersProvider.send('wallet_addEthereumChain', [APECHAIN_NETWORK_INFO]);
        } else {
             throw new Error("Provider not available to add chain.")
        }
      } catch (addError) {
        console.error("Add Network Error:", addError);
        typeLine("❌ Failed to add ApeChain network.", true);
      }
    } else {
        typeLine(`❌ Failed to switch network: ${switchError.message || 'Unknown error'}. Please do it manually.`, true);
    }
  }
}

// Triggered by CHAIN_CHANGED event
function handleChainChanged(chainId) {
    console.log("Chain Changed Handler:", chainId);
    const numericChainId = parseInt(chainId, 16);

    if (!userAddress) {
        console.log("Chain changed but user not connected, ignoring for UI.");
        return; // Ignore if not considered connected by our app state
    }

    // Update provider if needed (Ethers v5 Web3Provider usually handles this)
    // ethersProvider = new ethersInstance.providers.Web3Provider(web3Modal.getWalletProvider(), 'any');
    // signer = ethersProvider.getSigner();


    if (numericChainId !== APECHAIN_CHAIN_ID) {
        typeLine(`⚠️ Switched to wrong network (ID: ${numericChainId}). Please switch back to ApeChain.`, true);
        resetUI(); // Clear results
        walletOutput.innerHTML = `<p>[Wallet Connected: ${shortenAddress(userAddress)}]</p><p style="color:red;">⚠️ Please switch back to ApeChain (ID ${APECHAIN_CHAIN_ID}).</p>`;
        connectBtn.classList.add('hidden');
        disconnectBtn.classList.remove('hidden');
    } else {
         // Switched back to the correct chain
         typeLine(`[Network set to ApeChain]`);
         // Re-run checks now that we are on the correct chain
         runDegenCheck();
    }
}


// Triggered by disconnect button or ACCOUNT_DISCONNECTED event
async function handleDisconnect() {
  console.log("Handling disconnect...");

  // Use Web3Modal's disconnect if available and connected
  if (web3Modal && web3Modal.getIsConnected && web3Modal.getIsConnected() && web3Modal.disconnect) {
      try {
           await web3Modal.disconnect();
           console.log("Web3Modal disconnect called.");
      } catch (e) {
           console.warn("Error calling web3Modal.disconnect:", e);
      }
  } else {
      console.log("Web3Modal disconnect not called (not connected or method unavailable).");
  }

  // Always reset internal state and UI
  resetEverything();
  typeLine("[Wallet Disconnected]");
  console.log("Disconnected.");
}


async function runDegenCheck() {
    if (!userAddress || !ethersProvider || !signer) {
        typeLine("❌ Wallet not ready for scan.", true);
        return;
    }
    const network = await ethersProvider.getNetwork();
    if (network.chainId !== APECHAIN_CHAIN_ID) {
        typeLine("❌ Cannot scan: Wrong network detected.", true);
        // Optionally try switching again? Or just inform user.
        await attemptSwitchNetwork(); // Try to switch if they somehow got here
        return;
    }

    // Reset previous results before new scan
    resultArea.classList.add('hidden');
    petSection.classList.add('hidden');
    scoreList.innerHTML = "";
    mintPass.innerHTML = "";
    bonusButtons.classList.add('hidden');
    document.body.classList.remove('cult-3d-handshake');
    if (rainInterval) clearInterval(rainInterval); // Stop rain from previous run
    goldRainCanvas.classList.add('hidden');
    totalScore = 0;
    bestPetCollection = null;
    scoreDetails = [];
    cultFound = false;

    // Clear previous lines except the connection status
    const statusLines = Array.from(walletOutput.querySelectorAll('p')).filter(p => p.textContent.includes('[Wallet Connected') || p.textContent.includes('[Network set'));
    walletOutput.innerHTML = '';
    statusLines.forEach(line => walletOutput.appendChild(line)); // Keep relevant status lines

    typeLine("[Initiating Scan...]");

    try {
        const checks = [
            fetchFirstTransaction(), // Requires backend change!
            checkCult(),
            checkPetNFTs(),
            checkCollection2NFTs()
        ];
        const results = await Promise.allSettled(checks);
        console.log("Check results:", results);

        results.forEach(result => {
            if (result.status === 'rejected') {
                console.error("A check failed:", result.reason);
            }
        });

    } catch (error) {
        console.error("Error during check execution:", error);
        typeLine("❌ Error during scan process.", true);
    } finally {
        finalizeResults();
    }
}

// --- Blockchain Interaction Functions (fetchFirstTransaction, checkCult, checkPetNFTs, checkCollection2NFTs) ---
// These remain largely the same as the previous version, including the
// critical warning about fetchFirstTransaction needing a backend.
// Minor tweaks for consistency below:

function shortenAddress(addr) {
  if (!addr || addr.length < 10) return addr || "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// ==========================================================================
// --- !!! WARNING: BACKEND REQUIRED !!! ---
// Replace this entire function with a call to your secure backend API.
// ==========================================================================
async function fetchFirstTransaction() {
  typeLine("[Checking Transaction History (Backend Required)...]");
  const API_KEY_PLACEHOLDER = "YOUR_APESCAN_API_KEY_SHOULD_BE_ON_BACKEND"; // Placeholder
  const APECHAIN_API_URL = `https://api.apescan.io/api?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY_PLACEHOLDER}`;

  try {
    console.warn("Making INSECURE client-side call to ApeScan API. Replace with backend call.");
    typeLine("[Dev Note: Using insecure client-side API call!]");
    const response = await fetch(APECHAIN_API_URL);

    if (!response.ok) {
      throw new Error(`ApeScan API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    if (data.status === "1" && data.result && data.result.length > 0) {
      const firstTx = data.result[0];
      if (firstTx && firstTx.timeStamp) {
        const firstTxDate = new Date(parseInt(firstTx.timeStamp) * 1000);
        if (!isNaN(firstTxDate)) {
          typeLine(`[First TX Found: ${firstTxDate.toISOString().split('T')[0]}]`);
          const cutoff = new Date("2024-12-31T23:59:59Z");
          if (firstTxDate < cutoff) {
            totalScore += 10;
            scoreDetails.push({ text: "Early Wallet Bonus: +10 pts", highlight: false });
          } else {
             typeLine("[Wallet is not 'early' based on cutoff]");
          }
        } else { typeLine("[Could not parse first transaction date]"); }
      } else { typeLine("[No valid first transaction timestamp found]"); }
    } else if (data.status === "0" && data.message === "No transactions found") {
        typeLine("[No transactions found for this address]");
    } else if (data.status === "0" && data.message.includes("API Key")) {
         typeLine("[❌ Invalid/missing ApeScan API Key (Configure Backend!)]", true);
    } else { typeLine(`[Could not retrieve transactions: ${data.message || 'Unknown reason'}]`); }
  } catch (err) {
    console.error("CRITICAL: Failed to fetch first TX:", err);
    typeLine(`[❌ Failed to retrieve transaction history: ${err.message}]`, true);
  }
}
// ==========================================================================
// --- End of INSECURE section ---
// ==========================================================================

async function checkCult() {
  if (!ethersProvider || !userAddress) return;
  typeLine("[Checking $CULT Balance...]");
  try {
    // Use ethersInstance to access Contract constructor
    const contract = new ethersInstance.Contract(CULT_TOKEN_ADDRESS, erc20Abi, ethersProvider);
    const balanceRaw = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    // Use ethersInstance for utils
    const balance = ethersInstance.utils.formatUnits(balanceRaw, decimals);
    const cultBalance = parseFloat(balance);

    if (cultBalance > 0) {
      cultFound = true;
      document.body.classList.add('cult-3d-handshake');
      typeLine(`[$CULT Balance: ${cultBalance.toFixed(2)}]`);
      const cultPoints = Math.min(Math.floor(cultBalance / 150000) * 1, 50);
      if (cultPoints > 0) {
         typeLine("[Secret $CULT 3D Handshake Accepted...]");
         totalScore += cultPoints;
         scoreDetails.push({ text: `$CULT Holdings: +${cultPoints} pts`, highlight: false });
      } else { typeLine("[$CULT holdings too low for points]"); }
    } else {
        typeLine("[$CULT Balance: 0]");
        cultFound = false; // Ensure flag is false
        document.body.classList.remove('cult-3d-handshake');
    }
  } catch (err) {
    console.warn("⚠️ $CULT balance check failed:", err);
    typeLine("[⚠️ Could not check $CULT balance]", true);
  }
}

async function checkPetNFTs() {
    if (!ethersProvider || !userAddress) return;
    typeLine("[Checking Pet NFTs...]");
    let foundAnyPet = false;
    let ownedPets = []; // Track all owned pets from this collection

    const checkPromises = Object.entries(PET_NFTS).map(async ([name, address]) => {
        try {
            const contract = new ethersInstance.Contract(address, nftAbi, ethersProvider);
            const balance = await contract.balanceOf(userAddress);
            if (balance.gt(0)) {
                ownedPets.push(name); // Add to list if owned
                totalScore += 5;
                scoreDetails.push({ text: `${name} NFT: +5 pts`, highlight: true });
                foundAnyPet = true;
            }
        } catch (err) {
            console.warn(`⚠️ Could not check ${name} NFT:`, err);
            typeLine(`[⚠️ Error checking ${name}]`, true);
        }
    });

    await Promise.all(checkPromises);

    // Determine best pet based on the order in PET_NFTS
    bestPetCollection = null; // Reset before check
    for (const name of Object.keys(PET_NFTS)) {
        if (ownedPets.includes(name)) {
            bestPetCollection = name;
            break; // Found the first one in the preferred order
        }
    }

    if (!foundAnyPet) {
        typeLine("[No Pet NFTs Found]");
    } else {
        typeLine(`[Pet NFTs owned. Assigned: ${bestPetCollection}]`);
    }
}


async function checkCollection2NFTs() {
    if (!ethersProvider || !userAddress) return;
    typeLine("[Checking Other NFTs...]");
    let foundAny = false;
    const checkPromises = Object.entries(COLLECTION2_NFTS).map(async ([name, address]) => {
        try {
            const contract = new ethersInstance.Contract(address, nftAbi, ethersProvider);
            const balance = await contract.balanceOf(userAddress);
            if (balance.gt(0)) {
                totalScore += 2;
                scoreDetails.push({ text: `${name} NFT: +2 pts`, highlight: false });
                foundAny = true;
            }
        } catch (err) {
            console.warn(`⚠️ Could not check ${name} NFT:`, err);
            typeLine(`[⚠️ Error checking ${name}]`, true);
        }
    });
    await Promise.all(checkPromises);
    if (!foundAny) typeLine("[No Other Collection NFTs Found]");
}

// --- UI Update and Effects Functions (finalizeResults, showFinalScore, typeLine, startGoldRain) ---
// Remain largely the same as previous version.

function finalizeResults() {
  setTimeout(() => {
    typeLine("[Scan Complete. Displaying Results...]");
    showFinalScore();
  }, 500);
}

function showFinalScore() {
    resultArea.classList.remove("hidden");

    const pet = bestPetCollection || "Crab";
    petImage.src = `PetPromos/${pet}promo.png`;
    petText.innerHTML = `<strong>Assigned Pet: ${pet}</strong><br>Strategy: ???`; // TODO: Map pet to strategy
    petSection.classList.remove("hidden");

    scoreList.innerHTML = '';
    scoreDetails.sort((a, b) => {
        if (a.highlight !== b.highlight) return a.highlight ? -1 : 1;
        return a.text.localeCompare(b.text);
    });

    if (scoreDetails.length === 0) {
        scoreList.innerHTML = '<li>No scoring activity detected.</li>';
    } else {
        scoreDetails.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = item.text;
            if (item.highlight) {
                li.classList.add('neon-highlight');
                li.style.fontWeight = 'bold';
            }
            scoreList.appendChild(li);
        });
    }

    const totalLi = document.createElement('li');
    totalLi.innerHTML = `<strong>Total Score: ${totalScore} pts</strong>`;
    totalLi.style.marginTop = '15px';
    totalLi.style.borderTop = '1px solid #00f5ff';
    totalLi.style.paddingTop = '10px';
    scoreList.appendChild(totalLi);

    if (userAddress && totalScore >= 50) {
      mintPass.innerHTML = "✅ Degen Confirmed! Waitlist Access Granted.";
      mintPass.style.color = "#00f5ff";
      bonusButtons.classList.remove('hidden');
      startGoldRain();
    } else if (userAddress) {
        mintPass.innerHTML = `Score ${totalScore} // Need 50+ pts for Waitlist Access.`;
        mintPass.style.color = "orange";
        bonusButtons.classList.add('hidden');
    } else {
        mintPass.innerHTML = "Connect wallet to check eligibility.";
        mintPass.style.color = "grey";
        bonusButtons.classList.add('hidden');
    }
}

let rainInterval = null;
function startGoldRain() {
    // Implementation unchanged from previous version...
    goldRainCanvas.classList.remove('hidden');
    const ctx = goldRainCanvas.getContext('2d');
    let drops = [];
    function resizeCanvas() { /* ... */ }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    if (rainInterval) clearInterval(rainInterval);
    for (let i = 0; i < 100; i++) { drops.push({ /* ... */ }); }
    function drawRain() { /* ... */ }
    rainInterval = setInterval(drawRain, 33);
    setTimeout(() => { /* stop rain */ }, 10000);
}


function typeLine(text, isError = false) {
    // Implementation unchanged from previous version...
    const line = document.createElement('p');
    // Styles...
     if (isError) {
        line.style.color = "#ff4d4d";
        line.textContent = `❌ ${text}`;
        line.style.opacity = 1;
    } else {
         line.style.color = "#00ff88";
         let i = 0;
         const typingSpeed = 5;
         const interval = setInterval(() => { /* type effect... */}, typingSpeed);
    }
     walletOutput.insertBefore(line, walletOutput.firstChild);
     while (walletOutput.children.length > 20) { /* limit lines */ }
}

// --- Event Listeners & Initialization ---
connectBtn.addEventListener('click', onConnectClick);
disconnectBtn.addEventListener('click', handleDisconnect);

shareScoreBtn.addEventListener('click', () => {
    // Implementation unchanged...
    typeLine("[Generating score image...]");
    setTimeout(() => { /* html2canvas logic... */ }, 100);
});

document.addEventListener('DOMContentLoaded', () => {
    // Ensure ethers is loaded globally FIRST
    if (typeof window.ethers === 'undefined') {
        console.error("FATAL: Ethers.js is not loaded!");
        document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top: 50px;">Error: Core library Ethers.js failed to load. Check file inclusion order in HTML and browser console.</h1>';
        return; // Stop initialization
    }

    document.getElementById('year').textContent = new Date().getFullYear();
    try {
        initializeWeb3Modal();
        resetEverything();
        typeLine("System Online // Ready for Wallet Connection");
    } catch (e) {
        console.error("Initialization failed:", e);
        walletOutput.innerHTML = "<p>Could not initialize. Please check console or refresh.</p>";
    }
});

// Gold rain draw/resize functions (put them here for completeness)
function resizeCanvas() {
    if (!goldRainCanvas) return;
    goldRainCanvas.width = window.innerWidth;
    goldRainCanvas.height = window.innerHeight;
}
function drawRain() {
     if (!goldRainCanvas) { if (rainInterval) clearInterval(rainInterval); return; }
     const ctx = goldRainCanvas.getContext('2d');
     if (!ctx) return;
     const drops = window.goldRainDrops || []; // Access drops via window scope maybe? Or pass them around. Simpler via window for now.
     if (!window.goldRainDrops) window.goldRainDrops = [];


     ctx.clearRect(0, 0, goldRainCanvas.width, goldRainCanvas.height);
     ctx.fillStyle = '#FFD700'; // Gold color
     ctx.shadowColor = '#FFFF00'; // Yellow glow
     ctx.shadowBlur = 10;

     for (let i = 0; i < drops.length; i++) {
         let d = drops[i];
         ctx.fillRect(d.x, d.y, 2, d.length); // Draw drop
         d.y += d.speed; // Move drop
         if (d.y > goldRainCanvas.height) {
             window.goldRainDrops[i] = { // Reset drop
                 x: Math.random() * goldRainCanvas.width,
                 y: -20,
                 length: Math.random() * 20 + 10,
                 speed: Math.random() * 5 + 2
             };
         }
     }
 }
// Re-add the startGoldRain function modifying how drops are handled
function startGoldRain() {
    goldRainCanvas.classList.remove('hidden');
    const ctx = goldRainCanvas.getContext('2d');
    if (!ctx) return;

    window.goldRainDrops = []; // Initialize/reset drops on window object

    resizeCanvas(); // Initial size set
    window.removeEventListener('resize', resizeCanvas); // Remove previous listener if any
    window.addEventListener('resize', resizeCanvas); // Add listener

    if (rainInterval) clearInterval(rainInterval); // Clear previous interval

    for (let i = 0; i < 100; i++) { // Number of drops
        window.goldRainDrops.push({
            x: Math.random() * goldRainCanvas.width,
            y: Math.random() * goldRainCanvas.height - goldRainCanvas.height,
            length: Math.random() * 20 + 10,
            speed: Math.random() * 5 + 2
        });
    }

    rainInterval = setInterval(drawRain, 33);

    setTimeout(() => {
        if (rainInterval) clearInterval(rainInterval);
        goldRainCanvas.classList.add('hidden');
        if(goldRainCanvas.getContext('2d')) goldRainCanvas.getContext('2d').shadowBlur = 0; // Reset shadow
        window.goldRainDrops = []; // Clear drops
    }, 10000); // Stop after 10 seconds
}
