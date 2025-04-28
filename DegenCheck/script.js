document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const cycleBtn = document.getElementById('cyclePetsBtn');
  const walletOutput = document.getElementById('walletOutput');
  const petSection = document.getElementById('petSection');
  const petImage = document.getElementById('petImage');
  const petText = document.getElementById('petText');
  const scoreBreakdown = document.getElementById('scoreBreakdown');
  const scoreList = document.getElementById('scoreList');
  const mintPass = document.getElementById('mintPass');
  const bonusButtons = document.getElementById('bonusButtons');
  const mintButton = document.getElementById('mintButton');

  const APECHAIN_CHAIN_ID = 33139;
  let provider, signer;
  let totalScore = 0;
  let userAddress;
  let bestPet = null;
  let bestTokenId = null;
  let cultFound = false;
  let goblinDetected = false;
  let yugaDetected = false;
  let scoreDetails = [];

  const NFT_CONTRACTS = [
    { name: "TokenGators", address: "0xd33edeC311f8769c71f132A77F0c0796c22AF1c5", pet: "Crocodile", strategy: "Trades Overbought/Oversold Swings (Stochastic Oscillator)", supply: "10,000" },
    { name: "GS on Ape", address: "0xb3443B6Bd585ba4118CaE2beDb61c7EC4a8281Df", pet: "Gorilla", strategy: "Long-term Trend Following (Supertrend)", supply: "105" },
    { name: "Yurei", address: "0x0BDEF3d84b72031DD38FED41D3202becB2E8aef3", pet: "Raven", strategy: "Midpoint Momentum Strategy (Awesome Oscillator)", supply: "112" },
    { name: "BAYC", address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", pet: "Ape", strategy: "Momentum Trend Following (MACD Trend)", supply: "2,860" },
    { name: "DNRS", address: "0x896BE40d15d1dbFA4F4Ff25A110F3CE770e07897", pet: "Frog", strategy: "Volatility Breakout Trading (Donchian Channel Breakout)", supply: "441" },
    { name: "Qoonicorns", address: "0x6f8F60D8f390A149F8C111AF944B3989521d0184", pet: "Seal", strategy: "Bollinger Bands Mean Reversion", supply: "336" },
    { name: "Gobs", address: "0xBEbaa24108d6a03C7331464270b95278bBBE6Ff7", pet: "Goblin", strategy: "Momentum Burst Trading (ROC Threshold)", supply: "390" },
    { name: "Frostbyte", address: "0x5eDB0b26939764933c1ecFd99AB9379dfb62F4aD", pet: "Squirrel", strategy: "Volume-Based Pressure Strategy (Chaikin Money Flow)", supply: "153" },
    { name: "Nekito", address: "0x23ABf38a6d3aD137C0B219b51243Cf326ed66039", pet: "Cat", strategy: "Short-term Trend Following (EMA Cross)", supply: "480" },
    { name: "Forever Undead", address: "0x0178A9d0b0CBa1B2Ede3AFDb6dd021dB24fF4240", pet: "Fox", strategy: "Smoothed Momentum ROC (TRIX)", supply: "126" }
  ];

  const CULT_TOKEN = { name: "$CULT", address: "0xc7689ac46BC7a2c2819F0d9F280DC09C43295aBA" };
  const YUGA_NFTS = ["BAYC", "MAYC", "BAKC"];

  const nftAbi = ["function balanceOf(address owner) view returns (uint256)", "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"];
  const erc20Abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

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
        typeLine(`Connected Wallet: ${userAddress}`);

        await runFullScan();

      } catch (error) {
        console.error(error);
        typeLine("❌ Error connecting wallet.");
      }
    } else {
      typeLine("🦊 Please install MetaMask to connect your wallet.");
    }
  }

  async function runFullScan() {
    await checkNFTs(userAddress);
    await checkCult(userAddress);
    await checkBonusActivity(userAddress);
    await finalizeResults();
  }

  function resetEverything() {
    walletOutput.innerHTML = "";
    petSection.classList.add("hidden");
    scoreBreakdown.classList.add("hidden");
    bonusButtons.classList.add("hidden");
    totalScore = 0;
    bestPet = null;
    bestTokenId = null;
    cultFound = false;
    goblinDetected = false;
    yugaDetected = false;
    scoreDetails = [];
    document.body.classList.remove("cult-3d-handshake");
  }

  async function checkNFTs(address) {
    typeLine("[Scanning NFT Collections...]");

    for (const nft of NFT_CONTRACTS) {
      const contract = new ethers.Contract(nft.address, nftAbi, provider);
      const balance = await contract.balanceOf(address);

      if (balance.gt(0)) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, 0);
        if (bestTokenId === null || tokenId.lt(bestTokenId)) {
          bestTokenId = tokenId;
          bestPet = nft;
        }

        if (nft.name === "Gobs") goblinDetected = true;
        if (YUGA_NFTS.includes(nft.name)) yugaDetected = true;

        const points = Math.min(balance.toNumber() * 5, 30);
        totalScore += points;
        scoreDetails.push({ text: `${nft.name}: +${points} pts (${balance.toString()} NFTs)`, highlight: false });
      }
    }
  }

  async function checkCult(address) {
    const contract = new ethers.Contract(CULT_TOKEN.address, erc20Abi, provider);
    const balanceRaw = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const balance = ethers.utils.formatUnits(balanceRaw, decimals);
    const cultPoints = Math.min(Math.floor(parseFloat(balance) / 150000) * 1, 50);

    if (cultPoints > 0) {
      cultFound = true;
      totalScore += cultPoints;
      scoreDetails.push({ text: `$CULT Holdings: +${cultPoints} pts`, highlight: false });
    }
  }

  async function checkBonusActivity(address) {
    // Future: Detect Bridge TX, DEX Swaps, Wallet Age
    // Simulate for now:
    const bridgePoints = 5;
    const tradePoints = 5;
    const mintPoints = 1;
    const walletAgePoints = 10;

    totalScore += bridgePoints + tradePoints + mintPoints + walletAgePoints;

    scoreDetails.push({ text: `Bridged to ApeChain: +5 pts`, highlight: false });
    scoreDetails.push({ text: `Trading Activity: +5 pts`, highlight: false });
    scoreDetails.push({ text: `NFT Minting: +1 pt`, highlight: false });
    scoreDetails.push({ text: `Wallet Age Bonus: +10 pts`, highlight: false });
  }

  async function finalizeResults() {
    if (goblinDetected) {
      walletOutput.innerHTML = "<p>GOB! GOB! GOB!</p>";
      return;
    }

    if (yugaDetected) await runHeistSkit();

    if (cultFound) {
      document.body.classList.add('cult-3d-handshake');
      typeLine("Secret $CULT 3D Handshake Accepted...");
    }

    showFinalScore();
  }

  function runHeistSkit() {
    return new Promise((resolve) => {
      walletOutput.classList.add('heist-flash');
      const lines = [
        "YUGA ASSET FOUND! ....",
        "INITIATE HEIST.exe .....",
        "Heist initiated, preparing Pizza Delivery Outfit",
        "Heist failed, SHADOW DETECTED, ABORT!",
        "no heist for dev -womp womp-"
      ];

      let i = 0;
      function typeNext() {
        if (i < lines.length) {
          typeLine(lines[i]);
          i++;
          setTimeout(typeNext, 1200);
        } else {
          walletOutput.classList.remove('heist-flash');
          resolve();
        }
      }
      typeNext();
    });
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

  function showFinalScore() {
    if (bestPet) {
      petSection.classList.remove("hidden");
      petImage.src = `PetPromos/${bestPet.pet}promo.png`;
      petText.innerHTML = `<strong>${bestPet.pet}</strong><br><br>Strategy: ${bestPet.strategy}<br>Supply: ${bestPet.supply}`;
    }

    scoreBreakdown.classList.remove("hidden");
    scoreList.innerHTML = "";

    scoreDetails.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = item.highlight ? `<span class="neon-highlight">${item.text}</span>` : item.text;
      scoreList.appendChild(li);
    });

    if (bestPet) {
      const petLi = [...scoreList.children].find(li => li.textContent.startsWith(bestPet.name));
      if (petLi) petLi.classList.add('neon-highlight');
    }

    scoreList.innerHTML += `<li><strong>Total Score: ${totalScore} pts</strong></li>`;

    if (totalScore < 50) {
      mintPass.innerHTML = "More ApeChain Activity Required";
      bonusButtons.classList.add("hidden");
    } else {
      mintPass.innerHTML = "✅ Ape Confirmed!<br>1 Starter NFT = 1x Pet NFT or 100 $DGPT.";
      bonusButtons.classList.remove("hidden");
      mintButton.href = "#"; // Placeholder for now, update later to real Mint URL
    }
  }

  connectBtn.addEventListener('click', connectWallet);
  cycleBtn.addEventListener('click', simulateCycle);
  document.getElementById('year').textContent = new Date().getFullYear();

  function simulateCycle() {
    resetEverything();

    const eventTypes = ["normal", "gob", "heist", "cult"];
    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    if (randomEvent === "gob") {
      walletOutput.innerHTML = "<p>GOB! GOB! GOB!</p>";
      return;
    }

    if (randomEvent === "heist") {
      runHeistSkit();
      return;
    }

    if (randomEvent === "cult") {
      document.body.classList.add('cult-3d-handshake');
      typeLine("Secret $CULT 3D Handshake Accepted...");
      return;
    }

    // Normal simulated scan
    typeLine("[Simulating Wallet Scan...]");
    runFullScan();
  }
});
