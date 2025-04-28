document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const walletOutput = document.getElementById('walletOutput');
  const resultArea = document.getElementById('resultArea');
  const petSection = document.getElementById('petSection');
  const petImage = document.getElementById('petImage');
  const petText = document.getElementById('petText');
  const scoreList = document.getElementById('scoreList');
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
  let yugaDetected = false;
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

  const nftAbi = ["function balanceOf(address owner) view returns (uint256)"];
  const erc20Abi = ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"];

  function resetEverything() {
    walletOutput.innerHTML = "";
    resultArea.classList.add('hidden');
    petSection.classList.add('hidden');
    scoreList.innerHTML = "";
    totalScore = 0;
    bestPetCollection = null;
    scoreDetails = [];
    specialMessages = [];
    goblinTerminal = false;
    yugaDetected = false;
    cultFound = false;
    goldRainActive = false;
    document.body.classList.remove('cult-3d-handshake');
    goldRainCanvas.classList.add('hidden');
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
    typeLine("[Scanning Wallet Assets...]");

    await checkCult();
    await simulateFakeAssets();
    processWallet();
  }

  async function checkCult() {
    try {
      const contract = new ethers.Contract(CULT_TOKEN_ADDRESS, erc20Abi, provider);
      const balanceRaw = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      const balance = ethers.utils.formatUnits(balanceRaw, decimals);

      if (parseFloat(balance) > 0) {
        cultFound = true;
        document.body.classList.add('cult-3d-handshake');

        const cultPoints = Math.min(Math.floor(parseFloat(balance) / 150000) * 1, 50);
        if (cultPoints > 0) {
          totalScore += cultPoints;
          scoreDetails.push({ text: `$CULT Holdings: +${cultPoints} pts`, highlight: false });
        }
      }
    } catch (err) {
      console.warn("Could not check $CULT:", err);
    }
  }

  async function simulateFakeAssets() {
    const assets = [
      { name: "TokenGators", count: 0 },
      { name: "BAYC", count: Math.random() < 0.2 ? 1 : 0 },
      { name: "Gold Ore", count: Math.random() < 0.2 ? 1 : 0 },
      { name: "Gobs", count: Math.random() < 0.2 ? 1 : 0 }
    ];

    for (const asset of assets) {
      if (asset.count > 0) {
        scoreDetails.push({ text: `${asset.name}: +${asset.count * 5} pts`, highlight: false });

        if (asset.name === "Gold Ore") {
          startGoldRain();
        }
        if (asset.name === "Gobs") {
          goblinTerminal = true;
        }
        if (asset.name === "BAYC") {
          yugaDetected = true;
        }
      }
    }
  }

  function processWallet() {
    if (!bestPetCollection) bestPetCollection = "Crab";
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
  }

  function showFinalScore() {
    resultArea.classList.remove("hidden");
    petSection.classList.remove("hidden");

    const petMeta = PET_METADATA[bestPetCollection];
    petImage.src = `PetPromos/${petMeta.pet}promo.png`;
    petText.innerHTML = `<strong>${petMeta.pet}</strong><br>Supply: ${petMeta.supply}`;

    scoreDetails.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = item.text;
      scoreList.appendChild(li);
    });

    const totalLi = document.createElement('li');
    totalLi.innerHTML = `<strong>Total Score: ${totalScore} pts</strong>`;
    scoreList.appendChild(totalLi);

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

  connectBtn.addEventListener('click', connectWallet);

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
