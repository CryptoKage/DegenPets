// src/components/Layout.tsx
import React from 'react';
// --- Import the APP specific header ---
import AppHeader from './Header'; // Use the renamed AppHeader
// --- End Import ---
import Footer from './Footer';
import MatrixRain from './MatrixRain';
import NeonGrid from './NeonGrid';
import styles from './Layout.module.css';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <MatrixRain />
      <NeonGrid />
      <div className={styles.appContainer}>
         {/* --- Use the APP specific header --- */}
        <AppHeader />
        {/* --- End Use --- */}
        <main className={styles.mainContent}>
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;