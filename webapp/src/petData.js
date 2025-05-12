// webapp/src/petData.js
// Defines display data for all possible Pet outcomes

// --- Define Addresses (Ensure these match checker.js) ---
const CULT_TOKEN_ADDRESS = "0xc7689ac46BC7a2c2819F0d9F280DC09C43295aBA";
const BAYC_SHADOW_ADDRESS = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
const MAYC_SHADOW_ADDRESS = "0x60E4d786628Fea6478F785A6d7e704777c86a7c6";
const ZARDS_ADDRESS = "0x91417BD88AF5071CCea8d3BF3Af410660e356B06";
const HOPS_ADDRESS = "0xbe0c4F7aEF79e41463bcd4e20c66FdA4e35A5a19";
const GOBS_ADDRESS = "0xBEbaa24108d6a03C7331464270b95278bBBE6Ff7";
const MINO_ADDRESS = "0x8Af17673985E4032C6Ced41D35e9f5a3E694eD7F";
const NEKITO_ADDRESS = "0x23ABf38a6d3aD137C0B219b51243Cf326ed66039";
const DSNRS_ADDRESS = "0x896BE40d15d1dbFA4F4Ff25A110F3CE770e07897";
const OOGIES_ADDRESS = "0x214cAE51c3BAE88515aAEfd8e1867E64502B0342";
const FROSTBYTE_ADDRESS = "0x5eDB0b26939764933c1ecFd99AB9379dfb62F4aD";
const RILLAZ_ADDRESS = "0xa128ECdb362786512aF9E8b16fC3bb5F96fF78e8";
const MONKEE_ADDRESS = "0x13a9C4Ba78813ffCf8fc667DAEC043Af4f353C55";
const TG_ADDRESS = "0xd33edeC311f8769c71f132A77F0c0796c22AF1c5";
const GS_ADDRESS = "0xb3443B6Bd585ba4118CaE2beDb61c7EC4a8281Df";
const YUREI_ADDRESS = "0x0BDEF3d84b72031DD38FED41D3202becB2E8aef3";
const APEONAPE_ADDRESS = "0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0";
const WYATT_ADDRESS = "0xf0fFa6a311eb8b9e11a1453AD08ED195b8e81601";

