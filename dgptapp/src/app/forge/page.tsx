// src/app/forge/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react'; // useRef might be needed for modal focus later
import Layout from '@/components/Layout';
import styles from '@/components/Layout.module.css'; // Base page container styles
import forgeStyles from './Forge.module.css'; // Page specific styles
import PetSelectorModal from '@/components/PetSelectorModal'; // Import the modal
// import { useWallet } from '@/context/WalletContext'; // Keep for later when fetching real owned pets
import { PET_DATA } from '@/data/petData.js'; // For base data display
import Image from 'next/image';

// Mock types (replace with real types later)
interface MockOwnedPet { tokenId: number; key: string; mood?: number; }
type PetData = { name: string; strategyName?: string; description?: string; /* other fields */ }; // Simplified type for base data needed here
type PetDataMap = { [key: string]: PetData; };
interface MockBurnHistory { id: number; petName: string; tokenId: number; species: string; date: string; }

// --- MOCK DATA ---
const MOCK_OWNED_PETS_FORGE: MockOwnedPet[] = [
    { tokenId: 101, key: "TokenGators", mood: 88 }, { tokenId: 205, key: "Cat", mood: 95 },
    { tokenId: 333, key: "Snake" }, { tokenId: 45, key: "Crab", mood: 75 },
    { tokenId: 501, key: "Fox" }, { tokenId: 600, key: "Ape (Blue)" },
    { tokenId: 701, key: "MrMonkee" }, { tokenId: 802, key: "Goblin" },
];
const MOCK_BURN_HISTORY: MockBurnHistory[] = [
    { id: 1, petName: "OldSnake", tokenId: 15, species: "Snake", date: "2025-05-01" },
    { id: 2, petName: "WeakGator", tokenId: 88, species: "TokenGators", date: "2025-04-28" },
    { id: 3, petName: "Foxy", tokenId: 112, species: "Fox", date: "2025-04-15" },
];
const FORGE_COST_DGPT = 50;
// --- END MOCK DATA ---

