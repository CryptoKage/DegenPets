## 5.2 Smart Contracts

*   **Test Net** (Base Sepolia)
* DGPToken: 0xA9e1E7D56C5dffb9CeBdadB5F6A7Fd895cD78fB6 (ERC20 Utility Token)
* DegenPetNFT: 0x2C880c7e24D09ED87D8BDD0B63Db77Df8A474Ed4 (ERC721A Pet NFTs)
* TradingDesk (Proxy): 0x6f2ABFe626B775Fd53a8Ec3f55Fa7cd07D548f68 (ETH purchase for starter pet)
* PetAdoption (Proxy): 0x1Eed40E402bBDa0f7b4CA72b40127f5A0e8A8960 ($DGPT purchase for specific pets)
* PetForge (Proxy): 0x6A5f1ffa68b538D9803988A97ca9cb496f7b0FF1 (Combine pets)
* TournamentManager (Proxy): 0x8339FA6d6433c9c599062145a59eB398e4a1C7cB (Handles tournament buy-ins)
* PvERewardPool (Proxy): 0xe2Ab5c232eb6135D1f7144f04dA51B7a225583A3 (Holds PvE $DGPT rewards)
* AchievementRewardPool (Proxy): 0x9231400507772c049F755f8AEf0f93f8d4B40B09 (Holds Achievement $DGPT rewards)
* TournamentRewardPool (Proxy): 0x9FA2422c47fCa8A990641189284670eed6e1989b (Holds Tournament Prize $DGPT rewards)
* LPTokenLocker (Proxy): 0x47Eb8790E2CF386f32b244532c322a69aD6e47c9 (Locks LP tokens from Royalty Processor)
* RoyaltyProcessor (Proxy): 0xc8576a9034b58D2283744afD0fb2B154876aBBAF (Processes NFT royalties for buyback/LP)

#   **Contract Details** 
* A. DGPToken (0xA9e1...fB6)
 Type: ERC20 (Standard, Non-Upgradeable)
 Purpose: The core utility token ($DGPT) for the Degen Pets ecosystem.
 Key Features: Fixed total supply (100M), 18 decimals, Burnable, Ownable (owner received initial supply).
 Owner/Admin: Deployer (0x0719...) initially holds supply and ownership.
 TGE Distribution: Supply distributed via deployment script to Reward Pools, LP Allocator, and Treasury.
* B. DegenPetNFT (0x2C88...4Ed4)
 Type: ERC721A (Gas-Efficient NFT, Non-Upgradeable)
 Purpose: Represents the Degen Pet NFTs.
 Key Features: ERC721A minting, Ownable, AccessControl (MINTER_ROLE, BURNER_ROLE), stores speciesId & generation on-chain, uses baseURI for metadata.
 Owner/Admin: Deployer (0x0719...) initially owns contract and holds DEFAULT_ADMIN_ROLE.
 Roles Granted: MINTER_ROLE granted to TradingDesk, PetAdoption, PetForge proxies. BURNER_ROLE granted to PetForge proxy.
 Base URI (Testnet): "https://api.degenpets.com/temp-metadata/" (Placeholder).
* C. TradingDesk (Proxy) (0x6f2A...f68)
 Type: UUPS Upgradeable Logic Contract
 Purpose: Handles the initial acquisition of a starter pet via a fixed ETH payment.
 Key Features: Accepts 0.01 ETH, splits ETH (90% LP Seeding, 10% Treasury), mints a predefined starter pet NFT (Species 1, Gen 1) via DegenPetNFT. Pausable.
 Owner/Admin: Deployer (0x0719...) initially. Controls wallets, price, starter pet config, pausing, upgrades.
 Dependencies: DegenPetNFT.
 Roles Required: MINTER_ROLE on DegenPetNFT.
 Configuration (Testnet): LP Wallet (0x580...), Treasury (0x657C...), Price (0.01 ETH), Starter (1, 1).
* D. PetAdoption (Proxy) (0x1Eed...8960)
 Type: UUPS Upgradeable Logic Contract
 Purpose: Allows users to purchase specific Gen 1 pet species using $DGPT.
 Key Features: Accepts $DGPT (100 $DGPT), burns 100% of the fee, mints the chosen species (Gen 1) via DegenPetNFT. Requires user $DGPT approval. Pausable.
 Owner/Admin: Deployer (0x0719...) initially. Controls price, pausing, upgrades.
 Dependencies: DegenPetNFT, DGPToken.
 Roles Required: MINTER_ROLE on DegenPetNFT.
 Configuration (Testnet): Price (100 $DGPT).
