// Import necessary elements from Web3Modal using esm.sh CDN
import { Web3Modal } from 'https://esm.sh/@web3modal/standalone@3.1.0';
// Note: We might need the EthereumProvider separately if standalone doesn't bundle it sufficiently
// Let's try without explicitly importing EthereumProvider first, as Web3Modal might handle it.
// If connection issues arise, we might need to add:
// import { EthereumProvider } from 'https://esm.sh/@walletconnect/ethereum-provider@2.11.0';

// Ethers.js is still needed, ensure it's loaded in index.html BEFORE this script
// Or import it here as well if moving entirely to module imports:
// import { ethers } from 'https://esm.sh/ethers@5.7.2'; // Example if loading ethers as module

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
const PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID'; // Get this from https://cloud.walletconnect.com/ - REPLACE THIS

// --- !!! CRITICAL SECURITY WARNING !!! ---
// const API_KEY = "YOUR_APESCAN_API_KEY"; // DO NOT HARDCODE YOUR API KEY HERE!
// The ApeScan API call below ('fetchFirstTransaction') exposes this key.
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
      console.error("ERROR: WalletConnect PROJECT_ID is not set!");
      typeLine("❌ Configuration Error: PROJECT_ID missing.", true);
      return;
  }
  try {
    web3Modal = new Web3Modal({
        projectId: PROJECT_ID,
        standaloneChains: [`eip155:${APECHAIN_CHAIN_ID}`], // Mark ApeChain as standalone
        // Optional: Add theme variables, custom wallets etc.
        // themeVariables: { '--w3m-accent-color': '#00f5ff' } // Example theme color
    });

    console.log("Web3Modal Initialized");

    // --- Event Listeners (from Web3Modal) ---
    web3Modal.subscribeModal(newState => {
        console.log("Modal State Change:", newState);
        // If modal closes and we are not connected, reset UI potentially
        if (!newState.open && !userAddress) {
            // resetUI(); // Optionally reset if modal is closed without connecting
        }
    });

    // Subscribe to connection events (address, chainId, isConnected)
    // This is a more modern way Web3Modal v3 handles state
    web3Modal.subscribeProvider(async ({ provider, address, chainId, isConnected }) => {
        console.log("Provider State Change:", { address, chainId, isConnected });
        if (isConnected) {
            if (address && address !== userAddress) {
                // New connection or account change
                ethersProvider = new ethers.providers.Web3Provider(provider, 'any');
                handleConnect(); // Use the new provider details
            } else if (chainId && chainId !== APECHAIN_CHAIN_ID) {
                // Chain changed while connected
                handleChainChanged(`0x${chainId.toString(16)}`);
            } else if (address && chainId === APECHAIN_CHAIN_ID && !signer) {
                 // Re-connected or initial connect after state clear
                 ethersProvider = new ethers.providers.Web3Provider(provider, 'any');
                 handleConnect();
            }
        } else if (!isConnected && userAddress) {
            // Was connected, now disconnected
            handleDisconnect();
        } else if (!isConnected && !userAddress) {
           // Initial state or disconnected fully
           resetEverything();
        }
    });


  } catch (error) {
      console.error("Error initializing Web3Modal:", error);
      walletOutput.innerHTML = "<p>Error initializing connection module. Please refresh.</p>";
      typeLine("❌ Error initializing Web3Modal. Check console.", true);
  }
}

// --- Core Functions ---

function resetState() {
  // Don't nullify ethersProvider if Web3Modal manages it persistently
  // ethersProvider = null;
  signer = null;
  userAddress = null;
  totalScore = 0;
  bestPetCollection = null;
  scoreDetails = [];
  cultFound = false;
}

function resetUI() {
  walletOutput.innerHTML = "";
  resultArea.classList.add('hidden');
  petSection.classList.add('hidden');
  scoreList.innerHTML = "";
  mintPass.innerHTML = "";
  bonusButtons.classList.add('hidden');
  document.body.classList.remove('cult-3d-handshake');
  goldRainCanvas.classList.add('hidden');
  disconnectBtn.classList.add('hidden');
  connectBtn.classList.remove('hidden');
}

