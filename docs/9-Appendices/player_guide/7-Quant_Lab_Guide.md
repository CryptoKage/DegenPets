# Guide: Quant Lab

The Quant Lab is an advanced, endgame feature in Degen Pets designed for players who want to experiment deeply with trading strategies beyond the inherent traits of their Pet NFTs. Accessing and utilizing the Quant Lab requires a significant $DGPT investment.

*(Placeholder: Insert screenshot of the Quant Lab interface mockup here - showing locked state and unlocked state with assigned pet)*
*Figure 9: Example Quant Lab View*

## Unlocking the Quant Lab

*   **Requirement:** Access to the Quant Lab is not available by default.
*   **Cost:** You must first permanently unlock the feature for your account by paying a one-time fee of **1000* $DGPT**.
*   **Mechanism:** Navigate to the "Quant Lab" section of the application. If locked, you'll see the unlock cost and a button like `[Unlock Quant Lab]`. Clicking this will initiate a $DGPT transaction.
*   **Burn Rate:** A high percentage (target 90%*) of this unlock fee is **permanently burned**, making it a major $DGPT sink.
*   **Outcome:** Once the transaction confirms, the Quant Lab interface becomes accessible for your account. Initially, it grants you **one slot** for assigning a Pet. *(Future updates might allow upgrading for more slots at additional cost - TBD)*.

## Using the Quant Lab: Strategy Swapping

The core function of the Quant Lab is to allow **temporary strategy overrides** for an assigned Pet.

1.  **Assign a Pet:**
    *   Click on the available (initially one) slot in the Quant Lab interface.
    *   This will open a selector showing your Pet Collection. Choose any Pet you own (ideally one that isn't currently needed on the Trading Desk, although you *can* assign an active pet – it will use the Lab strategy while assigned).
    *   Confirm your selection. The chosen Pet will now occupy the Lab slot.

2.  **Select a New Strategy:**
    *   With the Pet assigned to the Lab slot, you'll see an option (likely a dropdown menu) labeled "Select Strategy" or similar.
    *   This menu lists **all 12 core Pet strategy types** available in the game (EMA Cross, MACD Trend, RSI Mean Reversion, Supertrend, Stochastic, etc.).
    *   Choose the strategy you want this Pet to *temporarily* use.

3.  **Parameter Usage:**
    *   When a Pet uses a swapped strategy via the Quant Lab, it does **NOT** use its own unique NFT parameters.
    *   Instead, it uses the **standard default parameters** associated with the chosen strategy type (e.g., if you swap a Cat to use MACD, it will likely use the default MACD settings like 12-period fast EMA, 26-period slow EMA, 9-period signal EMA* - exact defaults TBD).
    *   This allows you to test how the *core strategy itself* performs without the influence of unique (and potentially suboptimal) NFT parameters.

4.  **Activation:**
    *   Once a new strategy is selected, the change is active immediately *for as long as the Pet remains assigned to the Quant Lab slot*.
    *   If this Pet is also assigned to your Trading Desk, it will now trade using the selected Quant Lab strategy and its default parameters on its assigned Market/Timeframe. Its performance (PnL, Mood changes) will be based on this temporary strategy.

5.  **Removing from Lab:**
    *   Select the Pet within the Quant Lab interface.
    *   Click the `[Remove from Lab]` or similar button.
    *   The Pet is removed from the Lab slot (freeing it up).
    *   **Crucially:** The Pet immediately **reverts** to using its original, **NFT-defined Species Strategy and unique Parameters**. Any temporary strategy swap is instantly cancelled.

## Why Use the Quant Lab?

*   **Experimentation:** Test how different core strategies perform in current market conditions without needing to own a Pet of that specific species.
*   **Adaptability:** Temporarily assign a more suitable strategy to one of your active pets if market conditions drastically change (e.g., switch a mean-reversion pet to a trend-following strategy during a strong trend).
*   **Benchmarking:** See how a strategy performs with default parameters compared to your owned Pets with their unique random parameters.
*   **Endgame $DGPT Sink:** Provides a high-value utility for significant $DGPT expenditure.

The Quant Lab is a powerful tool for experienced players looking to gain an edge through strategic experimentation, but remember its effects are temporary and tied to the Lab slot.

---

**Next Step:** Learn about competitive play in [Guide: Tournaments Explained](8-Tournaments.md).
