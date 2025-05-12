// src/app/layout.tsx
import type { Metadata } from "next";
import { Orbitron, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // Keep Wagmi Providers
// Import the FULL WalletProvider
import { WalletProvider } from "@/context/WalletContext";

// ... (font configurations) ...
const orbitron = Orbitron({ /* ... */ });
const roboto_mono = Roboto_Mono({ /* ... */ });

export const metadata: Metadata = {
    title: "Degen Pets App", // Back to main title
    description: "Degen Pets - Cybernetic Trading Sim (Curtis Testnet)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Assert the type to include the variable property */}
      <body className={`${(orbitron as any).variable} ${(roboto_mono as any).variable}`}>
        <Providers>
           <WalletProvider>
              {children}
           </WalletProvider>
        </Providers>
      </body>
    </html>
  );
}