// src/app/shop/page.tsx
"use client";

import Layout from "@/components/Layout";
import styles from "@/components/Layout.module.css"; // Base page container
import shopStyles from './Shop.module.css'; // Specific styles
import { useState } from "react";
import Image from 'next/image';

// --- Mock Item Data ---
interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number; // Assuming $DGPT cost
    imageUrl: string; // Path relative to /public
}

const MOCK_SHOP_ITEMS: ShopItem[] = [
    { id: 'mood_boost_s', name: "Mood Booster (S)", description: "A small treat to slightly improve a Pet's mood.", cost: 50, imageUrl: "/ItemImages/mood_boost_s.png" },
    { id: 'mood_boost_m', name: "Mood Booster (M)", description: "A tasty snack guaranteed to lift a Pet's spirits.", cost: 150, imageUrl: "/ItemImages/mood_boost_m.png" },
    { id: 'strategy_reroll', name: "Strategy Chip Reroll", description: "WARNING: Randomly rerolls the Parameters on a Pet's Strategy Chip. Use with caution.", cost: 1000, imageUrl: "/ItemImages/reroll_chip.png" },
    { id: 'skip_cooldown', name: "Cooldown Skip", description: "Instantly finishes the current cooldown period for one Pet.", cost: 250, imageUrl: "/ItemImages/cooldown_skip.png" },
    { id: 'temp_param_boost', name: "Neuro-Optimizer (1H)", description: "Temporarily optimizes one Pet parameter for 1 hour.", cost: 500, imageUrl: "/ItemImages/param_boost.png" },
    { id: 'mood_stabilizer', name: "Mood Stabilizer", description: "Prevents mood drops from losses for the next 5 trades.", cost: 300, imageUrl: "/ItemImages/mood_stabilizer.png" },
    { id: 'common_data_feed', name: "Common Data Feed", description: "Unlocks access to standard market data streams for backtesting.", cost: 5000, imageUrl: "/ItemImages/data_feed.png" },
    // Add more mock items
];
// --- End Mock Data ---


