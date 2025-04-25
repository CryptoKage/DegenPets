document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const walletOutput = document.getElementById('walletOutput');

  const APECHAIN_RPC = "https://apechain.drpc.org";
  const APECHAIN_CHAIN_ID = 33139;

  let provider;
  let signer;

  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();

        if (network.chainId !== APECHAIN_CHAIN_ID) {
          walletOutput.innerHTML = `<p>Please switch to ApeChain in your wallet.</p>`;
          return;
        }

        signer = provider.getSigner();
        const address = await signer.getAddress();
        walletOutput.innerHTML = `<p>Connected Wallet: ${address}</p>`;

        // Placeholder for future NFT analysis
        walletOutput.innerHTML += `<p>Analyzing your ApeChain activity...</p>`;

        // Future logic will go here

      } catch (error) {
        console.error(error);
        walletOutput.innerHTML = `<p>Error connecting wallet.</p>`;
      }
    } else {
      walletOutput.innerHTML = `<p>Please install MetaMask to connect your wallet.</p>`;
    }
  }

  connectBtn.addEventListener('click', connectWallet);

  // Set current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();
});
