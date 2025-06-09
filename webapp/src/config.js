// webapp/src/config.js

// --- Network & WalletConnect Configuration ---
export const APECHAIN_CHAIN_ID = 33139;
export const ALCHEMY_APECHAIN_RPC_URL = "https://ape-mainnet.g.alchemy.com/v2/vsd8ZH4Ouc0w_2YRow5MQ93Z3dIMAayQ"; // Your Key

export const APECHAIN_NETWORK_INFO = {
  chainId: `0x${APECHAIN_CHAIN_ID.toString(16)}`,
  chainName: 'ApeChain',
  rpcUrls: [ALCHEMY_APECHAIN_RPC_URL],
  nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 },
  blockExplorerUrls: ['https://apescan.io']
};

export const PROJECT_ID = 'f653591549f67bc5dc45ead5e636a12e';
export const METADATA = {
    name: 'DegenCheck App',
    description: 'ApeChain Wallet Scanner & Pet Affinity',
    url: window.location.origin,
    icons: [`${window.location.origin}/favicon.png`]
};
export const WALLET_CHECK_API_URL = 'https://lus6llhkrb.execute-api.eu-north-1.amazonaws.com/prod/wallet-check/';

// --- Application Specific Contract Addresses ---
export const CULT_TOKEN_ADDRESS = "0xc7689ac46BC7a2c2819F0d9F280DC09C43295aBA";
export const BAYC_SHADOW_ADDRESS = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
export const MAYC_SHADOW_ADDRESS = "0x60E4d786628Fea6478F785A6d7e704777c86a7c6";
// Individual Trigger/Bonus NFTs
export const ZARDS_ADDRESS = "0x91417BD88AF5071CCea8d3BF3Af410660e356B06";
export const HOPS_ADDRESS = "0xbe0c4F7aEF79e41463bcd4e20c66FdA4e35A5a19";
export const GOBS_ADDRESS = "0xBEbaa24108d6a03C7331464270b95278bBBE6Ff7";
export const MINO_ADDRESS = "0x8Af17673985E4032C6Ced41D35e9f5a3E694eD7F";
export const NEKITO_ADDRESS = "0x23ABf38a6d3aD137C0B219b51243Cf326ed66039";
export const DSNRS_ADDRESS = "0x896BE40d15d1dbFA4F4Ff25A110F3CE770e07897"; // Note: DSNRS, not DRNS
export const OOGIES_ADDRESS = "0x214cAE51c3BAE88515aAEfd8e1867E64502B0342";
export const FROSTBYTE_ADDRESS = "0x5eDB0b26939764933c1ecFd99AB9379dfb62F4aD";
export const RILLAZ_ADDRESS = "0xa128ECdb362786512aF9E8b16fC3bb5F96fF78e8";
export const MUNKEE_ADDRESS = "0x13a9C4Ba78813ffCf8fc667DAEC043Af4f353C55";
export const TG_ADDRESS = "0xd33edeC311f8769c71f132A77F0c0796c22AF1c5"; // TokenGators Collection
export const GS_ADDRESS = "0xb3443B6Bd585ba4118CaE2beDb61c7EC4a8281Df";   // GS on Ape Collection
export const YUREI_ADDRESS = "0x0BDEF3d84b72031DD38FED41D3202becB2E8aef3"; // Yurei Collection
export const APES_ON_APES_ADDRESS = "0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0"; // ShadowApe Trigger
export const WYATT_NFT_ADDRESS = "0xf0fFa6a311eb8b9e11a1453AD08ED195b8e81601";   // Wyatt Trigger (Replaces Seal/Oogies for pet trigger)
export const DRIFTERS_ADDRESS = "0x9C732654399dBA1262Ffa8b2342b7FEFC8ee5EdB";   // Roko's Basilisk Trigger