export default function ForgePage() {
    const [pet1, setPet1] = useState<MockOwnedPet | null>(null);
    const [pet2, setPet2] = useState<MockOwnedPet | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectingForSlot, setSelectingForSlot] = useState<1 | 2 | null>(null);
    const [burnHistory, setBurnHistory] = useState<MockBurnHistory[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // TODO: Replace mock owned pets with fetch from API/Context using useWallet()
    // const { userAddress } = useWallet(); // Example usage later
    const ownedPets = MOCK_OWNED_PETS_FORGE; // Using mock data for now

    // Simulate fetching burn history
    useEffect(() => {
        console.log("ForgePage: Simulating fetch burn history...");
        setIsLoadingHistory(true);
        const timer = setTimeout(() => {
            setBurnHistory(MOCK_BURN_HISTORY);
            setIsLoadingHistory(false);
            console.log("ForgePage: Mock burn history loaded.");
        }, 1000); // Simulate 1 second delay
        return () => clearTimeout(timer);
    }, []); // Run once on mount

    // --- Modal Logic ---
    const openPetSelector = (slot: 1 | 2) => {
        console.log(`Opening selector for slot ${slot}`);
        setSelectingForSlot(slot);
        setIsModalOpen(true);
    };

    const closePetSelector = () => {
        setIsModalOpen(false);
        setSelectingForSlot(null);
    };

    const handlePetSelected = (selectedPet: MockOwnedPet) => {
        console.log(`Pet ID ${selectedPet.tokenId} selected for slot ${selectingForSlot}`);
        if (selectingForSlot === 1) {
            if (pet2?.tokenId !== selectedPet.tokenId) {
                setPet1(selectedPet);
            } else {
                alert("Cannot select the same pet for both slots.");
            }
        } else if (selectingForSlot === 2) {
            if (pet1?.tokenId !== selectedPet.tokenId) {
                 setPet2(selectedPet);
            } else {
                 alert("Cannot select the same pet for both slots.");
            }
        }
        closePetSelector();
    };
    // --- End Modal Logic ---

    // --- Forge Action ---
    const handleForge = () => {
        if (!pet1 || !pet2) {
            alert("Please select two different pets to forge.");
            return;
        }
        // Construct confirmation message
        const pet1Name = getBasePetData(pet1.key)?.name ?? `Pet ${pet1.tokenId}`;
        const pet2Name = getBasePetData(pet2.key)?.name ?? `Pet ${pet2.tokenId}`;
        const confirmation = window.confirm(
            `Are you sure you want to forge?\n\n` +
            `This will permanently BURN:\n` +
            `- ${pet1Name} (ID: ${pet1.tokenId})\n` +
            `- ${pet2Name} (ID: ${pet2.tokenId})\n\n` +
            `Cost: ${FORGE_COST_DGPT} $DGPT\n\n` +
            `Proceed?`
        );

        if (confirmation) {
             alert(`Confirmed! Forging Pet ${pet1.tokenId} and Pet ${pet2.tokenId}.\nImplement $DGPT checks, approvals, and PetForge contract call!`);
             // TODO: Implement actual forge logic (see previous comments)
        } else {
             alert("Forge cancelled.");
        }
    };
    // --- End Forge Action ---

    // --- Helper Functions ---
    const getBasePetData = (key: string | null): PetData | null => {
        if (!key) return null;
        return (PET_DATA as PetDataMap)[key] ?? null;
    }
    const sanitizePetKeyForImage = (key: string | null): string => {
        if (!key) return 'Default'; // Fallback key for default image
        return key.replace(/[\s()]/g, ''); // Adjust case if needed to match filenames
    }
    // --- End Helper Functions ---

    // Determine which pets to exclude in selector modal
    const excludePetIds = [];
    if (pet1) excludePetIds.push(pet1.tokenId);
    if (pet2) excludePetIds.push(pet2.tokenId);
    // Alternatively, exclude based on the slot being selected for:
    // const excludePetIds = selectingForSlot === 1 ? (pet2 ? [pet2.tokenId] : []) : (pet1 ? [pet1.tokenId] : []);


    return (
        <Layout>
            <div className={`${styles.pageContainer} ${forgeStyles.forgePage}`}>
                <h1 className={forgeStyles.pageTitle}>Forge</h1>

                <div className={forgeStyles.forgeArea}>
                    {/* Pet Selection Slots */}
                    <div className={forgeStyles.parentsContainer}>
                        <div className={forgeStyles.petSlot} onClick={() => openPetSelector(1)}>
                            {pet1 ? (
                                <>
                                    <Image
                                        src={`/PetImages/${sanitizePetKeyForImage(pet1.key)}.png`}
                                        alt={getBasePetData(pet1.key)?.name ?? 'Pet 1'}
                                        width={120} height={120} style={{ objectFit: 'contain'}}
                                        onError={(e) => { e.currentTarget.src = '/PetImages/Default.png'; }}
                                    />
                                    <span className={forgeStyles.petName}>{getBasePetData(pet1.key)?.name ?? 'Unknown'}</span>
                                    <span className={forgeStyles.petId}>ID: {pet1.tokenId}</span>
                                </>
                            ) : (
                                <span>+ Select Pet 1</span>
                            )}
                        </div>

                        <div className={forgeStyles.forgeButtonContainer}>
                            <span className={forgeStyles.forgeIcon}>🔥</span>
                             <button
                                 onClick={handleForge}
                                 disabled={!pet1 || !pet2} // Disable if both slots not filled
                                 className={`button button-primary ${forgeStyles.forgeButton}`}
                             >
                                 Forge
                             </button>
                             <span className={forgeStyles.forgeIcon}>🔥</span>
                        </div>

                        <div className={forgeStyles.petSlot} onClick={() => openPetSelector(2)}>
                             {pet2 ? (
                                <>
                                    <Image
                                        src={`/PetImages/${sanitizePetKeyForImage(pet2.key)}.png`}
                                        alt={getBasePetData(pet2.key)?.name ?? 'Pet 2'}
                                        width={120} height={120} style={{ objectFit: 'contain'}}
                                        onError={(e) => { e.currentTarget.src = '/PetImages/Default.png'; }}
                                    />
                                    <span className={forgeStyles.petName}>{getBasePetData(pet2.key)?.name ?? 'Unknown'}</span>
                                     <span className={forgeStyles.petId}>ID: {pet2.tokenId}</span>
                                </>
                            ) : (
                                <span>+ Select Pet 2</span>
                            )}
                        </div>
                    </div>

                    {/* Cost and Warning */}
                    <div className={forgeStyles.costWarningArea}>
                         <p className={forgeStyles.costText}>
                             Cost: <span>2 Pet NFTs</span> + <span>{FORGE_COST_DGPT} $DGPT</span>
                         </p>
                         <p className={forgeStyles.warningText}>
                             WARNING: Forging will permanently burn the two selected Pet NFTs!
                         </p>
                    </div>
                </div>

                {/* Burn History Section */}
                <section className={forgeStyles.historySection}>
                     <h3>Algo Feed History (Burned Pets)</h3>
                     {isLoadingHistory ? (
                         // Use the style defined in Forge.module.css
                         <p className={forgeStyles.loadingMessage}>Loading History...</p>
                     ) : burnHistory.length > 0 ? (
                         <ul className={forgeStyles.historyList}>
                             {burnHistory.map(item => (
                                 <li key={item.id} className={forgeStyles.historyItem}>
                                     <div className={forgeStyles.historyPetInfo}>
                                         {item.petName} <span>(ID: {item.tokenId}, Species: {item.species})</span>
                                     </div>
                                     <div className={forgeStyles.historyDate}>
                                         Burned: {new Date(item.date).toLocaleDateString()}
                                     </div>
                                 </li>
                             ))}
                         </ul>
                     ) : (
                          // Use the style defined in Forge.module.css
                          <p className={forgeStyles.loadingMessage}>No burn history found.</p>
                     )}
                </section>

            </div>

            {/* Pet Selector Modal */}
            <PetSelectorModal
                isOpen={isModalOpen}
                onClose={closePetSelector}
                ownedPets={ownedPets} // Pass mock owned pets for now
                onPetSelect={handlePetSelected}
                isLoading={false} // Set to true if fetching owned pets takes time
                excludePetIds={excludePetIds} // Pass IDs to disable
            />

        </Layout>
    );
} // End of ForgePage