export const PET_DATA = {
    "Invo": {
        name: "Invo",
        strategyName: "Supertrend",
        description: "Long-term Trend Following using volatility-adjusted trailing stops. Triggered by high CULT balance and Shadow NFT ownership.",
        supply: 105,
        parameters: [
            { name: "supertrend_atr_length", range: "Min (7) - Max (21)", effect: "Lookback for ATR (volatility). Shorter = more reactive." },
            { name: "supertrend_multiplier", range: "Min (2.0) - Max (5.0) (Step: 0.5)", effect: "ATR multiplier for band distance. Smaller = tighter bands." }
        ],
        affinityTriggerType: "$CULT + Shadow",
        affinityCollectionName: "$CULT + BAYC/MAYC",
        affinityContractAddress: null, // No single contract link
        affinityStatus: "Unconfirmed",
        xAccountLink: "https://www.x.com/notacult3d"
    },
    "Ape (Cult)":{
        name: "Ape (Cult)",
        strategyName: "Stochastic Oscillator",
        description: "Trades Overbought/Oversold Swings, requiring significant $CULT and Shadow confirmation.",
        supply: 2500,
        parameters: [
            { name: "stoch_k", range: "Min (10) - Max (21)", effect: "Lookback for raw %K calculation." },
            { name: "stoch_d", range: "Min (3) - Max (7)", effect: "SMA period for %D signal line." },
            { name: "stoch_smooth_k", range: "Min (3) - Max (7)", effect: "Additional smoothing for %K line (Slow Stoch)." },
            { name: "stoch_oversold", range: "Min (15) - Max (30)", effect: "Threshold for Buy signal." },
            { name: "stoch_overbought", range: "Min (70) - Max (85)", effect: "Threshold for Sell signal." }
        ],
        affinityTriggerType: "$CULT + Shadow",
        affinityCollectionName: "$CULT + BAYC/MAYC",
        affinityContractAddress: CULT_TOKEN_ADDRESS, // No single contract link
        affinityStatus: "Unconfirmed",
        xAccountLink: "https://www.x.com/notacult3d" // No specific collection link
    },
     "Ape (Red)": {
        name: "Ape (Red)",
        strategyName: "Stochastic Oscillator",
        description: "Trades Overbought/Oversold Swings, triggered by holding a large number of Shadow NFTs.",
        supply: 2500,
        parameters: [
            { name: "stoch_k", range: "Min 10 - Max (21)", effect: "Lookback for raw %K calculation." },
            { name: "stoch_d", range: "Min (3) - Max (7)", effect: "SMA period for %D signal line." },
            { name: "stoch_smooth_k", range: "Min (3) - Max (7)", effect: "Additional smoothing for %K line (Slow Stoch)." },
            { name: "stoch_oversold", range: "Min (15) - Max (30)", effect: "Threshold for Buy signal." },
            { name: "stoch_overbought", range: "Min (70) - Max (85)", effect: "Threshold for Sell signal." }
        ],
        affinityTriggerType: "Shadow Count",
        affinityCollectionName: "BAYC/MAYC Shadows (6+)",
        affinityContractAddress: BAYC_SHADOW_ADDRESS, // No single collection link
        affinityStatus: "Unconfirmed", // Status for Yuga?
        xAccountLink: "https://x.com/BoredApeYC"
    },
    "Ape (Blue)":{
        name: "Ape (Blue)",
        strategyName: "Stochastic Oscillator",
        description: "Trades Overbought/Oversold Swings, triggered by holding any Shadow NFT.",
        supply: 2500,
        parameters: [
            { name: "stoch_k", range: "Min (10) - Max (21)", effect: "Lookback for raw %K calculation." },
            { name: "stoch_d", range: "Min (3) - Max (7)", effect: "SMA period for %D signal line." },
            { name: "stoch_smooth_k", range: "Min (3) - Max (7)", effect: "Additional smoothing for %K line (Slow Stoch)." },
            { name: "stoch_oversold", range: "Min (15) - Max (30)", effect: "Threshold for Buy signal." },
            { name: "stoch_overbought", range: "Min (70) - Max (85)", effect: "Threshold for Sell signal." }
        ],
        affinityTriggerType: "Shadow Count",
        affinityCollectionName: "BAYC/MAYC Shadows (1+)",
        affinityContractAddress: BAYC_SHADOW_ADDRESS, // No single collection link
        affinityStatus: "Unconfirmed", // Status for Yuga?
        xAccountLink: "https://x.com/apecoin"
    },
    "Visor": {
        name: "Visor",
        strategyName: "Chaikin Money Flow",
        description: "Identifies buying/selling pressure using volume flow. Triggered by high $CULT balance.",
        supply: 153,
        parameters: [
            { name: "cmf_length", range: "Min (14) - Max (30)", effect: "Lookback for CMF accumulation." },
            { name: "cmf_entry_threshold", range: "Min (0.02) - Max (0.10) (Step: 0.01)", effect: "Level CMF must cross for signal." }
        ],
        affinityTriggerType: "$CULT Balance",
        affinityCollectionName: "$CULT Token",
        affinityContractAddress: CULT_TOKEN_ADDRESS,
        affinityStatus: "Good Boy",
        xAccountLink: "https://x.com/not_a_eye"
    },
    "MrMonkee": {
        name: "Mister Monkee",
        strategyName: "Stochastic Oscillator",
        description: "Trades Overbought/Oversold Swings using smoothed K/D lines.",
        supply: 2500,
        parameters: [
            { name: "stoch_k", range: "Min (10) - Max (21)", effect: "Lookback for raw %K." },
            { name: "stoch_d", range: "Min (3) - Max (7)", effect: "SMA period for %D signal." },
            { name: "stoch_smooth_k", range: "Min (3) - Max (7)", effect: "Smoothing for %K line." },
            { name: "stoch_oversold", range: "Min (15) - Max (30)", effect: "Buy threshold." },
            { name: "stoch_overbought", range: "Min (70) - Max (85)", effect: "Sell threshold." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "Mister Monkee",
        affinityContractAddress: MONKEE_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${MONKEE_ADDRESS}`,
        xAccountLink: "https://x.com/MONKEEMister"
    },
    "Snake": {
        name: "Snake",
        strategyName: "CCI Strategy",
        description: "Trades cyclical extremes based on Commodity Channel Index deviations.",
        supply: 2750,
        parameters: [
            { name: "cci_length", range: "Min (10) - Max (30)", effect: "Lookback period." },
            { name: "cci_lower_threshold", range: "Min (-150) - Max (-75)", effect: "Buy signal threshold." },
            { name: "cci_upper_threshold", range: "Min (75) - Max (150)", effect: "Sell signal threshold." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "Zards",
        affinityContractAddress: ZARDS_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${ZARDS_ADDRESS}`, // Auto-generated ME Link
        xAccountLink: "https://x.com/ZardsNFT"
    },
    "ShadowApe": {
        name: "ShadowApe",
        strategyName: "CCI Strategy",
        description: "Trades cyclical extremes based on Commodity Channel Index deviations.",
        supply: 2750,
         parameters: [
            { name: "cci_length", range: "Min (10) - Max (30)", effect: "Lookback period." },
            { name: "cci_lower_threshold", range: "Min (-150) - Max (-75)", effect: "Buy signal threshold." },
            { name: "cci_upper_threshold", range: "Min (75) - Max (150)", effect: "Sell signal threshold." }
        ],
       affinityTriggerType: "NFT Collection",
        affinityCollectionName: "Apes on Ape",
        affinityContractAddress: APEONAPE_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${APEONAPE_ADDRESS}`, // Auto-generated ME Link
        xAccountLink: "https://x.com/apechainapes"
    },
    "Goblin": {
        name: "Goblin",
        strategyName: "ROC Threshold",
        description: "Trades bursts of momentum based on Rate of Change.",
        supply: 390,
        parameters: [
             { name: "roc_length", range: "Min (9) - Max (14)", effect: "Lookback for ROC." },
             { name: "roc_threshold", range: "Min (0.5) - Max (2.0)", effect: "% change needed for signal." }
        ],
        affinityTriggerType: "NFT Collection (OR)",
        affinityCollectionName: "Gobs or Minotaurs",
        affinityContractAddress: GOBS_ADDRESS,  
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${GOBS_ADDRESS}`, 
        xAccountLink: "https://x.com/GobsOnApe"
    },
    "Cat": {
        name: "Cat",
        strategyName: "EMA Cross",
        description: "Short-term Trend Following using Exponential Moving Average crossovers.",
        supply: 480,
        parameters: [
            { name: "Param A: EMA_fast_length", range: "Min: (5) - Max: (20)", effect: "Lookback for faster EMA." },
            { name: "Param B: EMA_slow_length", range: "Min: (21) - Max: (50)", effect: "Lookback for slower EMA." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "Nekito",
        affinityContractAddress: NEKITO_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${NEKITO_ADDRESS}`, 
        xAccountLink: "https://x.com/NekitoNFT"
    },
    "Frog": {
        name: "Frog",
        strategyName: "Donchian Channel Breakout",
        description: "Trades breakouts above recent highs or below recent lows.",
        supply: 441,
        parameters: [
            { name: "donchian_lower_len", range: "Min (10) - Max (30)", effect: "Lookback for lowest low channel." },
            { name: "donchian_upper_len", range: "Min (10) - Max (30)", effect: "Lookback for highest high channel." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "DSNRS",
        affinityContractAddress: DSNRS_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${DSNRS_ADDRESS}`, 
        xAccountLink: "https://x.com/designertoshiro"
    },
    "Wyatt": {
        name: "Wyatt",
        strategyName: "Bollinger Bands Mean Reversion",
        description: "Trades reversals when price hits outer Bollinger Bands.",
        supply: 336,
        parameters: [
             { name: "bb_length", range: "Min (10) - Max (30)", effect: "Lookback for MA/StdDev." },
             { name: "bb_stddev", range: "Min (1.5) - Max (3.0)", effect: "StdDev multiplier." },
             { name: "bb_revert_threshold", range: "Min (X) - Max (Y)", effect: "Reversion distance from band." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "Wyatt",
        affinityContractAddress: WYATT_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${OOGIES_ADDRESS}`, // Auto-generated ME Link
        xAccountLink: "https://x.com/SeattleSale"
    },
    "Squirrel": {
        name: "Squirrel",
        strategyName: "CCI Strategy",
        description: "Trades cyclical extremes based on Commodity Channel Index deviations.",
        supply: 2750,
        parameters: [
            { name: "cci_length", range: "Min (10) - Max (30)", effect: "Lookback period." },
            { name: "cci_lower_threshold", range: "Min (-150) - Max (-75)", effect: "Buy threshold." },
            { name: "cci_upper_threshold", range: "Min (75) - Max (150)", effect: "Sell threshold." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "Frostbyte",
        affinityContractAddress: FROSTBYTE_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${FROSTBYTE_ADDRESS}`, // Auto-generated ME Link
        xAccountLink: "https://x.com/FrostbyteOnApe"
    },
    "Fox": {
        name: "Fox",
        strategyName: "TRIX",
        description: "Trades based on the Triple Exponential Average momentum oscillator.",
        supply: 126,
        parameters: [
            { name: "trix_length", range: "Min (12) - Max (25)", effect: "Lookback for EMA passes." },
            { name: "trix_signal_length", range: "Min (7) - Max (15)", effect: "Lookback for Signal Line." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "Rillaz",
        affinityContractAddress: RILLAZ_ADDRESS,
        affinityStatus: "Unconfirmed",   // "/* Confirmed / Unconfirmed */",
        magicEdenLink: `https://magiceden.io/collections/apechain/${RILLAZ_ADDRESS}`, // Auto-generated ME Link
        xAccountLink: "https://x.com/ApeChainRILLAZ"
    },
    "TokenGators": {
        name: "TokenGators",
        strategyName: "Awesome Oscillator",
        description: "Trades momentum based on difference between fast and slow SMAs of midpoint price.",
        supply: 112,
        parameters: [
            { name: "ao_fast_length", range: "Min (4) - Max (10)", effect: "Lookback for faster SMA." },
            { name: "ao_slow_length", range: "Min (25) - Max (40)", effect: "Lookback for slower SMA." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "TokenGators",
        affinityContractAddress: TG_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${TG_ADDRESS}`, // Auto-generated ME Link
        xAccountLink: "https://x.com/TokenGators"
    },  
    "Gorilla": {
        name: "Gorilla",
        strategyName: "MACD Trend",
        description: "Follows trends using Moving Average Convergence Divergence crossovers.",
        supply: 2860,
        parameters: [
             { name: "macd_fast_period", range: "Min (8) - Max (20)", effect: "Lookback for faster EMA." },
             { name: "macd_slow_period", range: "Min (21) - Max (40)", effect: "Lookback for slower EMA." },
             { name: "macd_signal_period", range: "Min (5) - Max (15)", effect: "Lookback for Signal Line EMA." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "GS on Ape",
        affinityContractAddress: GS_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${GS_ADDRESS}`, // Auto-generated ME Link
        xAccountLink: "https://x.com/GeezOnApe"
    },
    "Raven": {
        name: "Raven",
        strategyName: "CCI Strategy",
        description: "Trades cyclical extremes based on Commodity Channel Index deviations.",
        supply: 2750,
        parameters: [
             { name: "cci_length", range: "Min (10) - Max (30)", effect: "Lookback period." },
             { name: "cci_lower_threshold", range: "Min (-150) - Max (-75)", effect: "Buy threshold." },
             { name: "cci_upper_threshold", range: "Min (75) - Max (150)", effect: "Sell threshold." }
        ],
        affinityTriggerType: "NFT Collection",
        affinityCollectionName: "Yurei",
        affinityContractAddress: YUREI_ADDRESS,
        affinityStatus: "Unconfirmed",
        magicEdenLink: `https://magiceden.io/collections/apechain/${YUREI_ADDRESS}`, // Auto-generated ME Link
        xAccountLink: "https://x.com/YureiApe"
    },
    "Blob": {
        name: "Blob",
        strategyName: "RSI Mean Reversion",
        description: "Trades reversals from RSI extremes. Triggered by MAYC Shadow.",
        supply: 1920,
        parameters: [
             { name: "rsi_length", range: "Min (7) - Max (21)", effect: "Lookback for RSI." },
             { name: "rsi_oversold_level", range: "Min (20) - Max (35)", effect: "Buy threshold." },
             { name: "rsi_overbought_level", range: "Min (65) - Max (80)", effect: "Sell threshold." }
        ],
        affinityTriggerType: "Shadow Hold",
        affinityCollectionName: "MAYC Shadow",
        affinityContractAddress: MAYC_SHADOW_ADDRESS, // Link MAYC contract
        affinityStatus: "Unconfirmed", // Status for MAYC?
        magicEdenLink: `https://magiceden.io/collections/apechain/${MAYC_SHADOW_ADDRESS}`, // Link MAYC ME
        xAccountLink: "https://x.com/BoredApeYC"
    },
    // --- Default ---
    "Crab": {
        name: "Crab",
        strategyName: "RSI Mean Reversion",
        description: "Trades reversals from RSI extremes.",
        supply: 1920,
        parameters: [
            { name: "rsi_length", range: "Min (7) - Max (21)", effect: "Lookback for RSI." },
            { name: "rsi_oversold_level", range: "Min (20) - Max (35)", effect: "Buy threshold." },
            { name: "rsi_overbought_level", range: "Min (65) - Max (80)", effect: "Sell threshold." }
        ],
        affinityTriggerType: "Default",
        affinityCollectionName: "N/A - Default Pet",
        affinityContractAddress: null, // No contract
        affinityStatus: "N/A",
        magicEdenLink: null,
        xAccountLink: null // Link to main Degen Pets X?
    },
}; // End PET_DATA export