* E. PetForge (Proxy) (0x6A5f...0FF1)
 Type: UUPS Upgradeable Logic Contract
 Purpose: Allows users to burn two owned pets and pay a $DGPT fee to receive a special "Cybernetic" pet NFT.
 Key Features: Verifies parent ownership, requires $DGPT fee approval (500 $DGPT), burns 100% of fee, burns both parent NFTs, mints a predefined "Cybernetic" NFT (Species 255, Gen 1).
 Owner/Admin: Deployer (0x0719...) initially. Controls fee, Cybernetic outcome config, upgrades.
 Dependencies: DegenPetNFT, DGPToken.
 Roles Required: MINTER_ROLE, BURNER_ROLE on DegenPetNFT.
 Configuration (Testnet): Fee (500 $DGPT), Cybernetic Outcome (Species 255, Gen 1).
* F. TournamentManager (Proxy) (0x8339...7cB)
 Type: UUPS Upgradeable Logic Contract
 Purpose: Handles fixed $DGPT buy-ins for tournaments.
 Key Features: Accepts $DGPT buy-in (25 $DGPT), burns 10% of fee, holds 90% in contract. Requires user $DGPT approval. Allows owner to withdraw held funds. Pausable.
 Owner/Admin: Deployer (0x0719...) initially. Controls buy-in amount, pausing, fund withdrawal, upgrades.
 Dependencies: DGPToken.
 Configuration (Testnet): Buy-in (25 $DGPT), Burn Address (0x...dEaD).
* G. RewardPool Proxies (PvE 0xe2Ab...83A3, Achievement 0x9231...0B09, Tournament 0x9FA2...989b)
 Type: UUPS Upgradeable Logic Contract (Single Implementation, Multiple Proxies)
 Purpose: Securely hold $DGPT allocated for specific reward categories.
 Key Features: Holds $DGPT. Allows owner to withdraw funds to specified recipients via withdrawRewards. Rejects accidental ETH.
 Owner/Admin: Rewards Admin (0xC89D...) for all pools. Controls withdrawal, upgrades.
 Dependencies: DGPToken.
 Configuration (Testnet): Initial funds received via TGE script.
* H. LPTokenLocker (Proxy) (0x47Eb...47c9)
 Type: UUPS Upgradeable Logic Contract
 Purpose: Receives and time-locks LP tokens generated by the RoyaltyProcessor.
 Key Features: Holds specific ERC20 LP token. Allows owner to withdraw entire balance only after lock expires (3 years). Rejects accidental ETH.
 Owner/Admin: LP Locker Owner (0x580..., Deployer for now). Controls withdrawal after lock, upgrades.
 Dependencies: Target LP Token contract (Address needed).
 Configuration (Testnet): Owner, Lock Duration (3 years). NOTE: Initialized with $DGPT address as placeholder LP token; needs update post-pool creation.
* I. RoyaltyProcessor (Proxy) (0xc857...BBAF)
 Type: UUPS Upgradeable Logic Contract
 Purpose: Processes incoming ETH royalties for buyback/LP function. Designed to be triggered externally (Keeper/Automation).
 Key Features: Receives ETH. Splits ETH (20% Treasury, 80% for Buyback/LP). Swaps 40% ETH for $DGPT via DEX Router. Adds liquidity (40% ETH + bought $DGPT) to DEX. Sends resulting LP tokens to LPTokenLocker. Owner controls target wallets  and slippage.
Owner/Admin: Royalty Owner (0x580..., Deployer for now). Controls wallets, slippage, processing trigger (if manual), upgrades.
Dependencies: DGPToken, LPTokenLocker Proxy, DEX Router (IUniswapV2Router02 interface), WETH.  Configuration (Testnet): Router (0x475...), WETH (0x42...06), Treasury (0x657C...), Locker (0x47Eb...), Slippage (0.5%). NOTE: Assumes target DEX uses Uniswap V2 interface.
