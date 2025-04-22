---
# Detailed Pet Strategies & Parameters

This section provides details on the specific trading strategy used by each Degen Pet species and explains the unique, randomized parameters that influence their behavior. Understanding these is key to optimizing your Pet's market and timeframe assignments.

(Remember: All parameter values marked with * are initial placeholders and subject to potential tuning based on testing and balancing.)

---

# 1. Cat (EMA Cross Strategy)

*   **Strategy Type:** Trend Following (Short-Term)
*   **Concept:** The Cat aims to catch short-to-medium term trends by identifying when a faster-moving average price crosses over a slower-moving average price. A cross-up signals a potential uptrend (Buy), while a cross-down signals a potential downtrend (Sell). It's generally more active than longer-term strategies.
*   **Parameters:**
    *   `cat_ema_fast_length`
        *   **Effect:** Controls the lookback period (number of candles) for the *faster* Exponential Moving Average (EMA). A lower number makes the EMA react more quickly to recent price changes, potentially catching trends earlier but also being more susceptible to short-term noise or "whipsaws".
        *   **Range:** Integer between 5* and 20*.
    *   `cat_ema_slow_length`
        *   **Effect:** Controls the lookback period for the *slower* EMA. A higher number makes the EMA smoother and slower to react, acting as the baseline trend indicator. The greater the difference between fast and slow lengths, the less frequent the signals typically are.
        *   **Range:** Integer between 21* and 50*.
        *   **Constraint:** Must be greater than `cat_ema_fast_length`.

---

# 2. Frog (Donchian Channel Breakout Strategy)

*   **Strategy Type:** Volatility Breakout
*   **Concept:** The Frog patiently waits for the price to make a significant move ("leap") outside of its recent trading range. It uses Donchian Channels, which plot the highest high and lowest low over a set period. A Buy signal occurs when the price breaks *above* the recent high (upper channel), and a Sell signal occurs when the price breaks *below* the recent low (lower channel). It excels in trending markets after periods of consolidation.
*   **Parameters:**
    *   `frog_donchian_lower_len`
        *   **Effect:** Defines the lookback period (number of candles) for calculating the *lowest low* (the Lower Donchian Channel). A shorter period makes the lower channel react faster to recent lows, potentially triggering sell signals sooner on breakdowns.
        *   **Range:** Integer between 10* and 30*.
    *   `frog_donchian_upper_len`
        *   **Effect:** Defines the lookback period for calculating the *highest high* (the Upper Donchian Channel). A shorter period makes the upper channel react faster to recent highs, potentially triggering buy signals sooner on breakouts. *(Note: Often, lower and upper lengths are the same, but allowing variation adds nuance).*
        *   **Range:** Integer between 10* and 30*.

---

# 3. Blob (RSI Mean Reversion Strategy)

*   **Strategy Type:** Oscillator / Mean Reversion
*   **Concept:** The Blob operates on the idea that prices tend to revert to their average after extreme moves. It uses the Relative Strength Index (RSI), a momentum oscillator measuring the speed and change of price movements. The Blob looks to Buy when the RSI suggests the asset is "oversold" (price dropped too quickly) and Sell when the RSI suggests it's "overbought" (price rose too quickly), anticipating a pullback.
*   **Parameters:**
    *   `blob_rsi_length`
        *   **Effect:** Sets the lookback period (number of candles) for the RSI calculation. A shorter length makes the RSI more volatile and reach extreme levels more frequently. A longer length results in a smoother RSI with fewer extreme readings.
        *   **Range:** Integer between 7* and 21*.
    *   `blob_rsi_oversold_level`
        *   **Effect:** Defines the RSI level below which the Blob considers the asset potentially oversold, triggering a Buy signal when RSI crosses *back above* this level. A lower value (e.g., 20) requires a more significant price drop to trigger.
        *   **Range:** Integer between 20* and 35*.
    *   `blob_rsi_overbought_level`
        *   **Effect:** Defines the RSI level above which the Blob considers the asset potentially overbought, triggering a Sell signal when RSI crosses *back below* this level. A higher value (e.g., 80) requires a more significant price rise to trigger.
        *   **Range:** Integer between 65* and 80*.
        *   **Constraint:** Must be greater than `blob_rsi_oversold_level`.

---

# 4. Ape (MACD Trend Strategy)

