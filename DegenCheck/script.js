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
    // (continue adding all your NFT addresses here)
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
