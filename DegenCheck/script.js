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
  const shareScoreBtn = document.getElementById('shareScoreBtn');
  const goldRainCanvas = document.getElementById('goldRainCanvas');

  let provider, signer;
  let totalScore = 0;
  let bestPet = null;
  let scoreDetails = [];
  let specialMessages = [];
  let goblinTerminal = false;
  let cultFound = false;
  let goldRainActive = false;

  const PET_COLLECTIONS = [
    "TokenGators", "GS on Ape", "Yurei", "BAYC", "DNRS",
    "Qoonicorns", "Gobs", "Frostbyte", "Nekito", "Forever Undead"
  ];

  const SPECIAL_COLLECTIONS = {
    "Wyatt Wide World": { bonus: 50, message: "[Rokos Basilisk protocol activated... +50 pts]" },
    "Apes on Ape": { bonus: 35, message: "[InDankWeTrust!LFG! +35 pts]" },
    "Gold Ore": { bonus: 0, goldRain: true }
  };

  const NFT_CONTRACTS = [
    // Core Pet Collections
    { name: "TokenGators" }, { name: "GS on Ape" }, { name: "Yurei" }, { name: "BAYC" },
    { name: "DNRS" }, { name: "Qoonicorns" }, { name: "Gobs" }, { name: "Frostbyte" },
    { name: "Nekito" }, { name: "Forever Undead" },
    // Score-only Collections
    { name: "Wyatt Wide World" }, { name: "Minotaurs" }, { name: "Notapunkscult" }, { name: "Oogies" },
    { name: "STK" }, { name: "Ape Pass Concierge" }, { name: "Drifters" }, { name: "Bags" },
    { name: "Zards" }, { name: "Sh/apes" }, { name: "DENGS" }, { name: "TrenchersOnApe" },
    { name: "Pasta Apes" }, { name: "CHAOS Cats" }, { name: "Rillaz" }, { name: "Chumpz" },
    { name: "Hopstars" }, { name: "Banano" }, { name: "Dragons" }, { name: "Drift Lands" },
    { name: "Cybernetic Drift" }, { name: "Gold Ore" }, { name: "Quootants" }, { name: "PXLPMPS" },
    { name: "Mulls on Ape" }, { name: "Yuppies on Ape" }, { name: "Skidcity" }
  ];

  function resetEverything() {
    walletOutput.innerHTML = "";
    resultArea.classList.add('hidden');
    petSection.classList.add('hidden');
    scoreBreakdown.classList.add('hidden');
    bonusButtons.classList.add('hidden');
    scoreList.innerHTML = "";
    totalScore = 0;
    bestPet = null;
    scoreDetails = [];
    specialMessages = [];
    goblinTerminal = false;
    cultFound = false;
    goldRainActive = false;
    document.body.classList.remove('cult-3d-handshake');
    stopGoldRain();
  }

  function runFakeWallet(random = true) {
    resetEverything();
    typeLine("[Simulating Wallet Scan...]");

    let fakeWallet = { nfts: [] };

    NFT_CONTRACTS.forEach(nft => {
      if (Math.random() < 0.45) {
        fakeWallet.nfts.push({ name: nft.name, count: Math.floor(Math.random() * 4) + 1 });
      }
    });

    processWallet(fakeWallet);
  }

  function processWallet(wallet) {
    let lowestId = 999999;
    const sortedNFTs = [];

    wallet.nfts.forEach(entry => {
      const isPetCollection = PET_COLLECTIONS.includes(entry.name);
      const pointsPerNFT = isPetCollection ? 5 : 2;
      const cap = isPetCollection ? 30 : 20;
      const points = Math.min(entry.count * pointsPerNFT, cap);

      totalScore += points;
      sortedNFTs.push({
        name: entry.name,
        points,
        count: entry.count,
        isPet: isPetCollection
      });

      if (isPetCollection) {
        const fakeTokenId = Math.floor(Math.random() * 1000);
        if (fakeTokenId < lowestId) {
          lowestId = fakeTokenId;
          bestPet = entry.name;
        }
      }

      if (entry.name === "Gobs") goblinTerminal = true;

      if (SPECIAL_COLLECTIONS[entry.name]) {
        const special = SPECIAL_COLLECTIONS[entry.name];
        if (special.bonus) {
          totalScore += special.bonus;
          specialMessages.push(special.message);
        }
        if (special.goldRain) startGoldRain();
      }
    });

    finalizeResults(sortedNFTs);
  }

  function finalizeResults(sortedNFTs) {
    if (goblinTerminal) {
      walletOutput.innerHTML = "<p>GOB! GOB! GOB! GOB! GOB!</p>";
    }

    if (specialMessages.length > 0) {
      specialMessages.forEach(msg => typeLine(msg));
    }

    showFinalScore(sortedNFTs);
  }

  function showFinalScore(nfts) {
    resultArea.classList.remove("hidden");
    petSection.classList.remove("hidden");
    scoreBreakdown.classList.remove("hidden");

    if (bestPet) {
      petImage.src = `PetPromos/${bestPet}promo.png`;
      petText.innerHTML = `<strong>${bestPet}</strong><br>Supply: Unknown`;
    }

    const petNFTs = nfts.filter(nft => nft.isPet);
    const otherNFTs = nfts.filter(nft => !nft.isPet);

    petNFTs.forEach(nft => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="neon-highlight">${nft.name}: +${nft.points} pts (${nft.count} NFTs)</span>`;
      scoreList.appendChild(li);
    });

    otherNFTs
      .sort((a, b) => b.points - a.points)
      .slice(0, 8)
      .forEach(nft => {
        const li = document.createElement('li');
        li.innerHTML = `${nft.name}: +${nft.points} pts (${nft.count} NFTs)`;
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

  function startGoldRain() {
    const canvas = goldRainCanvas;
    const ctx = canvas.getContext('2d');
    canvas.classList.remove('hidden');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: Math.random() * 5 + 2,
        speed: Math.random() * 2 + 1
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffd700';
      particles.forEach(p => {
        p.y += p.speed;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (particles.some(p => p.y < canvas.height)) {
        requestAnimationFrame(animate);
      }
    }

    animate();
    goldRainActive = true;
  }

  function stopGoldRain() {
    goldRainCanvas.classList.add('hidden');
  }

  connectBtn.addEventListener('click', () => runFakeWallet(false));
  simulateBtn.addEventListener('click', () => runFakeWallet(true));
  shareScoreBtn.addEventListener('click', () => {
    html2canvas(document.querySelector("#resultArea")).then(canvas => {
      const link = document.createElement('a');
      link.download = `DegenCheck_Score_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      alert("✅ Screenshot Saved! Share it on Twitter/X!");
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
});