function resetEverything() {
  resetState();
  resetUI();
}

async function onConnectClick() { // Renamed to avoid conflict with internal connect logic
  if (!web3Modal) {
      console.error("Web3Modal not initialized");
      typeLine("Connection module not ready. Please refresh.", true);
      return;
  }
  console.log("Opening Web3Modal...");
  resetEverything(); // Reset before opening modal
  walletOutput.innerHTML = "<p>Please connect your wallet via the modal...</p>"; // Feedback

  try {
    // This just opens the modal. Connection is handled by subscribeProvider callback.
    await web3Modal.openModal();
  } catch (error) {
      console.error("Error opening Web3Modal:", error);
      typeLine(`❌ Error opening wallet modal: ${error.message}`, true);
      resetEverything();
  }
}

// Triggered by web3Modal.subscribeProvider when connection happens
async function handleConnect() {
    if (!ethersProvider) {
        console.error("Ethers provider not set in handleConnect");
        typeLine("❌ Connection state error. Please disconnect and reconnect.", true);
        return;
    }

    try {
        const network = await ethersProvider.getNetwork();
        console.log("Network:", network);

        // Get signer and address immediately
        signer = ethersProvider.getSigner();
        userAddress = await signer.getAddress();
        if (!userAddress) throw new Error("Could not get address from signer.");

        console.log("Connected Address:", userAddress);
        connectBtn.classList.add('hidden');
        disconnectBtn.classList.remove('hidden');
        walletOutput.innerHTML = ''; // Clear previous messages like "Please connect..."
        typeLine(`[Wallet Connected: ${shortenAddress(userAddress)}]`);


        if (network.chainId !== APECHAIN_CHAIN_ID) {
            typeLine(`⚠️ Wrong network (ID: ${network.chainId}). Please switch to ApeChain (ID: ${APECHAIN_CHAIN_ID}).`, true);
            await attemptSwitchNetwork(); // Try to switch
            // Re-check network after switch attempt - handled by chainChanged event? Or check here?
            const newNetwork = await ethersProvider.getNetwork();
            if (newNetwork.chainId !== APECHAIN_CHAIN_ID) {
                typeLine(`❌ Failed to switch to ApeChain. Scan aborted. Please switch manually.`, true);
                 // Keep connected state but don't run checks
                resetUI(); // Clear results area etc.
                walletOutput.innerHTML = `<p>[Wallet Connected: ${shortenAddress(userAddress)}]</p><p style="color:red;">⚠️ Please switch to ApeChain (ID ${APECHAIN_CHAIN_ID}) in your wallet.</p>`;
                connectBtn.classList.add('hidden'); // Still connected
                disconnectBtn.classList.remove('hidden');
                return; // Stop here if wrong network
            } else {
                 typeLine(`[Network Switched to ApeChain]`);
                 // Proceed with scan after successful switch
            }
        }

        // If network is correct or switch was successful, run the checks
        await runDegenCheck();

    } catch (error) {
        console.error("Handle Connect Error:", error);
        typeLine(`❌ Error processing connection: ${error.message}`, true);
        await handleDisconnect(); // Attempt to clean up state on error
    }
}


async function attemptSwitchNetwork() {
  if (!ethersProvider) {
    typeLine("❌ Cannot switch network: Provider not available.", true);
    return;
  }
  typeLine(`[Attempting to switch network to ApeChain...]`);
  try {
    await ethersProvider.send('wallet_switchEthereumChain', [{ chainId: APECHAIN_NETWORK_INFO.chainId }]);
    // Success is usually handled by the chainChanged event, but we might add a small delay and re-check here if needed.
  } catch (switchError) {
    console.error("Switch Network Error:", switchError);
    // Code 4902: Chain not added
    if (switchError.code === 4902) {
      typeLine("[ApeChain not found in wallet. Attempting to add...]");
      try {
        await ethersProvider.send('wallet_addEthereumChain', [APECHAIN_NETWORK_INFO]);
        // After adding, the wallet might automatically switch, triggering chainChanged.
        // Or the user might need to switch manually.
      } catch (addError) {
        console.error("Add Network Error:", addError);
        typeLine("❌ Failed to add ApeChain network.", true);
      }
    } else {
        typeLine("❌ Failed to switch network. Please do it manually.", true);
    }
  }
}

