// src/app/collection/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react'; // Added useRef
import Layout from '@/components/Layout';
import styles from '@/components/Layout.module.css';
import collectionStyles from './Collection.module.css';
import { PET_DATA } from '@/data/petData.js'; // Adjust path if needed
import Image from 'next/image';
import { isAddress } from 'ethers'; // Direct import for ethers v6

// --- Types ---
type PetParameter = { name: string; range: string; effect: string; };
type PetData = { name: string; strategyName: string; description: string; supply: number | string; parameters: PetParameter[]; /* Removed affinity fields */ xAccountLink: string | null; };
type PetDataMap = { [key: string]: PetData; };
// --- End Types ---

// --- MOCK DATA ---
// Simulate Owned Pet Data - Now include mock token ID and mood
interface MockOwnedPet {
    tokenId: number;
    key: string; // Key from PET_DATA
    mood?: number; // Optional mock mood
}
const MOCK_OWNED_PETS: MockOwnedPet[] = [
    { tokenId: 101, key: "TokenGators", mood: 88 },
    { tokenId: 205, key: "Cat", mood: 95 },
    { tokenId: 333, key: "Snake" },
    { tokenId: 45, key: "Crab", mood: 75 },
    { tokenId: 501, key: "Fox" },
    { tokenId: 600, key: "Ape (Blue)" },
    { tokenId: 701, key: "MrMonkee" },
    { tokenId: 802, key: "Goblin" },
];
// --- END MOCK DATA ---


