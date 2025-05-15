# Guide: Markets & Simulation

Degen Pets trade within a simulated environment based on real cryptocurrency market concepts. Understanding how this simulation works and how to assign your Pets to the right markets and timeframes is crucial for optimizing their performance.

(*Note: Markets have yet to be defined, we are experimenting with various markets to offer more variety across the various automated strategies. Although simulated we use real market data for the experiance)

## The Simulated Market Environment

*   **Assets:** Degen Pets trade specific cryptocurrency pairs. The initial set includes major assets like BTC/USDT, ETH/USDT*, APE/USDT, SOL/USDT* and HYPE/USDT*. More assets, potentially including those with different volatility profiles, are planned for future addition.
*   **Data Source:**
    *   *Beta Phase:* The simulation uses a fixed historical dataset spanning several months. All pets trade against this same historical data chronologically during the Beta.
    *   *Post-Beta:* The goal is to transition to using near real-time market data feeds via API (subject to project resources). Even then, the trading remains **simulated** – your Pets execute trades within the game's environment, affecting your $DGPT balance and Pet stats, but **no real funds are ever risked**, and no orders are placed on actual exchanges.
*   **No Trading Costs (Initially):** For simplicity, the simulation currently does not include factors like exchange fees, gas costs, or price slippage. A Pet's Profit and Loss (PnL) is calculated purely based on the simulated entry and exit prices determined by its strategy signals.

*(Placeholder: Insert screenshot of the Market View mockup here, showing list of assets)*
*Figure 6: Example Market Selection View*

## Assigning Markets and Timeframes

You have direct control over *where* and *how* your active Pets apply their strategies. This assignment happens via the **Info/Action Panel** on the [Trading Desk](2-Trading_Desk.md) or potentially from the [Pet Detail View](3-Understanding_Pets.md#the-pet-detail-view).

1.  **Select an Active Pet:** Click on one of the Pet Slots on your Trading Desk (or navigate to the Pet Detail View for an active pet).
2.  **Choose the Market:**
    *   Find the "Assign/Change Market" button or dropdown menu in the Info/Action Panel (or on the Detail View).
    *   A list of available asset pairs (e.g., BTC/USDT, ETH/USDT...) will be displayed.
    *   Select the market you want this Pet to trade on.
3.  **Choose the Timeframe:**
    *   Find the "Assign/Change Timeframe" button or dropdown menu.
    *   A list of available candle timeframes will appear (Initially: 1m*, 5m*, 15m*, 1h*, 4h*).
    *   Select the timeframe you want this Pet's strategy to analyze (e.g., choosing `1h` means the Pet's indicators like EMA or MACD will be calculated based on 1-hour price candles).
4.  **Confirm:** Save or confirm your selections.

**The Pet will now start analyzing data and executing trades based on its unique parameters applied to the chosen Market and Timeframe.**

**Strategic Considerations:**

*   **Volatility & Strategy:** Some strategies thrive in high volatility (like breakout strategies - Frog*), while others prefer smoother trends (like MA crossovers - Cat*, Gorilla*). Some assets are typically more volatile than others. Matching strategy to asset volatility is key.
*   **Timeframe Impact:** A strategy's behaviour changes drastically based on the timeframe. A short-term EMA cross on a 5m chart will generate many more signals (and potentially noise) than the same strategy on a 4h chart. Faster timeframes might suit scalping-type pets (Cat*), while slower timeframes suit long-term trend followers (Gorilla*). Experimentation is crucial.
*   **Pet Parameters:** Remember your Pet's unique parameters! A Cat with very short EMA lengths might perform differently than a Cat with longer EMA lengths on the same Market/Timeframe.

## Using the Visual Backtester Tool (Requires Unlock*)

Making informed decisions about market and timeframe assignments can be challenging. The Visual Backtester is a powerful tool designed to help.

*(Placeholder: Insert screenshot of the Visual Backtester View mockup here, showing chart + indicator overlay)*
*Figure 7: Example Visual Backtester View*

*   **Access:** Requires a one-time purchase of the **Advanced Charting Module*** using $DGPT (Cost: 150* $DGPT, Burn Rate: 90%*).
*   **Functionality:**
    1.  Select one of your **owned Pet NFTs**.
    2.  Select any **available Market**.
    3.  Select any **available Timeframe**.
    4.  The tool displays a historical price chart for the chosen Market/Timeframe.
    5.  **Crucially:** It overlays the specific technical indicator(s) used by your selected Pet's strategy, calculated using *that Pet's unique, on-chain parameters*.
    6.  It visually marks the points on the chart where **your specific Pet's logic** would have generated **Buy** and **Sell** signals in the past.
*   **Purpose:** Allows you to visually simulate and assess how *your actual Pet* might have performed under different conditions *before* committing it to active trading on that setup. Compare different markets and timeframes for the same pet to find potentially better fits. This is your primary tool for data-driven decision-making in pet assignment.

---

**Next Step:** Learn about evolving your collection through [Guide: Forging Pets](6-Forging_Guide.md).
