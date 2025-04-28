document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const simulateBtn = document.getElementById('simulateWalletBtn');
  const walletOutput = document.getElementById('walletOutput');
  const resultArea = document.getElementById('resultArea');
  const petSection = document.getElementById('petSection');
  const petImage = document.getElementById('petImage');
  const petText = document.getElementById('petText');
  const scoreBreakdown = document.getElementById('scoreList');
  const mintPass = document.getElementById('mintPass');
  const bonusButtons = document.getElementById('bonusButtons');
  const mintButton = document.getElementById('mintButton');
  const shareScoreBtn = document.getElementById('shareScoreBtn');
  const goldRainCanvas = document.getElementById('goldRainCanvas');

  let provider, signer, userAddress;
  let totalScore = 0;
  let bestPetCollection = null;
  let scoreDetails = [];
  let specialMessages = [];
  let goblinTerminal = false;
  let cultFound = false;
  let goldRainActive = false;
  let realWalletConnected = false;

  const APECHAIN_CHAIN_ID = 33139;
  const CULT_TOKEN_ADDRESS = "0xc7689ac46BC7a2c2819F0d9F280DC09C43295aBA";

  const PET_METADATA = {
    "TokenGators": { pet: "Crocodile", supply: "10,000" },
    "GS on Ape": { pet: "Gorilla", supply: "105" },
    "Yurei": { pet: "Raven", supply: "112" },
    "BAYC": { pet: "Ape", supply: "2,860" },
    "DNRS": { pet: "Frog", supply: "441" },
    "Qoonicorns": { pet: "Seal", supply: "336" },
    "Gobs": { pet: "Goblin", supply: "390" },
    "Frostbyte": { pet: "Squirrel", supply: "153" },
    "Nekito": { pet: "Cat", supply: "480" },
    "Forever Undead": { pet: "Fox", supply: "126" },
    "Crab": { pet: "Crab", supply: "500" }
  };

  const SPECIAL_COLLECTIONS = {
    "Wyatt Wide World": { bonus: 50, message: "[Rokos Basilisk protocol activated... +50 pts]" },
    "Apes on Ape": { bonus: 35, message: "[InDankWeTrust!LFG! +35 pts]" },
    "Gold Ore": { bonus: 0, goldRain: true }
  };

  const KNOWN_NFTS = Object.keys(PET_METADATA)
    .filter(key => key !== "Crab")
    .concat(Object.keys(SPECIAL_COLLECTIONS));

  const NFT_ADDRESSES = {
    // Mapping of collection name to contract address
    "TokenGators": "0xd33edeC311f8769c71f132A77F0c0796c22AF1c5",
    "GS on Ape": "0xb3443B6Bd585ba4118CaE2beDb61c7EC4a8281Df",
    "Yurei": "0x0BDEF3d84b72031DD38FED41D3202becB2E8aef3",
    "BAYC": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    "DNRS": "0x896BE40d15d1dbFA4F4Ff25A110F3CE770e07897",
    "Qoonicorns": "0x6f8F60D8f390A149F8C111AF944B3989521d0184",
    "Gobs": "0xBEbaa24108d6a03C7331464270b95278bBBE6Ff7",
    "Frostbyte": "0x5eDB0b26939764933c1ecFd99AB9379dfb62F4aD",
    "Nekito": "0x23ABf38a6d3aD137C0B219b51243Cf326ed66039",
    "Forever Undead": "0x0178A9d0b0CBa1B2Ede3AFDb6dd021dB24fF4240",
    "Wyatt Wide World": "0xf0fFa6a311eb8b9e11a1453AD08ED195b8e81601",
    "Apes on Ape": "0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0",
    "Gold Ore": "0xD5Af802F7300D1bE00f175e49B1297e7c9601a9B"
  };

  const nftAbi = ["function balanceOf(address owner) view returns (uint256)"];
  const erc20Abi = ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"];

  function resetEverything() {
    walletOutput.innerHTML = "";
    resultArea.classList.add('hidden');
    petSection.classList.add('hidden');
    scoreBreakdown.classList.add('hidden');
    bonusButtons.classList.add('hidden');
    scoreList.innerHTML = "";
    totalScore = 0;
    bestPetCollection = null;
    scoreDetails = [];
    specialMessages = [];
    goblinTerminal = false;
    cultFound = false;
    goldRainActive = false;
    document.body.classList.remove('cult-3d-handshake');
    stopGoldRain();
  }

  async function connectWallet() {
    resetEverything();
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();

        if (network.chainId !== APECHAIN_CHAIN_ID) {
          typeLine("⚠️ Please switch to ApeChain (Chain ID 33139).");
          return;
        }

        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        realWalletConnected = true;

        typeLine("[Connected to ApeChain]");
        await runRealWalletScan();

      } catch (error) {
        console.error(error);
        typeLine("❌ Error connecting wallet.");
      }
    } else {
      typeLine("🦊 Please install MetaMask.");
    }
  }

  async function runRealWalletScan() {
    resetEverything();
    typeLine("[Scanning Wallet Assets...]");

    const nftsFound = [];

    for (const [collectionName, address] of Object.entries(NFT_ADDRESSES)) {
      try {
        const contract = new ethers.Contract(address, nftAbi, provider);
        const balance = await contract.balanceOf(userAddress);

        if (balance.gt(0)) {
          nftsFound.push({ name: collectionName, count: balance.toNumber() });
        }
      } catch (err) {
        console.warn(`Could not check ${collectionName}:`, err);
      }
    }

    await checkCult();
    processWallet({ nfts: nftsFound });
  }

  async function checkCult() {
    try {
      const contract = new ethers.Contract(CULT_TOKEN_ADDRESS, erc20Abi, provider);
      const balanceRaw = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      const balance = ethers.utils.formatUnits(balanceRaw, decimals);

      if (parseFloat(balance) > 0) {
        const cultPoints = Math.min(Math.floor(parseFloat(balance) / 150000) * 1, 50);
        if (cultPoints > 0) {
          cultFound = true;
          totalScore += cultPoints;
          scoreDetails.push({ text: `$CULT Holdings: +${cultPoints} pts`, highlight: false });
        }
      }
    } catch (err) {
      console.warn("Could not check $CULT:", err);
    }
  }

  function processWallet(wallet) {
    let lowestId = 999999;
    let petEligible = [];

    wallet.nfts.forEach(entry => {
      const isCore = Object.keys(PET_METADATA).includes(entry.name) && entry.name !== "Crab";
      const pointsPerNFT = isCore ? 5 : 2;
      const cap = isCore ? 30 : 20;
      const points = Math.min(entry.count * pointsPerNFT, cap);

      totalScore += points;
      scoreDetails.push({ text: `${entry.name}: +${points} pts (${entry.count} NFTs)`, highlight: false });

      if (isCore) {
        const fakeTokenId = Math.floor(Math.random() * 1000);
        petEligible.push({ name: entry.name, tokenId: fakeTokenId });
        if (entry.name === "Gobs") goblinTerminal = true;
      }

      if (SPECIAL_COLLECTIONS[entry.name]) {
        const special = SPECIAL_COLLECTIONS[entry.name];
        if (special.bonus) {
          totalScore += special.bonus;
          specialMessages.push(special.message);
        }
        if (special.goldRain) startGoldRain();
      }
    });

    if (petEligible.length > 0) {
      petEligible.sort((a, b) => a.tokenId - b.tokenId);
      bestPetCollection = petEligible[0].name;
    } else {
      bestPetCollection = "Crab";
    }

    finalizeResults();
  }

  function finalizeResults() {
    if (goblinTerminal) {
      walletOutput.innerHTML = "<p>GOB! GOB! GOB! GOB! GOB!</p>";
    }

    if (specialMessages.length > 0) {
      specialMessages.forEach(msg => typeLine(msg));
    }

    showFinalScore();
  }

  function showFinalScore() {
    resultArea.classList.remove("hidden");
    petSection.classList.remove("hidden");
    scoreBreakdown.classList.remove("hidden");

    const petMeta = PET_METADATA[bestPetCollection];
    petImage.src = `PetPromos/${petMeta.pet}promo.png`;
    petText.innerHTML = `<strong>${petMeta.pet}</strong><br>Supply: ${petMeta.supply}`;

    scoreDetails.forEach(item => {
      const li = document.createElement('li');
      if (item.text.startsWith(bestPetCollection)) {
        li.innerHTML = `<span class="neon-highlight">${item.text}</span>`;
      } else {
        li.innerHTML = item.text;
      }
      scoreList.appendChild(li);
    });

    scoreList.innerHTML += `<li><strong>Total Score: ${totalScore} pts</strong></li>`;

    if (realWalletConnected && totalScore >= 50) {
      mintPass.innerHTML = "✅ Ape Confirmed!<br>Join the Waitlist.";
      bonusButtons.classList.remove('hidden');
    } else {
      mintPass.innerHTML = realWalletConnected ? "More ApeChain Activity Required" : "Simulated Scan (No WL Access)";
      bonusButtons.classList.add('hidden');
    }
  }

  function typeLine(text) {
    const line = document.createElement('p');
    line.style.margin = "0";
    line.style.opacity = 0;
    line.textContent = "";
    walletOutput.appendChild(line);

    let i = 0;
    const interval = setInterval(() => {
      line.style.opacity = 1;
      line.textContent = text.slice(0, i++) + "_";
      if (i > text.length) {
        clearInterval(interval);
        line.textContent = text;
      }
    }, 15);
  }

  connectBtn.addEventListener('click', connectWallet);
  simulateBtn.addEventListener('click', runFakeWallet);
  shareScoreBtn.addEventListener('click', () => {
    html2canvas(document.querySelector("#scoreBreakdown")).then(canvas1 => {
      html2canvas(document.querySelector("#petSection")).then(canvas2 => {
        const combinedCanvas = document.createElement('canvas');
        combinedCanvas.width = Math.max(canvas1.width, canvas2.width);
        combinedCanvas.height = canvas1.height + canvas2.height;
        const ctx = combinedCanvas.getContext('2d');
        ctx.drawImage(canvas1, 0, 0);
        ctx.drawImage(canvas2, 0, canvas1.height);

        const link = document.createElement('a');
        link.download = `DegenCheck_Score_${Date.now()}.png`;
        link.href = combinedCanvas.toDataURL();
        link.click();
        alert("✅ Screenshot Saved! Share it on Twitter/X!");
      });
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
});
