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
  "Art Collection 1 Name": { address: APE_ART_COLLECTION_ADDRESSES[0], points: 0, isPrimary: false }, // Points handled by specific bonus
  "Art Collection 2 Name": { address: APE_ART_COLLECTION_ADDRESSES[1], points: 0, isPrimary: false },
  "Art Collection 3 Name": { address: APE_ART_COLLECTION_ADDRESSES[2], points: 0, isPrimary: false },

  // --- NFTs checked for conditions but might not be "Primary" for "most held" rule, or points handled differently ---
  'BAYC Shadow':  { address: BAYC_SHADOW_ADDRESS, points: 25, isPrimary: false }, // +25 Bonus
  'MAYC Shadow':  { address: MAYC_SHADOW_ADDRESS, points: 25, isPrimary: false }, // +25 Bonus (also triggers Blob Pet if no other Shadow Apes)

  // --- Secondary Bonus Point NFTs ---
  "Blobs":      { address: "0x2c37897ad565F70163Ec979282CA3ac767094843", points: 10, isPrimary: false }, // Specific +10
  "Globs":      { address: "0x73fA3797ca15d8758c3c45cdAFA63e7359964EC6", points: 10, isPrimary: false }, // Specific +10
  "Ape Gang":   { address: "0xF36f4faDEF899E839461EccB8D0Ce3d49Cff5A90", points: 5, isPrimary: false },
  "Zards": { address: ZARDS_ADDRESS, points: 0, isPrimary: false }, // Already primary, no extra bonus here
  "Hopstars": { address: HOPS_ADDRESS, points: 0, isPrimary: false }, // Already primary
  "Oogies": { address: OOGIES_ADDRESS, points: 5, isPrimary: false }, // Wyatt uses Oogies address, this is now secondary bonus if Oogies also grant points
  "Qoonicorns": { address: "0x6f8F60D8f390A149F8C111AF944B3989521d0184", points: 5, isPrimary: false },
  "Chaos Cats": { address: "0x027f7366f15f375a8EDDf9Ca768CBdC050DA8CDc", points: 5, isPrimary: false },
  "Skid City":  { address: "0xC78D0918D32146ab56146e18047021DA58a4f64b", points: 5, isPrimary: false },
  "Pasta Apes": { address: "0x682dD9B9e7b90707b854c46E1EF2637fEeaF090a", points: 5, isPrimary: false },
  "Wyatt wide world (Original Wyatt NFT Source - Bonus)": { address: WYATT_NFT_ADDRESS, points: 0, isPrimary: false }, // This IS the Wyatt primary now
  "Minotaurs": { address: MINO_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Goblin, no extra bonus
  "Notapunkscult":{ address: "0xFA1c20E0d4277b1E0b289DfFadb5Bd92Fb8486aA", points: 5, isPrimary: false },
  "STK":          { address: "0xFa24048955CF7699A50EC1d2abcB0Cba89c08c38", points: 5, isPrimary: false },
  "Ape Pass Concierge": { address: "0x6D8F985bf0DC743dc1d81aEFf14A901cCE357ABC", points: 5, isPrimary: false },
  "Drifters":     { address: DRIFTERS_ADDRESS, points: 5, isPrimary: false }, // +5 Secondary Bonus (Basilisk pts handled separately)
  "Bags":         { address: "0xCF6d469911FfaBcb4911400E32e09c1BFc08FEBD", points: 5, isPrimary: false },
  "Sh/apes":      { address: "0x6986748Eb2e4b038c06cA6C916B72F02dE906B80", points: 5, isPrimary: false },
  "Frostbyte (Bonus Pts)": { address: FROSTBYTE_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Squirrel
  "Nekito (Bonus Pts)":{ address: NEKITO_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Cat
  "DRNS (Bonus Pts)":{ address: DSNRS_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Frog
  "BrotherHOOD":  { address: "0x9F5C6d39c55131FE7752cBd88d53c67F9aFD3112", points: 5, isPrimary: false },
  "AlphaBanannas":{ address: "0xdFC7CD021514C55eEdC821E484217ee018E39028", points: 5, isPrimary: false },
  "Bored on chain":{ address: "0x80EAB3eD8f3c664827ac46dff9dd1758Ee402622", points: 5, isPrimary: false },
  "Chumpz":       { address: "0xa9a1d086623475595A02991664742E4A1cbAFcb8", points: 5, isPrimary: false },
  "Rillaz (Bonus Pts)": { address: RILLAZ_ADDRESS, points: 0, isPrimary: false }, // Is Primary for Fox
  "Forever undead":{ address: "0x0178A9d0b0CBa1B2Ede3AFDb6dd021dB24fF4240", points: 5, isPrimary: false },
  "Banano":       { address: "0xD17384D1de685846C2dEc95dd17B52BabF821c68", points: 5, isPrimary: false },
  "Dragons":      { address: "0x942f916C60De629C0758542d4b08Fc1356309DFB", points: 5, isPrimary: false },
  "Dengs":        { address: "0x2CF92fe634909A9cF5e41291f54e5784d234cF8d", points: 5, isPrimary: false },
  "TrenchersOnApe":{ address: "0x1B094A5B06ce05FE443E7cF0B5fDcD6673eb735D", points: 5, isPrimary: false },
};

// Ape Art points
export const APE_ART_COLLECTIONS = [
    "0xAddressOfArtCollection1",
    "0xAddressOfArtCollection2",
    "0xAddressOfArtCollection3",
    // ... add all relevant art collection addresses
];

// ABIs
export const nftAbi = ["function balanceOf(address owner) view returns (uint256)"];
export const erc20Abi = ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"];