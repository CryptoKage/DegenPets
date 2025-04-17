## 5.2 Smart Contracts

*   **Pet NFTs:** Utilizing the gas-efficient ERC721A standard, storing core Pet traits (Species ID, unique Parameters, Generation) immutably on-chain.
*   **$DGPT Token:** A standard ERC20 implementation manages the utility token supply, transfers, and burning.
*   **Core Logic Contracts:** Custom, audited smart contracts handle:
    *   `TradingDesk`: Manages the initial ETH purchase and automated distribution to LP seeding function and Treasury.
    *   `PetForge`: Orchestrates the Forging process, including burning parent NFTs, handling fees, interacting with Chainlink VRF, and minting new Pet NFTs.
    *   `PetShop`: Facilitates the purchase of Pets using $DGPT and executes the token burn.
    *   `RoyaltyProcessor`: Receives secondary market royalties and executes the automated $DGPT buyback and liquidity provision sequence (triggered by an external keeper).
    *   `RewardPool`: Securely holds and dispenses $DGPT for distinct reward pools (PvE, Achievements, Tournaments).