*   **Strategy Type:** Trend Following (Momentum Oscillator)
*   **Concept:** The Ape follows momentum shifts using the Moving Average Convergence Divergence (MACD) indicator. MACD shows the relationship between two EMAs of price. A "Signal Line" (an EMA of the MACD line itself) is used for triggers. The Ape typically Buys when the MACD line crosses above the Signal Line (indicating increasing bullish momentum) and Sells when it crosses below (indicating increasing bearish momentum).
*   **Parameters:**
    *   `ape_macd_fast_period`
        *   **Effect:** The lookback period for the *faster* EMA used in the main MACD calculation. Shorter periods make the MACD react more quickly.
        *   **Range:** Integer between 8* and 20*.
    *   `ape_macd_slow_period`
        *   **Effect:** The lookback period for the *slower* EMA used in the main MACD calculation. Must be greater than the fast period. Larger differences between slow and fast generally result in a MACD that moves less frequently above/below zero.
        *   **Range:** Integer between 21* and 40*.
        *   **Constraint:** Must be greater than `ape_macd_fast_period`.
    *   `ape_macd_signal_period`
        *   **Effect:** The lookback period for the EMA of the MACD line itself (the Signal Line). A shorter period creates a signal line that follows the main MACD line more closely, leading to more frequent crossover signals (potentially more noise). A longer period smooths the signal line, resulting in fewer, potentially more reliable, signals.
        *   **Range:** Integer between 5* and 15*.

---

# 5. Gorilla (Supertrend Strategy)

*   **Strategy Type:** Trend Following (Volatility-Based)
*   **Concept:** The Gorilla aims to identify and ride major trends while filtering out minor price fluctuations. It uses the Supertrend indicator, which plots a line above or below the price based on average volatility (ATR - Average True Range). When the price closes above the Supertrend line, the trend is considered Up (Buy signal, line moves below price acting as trailing support). When the price closes below the line, the trend is considered Down (Sell signal, line moves above price acting as trailing resistance). It tends to trade less frequently than MA crossover systems.
*   **Parameters:**
    *   `gorilla_supertrend_atr_length`
        *   **Effect:** This sets the lookback period (number of candles) for the Average True Range (ATR) calculation, which measures market volatility. A shorter length makes the ATR (and thus the Supertrend bands) more reactive to recent volatility spikes. A longer length smooths the volatility reading.
        *   **Range:** Integer between 7* and 21*.
    *   `gorilla_supertrend_multiplier`
        *   **Effect:** This factor multiplies the ATR value to determine how far away the Supertrend bands are plotted from the price. A smaller multiplier (e.g., 2.0) creates tighter bands, leading to earlier signals but potentially more whipsaws in choppy markets. A larger multiplier (e.g., 5.0) creates wider bands, filtering more noise but potentially entering/exiting trends later.
        *   **Range:** Float between 2.0* and 5.0* (Step: 0.5*).

---

# 6. Crocodile (Stochastic Oscillator Strategy)

*   **Strategy Type:** Momentum Oscillator / Reversal Indication
*   **Concept:** The Crocodile lies in wait for momentum to reach extreme levels, anticipating a potential reversal ("snap"). It uses the Stochastic Oscillator, which compares a closing price to its price range over a certain period. It generates %K (raw value) and %D (smoothed %K) lines oscillating between 0 and 100. The Croc typically Buys when the %K line crosses above the %D line in "oversold" territory (e.g., below 20) and Sells when %K crosses below %D in "overbought" territory (e.g., above 80).
*   **Parameters (5 total):**
    *   `croc_stoch_k`
        *   **Effect:** The main lookback period (number of candles) for calculating the highest high and lowest low used in the raw %K calculation. A shorter period makes the oscillator more sensitive and erratic.
        *   **Range:** Integer between 10* and 21*.
    *   `croc_stoch_d`
        *   **Effect:** The period used for the Simple Moving Average (SMA) applied to the %K line to create the smoother %D (signal) line. A shorter period makes %D follow %K more closely (more signals).
        *   **Range:** Integer between 3* and 7*.
    *   `croc_stoch_smooth_k`
        *   **Effect:** An additional smoothing period (SMA) applied to the *raw* %K *before* the %D calculation (sometimes called "Slow Stochastic"). A value of 1 typically means no smoothing (Fast Stochastic), while a value like 3 (common) slows down the %K line itself, filtering noise before the %D cross.
        *   **Range:** Integer between 3* and 7*.
    *   `croc_stoch_oversold`
        *   **Effect:** Defines the threshold below which a K/D crossover signals a Buy. A lower value requires a stronger oversold condition.
        *   **Range:** Integer between 15* and 30*.
    *   `croc_stoch_overbought`
        *   **Effect:** Defines the threshold above which a K/D crossover signals a Sell. A higher value requires a stronger overbought condition.
        *   **Range:** Integer between 70* and 85*.
        *   **Constraint:** Must be greater than `croc_stoch_oversold`.

