// Import necessary elements from Web3Modal
// Adjust the import path based on how you installed/included Web3Modal
// This assumes you are using a build system or compatible CDN that provides ES Modules
import { EthereumProvider } from 'https://unpkg.com/@walletconnect/ethereum-provider@2.11.0'; // Example import, adjust!
import { Web3Modal } from 'https://unpkg.com/@web3modal/standalone@3.1.0'; // Example import, adjust!

// --- Configuration ---
const APECHAIN_RPC_URL = "https://apechain.rpc.ankr.com/"; // Replace with preferred ApeChain RPC
const APECHAIN_CHAIN_ID = 33139;
const APECHAIN_NETWORK_INFO = {
  chainId: `0x${APECHAIN_CHAIN_ID.toString(16)}`, // Hex format
  chainName: 'ApeChain',
  rpcUrls: [APECHAIN_RPC_URL],
  nativeCurrency: { name: 'APE', M }, // Check ApeChain native currency details
  blockExplorerUrls: ['https://apescan.io'] // Check ApeChain explorer URL
};
const PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID'; // Get this from https://cloud.walletconnect.com/

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
let ethersProvider = null;
let signer = null;
let userAddress = null;

function initializeWeb3Modal() {
  try {
    // ** Important:** Adapt the provider options based on the specific Web3Modal version and package you are using (@web3modal/ethers5, @web3modal/standalone, etc.)
    // The setup below is a general guideline for v3 standalone; consult its docs.
    web3Modal = new Web3Modal({
        projectId: PROJECT_ID,
        standaloneChains: [`eip155:${APECHAIN_CHAIN_ID}`], // Mark ApeChain as standalone if not in default WC list
        // You might need additional config here for themes, wallets, etc.
        // enableExplorer: true, // Example option
        },
        // ** Provider Options: May need WalletConnect's EthereumProvider **
        // This part is highly version-dependent. Consult Web3Modal docs for vanilla JS + Ethers v5 setup.
        // Example using WalletConnect's EthereumProvider (may need separate import/setup)
        /*
        new EthereumProvider({
            projectId: PROJECT_ID,
            chains: [APECHAIN_CHAIN_ID],
            showQrModal: true, // Let WC handle QR modal if Web3Modal doesn't
            rpcMap: {
                [APECHAIN_CHAIN_ID]: APECHAIN_RPC_URL
            },
            methods: [ // Methods your dApp requires
                'eth_sendTransaction',
                'personal_sign',
                'eth_accounts',
                'eth_requestAccounts',
                'eth_call',
                'eth_getBalance',
                'eth_chainId',
                'eth_estimateGas',
                'eth_gasPrice',
                'wallet_switchEthereumChain',
                'wallet_addEthereumChain'
             ],
             events: ["chainChanged", "accountsChanged"],
        })
        */
    );

    console.log("Web3Modal Initialized");

    // --- Event Listeners (from Web3Modal) ---
    web3Modal.subscribeModal(newState => {
        console.log("Modal State Change:", newState);
        if (!newState.open && !userAddress) {
             // Modal closed without connecting
             resetUI();
        }
    });

   // Web3Modal v3+ often uses its own event system or relies on the underlying provider's events.
   // Consult documentation for subscribing to connect/disconnect/account change events.
   // Example Placeholder: You might need provider-specific listeners:
   /*
   if (web3Modal.provider) { // Check if provider exists after connection
        web3Modal.provider.on("accountsChanged", (accounts) => {
            console.log("Accounts Changed:", accounts);
            if (accounts.length > 0) {
                handleConnect(web3Modal.provider); // Re-run logic with new account
            } else {
                handleDisconnect();
            }
        });
        web3Modal.provider.on("chainChanged", (chainId) => {
             console.log("Chain Changed:", chainId);
             // Potentially force re-check or disconnect if not ApeChain
             const numericChainId = parseInt(chainId, 16);
             if (numericChainId !== APECHAIN_CHAIN_ID) {
                 typeLine(`⚠️ Please switch back to ApeChain (Chain ID ${APECHAIN_CHAIN_ID}).`);
                 // Optionally disconnect or disable features
             } else {
                 // Re-run checks if needed
                 if(userAddress) runDegenCheck();
             }
        });
        web3Modal.provider.on("disconnect", () => {
             console.log("Provider Disconnected");
             handleDisconnect();
        });
   }
   */


  } catch (error) {
      console.error("Error initializing Web3Modal:", error);
      walletOutput.innerHTML = "<p>Error initializing connection module. Please refresh.</p>";
  }
}


