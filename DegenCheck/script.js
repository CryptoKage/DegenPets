document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const simulateBtn = document.getElementById('simulateBtn');
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

  let totalScore = 0;
  let bestPetCollection = null;
  let scoreDetails = [];

  function resetEverything() {
    walletOutput.innerHTML = "";
    resultArea.classList.add('hidden');
    petSection.classList.add('hidden');
    scoreList.innerHTML = "";
    totalScore = 0;
    bestPetCollection = null;
    scoreDetails = [];
    document.body.classList.remove('cult-3d-handshake');
    goldRainCanvas.classList.add('hidden');
    disconnectBtn.classList.add('hidden');
  }

  function simulateFakeWallet() {
    resetEverything();
    typeLine("[Simulating Wallet Connection...]");

    setTimeout(() => {
      typeLine("[Connected Wallet: 0xFAKE...DEAD]");
      fakeScanAssets();
    }, 1000);
  }

  function fakeScanAssets() {
    setTimeout(() => {
      typeLine("[Scanning Wallet Assets...]");

      let rand = Math.random();
      if (rand < 0.4) {
        triggerHeist();
      }
      if (rand > 0.6) {
        triggerGoldRain();
      }
      if (Math.random() < 0.5) {
        triggerGobGob();
      }

      if (Math.random() < 0.7) {
        document.body.classList.add('cult-3d-handshake');
        typeLine("[Secret $CULT 3D Handshake Accepted...]");
        totalScore += 30;
        scoreDetails.push({ text: "$CULT Holdings (Fake): +30 pts", highlight: false });
      }

      simulateFakeNFTs();
      finalizeResults();
    }, 1500);
  }

  function simulateFakeNFTs() {
    const petCollections = ["TokenGators", "GS on Ape", "Yurei"];
    const collection2 = ["Qoonicorns", "Chaos Cats", "Skid City", "Pasta Apes"];

    const chosenPet = petCollections[Math.floor(Math.random() * petCollections.length)];
    bestPetCollection = chosenPet;
    totalScore += 5;
    scoreDetails.push({ text: `${chosenPet}: +5 pts`, highlight: true });

    collection2.forEach(name => {
      if (Math.random() < 0.5) {
        totalScore += 2;
        scoreDetails.push({ text: `${name}: +2 pts`, highlight: false });
      }
    });
  }

  function triggerHeist() {
    typeLine("YUGA ASSET FOUND! ....");
    setTimeout(() => {
      typeLine("INITIATE HEIST.exe .....");
      setTimeout(() => {
        typeLine("Heist initiated, preparing Pizza Delivery Outfit");
        setTimeout(() => {
          typeLine("Heist failed, SHADOW DETECTED, ABORT!");
          setTimeout(() => {
            typeLine("no heist for dev -womp womp-");
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }

  function triggerGoldRain() {
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
  }

  function triggerGobGob() {
    typeLine("GOB! GOB! GOB! GOB! GOB! GOB!");
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

    mintPass.innerHTML = "✅ Simulation Mode Complete.";
    bonusButtons.classList.add('hidden');
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

  simulateBtn.addEventListener('click', simulateFakeWallet);

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
