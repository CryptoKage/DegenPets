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
  let bestPetCollection = null;
  let scoreDetails = [];
  let specialMessages = [];
  let goblinTerminal = false;
  let cultFound = false;
  let goldRainActive = false;
  let realWalletConnected = false;

  const APECHAIN_CHAIN_ID = 33139;

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

  const CORE_PET_COLLECTIONS = Object.keys(PET_METADATA).filter(key => key !== "Crab");

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
        realWalletConnected = true;

        typeLine("[Connected to ApeChain]");
        runFakeWallet(); // Still using fake data for now — you can replace with real calls later

      } catch (error) {
        console.error(error);
        typeLine("❌ Error connecting wallet.");
      }
    } else {
      typeLine("🦊 Please install MetaMask.");
    }
  }

  function runFakeWallet() {
    resetEverything();
    typeLine("[Simulating Wallet Scan...]");

    let fakeWallet = { nfts: [] };

    Object.keys(PET_METADATA).concat(Object.keys(SPECIAL_COLLECTIONS)).forEach(name => {
      if (Math.random() < 0.5) {
        fakeWallet.nfts.push({ name, count: Math.floor(Math.random() * 4) + 1 });
      }
    });

    processWallet(fakeWallet);
  }

  function processWallet(wallet) {
    let lowestId = 999999;
    let petEligible = [];

    wallet.nfts.forEach(entry => {
      const isCore = CORE_PET_COLLECTIONS.includes(entry.name);
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
      mintButton.textContent = "[Join Waitlist]";
      mintButton.href = "#"; // Placeholder
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
        ctx.arc(p.x, p.y, 0, Math.PI * 2);
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
