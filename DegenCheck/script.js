document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const walletOutput = document.getElementById('walletOutput');
  const petSection = document.getElementById('petSection');
  const petImage = document.getElementById('petImage');
  const petText = document.getElementById('petText');

  const APECHAIN_CHAIN_ID = 33139;

  const NFT_CONTRACTS = [
    { name: "TokenGators", address: "0xd33edeC311f8769c71f132A77F0c0796c22AF1c5", pet: "Crocodile", strategy: "Trades Overbought/Oversold Swings (Stochastic Oscillator)" },
    { name: "GS on Ape", address: "0xb3443B6Bd585ba4118CaE2beDb61c7EC4a8281Df", pet: "Gorilla", strategy: "Long-term Trend Following (Supertrend)" },
    { name: "Yurei", address: "0x0BDEF3d84b72031DD38FED41D3202becB2E8aef3", pet: "Raven", strategy: "Midpoint Momentum Strategy (Awesome Oscillator)" },
    { name: "Hopstars", address: "0xbe0c4F7aEF79e41463bcd4e20c66FdA4e35A5a19", pet: "Penguin", strategy: "Trades Cyclical Extremes (CCI Strategy)" },
    { name: "Qoonicorns", address: "0x6f8F60D8f390A149F8C111AF944B3989521d0184", pet: "Seal", strategy: "Bollinger Bands Mean Reversion" },
    { name: "Forever Undead", address: "0x0178A9d0b0CBa1B2Ede3AFDb6dd021dB24fF4240", pet: "Fox", strategy: "Smoothed Momentum ROC (TRIX)" },
    { name: "Frostbyte", address: "0x5eDB0b26939764933c1ecFd99AB9379dfb62F4aD", pet: "Squirrel", strategy: "Volume-Based Pressure Strategy (Chaikin Money Flow)" },
    { name: "Nekito", address: "0x23ABf38a6d3aD137C0B219b51243Cf326ed66039", pet: "Cat", strategy: "Short-term Trend Following (EMA Cross)" },
    { name: "DNRS", address: "0x896BE40d15d1dbFA4F4Ff25A110F3CE770e07897", pet: "Frog", strategy: "Volatility Breakout Trading (Donchian Channel Breakout)" },
    { name: "Gobs", address: "0xBEbaa24108d6a03C7331464270b95278bBBE6Ff7", pet: "Goblin", strategy: "Momentum Burst Trading (ROC Threshold)" }
  ];

  const CULT_TOKEN = { name: "$CULT", address: "0xc7689ac46BC7a2c2819F0d9F280DC09C43295aBA" };

  const nftAbi = ["function balanceOf(address owner) view returns (uint256)", "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"];
  const erc20Abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

  let provider;
  let signer;
  let totalScore = 0;
  let userAddress;
  let bestPet = null;
  let bestTokenId = null;
  let cultFound = false;

  async function connectWallet() {
    walletOutput.innerHTML = "";
    petSection.classList.add("hidden");
    totalScore = 0;
    bestPet = null;
    bestTokenId = null;
    cultFound = false;

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

        await checkCultBalance(userAddress);
        await checkNftHoldings(userAddress);

        setTimeout(showScore, 1500);

      } catch (error) {
        console.error(error);
        typeLine("❌ Error connecting wallet.");
      }
    } else {
      typeLine("🦊 Please install MetaMask to connect your wallet.");
    }
  }

  async function checkCultBalance(address) {
    typeLine("[Checking $CULT Holdings...]");
    const contract = new ethers.Contract(CULT_TOKEN.address, erc20Abi, provider);
    const balanceRaw = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const balance = ethers.utils.formatUnits(balanceRaw, decimals);
    if (parseFloat(balance) > 0) {
      cultFound = true;
      typeLine("Secret $CULT 3D Handshake Accepted...");
      document.body.classList.add('cult-3d-handshake');
      setTimeout(() => document.body.classList.remove('cult-3d-handshake'), 3000);

      const cultPoints = Math.min(50, Math.floor(parseFloat(balance) / 10000) * 5);
      totalScore += cultPoints;
      typeLine(`$CULT Points Awarded: +${cultPoints}`);
    }
  }

  async function checkNftHoldings(address) {
    typeLine("[Scanning NFTs...]");
    for (const nft of NFT_CONTRACTS) {
      const contract = new ethers.Contract(nft.address, nftAbi, provider);
      const balance = await contract.balanceOf(address);
      if (balance.gt(0)) {
        totalScore += 5;
        const tokenId = await contract.tokenOfOwnerByIndex(address, 0);
        if (bestTokenId === null || tokenId.lt(bestTokenId)) {
          bestTokenId = tokenId;
          bestPet = nft;
        }
        typeLine(`Detected NFT: ${nft.name} [+5 pts]`);
      }
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

  function showScore() {
    typeLine("");
    typeLine(`Total Score: ${totalScore} points`);

    if (totalScore >= 50) {
      petSection.classList.remove("hidden");

      if (bestPet) {
        petImage.src = `PetPromos/${bestPet.pet}promo.png`;
        petText.innerHTML = `<strong>${bestPet.pet}</strong><br><br>Strategy: ${bestPet.strategy}`;
      } else {
        petImage.src = "";
        petText.innerHTML = "No assigned Pet. Explore ApeChain more!";
      }
    }
  }

  connectBtn.addEventListener('click', connectWallet);
  document.getElementById('year').textContent = new Date().getFullYear();

  const availablePets = [
  { pet: "Crocodile", strategy: "Trades Overbought/Oversold Swings (Stochastic Oscillator)" },
  { pet: "Gorilla", strategy: "Long-term Trend Following (Supertrend)" },
  { pet: "Raven", strategy: "Midpoint Momentum Strategy (Awesome Oscillator)" },
  { pet: "Penguin", strategy: "Trades Cyclical Extremes (CCI Strategy)" },
  { pet: "Seal", strategy: "Bollinger Bands Mean Reversion" },
  { pet: "Fox", strategy: "Smoothed Momentum ROC (TRIX)" },
  { pet: "Squirrel", strategy: "Volume-Based Pressure Strategy (Chaikin Money Flow)" },
  { pet: "Cat", strategy: "Short-term Trend Following (EMA Cross)" },
  { pet: "Frog", strategy: "Volatility Breakout Trading (Donchian Channel Breakout)" },
  { pet: "Goblin", strategy: "Momentum Burst Trading (ROC Threshold)" }
];

let currentPetIndex = 0;

function cyclePets() {
  petSection.classList.remove("hidden");

  const petData = availablePets[currentPetIndex];
  petImage.src = `PetPromos/${petData.pet}promo.png`;
  petText.innerHTML = `<strong>${petData.pet}</strong><br><br>Strategy: ${petData.strategy}`;

  currentPetIndex++;
  if (currentPetIndex >= availablePets.length) {
    currentPetIndex = 0;
  }
}

const cycleBtn = document.getElementById('cyclePetsBtn');
cycleBtn.addEventListener('click', cyclePets);

});
