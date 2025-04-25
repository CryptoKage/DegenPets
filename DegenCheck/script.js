document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const walletOutput = document.getElementById('walletOutput');

  const APECHAIN_RPC = "https://apechain.drpc.org";
  const APECHAIN_CHAIN_ID = 33139;

  const NFT_CONTRACTS = [
    { name: "TokenGators", address: "0xd33edeC311f8769c71f132A77F0c0796c22AF1c5" },
    { name: "GS on Ape", address: "0xb3443B6Bd585ba4118CaE2beDb61c7EC4a8281Df" },
    { name: "Apes on Ape", address: "0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0" }
  ];

  const ERC20_TOKENS = [
    { name: "$CULT", address: "0xc7689ac46BC7a2c2819F0d9F280DC09C43295aBA" }
  ];

  const nftAbi = [
    "function balanceOf(address owner) view returns (uint256)"
  ];

  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  let provider;
  let signer;

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
    walletOutput.innerHTML = ""; // Clear previous output
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
        const address = await signer.getAddress();
        typeLine(`Connected Wallet: ${address}`);

        await checkCultBalance(address);
        await checkNftHoldings(address);

      } catch (error) {
        console.error(error);
        typeLine("❌ Error connecting wallet.");
      }
    } else {
      typeLine("🦊 Please install MetaMask to connect your wallet.");
    }
  }

  async function checkCultBalance(userAddress) {
    typeLine("");
    typeLine("[CHECKING $CULT BALANCE...]");
    for (const token of ERC20_TOKENS) {
      const contract = new ethers.Contract(token.address, erc20Abi, provider);
      const balanceRaw = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      const balance = ethers.utils.formatUnits(balanceRaw, decimals);
      typeLine(`– ${token.name}: ${parseFloat(balance).toFixed(4)} APE`);
    }
  }

  async function checkNftHoldings(userAddress) {
    typeLine("");
    typeLine("[SCANNING NFT HOLDINGS ON APECHAIN...]");
    for (const nft of NFT_CONTRACTS) {
      const contract = new ethers.Contract(nft.address, nftAbi, provider);
      const balance = await contract.balanceOf(userAddress);
      typeLine(`– ${nft.name}: ${balance.toString()} owned`);
    }
  }

  connectBtn.addEventListener('click', connectWallet);
  document.getElementById('year').textContent = new Date().getFullYear();
});