// --- State Variables ---
let totalScore = 0;
let bestPetCollection = null;
let scoreDetails = [];
let cultFound = false;

// --- Core Functions ---

function resetState() {
  ethersProvider = null;
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

async function onConnect() {
  if (!web3Modal) {
      console.error("Web3Modal not initialized");
      typeLine("Connection module not ready. Please refresh.");
      return;
  }
  console.log("Attempting to connect...");
  resetEverything();
  walletOutput.innerHTML = "<p>Connecting...</p>"; // Initial feedback

  try {
    // Open the modal and wait for connection details
    const connection = await web3Modal.connect();
    // ** Important: How you get the Ethers provider depends HEAVILY on the Web3Modal adapter/version.**
    // This is a common pattern for older versions or specific adapters:
    // ethersProvider = new ethers.providers.Web3Provider(connection);
    // For newer versions/standalone, you might need to use WalletConnect's provider directly
    // or another method specified in Web3Modal's docs for Ethers v5 integration.
    // --- Placeholder: Assume you get a raw provider 'connection' ---
    if (!connection) throw new Error("Connection failed or cancelled.");

    // Wrap the provider (adjust based on actual connection object)
    ethersProvider = new ethers.providers.Web3Provider(connection, 'any'); // 'any' allows network changes

    // Subscribe to events *after* provider is confirmed
    connection.on("accountsChanged", (accounts) => handleAccountsChanged(accounts));
    connection.on("chainChanged", (chainId) => handleChainChanged(chainId));
    connection.on("disconnect", () => handleDisconnect());


    await handleConnect(connection); // Pass the raw connection or wrapped provider

  } catch (error) {
      console.error("Connection Error:", error);
      typeLine(`❌ Error connecting wallet: ${error.message}`);
      resetEverything();
  }
}

async function handleConnect(connectionOrProvider) {
    // Re-wrap provider just in case, ensure it's Ethers v5 provider
    ethersProvider = new ethers.providers.Web3Provider(connectionOrProvider, 'any');

    const network = await ethersProvider.getNetwork();
    console.log("Network:", network);

    if (network.chainId !== APECHAIN_CHAIN_ID) {
        typeLine(`⚠️ Please switch to ApeChain (Chain ID ${APECHAIN_CHAIN_ID}). Attempting to switch...`);
        try {
            await switchNetwork();
            // Re-fetch provider/signer after switch attempt
            ethersProvider = new ethers.providers.Web3Provider(connectionOrProvider, 'any');
            signer = ethersProvider.getSigner();
            userAddress = await signer.getAddress();
            if (!userAddress) throw new Error("Could not get address after switch.");
            typeLine(`[Switched to ApeChain]`);
        } catch (switchError) {
             console.error("Failed to switch network:", switchError);
             typeLine(`❌ Failed to switch to ApeChain. Please switch manually in your wallet.`);
             await handleDisconnect(); // Disconnect if switch fails
             return;
        }
    } else {
        signer = ethersProvider.getSigner();
        userAddress = await signer.getAddress();
        if (!userAddress) throw new Error("Could not get address.");
    }

    console.log("Connected Address:", userAddress);
    connectBtn.classList.add('hidden');
    disconnectBtn.classList.remove('hidden');
    typeLine(`[Connected Wallet: ${shortenAddress(userAddress)}]`);

    // Run the main checks
    await runDegenCheck();
}

async function switchNetwork() {
  if (!ethersProvider) throw new Error("Provider not available for switching network.");
  try {
    await ethersProvider.send('wallet_switchEthereumChain', [{ chainId: APECHAIN_NETWORK_INFO.chainId }]);
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await ethersProvider.send('wallet_addEthereumChain', [APECHAIN_NETWORK_INFO]);
      } catch (addError) {
        console.error("Failed to add ApeChain:", addError);
        throw new Error("Failed to add ApeChain network.");
      }
    } else {
        console.error("Failed to switch network:", switchError);
        throw new Error("Failed to switch network.");
    }
  }
}