// Triggered by web3Modal.subscribeProvider
function handleChainChanged(chainId) {
    console.log("Chain Changed Event:", chainId);
    const numericChainId = parseInt(chainId, 16);

    if (!userAddress) return; // Ignore if not connected

    if (numericChainId !== APECHAIN_CHAIN_ID) {
        typeLine(`⚠️ Switched to wrong network (ID: ${numericChainId}). Please switch back to ApeChain.`, true);
        resetUI(); // Clear results
        walletOutput.innerHTML = `<p>[Wallet Connected: ${shortenAddress(userAddress)}]</p><p style="color:red;">⚠️ Please switch back to ApeChain (ID ${APECHAIN_CHAIN_ID}).</p>`;
        connectBtn.classList.add('hidden'); // Keep connected state visible
        disconnectBtn.classList.remove('hidden');
    } else {
         // Switched back to the correct chain
         typeLine(`[Network set to ApeChain]`);
         // Re-run checks now that we are on the correct chain
         runDegenCheck();
    }
}


// Triggered by disconnect button or web3Modal.subscribeProvider
async function handleDisconnect() {
  console.log("Handling disconnect...");

  // Attempt to close modal if open
  if (web3Modal && web3Modal.isOpen) {
      await web3Modal.closeModal();
  }

  // Attempt to disconnect provider if method exists (might be handled by Web3Modal)
  if (ethersProvider && typeof ethersProvider.provider?.disconnect === 'function') {
      try {
          await ethersProvider.provider.disconnect();
      } catch (e) {
          console.warn("Provider disconnect method error:", e);
      }
  }
  // Reset internal state and UI
  resetEverything();
  typeLine("[Wallet Disconnected]");
  console.log("Disconnected.");
}


async function runDegenCheck() {
    // Ensure we are connected and on the right chain
    if (!userAddress || !ethersProvider || !signer) {
        typeLine("❌ Wallet not ready for scan.", true);
        return;
    }
    const network = await ethersProvider.getNetwork();
    if (network.chainId !== APECHAIN_CHAIN_ID) {
        typeLine("❌ Cannot scan: Wrong network detected.", true);
        return;
    }


    // Reset previous results before new scan
    resultArea.classList.add('hidden');
    petSection.classList.add('hidden');
    scoreList.innerHTML = "";
    mintPass.innerHTML = "";
    bonusButtons.classList.add('hidden');
    document.body.classList.remove('cult-3d-handshake');
    goldRainCanvas.classList.add('hidden');
    totalScore = 0;
    bestPetCollection = null;
    scoreDetails = [];
    cultFound = false;

    // Clear previous lines except the connection status
    const connectedLine = walletOutput.querySelector('p'); // Assuming first <p> is connection status
    walletOutput.innerHTML = '';
    if (connectedLine) walletOutput.appendChild(connectedLine);


    typeLine("[Initiating Scan...]");

    // --- Run Checks ---
    // Use Promise.allSettled to let all checks finish even if some fail
    try {
        const checks = [
            fetchFirstTransaction(), // Requires backend change!
            checkCult(),
            checkPetNFTs(),
            checkCollection2NFTs()
        ];
        const results = await Promise.allSettled(checks);
        console.log("Check results:", results);

        // Check if any critical check failed (optional)
        results.forEach(result => {
            if (result.status === 'rejected') {
                console.error("A check failed:", result.reason);
                // Optionally add a generic error message to scoreDetails or UI
            }
        });

    } catch (error) {
        // This catch is less likely with Promise.allSettled, but good practice
        console.error("Error during check execution:", error);
        typeLine("❌ Error during scan process.", true);
    } finally {
        // Finalize regardless of errors in individual checks
        finalizeResults();
    }
}


