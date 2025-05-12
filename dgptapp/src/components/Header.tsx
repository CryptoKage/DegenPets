// src/components/Header.tsx
"use client";

import Link from 'next/link';
import styles from './Header.module.css';
import WalletConnectButton from './WalletConnectButton'; // Keep wallet button

const AppHeader = () => { // Renamed component for clarity
  // TODO: Add mobile menu toggle logic later

  return (
    <header className={styles.siteHeader}>
      <nav className={`${styles.container} ${styles.nav}`}>
        {/* Logo links back to main marketing site */}
        <div className={styles.logo}>
           <a href="https://www.degenpets.com" target="_blank" rel="noopener noreferrer">[DGN_PETS_v1.0]</a>
           {/* Or link logo to /dashboard? Depends on desired UX */}
           {/* <Link href="/dashboard">[DGN_PETS_v1.0]</Link> */}
        </div>

        {/* Mobile Menu Toggle Placeholder */}
        {/* <button className={styles.mobileMenuToggle}>|||</button> */}

        {/* App Navigation & Wallet Button */}
        <div className={styles.navRightItems}>
          {/* Main App Navigation Links */}
          <ul id="nav-links" className={styles.navLinks}>
            <li><Link href="/dashboard">// Dashboard</Link></li>
            <li><Link href="/trading-desk">// Trading Desk</Link></li>
            <li><Link href="/collection">// Collection</Link></li>
            <li><Link href="/shop">// Shop</Link></li>
            <li><Link href="/forge">// Forge</Link></li>
            {/* Removed links like /#about, /#features */}
            <li><a href="https://degen-pets-1.gitbook.io/degen-pets/" target="_blank" rel="noopener noreferrer">// Docs</a></li>
          </ul>
          <WalletConnectButton />
        </div>
      </nav>
    </header>
  );
};

export default AppHeader; // Export with new name