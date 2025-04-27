document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const walletOutput = document.getElementById('walletOutput');
  const circuitCanvas = document.getElementById('circuit-canvas');
  const ctx = circuitCanvas.getContext('2d');

  const APECHAIN_CHAIN_ID = 33139;

  const NFT_CONTRACTS = [
    { name: "TokenGators", address: "0xd33edeC311f8769c71f132A77F0c0796c22AF1c5" },
    { name: "GS on Ape", address: "0xb3443B6Bd585ba4118CaE2beDb61c7EC4a8281Df" },
    { name: "Apes on Ape", address: "0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0" }
  ];

  const ERC20_TOKENS = [
    { name: "$CULT", address: "0xc7689ac46BC7a2c2819F0d9F280DC09C43295aBA" }
  ];

  const SHADOW_NFTS = [
    { name: "BAYC", address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" },
    { name: "MAYC", address: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6" },
    { name: "BAKC", address: "0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623" }
  ];

  const nftAbi = ["function balanceOf(address owner) view returns (uint256)"];
  const erc20Abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

  let provider;
  let signer;
  let totalScore = 0;
  let isOG = false;
  let userAddress;
  let heistTriggered = false;

  /* === Canvas Circuit Animation === */
  let circuits = [];

  function resizeCanvas() {
    circuitCanvas.width = window.innerWidth;
    circuitCanvas.height = window.innerHeight;
  }

  function drawCircuits() {
    ctx.clearRect(0, 0, circuitCanvas.width, circuitCanvas.height);
    circuits.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + Math.cos(c.angle) * c.length, c.y + Math.sin(c.angle) * c.length);
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    updateCircuits();
    requestAnimationFrame(drawCircuits);
  }

  function updateCircuits() {
    circuits.forEach(c => {
      c.length += 0.5;
      if (Math.random() < 0.02) {
        circuits.push({
          x: c.x + Math.cos(c.angle) * c.length,
          y: c.y + Math.sin(c.angle) * c.length,
          angle: (Math.random() * Math.PI * 2),
          length: 1
        });
      }
    });
  }

  function createCircuitSeed() {
    const rect = walletOutput.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    circuits.push({ x: startX, y: startY, angle: Math.random() * Math.PI * 2, length: 1 });
  }

  resizeCanvas();
  createCircuitSeed();
  drawCircuits();
  window.addEventListener('resize', resizeCanvas);

  /* === Virus Glitch + Monitor Refresh === */
  function randomVirusGlitch() {
    document.body.style.transform = `skewX(${(Math.random() - 0.5) * 2}deg) scale(${1 + (Math.random() - 0.5) * 0.005})`;
    setTimeout(() => {
      document.body.style.transform = '';
    }, 150);
  }

  function randomMonitorRefresh() {
    document.body.style.backgroundColor = '#ffffff';
    setTimeout(() => {
      document.body.style.backgroundColor = '#0f0f1a';
    }, 60);
  }

  setInterval(() => {
    if (Math.random() < 0.5) randomVirusGlitch();
  }, 5000);

  setInterval(() => {
    if (Math.random() < 0.3) randomMonitorRefresh();
  }, 30000);

  /* === Main Wallet Connect and Scan === */
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

  async function connectWallet() {
    walletOutput.innerHTML = "";
    totalScore = 0;
    isOG = false;
    heistTriggered = false;
    typeLine("[BOOTING CONNECTION TO APECHAIN...]");

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

        await checkShadowNFTs(userAddress);
        await checkCultBalance(userAddress);
        await checkNftHoldings(userAddress);
        await checkFirstTransaction(userAddress);

        setTimeout(showScore, 2000);

      } catch (error) {
        console.error(error);
        typeLine("❌ Error connecting wallet.");
      }
    } else {
      typeLine("🦊 Please install MetaMask to connect your wallet.");
    }
  }

  async function checkCultBalance(address) {
    typeLine("");
    typeLine("[CHECKING $CULT BALANCE...]");
    for (const token of ERC20_TOKENS) {
      const contract = new ethers.Contract(token.address, erc20Abi, provider);
      const balanceRaw = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      const balance = ethers.utils.formatUnits(balanceRaw, decimals);
      const points = Math.floor(balance / 10000) * 5;
      totalScore += points;
      typeLine(`– ${token.name}: ${parseFloat(balance).toFixed(2)} tokens [+${points} pts]`);
    }
  }

  async function checkNftHoldings(address) {
    typeLine("");
    typeLine("[SCANNING NFT HOLDINGS...]");
    for (const nft of NFT_CONTRACTS) {
      const contract = new ethers.Contract(nft.address, nftAbi, provider);
      const balance = await contract.balanceOf(address);
      if (balance.gt(0)) {
        totalScore += 5;
        typeLine(`– Owns ${nft.name} [+5 pts]`);
      }
    }
  }

  async function checkShadowNFTs(address) {
    for (const nft of SHADOW_NFTS) {
      const contract = new ethers.Contract(nft.address, nftAbi, provider);
      const balance = await contract.balanceOf(address);
      if (balance.gt(0)) {
        if (!heistTriggered) {
          await runHeistSequence();
          heistTriggered = true;
        }
        totalScore += 30;
        typeLine(`– Detected ${nft.name} [+30 pts]`);
      }
    }
  }

  async function checkFirstTransaction(address) {
    typeLine("");
    typeLine("[CHECKING FIRST APECHAIN TX...]");

    const txCount = await provider.getTransactionCount(address);
    if (txCount > 0) {
      const block = await provider.getBlock(1);
      const year = new Date(block.timestamp * 1000).getFullYear();
      if (year === 2024) {
        isOG = true;
        totalScore += 10;
        typeLine("– OG Ape Detected [+10 pts]");
      }
    }
  }

  function runHeistSequence() {
    return new Promise((resolve) => {
      walletOutput.classList.add('heist-flash');

      const heistLines = [
        "YUGA ASSET FOUND! ....",
        "INITIATE HEIST.exe .....",
        "Heist initiated, preparing Pizza Delivery Outfit",
        "Heist failed, SHADOW DETECTED, ABORT!",
        "no heist for dev -womp womp-"
      ];

      let i = 0;

      function typeNext() {
        if (i < heistLines.length) {
          typeLine(heistLines[i]);
          i++;
          setTimeout(typeNext, 1400);
        } else {
          walletOutput.classList.remove('heist-flash');
          resolve();
        }
      }

      typeNext();
    });
  }

  function showScore() {
    const scoreDiv = document.createElement('div');
    scoreDiv.className = "score-box";
    let title = "🌐 Visitor";
    if (totalScore >= 100) title = "🐋 Whale Ape";
    else if (totalScore >= 50) title = "🦍 Ape Veteran";
    else if (totalScore >= 20) title = "🦧 Young Ape";

    let ogBadge = isOG ? "💎 OG" : "";

    scoreDiv.innerHTML = `<h2>Total Score: ${totalScore} pts ${ogBadge}</h2><p>Rank: ${title}</p>`;
    walletOutput.appendChild(scoreDiv);

    scoreDiv.scrollIntoView({ behavior: 'smooth' });
  }

  connectBtn.addEventListener('click', connectWallet);
  document.getElementById('year').textContent = new Date().getFullYear();
});