export default function CollectionPage() {
    const [selectedPetKey, setSelectedPetKey] = useState<string | null>(null);
    const [selectedPetData, setSelectedPetData] = useState<PetData | null>(null);
    const [selectedOwnedPet, setSelectedOwnedPet] = useState<MockOwnedPet | null>(null); // Store selected owned pet object

    const [ownedPets, setOwnedPets] = useState<MockOwnedPet[]>([]); // Holds the list of owned pet objects
    const [isLoadingOwned, setIsLoadingOwned] = useState<boolean>(true);

    // Ref for the scrollable div
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Simulate fetching owned pets and sort them on mount
    useEffect(() => {
        setIsLoadingOwned(true);
        console.log("CollectionPage: Simulating fetch for owned pets...");
        const timer = setTimeout(() => {
            const dataMap = PET_DATA as PetDataMap;
            // Filter mock owned pets to ensure their key exists in PET_DATA
            const validOwnedPets = MOCK_OWNED_PETS.filter(p => dataMap.hasOwnProperty(p.key));
            // Sort alphabetically by pet name
            validOwnedPets.sort((a, b) =>
                (dataMap[a.key]?.name ?? a.key).localeCompare(dataMap[b.key]?.name ?? b.key)
            );

            setOwnedPets(validOwnedPets);
            setIsLoadingOwned(false);
            console.log("CollectionPage: Mock owned pets loaded:", validOwnedPets);

            // Select the first owned pet by default
            if (validOwnedPets.length > 0) {
                handleThumbnailClick(validOwnedPets[0]); // Pass the whole owned pet object
            } else {
                 setSelectedPetKey(null);
                 setSelectedPetData(null);
                 setSelectedOwnedPet(null);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    // --- Carousel Scroll Functions ---
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' }); // Scroll by ~3 thumbnails
        }
    };
    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };
    // --- End Carousel ---


    // --- Helper Functions ---
    const handleThumbnailClick = (ownedPet: MockOwnedPet) => { // Takes the owned pet object
        const dataMap = PET_DATA as PetDataMap;
        const petBaseData = dataMap[ownedPet.key];
        if (petBaseData) {
            setSelectedPetKey(ownedPet.key);
            setSelectedPetData(petBaseData); // Base species data
            setSelectedOwnedPet(ownedPet); // Specific owned pet data (ID, mood)
            console.log(`Selected owned pet ID: ${ownedPet.tokenId}, Key: ${ownedPet.key}`);
        } else {
            console.warn(`Pet base data not found for key: ${ownedPet.key}`);
            setSelectedPetKey(null);
            setSelectedPetData(null);
            setSelectedOwnedPet(null);
        }
    };

    const sanitizePetKeyForImage = (key: string): string => key.replace(/[\s()]/g, ''); // Adjust case if needed

    // Removed isValidAddress as it's not needed without affinity links now
    // const isValidAddress = (...) => { ... };
    // --- End Helper Functions ---


    return (
        <Layout>
            <div className={`${styles.pageContainer} ${collectionStyles.collectionPage}`}>
                <h1 className={collectionStyles.pageTitle}>[ Pet Collection ]</h1>
                <p className={collectionStyles.subtitle}>// View your acquired Degen Pet NFTs //</p>

                {/* --- Thumbnail Carousel --- */}
                <div className={collectionStyles.thumbnailCarouselContainer}>
                    <button onClick={scrollLeft} className={collectionStyles.carouselArrow} aria-label="Scroll Left">{'<'}</button>
                    <div className={collectionStyles.thumbnailGridWrapper}>
                        <div ref={scrollContainerRef} className={collectionStyles.petThumbnailGridScrollable}>
                            {isLoadingOwned ? (
                                <p className={collectionStyles.loadingMessage}>Loading collection...</p>
                            ) : ownedPets.length > 0 ? (
                                ownedPets.map(ownedPet => {
                                    const petName = (PET_DATA as PetDataMap)[ownedPet.key]?.name ?? ownedPet.key;
                                    return (
                                        <Image
                                            key={ownedPet.tokenId} // Use unique tokenId as key
                                            className={`${collectionStyles.petThumbnail} ${selectedOwnedPet?.tokenId === ownedPet.tokenId ? collectionStyles.petThumbnailActive : ''}`}
                                            src={`/PetImages/${sanitizePetKeyForImage(ownedPet.key)}.png`}
                                            alt={`Thumbnail for ${petName}`}
                                            title={`${petName} (ID: ${ownedPet.tokenId}) - Click for details`}
                                            width={85} height={85} style={{ objectFit: 'contain' }}
                                            onClick={() => handleThumbnailClick(ownedPet)}
                                            unoptimized
                                            priority={ownedPet.tokenId === ownedPets[0]?.tokenId}
                                            onError={(e) => { e.currentTarget.src = '/PetImages/Default.png'; }}
                                        />
                                    );
                                })
                            ) : (
                                <p className={collectionStyles.loadingMessage}>No Degen Pets found.</p>
                            )}
                        </div>
                    </div>
                    <button onClick={scrollRight} className={collectionStyles.carouselArrow} aria-label="Scroll Right">{'>'}</button>
                </div>
                {/* --- End Thumbnail Carousel --- */}


                <hr className={collectionStyles.divider} />

                {/* Main Pet Display Area */}
                {selectedPetData && selectedOwnedPet ? ( // Check both selectedPetData and selectedOwnedPet
                    <div className={collectionStyles.petDisplayArea}>
                        {/* Image Column */}
                        <div className={collectionStyles.petDisplayImageContainer}>
                            <Image /* ... Image props ... */ />
                        </div>
                         {/* Details Column */}
                        <div className={collectionStyles.petDisplayDetails}>
                            <h2 id="selectedPetName" className={collectionStyles.selectedPetName}>
                                {selectedPetData.name} (ID: {selectedOwnedPet.tokenId}) {/* Show Token ID */}
                            </h2>

                            {/* Specific Pet Stats Box */}
                             <div className={collectionStyles.petDetailBox}>
                                 <h3>NFT Details</h3>
                                 <p><span className={collectionStyles.label}>Token ID:</span> <span className={collectionStyles.value}>{selectedOwnedPet.tokenId}</span></p>
                                 <p><span className={collectionStyles.label}>Species:</span> <span className={collectionStyles.value}>{selectedPetData.name}</span></p>
                                 <p><span className={collectionStyles.label}>Mood:</span> <span className={collectionStyles.value}>{selectedOwnedPet.mood ?? 'N/A'}%</span></p>
                                 {/* TODO: Add Status (Idle/Trading), Assigned Market/TF here later */}
                                 <p><span className={collectionStyles.label}>Status:</span> <span className={collectionStyles.value}>[Mock Status]</span></p>
                                 <p>
                                      <span className={collectionStyles.label}>Max Supply:</span>
                                      <span className={`${collectionStyles.value} ${collectionStyles.selectedPetSupplyValue}`}>
                                          {(typeof selectedPetData.supply === 'number') ? selectedPetData.supply.toLocaleString() : (selectedPetData.supply || '--')}
                                      </span>
                                  </p>
                                  {/* Add Actions like Assign to Desk/Send to Forge later */}
                             </div>

                            {/* Strategy Info Box */}
                            <div className={collectionStyles.petDetailBox}>
                                <h3>Strategy: <span>{selectedPetData.strategyName}</span></h3>
                                <p>{selectedPetData.description}</p>
                                <ul className={collectionStyles.parameterList}>
                                     {/* Display base parameters for the species */}
                                    {selectedPetData.parameters?.map((param, index) => (
                                        <li key={index}><strong>{param.name}:</strong><span>{param.range}</span><br /><em>{param.effect}</em></li>
                                    )) ?? <li>No parameter details.</li>}
                                </ul>
                                <p className={collectionStyles.paramExplanation}><small>Parameters shown are base ranges for the species.</small></p>
                            </div>

                            {/* REMOVED Affinity Info Box */}

                        </div>
                    </div>
                ) : (
                     <div className={collectionStyles.petDisplayArea}>
                        <p className={collectionStyles.loadingMessage}>
                            {isLoadingOwned ? "Loading Collection..." : ownedPets.length === 0 ? "You don't own any Degen Pets yet." : "Select a pet from your collection above."}
                        </p>
                    </div>
                )}
                 {/* End Pet Display Area */}

            </div>
        </Layout>
    );
}