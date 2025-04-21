# Guide: Forging Pets

Forging is a core endgame mechanic in Degen Pets that allows you to combine two existing Pet NFTs from your collection to create a brand new one. This process is essential for refining your roster, potentially consolidating traits from successful parents, and reducing the overall Pet NFT supply. It's also the planned pathway to future Generation 2 Pets.

*(Placeholder: Insert screenshot of the Forge screen mockup here)*
*Figure 8: Example Forging Interface*

## The Forging Process: Step-by-Step

1.  **Navigate to the Forge:** Find the "Forge" section within the Degen Pets application.
2.  **Select Parent A:** You'll be prompted to choose the first parent Pet. Click the selection area, which will likely open a view of your Pet Collection. Choose any Pet NFT you own that is *not* currently sleeping or potentially undergoing another process.
3.  **Select Parent B:** Similarly, choose the second parent Pet from your collection. You must select a *different* Pet NFT than Parent A. Both parents must be owned by you.
4.  **Review Details & Cost:** The interface will display the two selected parents and the required **Forging Fee (500* $DGPT)**.
5.  **Confirm & Initiate Forging:**
    *   Read the warnings carefully! **Forging permanently burns BOTH Parent NFTs.** They will be removed from your collection forever.
    *   Click the `[Forge Now]` or similar confirmation button.
    *   Your wallet will prompt you to:
        *   Approve the Forging Contract to manage the two Parent Pet NFTs (if you haven't already).
        *   Approve the Forging Contract to spend the $DGPT Forging Fee*.
        *   Confirm the main transaction to initiate the Forging process, which will transfer the $DGPT fee (with a high %* being burned) and trigger the burning of the parent NFTs.
6.  **Processing:** Once your transaction confirms on the blockchain, the Forging process begins. The smart contract:
    *   Burns the parent NFTs.
    *   Burns the required $DGPT fee portion.
    *   Requests secure randomness from Chainlink VRF.
    *   Waits for the VRF callback with the random number.
    *   Determines the offspring's traits (see below).
    *   Mints the new offspring Pet NFT directly to your wallet.
    *   You'll likely see a "Forging in Progress..." or similar indicator in the UI. This can take a short while depending on blockchain speed and VRF response time.
7.  **Success! New Pet Minted:** Once complete, you'll receive a notification, and the new Generation 1 (or higher) Pet NFT will appear in your Collection.

## Understanding the Offspring

The newly forged Pet is unique but inherits traits based on its parents:

1.  **Species & Core Strategy:** The offspring inherits the **Species** (and therefore the core trading strategy) of the parent that had the **higher historical Win Rate***.
    *   *(Requirement):* A minimum number of trades (e.g., 50*) is likely required for a parent's Win Rate to be considered.
    *   *(Tie-breaker):* If neither parent meets the requirement, or if Win Rates are equal, the system may default to the species of Parent A*, or potentially allow the player to choose* (Final logic TBD).
2.  **Parameters:** The offspring receives **newly randomized parameters** specific to its inherited Species, within the standard allowed ranges.
    *   **Inheritance Chance:** However, for *each* parameter, there is a small chance* (e.g., 10%*) that the offspring will **inherit the exact parameter value** from the parent whose Species was chosen, instead of getting a new random value. This allows for the possibility of passing down desirable traits.
3.  **Generation:** The offspring's Generation is calculated based on its parents (typically `max(ParentA_Gen, ParentB_Gen) + 1`). Your first forged pet will be Generation 1. Forging two Gen 1 pets results in a Gen 2 pet, and so on.
4.  **Badges & History:** The new Pet starts with a fresh history – it does **not** inherit the badges, trade count, or PnL stats of its parents.

## Why Forge?

*   **Supply Sink:** Removes two NFTs from circulation, contributing to scarcity.
*   **$DGPT Burn:** Removes significant $DGPT via the fee burn.
*   **Strategic Consolidation:** Allows you to potentially get more Pets of a Species/Strategy type you find effective by using parents of that type.
*   **Trait Inheritance:** Offers a small chance to pass on potentially "lucky" or effective parameters from a successful parent.
*   **Access to Future Generations:** Forging is the only way to create higher-generation pets, which is planned to be necessary for accessing potential future features or mechanics (like Gen 2 strategies*).

Forging is a core endgame loop that requires careful consideration and strategic use of your Pet collection and $DGPT resources.

---

**Next Step:** Explore the advanced strategy customization available in the [Guide: Quant Lab](7-Quant_Lab_Guide.md).
