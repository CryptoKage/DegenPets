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

  // 🔵 Full Wallet Simulation
  typeLine("[Simulating Wallet Scan...]");

  const testWallet = {
    nfts: [
      { name: "TokenGators", count: 2 },
      { name: "Yurei", count: 1 }
    ],
    cultBalance: 450000 // 450k $CULT
  };

  totalScore = 0;
  scoreDetails = [];

  // Simulate NFTs owned
  let minTokenId = 999999;
  bestPet = null;

  testWallet.nfts.forEach(entry => {
    const nft = NFT_CONTRACTS.find(x => x.name === entry.name);
    if (!nft) return;

    const points = Math.min(entry.count * 5, 30);
    totalScore += points;
    scoreDetails.push({ text: `${nft.name}: +${points} pts (${entry.count} NFTs)`, highlight: false });

    // Find lowest token ID (simulate)
    const fakeTokenId = Math.floor(Math.random() * 500); // random but low number
    if (fakeTokenId < minTokenId) {
      minTokenId = fakeTokenId;
      bestPet = nft;
    }
  });

  // Simulate CULT points
  const cultPoints = Math.min(Math.floor(testWallet.cultBalance / 150000) * 1, 50);
  if (cultPoints > 0) {
    totalScore += cultPoints;
    cultFound = true;
    document.body.classList.add('cult-3d-handshake');
    typeLine("Secret $CULT 3D Handshake Accepted...");
    scoreDetails.push({ text: `$CULT Holdings: +${cultPoints} pts`, highlight: false });
  }

  // Show results
  setTimeout(() => {
    showFinalScore();
  }, 2000);
}
