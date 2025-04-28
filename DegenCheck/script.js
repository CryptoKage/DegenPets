document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const simulateBtn = document.getElementById('simulateWalletBtn');
  const walletOutput = document.getElementById('walletOutput');
  const resultArea = document.getElementById('resultArea');
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
  let goblinDetected = false;
  let goblinTerminal = false;
  let yugaDetected = false;
  let cultFound = false;
  let scoreDetails = [];

  const NFT_CONTRACTS = [
    { name: "TokenGators", pet: "Crocodile", supply: "10,000" },
    { name: "GS on Ape", pet: "Gorilla", supply: "105" },
    { name: "Yurei", pet: "Raven", supply: "112" },
    { name: "BAYC", pet: "Ape", supply: "2,860" },
    { name: "DNRS", pet: "Frog", supply: "441" },
    { name: "Qoonicorns", pet: "Seal", supply: "336" },
    { name: "Gobs", pet: "Goblin", supply: "390" },
    { name: "Frostbyte", pet: "Squirrel", supply: "153" },
    { name: "Nekito", pet: "Cat", supply: "480" },
    { name: "Forever Undead", pet: "Fox", supply: "126" }
  ];

  function resetEverything() {
    walletOutput.innerHTML = "";
    resultArea.classList.add('hidden');
    petSection.classList.add('hidden');
    scoreBreakdown.classList.add('hidden');
    bonusButtons.classList.add('hidden');
    totalScore = 0;
    bestPet = null;
    bestTokenId = null;
    goblinDetected = false;
    goblinTerminal = false;
    yugaDetected = false;
    cultFound = false;
    scoreDetails = [];
    document.body.classList.remove('cult-3d-handshake');
  }

  function runFakeWallet(random = true) {
    resetEverything();
    typeLine("[Simulating Wallet Scan...]");

    let fakeWallet = {
      nfts: [],
      cultBalance: 0,
      bridged: false,
      trades: 0,
      minted: false,
      firstTxEarly: false,
    };

    if (random) {
      NFT_CONTRACTS.forEach(nft => {
        if (Math.random() < 0.5) {
          fakeWallet.nfts.push({ name: nft.name, count: Math.floor(Math.random() * 5) + 1 });
        }
      });
      fakeWallet.cultBalance = Math.floor(Math.random() * 1000000);
      fakeWallet.bridged = Math.random() < 0.5;
      fakeWallet.trades = Math.floor(Math.random() * 10);
      fakeWallet.minted = Math.random() < 0.5;
      fakeWallet.firstTxEarly = Math.random() < 0.5;
    }

    processWallet(fakeWallet);
  }

  function processWallet(wallet) {
    let lowestId = 999999;

    wallet.nfts.forEach(entry => {
      const nft = NFT_CONTRACTS.find(n => n.name === entry.name);
      if (!nft) return;

      const points = Math.min(entry.count * 5, 30);
      totalScore += points;
      scoreDetails.push({ text: `${entry.name}: +${points} pts (${entry.count} NFTs)`, highlight: false });

      const fakeTokenId = Math.floor(Math.random() * 1000);
      if (fakeTokenId < lowestId) {
        lowestId = fakeTokenId;
        bestPet = nft;
      }

      if (nft.name === "Gobs") goblinTerminal = true;
      if (["BAYC", "MAYC", "BAKC"].includes(nft.name)) yugaDetected = true;
    });

    if (wallet.cultBalance > 0) {
      const cultPoints = Math.min(Math.floor(wallet.cultBalance / 150000), 50);
      totalScore += cultPoints;
      scoreDetails.push({ text: `$CULT Holdings: +${cultPoints} pts`, highlight: false });
    }

    if (wallet.bridged) {
      totalScore += 5;
      scoreDetails.push({ text: "Bridged to ApeChain: +5 pts", highlight: false });
    }

    if (wallet.trades > 0) {
      const tradePoints = Math.min(wallet.trades, 5);
      totalScore += tradePoints;
      scoreDetails.push({ text: `Trading Activity: +${tradePoints} pts`, highlight: false });
    }

    if (wallet.minted) {
      totalScore += 1;
      scoreDetails.push({ text: "NFT Minting: +1 pt", highlight: false });
    }

    if (wallet.firstTxEarly) {
      totalScore += 10;
      scoreDetails.push({ text: "Wallet Age Bonus: +10 pts", highlight: false });
    }

    finalizeResults();
  }

  function finalizeResults() {
    if (goblinTerminal) {
      walletOutput.innerHTML = "<p>GOB! GOB! GOB! GOB! GOB!</p>";
    }

    if (yugaDetected) {
      runHeistSkit().then(showFinalScore);
    } else {
      showFinalScore();
    }

    if (cultFound) {
      document.body.classList.add('cult-3d-handshake');
    }
  }

  function showFinalScore() {
    resultArea.classList.remove("hidden");
    petSection.classList.remove("hidden");
    scoreBreakdown.classList.remove("hidden");
    scoreList.innerHTML = "";

    if (bestPet) {
      petImage.src = `PetPromos/${bestPet.pet}promo.png`;
      petText.innerHTML = `<strong>${bestPet.pet}</strong><br>Supply: ${bestPet.supply}`;
    }

    scoreDetails.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = item.highlight ? `<span class="neon-highlight">${item.text}</span>` : item.text;
      scoreList.appendChild(li);
    });

    scoreList.innerHTML += `<li><strong>Total Score: ${totalScore} pts</strong></li>`;

    if (totalScore < 50) {
      mintPass.innerHTML = "More ApeChain Activity Required";
      bonusButtons.classList.add("hidden");
    } else {
      mintPass.innerHTML = "✅ Ape Confirmed!<br>Join the Waitlist.";
      bonusButtons.classList.remove("hidden");
      mintButton.textContent = "[Join Waitlist]";
      mintButton.href = "#"; // Placeholder
    }
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

  connectBtn.addEventListener('click', () => runFakeWallet(false)); // for demo, or change later
  simulateBtn.addEventListener('click', () => runFakeWallet(true));
  document.getElementById('year').textContent = new Date().getFullYear();
});
