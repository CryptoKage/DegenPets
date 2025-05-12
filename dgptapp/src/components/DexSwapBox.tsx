// src/components/DexSwapBox.tsx
import styles from './DexSwapBox.module.css'; // Create this CSS file

const DexSwapBox = () => {
    // TODO: Add state for input amounts, token balances, swap logic

    return (
        <div className={styles.swapBox}>
            {/* Input for Token A (e.g., DGPT) */}
            <div className={styles.tokenInputGroup}>
                 <input type="number" placeholder="0.0" className={styles.tokenInput} />
                 <div className={styles.tokenSelector}>$DGPT</div>
                 {/* TODO: Add Balance */}
            </div>

            {/* Swap/Rotate Button */}
            <div className={styles.swapButtonContainer}>
                <button className={styles.rotateButton} title="Swap Input/Output">⇅</button>
            </div>

             {/* Input for Token B (e.g., APE) */}
             <div className={styles.tokenInputGroup}>
                 <input type="number" placeholder="0.0" className={styles.tokenInput} />
                 <div className={styles.tokenSelector}>APE</div>
                  {/* TODO: Add Balance */}
             </div>

             {/* Swap Action Button */}
              <button className={`button button-secondary ${styles.executeSwapButton}`} disabled>
                 Swap (Unavailable)
             </button>
             {/* TODO: Add price impact/slippage info */}
        </div>
    );
};

export default DexSwapBox;