// src/components/Footer.tsx
"use client";

import Link from 'next/link';
import styles from './Footer.module.css'; // We'll create this CSS file next
import { useEffect, useState } from 'react'; // To get current year dynamically

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className={styles.siteFooter}>
      <div className={`${styles.container}`}>
        <div className={styles.footerLinks}>
          <Link href="/docs" target="_blank" rel="noopener noreferrer">[Documents]</Link> |
          <Link href="/community" target="_blank" rel="noopener noreferrer">[Community_X]</Link> |
          {/* Add other links as needed */}
          <Link href="/terms">[Disclaimer]</Link>
        </div>
        <p>© <span id="year">{currentYear}</span> Degen Pets App // Systems Green.</p>
      </div>
    </footer>
  );
};

export default Footer;