function handleAccountsChanged(accounts) {
    console.log("Accounts Changed:", accounts);
    if (accounts.length === 0) {
        // Handle disconnection or account lock
        handleDisconnect();
    } else if (accounts[0] !== userAddress) {
        // New account connected, re-run checks
        userAddress = accounts[0]; // Update address
        resetUI(); // Clear previous results
        typeLine(`[Account Changed: ${shortenAddress(userAddress)}]`);
        // Ensure provider/signer are updated if necessary (usually handled by Web3Provider)
        signer = ethersProvider.getSigner();
        runDegenCheck(); // Re-run checks for the new account
    }
}

function handleChainChanged(chainId) {
    console.log("Chain Changed:", chainId);
    const numericChainId = parseInt(chainId, 16);
    if (numericChainId !== APECHAIN_CHAIN_ID) {
        typeLine(`⚠️ Switched away from ApeChain. Please switch back.`);
        // Decide how to handle - clear results, show warning, etc.
        resetUI(); // Example: clear results when off-chain
        walletOutput.innerHTML = `<p>⚠️ Please switch back to ApeChain (ID ${APECHAIN_CHAIN_ID}) in your wallet.</p>`;
        disconnectBtn.classList.remove('hidden'); // Keep disconnect visible
        connectBtn.classList.add('hidden');
    } else {
         // Switched back to the correct chain
         if(userAddress) {
             typeLine(`[Switched back to ApeChain]`);
             runDegenCheck(); // Optionally re-run checks
         } else {
             // User might have switched chain before connecting fully
             onConnect(); // Try to connect again now that chain is correct
         }
    }
}


async function handleDisconnect() {
  console.log("Handling disconnect...");
  if (web3Modal && web3Modal.isOpen) {
      await web3Modal.closeModal();
  }
  // Also attempt provider disconnect if available
  if (ethersProvider && typeof ethersProvider.provider.disconnect === 'function') {
      try {
          await ethersProvider.provider.disconnect();
      } catch (e) {
          console.warn("Provider disconnect method error:", e);
      }
  }
  resetEverything();
  typeLine("[Wallet Disconnected]");
}


