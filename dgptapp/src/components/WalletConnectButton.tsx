// src/components/WalletConnectButton.tsx
"use client";

// Use the FULL wallet hook
import { useWallet } from "@/context/WalletContext";
import styles from './WalletConnectButton.module.css';

const WalletConnectButton = () => {
    // Destructure from the FULL context
    const {
        connectWallet,
        disconnectWallet,
        userAddress,
        isConnected,
        isLoading, // Bring back isLoading if needed for button state
        currentChainId
    } = useWallet();

    // Use the correct testnet ID
    const APECHAIN_ID = 33111;

    const shortenAddress = (addr: string | undefined) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (isLoading) {
        return <button className={`${styles.button} ${styles.loading}`} disabled>Loading...</button>;
    }

    if (isConnected) {
        if (currentChainId !== APECHAIN_ID) {
            return (
                <div className={styles.walletInfo}>
                    <button className={`${styles.button} ${styles.errorButton}`} disabled title={`Connected to wrong network (ID: ${currentChainId})`}>
                        Wrong Network
                    </button>
                    <button onClick={disconnectWallet} className={`${styles.button} ${styles.disconnectButton}`}>
                        Disconnect
                    </button>
                </div>
            );
        }
        // Connected to correct network
        return (
            <div className={styles.walletInfo}>
                <span className={styles.addressDisplay} title={userAddress}>{shortenAddress(userAddress)}</span>
                <button onClick={disconnectWallet} className={`${styles.button} ${styles.disconnectButton}`}>
                    Disconnect
                </button>
            </div>
        );
    }

    // Not connected
    return (
        <button onClick={connectWallet} className={`${styles.button} ${styles.connectButton}`}>
            Connect Wallet
        </button>
    );
};

export default WalletConnectButton;