// --- NFT Configuration for Checks ---
// isPrimary: true -> Participates in "most held" for Pet determination, gets +10 points.
// isPrimary: false -> Bonus points only.
// triggersPet: The key in PET_DATA this NFT (if primary and "most held") would map to.
export const ALL_NFTS_TO_CHECK = {
  // --- Primary NFTs for "Most Held" Logic (+10 points) ---
  'MrMonkee':     { address: MUNKEE_ADDRESS, points: 10, isPrimary: true, triggersPet: "MrMonkee" },
  'Snake (from Zards)': { address: ZARDS_ADDRESS, points: 10, isPrimary: true, triggersPet: "Snake" },
  'ShadowApe (from ApesOnApes)': { address: APES_ON_APES_ADDRESS, points: 10, isPrimary: true, triggersPet: "ShadowApe" }, // ApesOnApes determines ShadowApe
  'Goblin (from Gobs)': { address: GOBS_ADDRESS, points: 10, isPrimary: true, triggersPet: "Goblin" },
  'Goblin (from Minotaurs)': { address: MINO_ADDRESS, points: 10, isPrimary: true, triggersPet: "Goblin" },
  'Cat (from Nekito)':  { address: NEKITO_ADDRESS, points: 10, isPrimary: true, triggersPet: "Cat" },
  'Frog (from DRNS)':   { address: DSNRS_ADDRESS, points: 10, isPrimary: true, triggersPet: "Frog" }, // Corrected DSNRS
  'Wyatt (from Wyatt NFT)': { address: WYATT_NFT_ADDRESS, points: 10, isPrimary: true, triggersPet: "Wyatt" }, // Wyatt NFT determines Wyatt Pet
  'Squirrel (from Frostbyte)': { address: FROSTBYTE_ADDRESS, points: 10, isPrimary: true, triggersPet: "Squirrel" },
  'Fox (from Rillaz)':  { address: RILLAZ_ADDRESS, points: 10, isPrimary: true, triggersPet: "Fox" },
  'TokenGators':  { address: TG_ADDRESS, points: 10, isPrimary: true, triggersPet: "TokenGators" },
  'Gorilla (from GS on Ape)': { address: GS_ADDRESS, points: 10, isPrimary: true, triggersPet: "Gorilla" },
  'Raven (from Yurei)': { address: YUREI_ADDRESS, points: 10, isPrimary: true, triggersPet: "Raven" },

  // -- Ape Art Collection
  //"Art Collection 1 Name": { address: APE_ART_COLLECTION_ADDRESSES[0], points: 0, isPrimary: false }, // Points handled by specific bonus
  //"Art Collection 2 Name": { address: APE_ART_COLLECTION_ADDRESSES[1], points: 0, isPrimary: false },
  //"Art Collection 3 Name": { address: APE_ART_COLLECTION_ADDRESSES[2], points: 0, isPrimary: false },

  // --- NFTs checked for conditions but might not be "Primary" for "most held" rule, or points handled differently ---
  'BAYC Shadow':  { address: BAYC_SHADOW_ADDRESS, points: 25, isPrimary: false }, // +25 Bonus
  'MAYC Shadow':  { address: MAYC_SHADOW_ADDRESS, points: 25, isPrimary: false }, // +25 Bonus (also triggers Blob Pet if no other Shadow Apes)

  // --- Secondary Bonus Point NFTs ---
  "Blobs":      { address: "0x2c37897ad565F70163Ec979282CA3ac767094843", points: 10, isPrimary: false }, // Specific +10
  "Globs":      { address: "0x73fA3797ca15d8758c3c45cdAFA63e7359964EC6", points: 10, isPrimary: false }, // Specific +10
  "Ape Gang":   { address: "0xF36f4faDEF899E839461EccB8D0Ce3d49Cff5A90", points: 5, isPrimary: false },
  "Zards": { address: ZARDS_ADDRESS, points: 0, isPrimary: false }, // Already primary, no extra bonus here
  "Hopstars": { address: HOPS_ADDRESS, points: 0, isPrimary: false },
  "Oogies": { address: OOGIES_ADDRESS, points: 5, isPrimary: false }, 
  "Qoonicorns": { address: "0x6f8F60D8f390A149F8C111AF944B3989521d0184", points: 5, isPrimary: false },
  "Chaos Cats": { address: "0x027f7366f15f375a8EDDf9Ca768CBdC050DA8CDc", points: 55, isPrimary: false },
  "Skid City":  { address: "0xC78D0918D32146ab56146e18047021DA58a4f64b", points: 5, isPrimary: false },
  "Pasta Apes": { address: "0x682dD9B9e7b90707b854c46E1EF2637fEeaF090a", points: 5, isPrimary: false },
  "Wyatt wide world": { address: WYATT_NFT_ADDRESS, points: 0, isPrimary: false }, // This IS the Wyatt primary now
  "Minotaurs": { address: MINO_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Goblin, no extra bonus
  "Notapunkscult":{ address: "0xFA1c20E0d4277b1E0b289DfFadb5Bd92Fb8486aA", points: 5, isPrimary: false },
  "STK":          { address: "0xFa24048955CF7699A50EC1d2abcB0Cba89c08c38", points: 5, isPrimary: false },
  "Ape Pass Concierge": { address: "0x6D8F985bf0DC743dc1d81aEFf14A901cCE357ABC", points: 5, isPrimary: false },
  "Drifters":     { address: DRIFTERS_ADDRESS, points: 5, isPrimary: false }, // +5 Secondary Bonus (Basilisk pts handled separately)
  "Bags":         { address: "0xCF6d469911FfaBcb4911400E32e09c1BFc08FEBD", points: 5, isPrimary: false },
  "Sh/apes":      { address: "0x6986748Eb2e4b038c06cA6C916B72F02dE906B80", points: 5, isPrimary: false },
  "Frostbyte": { address: FROSTBYTE_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Squirrel
  "Nekito":{ address: NEKITO_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Cat
  "DRNS":{ address: DSNRS_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Frog
  "BrotherHOOD":  { address: "0x9F5C6d39c55131FE7752cBd88d53c67F9aFD3112", points: 5, isPrimary: false },
  "AlphaBanannas":{ address: "0xdFC7CD021514C55eEdC821E484217ee018E39028", points: 5, isPrimary: false },
  "Bored on chain":{ address: "0x80EAB3eD8f3c664827ac46dff9dd1758Ee402622", points: 5, isPrimary: false },
  "Chumpz":       { address: "0xa9a1d086623475595A02991664742E4A1cbAFcb8", points: 5, isPrimary: false },
  "Rillaz": { address: RILLAZ_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Fox
  "Forever undead":{ address: "0x0178A9d0b0CBa1B2Ede3AFDb6dd021dB24fF4240", points: 5, isPrimary: false },
  "Banano":       { address: "0xD17384D1de685846C2dEc95dd17B52BabF821c68", points: 5, isPrimary: false },
  "Dragons":      { address: "0x942f916C60De629C0758542d4b08Fc1356309DFB", points: 5, isPrimary: false },
  "Dengs":        { address: "0x2CF92fe634909A9cF5e41291f54e5784d234cF8d", points: 5, isPrimary: false },
  "TrenchersOnApe":{ address: "0x1B094A5B06ce05FE443E7cF0B5fDcD6673eb735D", points: 5, isPrimary: false },
  "MullsOnApe" :{ address: "0x0291E6c2094fb96628732A707be55A54b4228B5F", points: 10, isPrimary: false },
  "The 8102: Loot Chest" :{ address: "0x0859322Ad586c69532f4577DE4Ea966cf6A7C9e5", points: 5, isPrimary: false},
  "Mister Monkees Bananas" :{ address: "0x69380EE15D1DFf8a89Be3c0Ef2c2572C6b8B6559", points: 5, isPrimary: false },
  "Clutch Puppies" :{ address: "0x1B16c0B69D4a30c42c92C873C4873787AfCbEc5c", points: 5, isPrimary: false }, 
  "ARTLICKY" :{ address: "0xc85881E4ca13A29177E9D78bC2E840fE6937fD87", points: 5, isPrimary:false },
  "Dots" :{ address: "0xAD4665a6afA7E2c13A175eA8ce83C29A9e173708", points: 5, isPrimary:false },
  "RFDZ FREEDOM FRIES" :{ address: "0x50667862e5ABa3F3b7FD586C6d93ae345b343526", points: 5, isPrimary: false },
  "Jimmy" :{address: "0x7262718CA3734a48C3BE93521e8695630f1a45CD", points: 5, isPrimary: false }, // @JimmyOnApe
  "OtherEgg Genesis" :{ address: "0x490EE1259725928C367F0d8D938b2237CC76E1D6", points: 5, isPrimary: false },
  "Stargirl Salon" :{ address: "0x53e38A3Bb5954Cc7830Bbc6F2520B61D01D95056", points: 5, isPrimary: false },
  "Typical Tigers" :{ address: "0x79f6cc634f14c891d0FEA2037d001e39126F01E8", points: 5, isPrimary: false },  // @TypicalTigerNFT
  "Mingles" :{ address : "0x6579cfD742D8982A7cDc4C00102D3087F6c6dd8E", points: 5, isPrimary: false },  // https://x.com/MinglesNFT
  "Wild Dogs" :{ address : "0x75e7b64AA70f8266843D6C90AA396C99c27b98Eb", points: 5, isPrimary: false },  // https://x.com/WildDogsOnApe
  "DoNgSoCKs" :{ address: "0x4aE3c94b711b265c0aBC60a07C3F7f9e81B8b93e", points: 5, isPrimary: false },
  "Egg" :{ address: "0xA0D77Da1E690156B95e0619DE4a4F8fc5e3A2266", points: 5, isPrimary: false },  // x.com/cryptojeweler
  "Daizen" :{ address: "0xBd8FF6628D745a3543B0d5f0861fF96D7aab11a4", points: 5, isPrimary: false },
  "Gwapes" :{ address: "0xeD6fC07A471F4dd1878440B0538617b4D0680852", points: 5, isPrimary: false }, 
  "FUKU" :{ address: "0x1bcbD0D45d35BBBE514BEc8CB9e48C51835a6d8c", points: 5, isPrimary: false },
  "Ape Shit" :{ address: "0xF065fe3B9f57d675b0abdB2680F5432A64425663", points: 5, isPrimary: false },
  "Blever" :{ address: "0x1504734C6e17EE446A65D987C239952E46FB28e5", points: 5, isPrimary: false }, 
  "Forever Undead" :{ address: "0x0178A9d0b0CBa1B2Ede3AFDb6dd021dB24fF4240", points: 5, isPrimary: false },
  "Allo Pass" :{ address: "0x88f1A6D167531adC34aB24c6B22A9E99bbd77E3F", points: 5, isPrimary: false },
  "Orca Business" :{ address: "0xF3DFD71822b10F9F1e6f21097C29E36c4f3952c0", points: 5, isPrimary: false },
  "Goblin Ape" :{ address: "0x91CC2f19fEDC2702F3767935FaF046F58F4Ee3af", points: 5, isPrimary: false },
  "Gold Ore" :{ address: "0xD5Af802F7300D1bE00f175e49B1297e7c9601a9B", points: 5, isPrimary: false },
  "Duds" :{ address: "0x270747A876b5dc934141DFffE721458154ad9706", points: 5, isPrimary: false },
  "Sloooths" :{ address: "0x4c2eF2994Ac84036f695BE2E23e669Fe5DD73526", points: 5, isPrimary: false },
  "Shadow Games" :{ address: "0x86f191A004765c528e07a01dBe451aa1F11aE544", points: 15, isPrimary: false},
  "Fade" :{ address: "0xD5D99061019fd0ccd8Ce825C91d53FBF1DfAB8fC", points: 10, isPrimary: false},
  "Pixelaped" :{ address: "0x8115425550de116e360b9e284f6C21A801932b40", points: 5, isPrimary: false},
  "Mutated Pixelaped" :{ address: "0x8115425550de116e360b9e284f6C21A801932b40", points: 5, isPrimary: false},
  "Monkey Terminal" :{ address: "0xa07d48F04ecBBae5Cb65AeEbA15FfD6EcC15D2A4", points: 10, isPrimary: false}

  
};

// webapp/src/config.js
// ... (other existing configurations) ...

// --- Degen Pet Card NFT Minting Configuration ---
export const DEGEN_PET_NFT_CONTRACT_ADDRESS = "0xd64261b1F93cf8eB69c246f373508e06e4de3e2f"; // Your deployed contract
export const DEGEN_PET_NFT_ABI = [{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"address","name":"_initialOwner","type":"address"},{"internalType":"string","name":"_initialBaseURI","type":"string"},{"internalType":"uint256","name":"_initialMintPrice","type":"uint256"},{"internalType":"address","name":"_initialFundsRecipient","type":"address"},{"internalType":"address","name":"_royaltyReceiver","type":"address"},{"internalType":"uint96","name":"_royaltyFeeNumerator","type":"uint96"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ApprovalCallerNotOwnerNorApproved","type":"error"},{"inputs":[],"name":"ApprovalQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"BalanceQueryForZeroAddress","type":"error"},{"inputs":[{"internalType":"uint256","name":"sent","type":"uint256"},{"internalType":"uint256","name":"required","type":"uint256"}],"name":"DPAC__IncorrectPaymentAmount","type":"error"},{"inputs":[],"name":"DPAC__InvalidMintPrice","type":"error"},{"inputs":[{"internalType":"address","name":"minter","type":"address"},{"internalType":"uint256","name":"currentMints","type":"uint256"},{"internalType":"uint256","name":"maxMints","type":"uint256"}],"name":"DPAC__MaxMintsPerWalletReached","type":"error"},{"inputs":[{"internalType":"uint96","name":"feeNumerator","type":"uint96"},{"internalType":"uint96","name":"maxFeeNumerator","type":"uint96"}],"name":"DPAC__RoyaltyFeeTooLarge","type":"error"},{"inputs":[],"name":"DPAC__TransferFailed","type":"error"},{"inputs":[],"name":"DPAC__URIQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"DPAC__ZeroAddress","type":"error"},{"inputs":[{"internalType":"uint256","name":"numerator","type":"uint256"},{"internalType":"uint256","name":"denominator","type":"uint256"}],"name":"ERC2981InvalidDefaultRoyalty","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC2981InvalidDefaultRoyaltyReceiver","type":"error"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"numerator","type":"uint256"},{"internalType":"uint256","name":"denominator","type":"uint256"}],"name":"ERC2981InvalidTokenRoyalty","type":"error"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC2981InvalidTokenRoyaltyReceiver","type":"error"},{"inputs":[],"name":"EnforcedPause","type":"error"},{"inputs":[],"name":"ExpectedPause","type":"error"},{"inputs":[],"name":"MintERC2309QuantityExceedsLimit","type":"error"},{"inputs":[],"name":"MintToZeroAddress","type":"error"},{"inputs":[],"name":"MintZeroQuantity","type":"error"},{"inputs":[],"name":"NotCompatibleWithSpotMints","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"OwnerQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"OwnershipNotInitializedForExtraData","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[],"name":"SequentialMintExceedsLimit","type":"error"},{"inputs":[],"name":"SequentialUpToTooSmall","type":"error"},{"inputs":[],"name":"SpotMintTokenIdTooSmall","type":"error"},{"inputs":[],"name":"TokenAlreadyExists","type":"error"},{"inputs":[],"name":"TransferCallerNotOwnerNorApproved","type":"error"},{"inputs":[],"name":"TransferFromIncorrectOwner","type":"error"},{"inputs":[],"name":"TransferToNonERC721ReceiverImplementer","type":"error"},{"inputs":[],"name":"TransferToZeroAddress","type":"error"},{"inputs":[],"name":"URIQueryForNonexistentToken","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"ApeWithdrawn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"newBaseURI","type":"string"}],"name":"BaseURIUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"CardMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toTokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"ConsecutiveTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newRecipient","type":"address"}],"name":"FundsRecipientUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newMaxMints","type":"uint256"}],"name":"MaxMintsPerWalletUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newPrice","type":"uint256"}],"name":"MintPriceUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"fundsRecipient","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxMintsPerWallet","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mintCard","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"mintPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"mintedWalletCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"salePrice","type":"uint256"}],"name":"royaltyInfo","outputs":[{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"royaltyAmount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"newBaseURI","type":"string"}],"name":"setBaseURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint96","name":"feeNumerator","type":"uint96"}],"name":"setDefaultRoyalty","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newRecipient","type":"address"}],"name":"setFundsRecipient","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"newMaxMints","type":"uint256"}],"name":"setMaxMintsPerWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"newPrice","type":"uint256"}],"name":"setMintPrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"result","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdrawApeFunds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenAddress","type":"address"}],"name":"withdrawStuckTokens","outputs":[],"stateMutability":"nonpayable","type":"function"}];

// Ape Art points
// export const APE_ART_COLLECTIONS = [
 //   "0xAddressOfArtCollection1",
 //   "0xAddressOfArtCollection2",
 //   "0xAddressOfArtCollection3",
    // ... add all relevant art collection addresses
// ];

// ABIs
export const nftAbi = ["function balanceOf(address owner) view returns (uint256)"];
export const erc20Abi = ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"];