export default function ShopPage() {
    // State for the items currently selected/added to the cart
    const [cart, setCart] = useState<ShopItem[]>([]);
    // State for the item currently hovered/selected in the list for display
    const [previewItem, setPreviewItem] = useState<ShopItem | null>(MOCK_SHOP_ITEMS[0] ?? null); // Show first item initially

    // Calculate total cost
    const totalCost = cart.reduce((sum, item) => sum + item.cost, 0);

    // Handle checking/unchecking item
    const handleItemToggle = (item: ShopItem, isChecked: boolean) => {
        if (isChecked) {
            setCart(prevCart => [...prevCart, item]);
        } else {
            setCart(prevCart => prevCart.filter(cartItem => cartItem.id !== item.id));
        }
    };

    // Handle hovering over item for preview (optional)
    const handleItemHover = (item: ShopItem | null) => {
        setPreviewItem(item);
    };

    // Handle Buy Button
    const handleBuy = () => {
        if (cart.length === 0) return;
        const itemNames = cart.map(item => item.name).join(', ');
        alert(`Attempting to buy: ${itemNames}\nTotal Cost: ${totalCost} $DGPT\n\nImplement $DGPT Approval & Purchase logic here!`);
        // TODO:
        // 1. Check if user has enough $DGPT balance (fetch from context/API)
        // 2. Check $DGPT allowance for the Shop Contract/Burn Address
        // 3. Prompt for approval if needed (DGPToken.approve(...))
        // 4. Prompt for purchase transaction (ShopContract.buy(...) or DGPToken.transfer/burn(...))
        // 5. On success, call backend API to confirm purchase and update inventory
        // 6. Clear cart: setCart([])
    };

    // Handle Clear Button
    const handleClearCart = () => {
        setCart([]);
    };


    return (
        <Layout>
            <div className={`${styles.pageContainer} ${shopStyles.shopPage}`}>
                <h1 className={shopStyles.pageTitle}>Item Shop</h1>

                <div className={shopStyles.shopGrid}>

                    {/* Column 1: Item List */}
                    <div className={`${shopStyles.itemListArea} ${shopStyles.areaBox}`}>
                        <h3 className={shopStyles.areaTitle}>Item List</h3>
                        <ul className={shopStyles.itemList}>
                            {MOCK_SHOP_ITEMS.map(item => {
                                const isInCart = cart.some(cartItem => cartItem.id === item.id);
                                return (
                                    <li
                                        key={item.id}
                                        className={shopStyles.itemEntry}
                                        onClick={() => handleItemToggle(item, !isInCart)} // Toggle on click
                                        onMouseEnter={() => handleItemHover(item)} // Show preview on hover
                                        // onMouseLeave={() => handleItemHover(null)} // Optional: clear preview on leave
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isInCart}
                                            onChange={(e) => handleItemToggle(item, e.target.checked)}
                                            onClick={(e) => e.stopPropagation()} // Prevent li onClick from firing too
                                            className={shopStyles.itemCheckbox}
                                            aria-label={`Select ${item.name}`}
                                        />
                                        <span className={shopStyles.itemName}>{item.name}</span>
                                        <span className={shopStyles.itemCost}>{item.cost.toLocaleString()} $DGPT</span>
                                    </li>
                                );
                             })}
                        </ul>
                    </div>

                    {/* Column 2: Image & Shopping List */}
                    <div className={shopStyles.itemDisplayColumn}>
                        <div className={`${shopStyles.itemImageArea} ${shopStyles.areaBox}`}>
                             {/* Show preview item image or placeholder */}
                            {previewItem ? (
                                <Image
                                    src={previewItem.imageUrl}
                                    alt={previewItem.name}
                                    width={150} height={150} // Adjust size as needed
                                    style={{ objectFit: 'contain' }}
                                    onError={(e) => { e.currentTarget.src = '/ItemImages/Default.png'; }} // Default image
                                />
                            ) : (
                                 <div className={shopStyles.itemImagePlaceholder}>Item Image</div>
                            )}
                        </div>
                        <div className={`${shopStyles.shoppingListArea} ${shopStyles.areaBox}`}>
                             <h3 className={shopStyles.areaTitle}>Shopping List</h3>
                             {cart.length > 0 ? (
                                <ul className={shopStyles.shoppingList}>
                                    {cart.map((item, index) => (
                                        <li key={`${item.id}-${index}`} className={shopStyles.shoppingListItem}>
                                            <span className={shopStyles.shoppingItemName}>{item.name}</span>
                                            <span className={shopStyles.shoppingItemCost}>{item.cost.toLocaleString()} $DGPT</span>
                                        </li>
                                    ))}
                                </ul>
                             ) : (
                                <p className={shopStyles.emptyCartMessage}>Select items from the list.</p>
                             )}
                        </div>
                    </div>

                     {/* Column 3: Description, Total, Purchase */}
                    <div className={shopStyles.purchaseColumn}>
                         <div className={`${shopStyles.itemDescriptionArea} ${shopStyles.areaBox}`}>
                              <h3 className={shopStyles.areaTitle}>Description</h3>
                              {/* Show preview item description */}
                              <p className={shopStyles.itemDescriptionContent}>
                                 {previewItem ? previewItem.description : 'Hover over or select an item to see its description.'}
                              </p>
                         </div>
                         <div className={`${shopStyles.totalCostArea} ${shopStyles.areaBox}`}>
                              <p className={shopStyles.totalCostText}>
                                 Total Cost: <span className={shopStyles.totalCostValue}>{totalCost.toLocaleString()} $DGPT</span>
                              </p>
                         </div>
                         <div className={`${shopStyles.purchaseActionArea} ${shopStyles.areaBox}`}>
                              {/* TODO: Add $DGPT balance display here */}
                              <p>Your $DGPT Balance: [Fetch Balance]</p>
                              <div className={shopStyles.purchaseButtons}>
                                  <button onClick={handleBuy} disabled={cart.length === 0} className={`button button-primary ${shopStyles.buyButton}`}>
                                      Buy Items
                                  </button>
                                  <button onClick={handleClearCart} disabled={cart.length === 0} className={`button button-secondary ${shopStyles.clearButton}`}>
                                      Clear List
                                  </button>
                              </div>
                         </div>
                    </div>

                </div> {/* End Shop Grid */}
            </div>
        </Layout>
    );
}