function shortenAddress(addr) {
  if (!addr || addr.length < 10) return addr || "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// ==========================================================================
// --- !!! WARNING: BACKEND REQUIRED !!! ---
// The following function uses a hardcoded API Key placeholder and makes a
// client-side request to ApeScan. This is INSECURE.
// TODO: Replace this entire function with a call to your own backend API.
// Your backend API will securely store the key and query ApeScan.
// ==========================================================================
async function fetchFirstTransaction() {
  typeLine("[Checking Transaction History (Backend Required)...]"); // Indicate backend need
  // --- !!! THIS IS THE INSECURE PART - REPLACE WITH BACKEND CALL !!! ---
  const API_KEY_PLACEHOLDER = "YOUR_APESCAN_API_KEY_SHOULD_BE_ON_BACKEND"; // Placeholder
  const APECHAIN_API_URL = `https://api.apescan.io/api?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY_PLACEHOLDER}`;

  // --- Backend Call Placeholder ---
  // const backendUrl = '/api/getFirstTx'; // Your actual backend endpoint
  // try {
  //   const response = await fetch(`${backendUrl}?address=${userAddress}`);
  //   if (!response.ok) throw new Error(`Backend request failed: ${response.statusText}`);
  //   const data = await response.json();
  //   // Process data from your backend...
  // } catch (err) { ... }
  // --- End Backend Placeholder ---

  try {
    // --- !!! INSECURE client-side call - REMOVE/REPLACE THIS fetch !!! ---
    console.warn("Making INSECURE client-side call to ApeScan API. Replace with backend call.");
    typeLine("[Dev Note: Using insecure client-side API call!]"); // Warn in UI too
    const response = await fetch(APECHAIN_API_URL);
    // --- !!! End INSECURE call !!! ---

    if (!response.ok) {
      // Handle non-200 responses (like rate limits, key errors)
      throw new Error(`ApeScan API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    // Process data (same logic as before)
    if (data.status === "1" && data.result && data.result.length > 0) {
      const firstTx = data.result[0];
      if (firstTx && firstTx.timeStamp) {
        const firstTxDate = new Date(parseInt(firstTx.timeStamp) * 1000);
        if (!isNaN(firstTxDate)) {
          typeLine(`[First TX Found: ${firstTxDate.toISOString().split('T')[0]}]`);
          const cutoff = new Date("2024-12-31T23:59:59Z"); // Keep your cutoff logic
          if (firstTxDate < cutoff) {
            totalScore += 10;
            scoreDetails.push({ text: "Early Wallet Bonus: +10 pts", highlight: false });
          } else {
             typeLine("[Wallet is not 'early' based on cutoff]");
          }
        } else {
            typeLine("[Could not parse first transaction date]");
        }
      } else {
        typeLine("[No valid first transaction timestamp found]");
      }
    } else if (data.status === "0" && data.message === "No transactions found") {
        typeLine("[No transactions found for this address]");
    } else if (data.status === "0" && data.message.includes("API Key")) {
         typeLine("[❌ Invalid or missing ApeScan API Key (Configure Backend!)]", true);
         console.error("ApeScan API Key Error:", data.message);
    } else {
        typeLine(`[Could not retrieve transactions: ${data.message || 'Unknown reason'}]`);
        console.warn("ApeScan API non-success response:", data);
    }
  } catch (err) {
    console.error("CRITICAL: Failed to fetch first TX (check backend implementation):", err);
    typeLine(`[❌ Failed to retrieve transaction history: ${err.message}]`, true);
    // Decide if this error should halt the entire score or just skip this part
    // For now, let it continue but log the error prominently.
  }
}
// ==========================================================================
// --- End of INSECURE section ---
// ==========================================================================


async function checkCult() {
  if (!ethersProvider || !userAddress) return;
  typeLine("[Checking $CULT Balance...]");
  try {
    const contract = new ethers.Contract(CULT_TOKEN_ADDRESS, erc20Abi, ethersProvider); // Use provider for reads
    const balanceRaw = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    const balance = ethers.utils.formatUnits(balanceRaw, decimals);
    const cultBalance = parseFloat(balance);

    if (cultBalance > 0) {
      cultFound = true; // Set flag even if points are 0
      document.body.classList.add('cult-3d-handshake');
      typeLine(`[$CULT Balance: ${cultBalance.toFixed(2)}]`); // Show balance

      const cultPoints = Math.min(Math.floor(cultBalance / 150000) * 1, 50); // Keep your logic
      if (cultPoints > 0) {
         typeLine("[Secret $CULT 3D Handshake Accepted...]");
         totalScore += cultPoints;
         scoreDetails.push({ text: `$CULT Holdings: +${cultPoints} pts`, highlight: false });
      } else {
         typeLine("[$CULT holdings too low for points]");
      }
    } else {
        typeLine("[$CULT Balance: 0]");
         // Ensure class is removed if balance is 0 (might happen on account switch)
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
    // Use Promise.all for concurrent checks
    const checkPromises = Object.entries(PET_NFTS).map(async ([name, address]) => {
        try {
            const contract = new ethers.Contract(address, nftAbi, ethersProvider);
            const balance = await contract.balanceOf(userAddress);
            if (balance.gt(0)) {
                // Assign the *first* one found chronologically as the primary pet
                // This requires careful handling if checks run concurrently.
                // Simple approach: Let the last one checked overwrite, then pick based on fixed order later.
                // Or, track all owned pets and pick 'best' based on criteria.
                // --- Let's stick to assigning the first one listed in PET_NFTS if owned ---
                if (Object.keys(PET_NFTS).indexOf(name) < (bestPetCollection ? Object.keys(PET_NFTS).indexOf(bestPetCollection) : 999)) {
                    bestPetCollection = name;
                }
                totalScore += 5; // Add points for each collection held
                scoreDetails.push({ text: `${name} NFT: +5 pts`, highlight: true });
                foundAnyPet = true; // Mark that at least one was found
            }
        } catch (err) {
            console.warn(`⚠️ Could not check ${name} NFT:`, err);
            typeLine(`[⚠️ Error checking ${name}]`, true);
        }
    });

    await Promise.all(checkPromises); // Wait for all checks

    if (!foundAnyPet) {
        typeLine("[No Pet NFTs Found]");
    } else {
        typeLine(`[Assigned Pet based on holdings: ${bestPetCollection || 'Default'}]`);
    }
}


async function checkCollection2NFTs() {
    if (!ethersProvider || !userAddress) return;
    typeLine("[Checking Other NFTs...]");
    let foundAny = false;
    // Use Promise.all for concurrent checks
    const checkPromises = Object.entries(COLLECTION2_NFTS).map(async ([name, address]) => {
        try {
            const contract = new ethers.Contract(address, nftAbi, ethersProvider); // Use provider for reads
            const balance = await contract.balanceOf(userAddress);
            if (balance.gt(0)) {
                totalScore += 2; // Add points for each
                scoreDetails.push({ text: `${name} NFT: +2 pts`, highlight: false });
                foundAny = true;
            }
        } catch (err) {
            console.warn(`⚠️ Could not check ${name} NFT:`, err);
            typeLine(`[⚠️ Error checking ${name}]`, true);
        }
    });

    await Promise.all(checkPromises); // Wait for all checks

     if (!foundAny) typeLine("[No Other Collection NFTs Found]");
}


function finalizeResults() {
  // Slight delay for effect / wait for typeLine messages
  setTimeout(() => {
    typeLine("[Scan Complete. Displaying Results...]");
    showFinalScore();
  }, 500);
}

function showFinalScore() {
    resultArea.classList.remove("hidden");

    // Determine Pet - Use the determined bestPetCollection or default to "Crab"
    const pet = bestPetCollection || "Crab";
    petImage.src = `PetPromos/${pet}promo.png`; // Ensure these images exist
    petText.innerHTML = `<strong>Assigned Pet: ${pet}</strong><br>Strategy: ???`; // TODO: Map pet to strategy
    petSection.classList.remove("hidden");


    // Display Score Breakdown
    scoreList.innerHTML = ''; // Clear previous list items
    // Sort: Highlighted first, then alphabetically perhaps?
    scoreDetails.sort((a, b) => {
        if (a.highlight !== b.highlight) {
            return a.highlight ? -1 : 1; // Highlights first
        }
        return a.text.localeCompare(b.text); // Then alphabetical
    });

    if (scoreDetails.length === 0) {
        scoreList.innerHTML = '<li>No scoring activity detected.</li>';
    } else {
        scoreDetails.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = item.text;
            if (item.highlight) {
                // Using your CSS class now!
                li.classList.add('neon-highlight');
                // Keep bold for emphasis too if desired
                li.style.fontWeight = 'bold';
            }
            scoreList.appendChild(li);
        });
    }

    const totalLi = document.createElement('li');
    totalLi.innerHTML = `<strong>Total Score: ${totalScore} pts</strong>`;
    totalLi.style.marginTop = '15px';
    totalLi.style.borderTop = '1px solid #00f5ff'; // Separator line
    totalLi.style.paddingTop = '10px';
    scoreList.appendChild(totalLi);

    // Display Mint Pass / Waitlist Eligibility
    if (userAddress && totalScore >= 50) {
      mintPass.innerHTML = "✅ Degen Confirmed! Waitlist Access Granted.";
      mintPass.style.color = "#00f5ff"; // Use your theme color
      bonusButtons.classList.remove('hidden');
      // Optional: Trigger gold rain effect
      startGoldRain();
    } else if (userAddress) {
        mintPass.innerHTML = `Score ${totalScore} // Need 50+ pts for Waitlist Access.`;
        mintPass.style.color = "orange";
        bonusButtons.classList.add('hidden'); // Hide buttons if not qualified
    } else {
        // Should not happen if logic flow is correct, but as a fallback
        mintPass.innerHTML = "Connect wallet to check eligibility.";
        mintPass.style.color = "grey";
        bonusButtons.classList.add('hidden');
    }
}

// --- Type Line Effect ---
function typeLine(text, isError = false) {
    const line = document.createElement('p');
    line.style.margin = "0";
    line.style.fontFamily = "'Roboto Mono', monospace"; // Ensure monospaced font
    line.style.fontSize = "0.9em";
    line.style.opacity = 0; // Start hidden for fade-in effect
    line.textContent = ""; // Start empty for typing effect
    line.style.wordBreak = "break-word"; // Prevent long lines overflowing
    if (isError) {
        line.style.color = "#ff4d4d"; // A slightly less harsh red
        line.textContent = `❌ ${text}`; // Prepend error icon
        line.style.opacity = 1; // Show errors immediately, no typing
        // walletOutput.insertBefore(line, walletOutput.firstChild);
    } else {
         line.style.color = "#00ff88"; // Normal color from your CSS
         let i = 0;
         const typingSpeed = 5; // Even faster typing
         const interval = setInterval(() => {
           line.style.opacity = 1;
           line.textContent = text.slice(0, i++) + "█"; // Use block cursor
           if (i > text.length) {
             clearInterval(interval);
             line.textContent = text; // Remove cursor when done
             // Scroll to bottom (optional, might be annoying)
             // walletOutput.scrollTop = walletOutput.scrollHeight;
           }
         }, typingSpeed);
    }
     // Always prepend new lines
     walletOutput.insertBefore(line, walletOutput.firstChild);

     // Limit number of lines displayed (e.g., keep last 20)
     const maxLines = 20;
     while (walletOutput.children.length > maxLines) {
         walletOutput.removeChild(walletOutput.lastChild);
     }
}

// --- Gold Rain Effect ---
let rainInterval = null;
function startGoldRain() {
    goldRainCanvas.classList.remove('hidden');
    const ctx = goldRainCanvas.getContext('2d');
    let drops = [];

    function resizeCanvas() {
        goldRainCanvas.width = window.innerWidth;
        goldRainCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Stop any previous rain
    if (rainInterval) clearInterval(rainInterval);

    // Initialize drops
    for (let i = 0; i < 100; i++) { // Number of drops
        drops.push({
            x: Math.random() * goldRainCanvas.width,
            y: Math.random() * goldRainCanvas.height - goldRainCanvas.height, // Start above screen
            length: Math.random() * 20 + 10, // Length of drop
            speed: Math.random() * 5 + 2   // Speed of drop
        });
    }

    function drawRain() {
        ctx.clearRect(0, 0, goldRainCanvas.width, goldRainCanvas.height);
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.shadowColor = '#FFFF00'; // Yellow glow
        ctx.shadowBlur = 10;

        for (let i = 0; i < drops.length; i++) {
            let d = drops[i];
            ctx.fillRect(d.x, d.y, 2, d.length); // Draw drop

            d.y += d.speed; // Move drop

            // Reset drop if it goes off screen
            if (d.y > goldRainCanvas.height) {
                drops[i] = {
                    x: Math.random() * goldRainCanvas.width,
                    y: -20, // Reset slightly above screen
                    length: Math.random() * 20 + 10,
                    speed: Math.random() * 5 + 2
                };
            }
        }
    }

    rainInterval = setInterval(drawRain, 33); // Approx 30 FPS

    // Stop rain after a while (e.g., 10 seconds)
    setTimeout(() => {
        if (rainInterval) clearInterval(rainInterval);
        goldRainCanvas.classList.add('hidden');
        ctx.shadowBlur = 0; // Reset shadow
    }, 10000); // Stop after 10 seconds
}


// --- Event Listeners ---
connectBtn.addEventListener('click', onConnectClick); // Use the click handler
disconnectBtn.addEventListener('click', handleDisconnect);

shareScoreBtn.addEventListener('click', () => {
  typeLine("[Generating score image...]");
  // Ensure result area is fully rendered before capture
  setTimeout(() => {
      const scoreElement = document.querySelector("#scoreBreakdown");
      const petElement = document.querySelector("#petSection");

      if (!scoreElement || !petElement) {
          console.error("Cannot find elements to screenshot");
          typeLine("❌ Error generating score image: Elements not found.", true);
          return;
      }

      // Options to improve capture quality slightly
      const options = {
          scale: window.devicePixelRatio || 2, // Use device pixel ratio for sharpness
          backgroundColor: '#0f0f1a', // Match body background
          useCORS: true, // Important if pet images are from external source
          logging: false // Disable html2canvas logging
      };

      html2canvas(scoreElement, options).then(canvas1 => {
        html2canvas(petElement, options).then(canvas2 => {
          const combinedCanvas = document.createElement('canvas');
          const padding = 20 * options.scale; // Scale padding too

          // Combine vertically
          combinedCanvas.width = Math.max(canvas1.width, canvas2.width);
          combinedCanvas.height = canvas1.height + canvas2.height + padding;
          const ctx = combinedCanvas.getContext('2d');

          // Fill background
          ctx.fillStyle = options.backgroundColor;
          ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

          // Draw the captured canvases onto the combined one
          ctx.drawImage(canvas1, 0, 0);
          ctx.drawImage(canvas2, 0, canvas1.height + padding);

          // Trigger download
          const link = document.createElement('a');
          link.download = `DegenCheck_Score_${userAddress ? shortenAddress(userAddress) : 'Unknown'}_${Date.now()}.png`;
          link.href = combinedCanvas.toDataURL("image/png");
          link.click();
          typeLine("[✅ Score image saved!]");
        }).catch(err => {
            console.error("Error capturing pet section:", err);
            typeLine("❌ Error generating score image (pet section).", true);
        });
      }).catch(err => {
          console.error("Error capturing score breakdown:", err);
          typeLine("❌ Error generating score image (score section).", true);
      });
  }, 100); // Small delay to help rendering
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (!ethers) {
         console.error("Ethers.js not loaded!");
         walletOutput.innerHTML = "<p>ERROR: Core library (Ethers.js) failed to load. Please refresh.</p>";
         return;
     }
    document.getElementById('year').textContent = new Date().getFullYear();
    try {
        initializeWeb3Modal();
        // Initial UI state
        resetEverything();
        typeLine("System Online // Ready for Wallet Connection");
    } catch (e) {
        console.error("Initialization failed:", e);
        walletOutput.innerHTML = "<p>Could not initialize. Please check console or refresh.</p>";
    }
});
