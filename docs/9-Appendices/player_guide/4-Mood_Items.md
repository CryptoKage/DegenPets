# Guide: Managing Mood & Using Items

Your Degen Pets aren't just emotionless trading bots; their performance and recent experiences affect their **Mood**. Managing Mood is a key aspect of keeping your Pets trading effectively and maximizing your potential earnings.

## Understanding Pet Mood

Think of Mood as a measure of your Pet's current trading morale or stamina. It ranges from 0 to 100.

*   **Viewing Mood:** You can see a Pet's current Mood on its Pet Card in the Collection, on its Active Slot view on the Trading Desk, and in detail on its Pet Detail View. It's often represented by a visual bar (changing color from red at low mood, to yellow/orange, to green at high mood) and a numerical value.

*   **How Mood Changes:**
    *   **Losing Trade:** Closing a trade at a loss significantly decreases Mood (**-5*** Mood points).
    *   **Profitable Trade:** Closing a trade with profit provides a small Mood boost (**+1*** Mood point).
    *   **Break-Even Trade:** Closing a trade at break-even has **no effect** on Mood.
    *   **Item Use:** Using specific items like Energy Drinks, Stimulants, or Relaxants instantly increases Mood (see below).
    *   **Resting:** Pets inactive in your Collection slowly regenerate Mood over time (**+2*** Mood per hour*).

*   **Consequences of Low Mood (Sleep):**
    *   If a Pet's Mood drops all the way to **0**, it becomes overwhelmed or "tilted".
    *   The Pet immediately enters a **Sleep** state and becomes **inactive**, even if assigned to the Trading Desk. It stops trading.
    *   The Sleep state lasts for a fixed duration (**6 hours***). You can see the remaining time on the Pet's status.
    *   While sleeping, the Pet cannot trade or be used for actions like Forging.
    *   Upon waking up naturally after 6 hours, the Pet's Mood automatically resets to **50*** (a neutral state), and it becomes Idle, ready to be assigned a market/timeframe again if it was on the Desk.

*   **Benefits of High Mood:**
    *   Keeping Pets in a good Mood ensures they remain active and continue trading according to their strategy.
    *   When a Pet's Mood reaches the maximum of **100**, you instantly receive a $DGPT reward (**+30*** $DGPT) credited to your account, and the Pet's Mood resets to **50***, allowing the cycle to continue.

**Strategic Implication:** Letting a consistently losing Pet hit 0 Mood forces a cooldown period, naturally reducing its negative impact while it rests and recovers. Conversely, keeping profitable pets topped up with Items can maximize their trading uptime and potential to hit the max Mood bonus.

---

## Using Items

Items are consumable tools purchased with $DGPT from the Shop that help you manage your Pets' Mood or gain insights.

*(Placeholder: Insert screenshot of the Item Shop mockup here)*
*Figure 5: Example Item Shop View*

### Item List & Effects:

*(See the full [Item List](../Item_List.md) appendix for current costs)*

*   **Energy Drink:** Instantly grants **+15*** Mood to the selected Pet. A basic pick-me-up.
*   **Stimulants:** Instantly grants **+25*** Mood to the selected Pet. A significant boost. *(May have minor secondary effects on trade frequency - TBD)*.
*   **Relaxants:** Instantly grants **+25*** Mood to the selected Pet. A significant boost. *(May have minor secondary effects on trade frequency - TBD)*.
*   **AI Briefing:** Provides tactical text suggestions comparing current market conditions (based on simple server-side analysis) to your owned Pet roster's strategies and parameters. Helps with deciding which Pet/Market/Timeframe combination might be favorable. Consumed on use.

### How to Buy Items:

1.  Navigate to the **"Shop"** section of the application.
2.  View the available items, their effects, and their $DGPT costs*.
3.  Select the item you wish to purchase.
4.  Enter the desired quantity.
5.  Click the `[Buy Items]` button.
6.  Your wallet will likely prompt you to approve the $DGPT spending (if it's the first time buying or you haven't approved enough) and then confirm the transaction to spend the $DGPT.
7.  Once the transaction confirms, the items are added to your off-chain inventory (typically displayed somewhere in your profile or Shop interface).

### How to Use Items:

1.  Navigate to the Pet you want to use an item on (either via the **Trading Desk** view -> selecting the active pet -> using the Info/Action Panel, or via the **Collection** view -> selecting the pet -> **Pet Detail View**).
2.  Find and click the `[Use Item]` button associated with that Pet.
3.  A list or modal showing your available item inventory will appear.
4.  Select the specific item you want to use (e.g., "Energy Drink").
5.  Confirm the use.
6.  The item's effect will be applied instantly (e.g., Mood increases), and one count of that item will be deducted from your inventory.

Using items strategically can help prevent pets from falling asleep, push them towards the max mood bonus, or provide helpful guidance via the AI Briefing.

---

**Next Step:** Learn about the simulated markets and how to assign your pets in [Guide: Markets & Simulation](5-Markets_Simulation.md).
