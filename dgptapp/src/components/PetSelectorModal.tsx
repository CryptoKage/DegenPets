// src/components/PetSelectorModal.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import styles from './PetSelectorModal.module.css';
// Re-use the MockOwnedPet interface (or define a proper type)
// Ideally, this would come from a shared types file
interface MockOwnedPet { tokenId: number; key: string; mood?: number; }
// Import PET_DATA to get names/images
import { PET_DATA } from '@/data/petData'; // Adjust path if needed
type PetDataMap = { [key: string]: { name: string; /* other fields */ }; };

interface PetSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    ownedPets: MockOwnedPet[]; // Pass the list of owned pets
    onPetSelect: (pet: MockOwnedPet) => void; // Callback when a pet is chosen
    isLoading: boolean;
    error?: string | null;
    // Optional: Pass IDs of already selected pets to disable them
    excludePetIds?: (number | string)[];
}

const PetSelectorModal: React.FC<PetSelectorModalProps> = ({
    isOpen,
    onClose,
    ownedPets,
    onPetSelect,
    isLoading,
    error,
    excludePetIds = [] // Default to empty array
}) => {

    if (!isOpen) return null;

    // Helper to sanitize pet key for image filenames
    const sanitizePetKeyForImage = (key: string): string => key.replace(/[\s()]/g, '');

    return (
        <div className={`${styles.modalOverlay} ${isOpen ? styles.modalOverlayVisible : ''}`} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}> {/* Prevent closing when clicking inside content */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Select Pet</h2>
                    <button onClick={onClose} className={styles.closeButton} aria-label="Close">×</button>
                </div>

                <div className={styles.petListContainer}>
                    {isLoading ? (
                        <p className={styles.loadingMessage}>Loading Pets...</p>
                    ) : error ? (
                         <p className={styles.errorMessage}>Error loading pets: {error}</p>
                    ) : ownedPets.length === 0 ? (
                        <p className={styles.loadingMessage}>No available pets found in your collection.</p>
                    ) : (
                        <div className={styles.petGrid}>
                            {ownedPets.map(pet => {
                                const petBaseData = (PET_DATA as PetDataMap)[pet.key];
                                const isDisabled = excludePetIds.includes(pet.tokenId);
                                return (
                                    <div
                                        key={pet.tokenId}
                                        className={`${styles.petSelectItem} ${isDisabled ? styles.petSelectItemDisabled : ''}`}
                                        onClick={() => !isDisabled && onPetSelect(pet)}
                                        title={isDisabled ? 'Pet already selected' : `Select ${petBaseData?.name ?? 'Pet'} (ID: ${pet.tokenId})`}
                                    >
                                        <Image
                                            src={`/PetImages/${sanitizePetKeyForImage(pet.key)}.png`}
                                            alt={petBaseData?.name ?? 'Pet Image'}
                                            width={60}
                                            height={60}
                                            style={{ objectFit: 'contain' }}
                                            onError={(e) => { e.currentTarget.src = '/PetImages/Default.png'; }}
                                        />
                                        <span className={styles.petSelectName}>{petBaseData?.name ?? 'Unknown Species'}</span>
                                        <span className={styles.petSelectId}>ID: {pet.tokenId}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PetSelectorModal;