async function runDegenCheck() {
    if (!userAddress || !ethersProvider || !signer) {
        typeLine("❌ Wallet not fully connected.");
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
    // Use Promise.all for potentially faster checks (if RPC allows concurrency)
    // Note: The ApeScan API might have stricter rate limits.
    try {
        const checks = [
            fetchFirstTransaction(), // Requires backend change!
            checkCult(),
            checkPetNFTs(),
            checkCollection2NFTs()
        ];
        await Promise.all(checks);

    } catch (error) {
        console.error("Error during checks:", error);
        typeLine("❌ Error during scan process.");
        // Optionally show partial results if some checks succeeded
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
// The following function uses a hardcoded API Key and makes a client-side
// request to ApeScan. This is INSECURE.
// TODO: Replace this entire function with a call to your own backend API.
// Your backend API will securely store the key and query ApeScan.
// ==========================================================================
async function fetchFirstTransaction() {
  typeLine("[Checking Transaction History...]");
  const APECHAIN_API_URL = `https://api.apescan.io/api?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=asc&apikey=YOUR_APESCAN_API_KEY`; // << KEY EXPOSED!

  // --- Backend Placeholder ---
  // const backendUrl = '/api/getFirstTx'; // Your backend endpoint
  // const response = await fetch(`${backendUrl}?address=${userAddress}`);
  // --- End Backend Placeholder ---

  try {
    // --- !!! INSECURE - Client-side call - Replace this fetch !!! ---
    console.warn("Making INSECURE client-side call to ApeScan API. Replace with backend call.");
    const response = await fetch(APECHAIN_API_URL);
    // --- !!! End INSECURE call !!! ---

    if (!response.ok) {
      throw new Error(`ApeScan API request failed: ${response.statusText}`);
    }
    const data = await response.json();

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
          }
        } else {
            typeLine("[Could not parse first transaction date]");
        }
      } else {
        typeLine("[No valid first transaction timestamp found]");
      }
    } else if (data.status === "0" && data.message === "No transactions found") {
        typeLine("[No transactions found for this address]");
    } else {
        typeLine(`[Could not retrieve transactions: ${data.message || 'Unknown reason'}]`);
        console.warn("ApeScan API non-success response:", data);
    }
  } catch (err) {
    console.error("CRITICAL: Failed to fetch first TX (check backend implementation):", err);
    typeLine("[❌ Failed to retrieve transaction history]");
    // Decide if this error should halt the entire score or just skip this part
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

    if (parseFloat(balance) > 0) {
      cultFound = true;
      document.body.classList.add('cult-3d-handshake');
      typeLine("[Secret $CULT 3D Handshake Accepted...]");

      const cultPoints = Math.min(Math.floor(parseFloat(balance) / 150000) * 1, 50); // Keep your logic
      if (cultPoints > 0) {
        totalScore += cultPoints;
        scoreDetails.push({ text: `$CULT Holdings: +${cultPoints} pts`, highlight: false });
      }
    } else {
        typeLine("[$CULT Balance: 0]");
    }
  } catch (err) {
    console.warn("⚠️ $CULT balance check failed (RPC issue?):", err);
    typeLine("[⚠️ Could not check $CULT balance]");
  }
}

async function checkPetNFTs() {
    if (!ethersProvider || !userAddress) return;
    typeLine("[Checking Pet NFTs...]");
    let foundAnyPet = false;
    for (const [name, address] of Object.entries(PET_NFTS)) {
        try {
            const contract = new ethers.Contract(address, nftAbi, ethersProvider); // Use provider for reads
            const balance = await contract.balanceOf(userAddress);
            if (balance.gt(0)) {
                if (!bestPetCollection) { // Assign the *first* one found as the primary pet
                   bestPetCollection = name;
                }
                totalScore += 5; // Add points for each collection held
                scoreDetails.push({ text: `${name} NFT: +5 pts`, highlight: true });
                foundAnyPet = true;
            }
        } catch (err) {
            console.warn(`⚠️ Could not check ${name} NFT:`, err);
            typeLine(`[⚠️ Error checking ${name}]`);
        }
    }
    if (!foundAnyPet) typeLine("[No Pet NFTs Found]");
}

async function checkCollection2NFTs() {
    if (!ethersProvider || !userAddress) return;
    typeLine("[Checking Other NFTs...]");
    let foundAny = false;
    for (const [name, address] of Object.entries(COLLECTION2_NFTS)) {
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
            typeLine(`[⚠️ Error checking ${name}]`);
        }
    }
     if (!foundAny) typeLine("[No Other Collection NFTs Found]");
}

function finalizeResults() {
  // Slight delay for effect / wait for typeLine messages
  setTimeout(() => {
    typeLine("[Scan Complete]");
    showFinalScore();
  }, 500); // Reduced delay a bit
}

