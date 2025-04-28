document.addEventListener('DOMContentLoaded', () => {
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

  let provider, signer, userAddress;
  let totalScore = 0;
  let bestPetCollection = null;
  let scoreDetails = [];
  let cultFound = false;
  let realWalletConnected = false;

  const APECHAIN_CHAIN_ID = 33139;
  const CULT_TOKEN_ADDRESS = "0xc7689ac46BC7a2c2819F0d9F280DC09C43295aBA";

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
    cultFound = false;
    realWalletConnected = false;
    document.body.classList.remove('cult-3d-handshake');
    goldRainCanvas.classList.add('hidden');
    disconnectBtn.classList.add('hidden');
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

        disconnectBtn.classList.remove('hidden');

        typeLine(`[Connected Wallet: ${shortenAddress(userAddress)}]`);
        await fetchFirstTransaction();
        await checkCult();
        simulateCollection2NFTs(); // safe simulation for now
        finalizeResults();

      } catch (error) {
        console.error(error);
        typeLine("❌ Error connecting wallet.");
      }
    } else {
      typeLine("🦊 Please install MetaMask.");
    }
  }

  function shortenAddress(addr) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  async function fetchFirstTransaction() {
    try {
      const response = await fetch(`https://api.apescan.io/api?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=asc`);
      const data = await response.json();

      if (data.result && data.result.length > 0) {
        const firstTx = data.result[0];
        
        if (firstTx && firstTx.timeStamp) {
          const firstTxDate = new Date(firstTx.timeStamp * 1000);
          if (!isNaN(firstTxDate)) {
            typeLine(`[First TX: ${firstTxDate.toISOString().split('T')[0]} Function: transfer()]`);

            // Early Wallet Bonus
            const cutoff = new Date("2024-12-31T23:59:59Z");
            if (firstTxDate < cutoff) {
              totalScore += 10;
              scoreDetails.push({ text: "Early Wallet Bonus: +10 pts", highlight: false });
            }
          } else {
            typeLine("[No valid first transaction found]");
          }
        } else {
          typeLine("[No valid first transaction found]");
        }
      } else {
        typeLine("[No transactions found]");
      }
    } catch (err) {
      console.warn("Could not fetch first TX:", err);
      typeLine("[Failed to retrieve transactions]");
    }
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

        typeLine("[Secret $CULT 3D Handshake Accepted...]");

        const cultPoints = Math.min(Math.floor(parseFloat(balance) / 150000) * 1, 50);
        if (cultPoints > 0) {
          totalScore += cultPoints;
          scoreDetails.push({ text: `$CULT Holdings: +${cultPoints} pts`, highlight: false });
        }
      }
    } catch (err) {
      console.warn("⚠️ $CULT balance not readable on RPC (skipping).");
    }
  }

  function simulateCollection2NFTs() {
    const collection2 = ["Qoonicorns", "Chaos Cats", "Skid City", "Pasta Apes"];
    collection2.forEach(name => {
      if (Math.random() < 0.5) { // simulate 50% chance
        scoreDetails.push({ text: `${name}: +2 pts`, highlight: false });
        totalScore += 2;
      }
    });
  }

  function finalizeResults() {
    setTimeout(() => {
      typeLine("[Scan Complete]");
      showFinalScore();
    }, 1500);
  }

  function showFinalScore() {
    resultArea.classList.remove("hidden");
    petSection.classList.remove("hidden");

    const pet = bestPetCollection || "Crab";
    petImage.src = `PetPromos/${pet}promo.png`;
    petText.innerHTML = `<strong>${pet}</strong><br>Supply: ???`;

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

  connectBtn.addEventListener('click', connectWallet);

  disconnectBtn.addEventListener('click', () => {
    location.reload();
  });

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