---

# 7. Goblin (Rate of Change Threshold Strategy)

*   **Strategy Type:** Momentum Breakout
*   **Concept:** The Goblin gets excited by sudden, sharp price movements. It uses the Rate of Change (ROC) indicator, which measures the percentage price change over a defined period. The Goblin sets a threshold; if the price increases by more than that percentage (positive threshold) within the period, it signals a Buy. If it decreases by more than that percentage (negative threshold), it signals a Sell. It aims to jump onto sudden bursts of momentum.
*   **Parameters:**
    *   `goblin_roc_length`
        *   **Effect:** The lookback period (number of candles) over which the percentage change is calculated. A shorter length measures very recent, potentially noisy, bursts. A longer length measures more sustained momentum shifts.
        *   **Range:** Integer between 7* and 21*.
    *   `goblin_roc_threshold`
        *   **Effect:** The minimum percentage change (positive for Buy, negative for Sell) required within the `goblin_roc_length` period to trigger a signal. A lower threshold (e.g., 0.5%) will trigger on smaller moves (more signals, potentially false). A higher threshold (e.g., 3.0%) requires a significant price spike (fewer signals, potentially missing smaller bursts).
        *   **Range:** Float between 0.5* and 3.0* (Step: 0.1*).

---

# 8. Seal (Bollinger Band Mean Reversion Strategy)

*   **Strategy Type:** Volatility / Mean Reversion
*   **Concept:** The Seal plays within expected price boundaries defined by volatility. It uses Bollinger Bands, which plot bands a certain number of standard deviations above and below a central moving average. The Seal assumes that when price touches an outer band, it's likely overextended and will revert towards the middle. It Buys when price hits the Lower Band and Sells when price hits the Upper Band, often exiting when price returns to the Middle Band.
*   **Parameters:**
    *   `seal_bbands_length`
        *   **Effect:** The lookback period (number of candles) for the central Simple Moving Average (SMA) and the standard deviation calculation. A shorter length makes the bands react faster to recent price action and volatility.
        *   **Range:** Integer between 10* and 30*.
    *   `seal_bbands_std_dev`
        *   **Effect:** The number of standard deviations used to plot the Upper and Lower Bands away from the central SMA. A smaller value (e.g., 1.5) creates narrower bands, leading to more frequent signals as price touches them often (suited for low volatility). A larger value (e.g., 3.0) creates wider bands, requiring stronger moves to touch them (fewer signals, suited for higher volatility).
        *   **Range:** Float between 1.5* and 3.0* (Step: 0.1*).

---

---

# 9. Penguin (CCI Strategy)

*   **Strategy Type:** Momentum Oscillator / Cyclical Trading
*   **Concept:** The Penguin tries to identify cyclical turns or emerging trends by measuring price deviation from its statistical average. It uses the Commodity Channel Index (CCI), which oscillates around a zero line. High positive values suggest strong upward momentum (potentially overbought), while low negative values suggest strong downward momentum (potentially oversold). The Penguin typically Buys when CCI crosses *above* a lower threshold (signaling upward turn from oversold) and Sells when CCI crosses *below* an upper threshold (signaling downward turn from overbought).
*   **Parameters:**
    *   `penguin_cci_length`
        *   **Effect:** The lookback period (number of candles) used for calculating the average price and its deviation. Shorter lengths make the CCI more volatile and reach extremes more often. Longer lengths smooth the CCI, resulting in fewer signals.
        *   **Range:** Integer between 10* and 30*.
    *   `penguin_cci_lower_threshold`
        *   **Effect:** The negative CCI level that price must cross *above* to generate a Buy signal. A more negative value (e.g., -150) requires a stronger oversold condition before signaling a potential reversal upwards.
        *   **Range:** Integer between -150* and -75*.
    *   `penguin_cci_upper_threshold`
        *   **Effect:** The positive CCI level that price must cross *below* to generate a Sell signal. A higher value (e.g., 150) requires a stronger overbought condition before signaling a potential reversal downwards.
        *   **Range:** Integer between 75* and 150*.
    *   *(Note: The CCI scaling constant `c` is typically fixed at 0.015 and not randomized).*