function showFinalScore() {
    resultArea.classList.remove("hidden");

    // Determine Pet
    const pet = bestPetCollection || "Crab"; // Default to Crab if no PET_NFT held
    petImage.src = `PetPromos/${pet}promo.png`; // Ensure these images exist
    petText.innerHTML = `<strong>Assigned Pet: ${pet}</strong><br>Strategy: ???`; // Update text, maybe fetch strategy later?
    petSection.classList.remove("hidden");


    // Display Score Breakdown
    scoreList.innerHTML = ''; // Clear previous list items
    scoreDetails.sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0)); // Optional: put highlighted items first
    scoreDetails.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = item.text;
      if (item.highlight) {
          li.style.fontWeight = 'bold'; // Example highlight
      }
      scoreList.appendChild(li);
    });

    const totalLi = document.createElement('li');
    totalLi.innerHTML = `<strong>Total Score: ${totalScore} pts</strong>`;
    totalLi.style.marginTop = '10px'; // Add some spacing
    scoreList.appendChild(totalLi);

    // Display Mint Pass / Waitlist Eligibility
    if (userAddress && totalScore >= 50) { // Ensure user is connected
      mintPass.innerHTML = "✅ Ape Confirmed!<br>You qualify! Click below.";
      mintPass.style.color = "lime"; // Make it stand out
      bonusButtons.classList.remove('hidden');
    } else if (userAddress) {
        mintPass.innerHTML = `Score ${totalScore} // More ApeChain Activity Required (Need 50+)`;
        mintPass.style.color = "orange";
        bonusButtons.classList.add('hidden'); // Hide buttons if not qualified
    } else {
        // Should not happen if logic flow is correct, but as a fallback
        mintPass.innerHTML = "Connect wallet first.";
        bonusButtons.classList.add('hidden');
    }
}


function typeLine(text, isError = false) {
    const line = document.createElement('p');
    line.style.margin = "0";
    line.style.fontFamily = "'Courier New', Courier, monospace"; // Ensure monospaced font
    line.style.fontSize = "0.9em";
    line.style.opacity = 0; // Start hidden for fade-in effect
    line.textContent = ""; // Start empty for typing effect
    if (isError) {
        line.style.color = "red";
    }

    // Prepend new lines instead of appending, keep output area scrolled up
    walletOutput.insertBefore(line, walletOutput.firstChild);


    let i = 0;
    const typingSpeed = 10; // Faster typing speed
    const interval = setInterval(() => {
      line.style.opacity = 1;
      line.textContent = text.slice(0, i++) + "█"; // Use block cursor
      if (i > text.length) {
        clearInterval(interval);
        line.textContent = text; // Remove cursor when done
      }
    }, typingSpeed);
}

// --- Event Listeners ---
connectBtn.addEventListener('click', onConnect);
disconnectBtn.addEventListener('click', handleDisconnect);

shareScoreBtn.addEventListener('click', () => {
  // Ensure result area is fully rendered before capture
  setTimeout(() => {
      const scoreElement = document.querySelector("#scoreBreakdown");
      const petElement = document.querySelector("#petSection");

      if (!scoreElement || !petElement) {
          console.error("Cannot find elements to screenshot");
          alert("Error generating score image.");
          return;
      }

      // Options to improve capture quality slightly
      const options = { scale: 2, backgroundColor: '#000' }; // Increase scale, set bg

      html2canvas(scoreElement, options).then(canvas1 => {
        html2canvas(petElement, options).then(canvas2 => {
          const combinedCanvas = document.createElement('canvas');
          // Combine vertically
          combinedCanvas.width = Math.max(canvas1.width, canvas2.width);
          combinedCanvas.height = canvas1.height + canvas2.height + 20; // Add padding
          const ctx = combinedCanvas.getContext('2d');

          // Optional: Fill background if needed
          ctx.fillStyle = '#0D0D0D'; // Match body background? Adjust as needed
          ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

          // Draw the captured canvases onto the combined one
          ctx.drawImage(canvas1, 0, 0);
          ctx.drawImage(canvas2, 0, canvas1.height + 20); // Add padding

          // Trigger download
          const link = document.createElement('a');
          link.download = `DegenCheck_Score_${Date.now()}.png`;
          link.href = combinedCanvas.toDataURL("image/png"); // Use PNG
          link.click();
          // Consider less intrusive notification
          typeLine("[✅ Score image saved!]");
        }).catch(err => {
            console.error("Error capturing pet section:", err);
            alert("Error generating score image (pet section).");
        });
      }).catch(err => {
          console.error("Error capturing score breakdown:", err);
          alert("Error generating score image (score section).");
      });
  }, 100); // Small delay to help rendering
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    try {
        initializeWeb3Modal();
    } catch (e) {
        console.error("Initialization failed:", e);
        walletOutput.innerHTML = "<p>Could not initialize. Please check console or refresh.</p>";
    }
});
