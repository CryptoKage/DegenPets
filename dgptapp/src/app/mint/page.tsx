// src/app/mint/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import styles from '@/components/Layout.module.css'; // Base container
import mintStyles from './Mint.module.css'; // Page specific styles
import SpeciesCard from '@/components/SpeciesCard'; // Import species card
import DexSwapBox from '@/components/DexSwapBox'; // Import swap box
import { PET_DATA } from '@/data/petData.js'; // Import pet data
// import { useWallet } from '@/context/WalletContext'; // Keep for later

// --- Types ---
type PetDataMap = { [key: string]: { name: string; supply: number | string; /* other fields */ }; };
interface MockOwnedPet { tokenId: number; key: string; mood?: number; }
// --- End Types ---

// --- MOCK DATA ---
// Simulate owned pets to determine which species are selectable
const MOCK_OWNED_PETS_MINT: MockOwnedPet[] = [
    { tokenId: 101, key: "TokenGators"}, { tokenId: 205, key: "Cat"}, { tokenId: 45, key: "Crab"}
];
// Cost per mint
const MINT_COST_DGPT = 100; // Example cost
// --- END MOCK DATA ---

export default function MintPage() {
    // const { userAddress, dgptBalance } = useWallet(); // Get real data later

    // State
    const [ownedSpeciesKeys, setOwnedSpeciesKeys] = useState<string[]>([]); // Unique species keys owned
    const [selectedSpeciesKey, setSelectedSpeciesKey] = useState<string | null>(null); // Species selected for minting
    const [isMinting, setIsMinting] = useState(false);

    // Process owned pets to get unique species keys on mount
    useEffect(() => {
        console.log("MintPage: Processing owned pet species...");
        const keys = MOCK_OWNED_PETS_MINT.map(pet => pet.key);
        const uniqueKeys = [...new Set(keys)]; // Get unique keys
         // Sort them based on PET_DATA name
         uniqueKeys.sort((a, b) =>
             ((PET_DATA as PetDataMap)[a]?.name ?? a).localeCompare((PET_DATA as PetDataMap)[b]?.name ?? b)
         );
        setOwnedSpeciesKeys(uniqueKeys);
        console.log("MintPage: Unique owned species keys:", uniqueKeys);
    }, []); // Run once

    // Handle Species Selection for Minting (from the "Partnership Pass" area)
    const handleSpeciesSelect = (key: string) => {
        console.log("Selected species for minting:", key);
        setSelectedSpeciesKey(key);
    };

    // Handle Mint Button Click
    const handleMint = () => {
        if (!selectedSpeciesKey) {
            alert("Please select a species from the 'Partnership Pass' list to attempt minting.");
            return;
        }
        setIsMinting(true);
        const speciesName = (PET_DATA as PetDataMap)[selectedSpeciesKey]?.name ?? selectedSpeciesKey;
        alert(`Attempting to mint ${speciesName} (70% chance, 30% random).\nCost: ${MINT_COST_DGPT} $DGPT.\n\nImplement $DGPT checks, approval, and PetAdoption contract call!`);
        // TODO: Implement actual mint logic (check balance, approve, call contract)
        // Use selectedSpeciesKey to get the speciesId needed for the contract call
        setTimeout(() => setIsMinting(false), 1000); // Simulate end of minting
    };

     // Helper to sanitize pet key for image filenames
     const sanitizePetKeyForImage = (key: string): string => key.replace(/[\s()]/g, '');

    // Get all possible species keys for the main grid display
    const allSpeciesKeys = Object.keys(PET_DATA).sort((a, b) =>
        ((PET_DATA as PetDataMap)[a]?.name ?? a).localeCompare((PET_DATA as PetDataMap)[b]?.name ?? b)
    );


    return (
        <Layout>
             <div className={`${styles.pageContainer} ${mintStyles.mintPage}`}>
                 <h1 className={mintStyles.pageTitle}>Pet Adoption</h1>

                 <div className={mintStyles.mainLayout}>
                     {/* Column 1: Stats */}
                     <div className={mintStyles.statsColumn}>
                         <section className={mintStyles.areaBox}>
                             <h3 className={mintStyles.areaTitle}>Player Stats</h3>
                             <div className={mintStyles.statsGrid}>
                                 <div className={mintStyles.statItem}><span className={mintStyles.statLabel}>$DGPT Balance</span><span className={mintStyles.statValue}>[Mock Bal]</span></div>
                                 <div className={mintStyles.statItem}><span className={mintStyles.statLabel}>Owned Pets</span><span className={mintStyles.statValue}>{MOCK_OWNED_PETS_MINT.length}</span></div>
                             </div>
                         </section>
                         <section className={mintStyles.areaBox}>
                             <h3 className={mintStyles.areaTitle}>Global Stats</h3>
                              <div className={mintStyles.statsGrid}>
                                  <div className={mintStyles.statItem}><span className={mintStyles.statLabel}>Total Minted</span><span className={mintStyles.statValue}>[Mock Global]</span></div>
                                  {/* Add more global stats */}
                              </div>
                         </section>
                     </div>

                      {/* Column 2: Species Grid */}
                      <div className={`${mintStyles.gridColumn} ${mintStyles.speciesGridArea}`}>
                           <h3 className={mintStyles.areaTitle}>Available Species Pool</h3>
                           <div className={mintStyles.speciesGrid}>
                               {allSpeciesKeys.map(key => {
                                   const data = (PET_DATA as PetDataMap)[key];
                                   if (!data) return null;
                                   return (
                                       <SpeciesCard
                                           key={key}
                                           petKey={key}
                                           name={data.name}
                                           maxSupply={data.supply}
                                           imageUrl={`/PetImages/${sanitizePetKeyForImage(key)}.png`}
                                           isSelectable={false} // Not selectable from main grid
                                       />
                                   );
                               })}
                           </div>
                      </div>

                      {/* Column 3: Selection / Swap / Mint */}
                      <div className={mintStyles.controlsColumn}>
                          <section className={`${mintStyles.selectionArea} ${mintStyles.areaBox}`}>
                               <h3 className={mintStyles.areaTitle}>Partnership Pass (Owned Species)</h3>
                               {ownedSpeciesKeys.length > 0 ? (
                                   <>
                                        <ul className={mintStyles.selectionList}>
                                            {ownedSpeciesKeys.map(key => {
                                                const data = (PET_DATA as PetDataMap)[key];
                                                if (!data) return null;
                                                return (
                                                    <li
                                                        key={key}
                                                        className={`${mintStyles.selectionItem} ${selectedSpeciesKey === key ? mintStyles.selectionItemSelected : ''}`}
                                                        onClick={() => handleSpeciesSelect(key)}
                                                    >
                                                        {data.name}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                        <p className={mintStyles.selectionNote}>Select species for 70% mint chance.</p>
                                   </>
                               ) : (
                                   <p>Own Pet NFTs to enable targeted minting.</p>
                               )}
                          </section>

                           <section className={`${mintStyles.mintActionArea} ${mintStyles.areaBox}`}>
                               <h3 className={mintStyles.areaTitle}>Mint Action</h3>
                               <p className={mintStyles.costText}>
                                   Cost: <span>{MINT_COST_DGPT} $DGPT</span>
                               </p>
                               <button
                                    onClick={handleMint}
                                    disabled={isMinting || !selectedSpeciesKey}
                                    className={`button button-primary ${mintStyles.mintButton}`}
                                >
                                    {isMinting ? "Minting..."
                                        : selectedSpeciesKey && PET_DATA.hasOwnProperty(selectedSpeciesKey) // Check if key exists
                                            ? `Mint ${(PET_DATA as PetDataMap)[selectedSpeciesKey].name}` // Access name safely
                                            : "Select Species Above" // Fallback
                                    }
                                </button>
                           </section>

                           <section className={`${mintStyles.swapBoxArea}`}>
                                <h3 className={mintStyles.areaTitle}>Swap Tokens</h3>
                                <DexSwapBox />
                           </section>
                      </div>

                 </div>
             </div>
        </Layout>
    );
}