---

# 10. Owl (Awesome Oscillator Strategy)

*   **Strategy Type:** Momentum Oscillator
*   **Concept:** The Owl gauges market momentum by comparing short-term momentum to longer-term momentum, using moving averages of the midpoint price ((High + Low) / 2). The Awesome Oscillator (AO) is plotted as a histogram oscillating around zero. The Owl primarily uses the zero-line crossover: Buying when the histogram crosses from negative to positive (short-term momentum overtaking long-term) and Selling when it crosses from positive to negative.
*   **Parameters:**
    *   `owl_ao_fast_length`
        *   **Effect:** The lookback period (number of candles) for the *faster* Simple Moving Average (SMA) of the midpoint price. A shorter period makes the AO react more quickly to recent momentum shifts.
        *   **Range:** Integer between 4* and 10*.
    *   `owl_ao_slow_length`
        *   **Effect:** The lookback period for the *slower* SMA of the midpoint price. The difference between fast and slow periods determines the sensitivity of the oscillator.
        *   **Range:** Integer between 25* and 40*.
        *   **Constraint:** Must be greater than `owl_ao_fast_length`.
    *   *(Note: More complex AO strategies involving histogram patterns like "Saucer" or "Twin Peaks" exist but are not used for the basic Owl signal generation initially).*

---

# 11. Fox (TRIX Strategy)

*   **Strategy Type:** Momentum Oscillator (Smoothed)
*   **Concept:** The Fox aims to filter out market noise and identify more significant momentum shifts. It uses TRIX, which calculates the percentage Rate of Change (ROC) of a *triple* exponentially smoothed moving average (EMA) of the closing price. This heavy smoothing reduces sensitivity to minor fluctuations. The Fox typically generates signals when the TRIX line crosses over its own Signal Line (an EMA of the TRIX line), similar to MACD but with a different underlying calculation focused on smooth momentum.
*   **Parameters:**
    *   `fox_trix_length`
        *   **Effect:** The lookback period (number of candles) used for *each* of the three EMA smoothing passes. A longer length results in a much smoother, slower TRIX line that filters more noise but reacts later to trend changes.
        *   **Range:** Integer between 12* and 25*.
    *   `fox_trix_signal_length`
        *   **Effect:** The lookback period for the EMA applied to the TRIX line itself to create the Signal Line. A shorter period makes the signal line track the TRIX line more closely (more frequent crossovers). A longer period smooths the signal line (fewer crossovers).
        *   **Range:** Integer between 7* and 15*.

---

# 12. Squirrel (Chaikin Money Flow Strategy)

*   **Strategy Type:** Volume Oscillator
*   **Concept:** The Squirrel focuses on whether money is flowing into or out of an asset by combining price action and volume. It uses the Chaikin Money Flow (CMF) indicator, which measures buying and selling pressure over a set period. CMF oscillates around zero. Positive values suggest net buying pressure, while negative values suggest net selling pressure. The Squirrel typically Buys when CMF crosses above a small positive threshold (confirming buying pressure) and Sells when CMF crosses below a small negative threshold (confirming selling pressure).
*   **Parameters:**
    *   `squirrel_cmf_length`
        *   **Effect:** The lookback period (number of candles) over which money flow volume is accumulated. A shorter period makes the CMF more sensitive to recent bursts of buying/selling pressure. A longer period provides a smoother, longer-term view of money flow.
        *   **Range:** Integer between 14* and 30*.
    *   `squirrel_cmf_entry_threshold`
        *   **Effect:** The small positive value the CMF must cross *above* to trigger a Buy, or the small negative value it must cross *below* to trigger a Sell (e.g., threshold 0.05 means Buy > +0.05, Sell < -0.05). This filters out noise around the zero line. A higher absolute threshold requires stronger confirmation of buying/selling pressure.
        *   **Range:** Float between 0.02* and 0.10* (Step: 0.01*).
*   **Data Requirement:**
    **Important:** The Chaikin Money Flow strategy requires reliable **Volume** data for the selected Market/Timeframe. Ensure the data source provides accurate volume information for this Pet to function correctly.


---
