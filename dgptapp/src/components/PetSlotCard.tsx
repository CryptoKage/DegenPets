// src/components/PetSlotCard.tsx
"use client";

import Image from 'next/image'; // Using Next.js Image for optimization
import styles from './PetSlotCard.module.css'; // Create this CSS module

// Define possible props for the component
interface PetSlotCardProps {
    slotIndex: number; // e.g., 1, 2, 3, 4
    pet?: { // Optional: Pet data if slot is occupied
        id: number | string;
        name: string;
        species: string;
        imageUrl: string;
        status: 'Idle' | 'Trading' | 'Error'; // Example statuses
        mood: number; // Example: 0-100
        trades: number;
        wlbeRatio: string; // Example: "W0/B0/E0 L0/S0"
    };
    onAddPet: (slotIndex: number) => void; // Function to call when "Add Pet" is clicked
    onSelectPet: (petId: number | string, slotIndex: number) => void; // Function to call when an occupied slot is clicked
}

const PetSlotCard: React.FC<PetSlotCardProps> = ({
    slotIndex,
    pet,
    onAddPet,
    onSelectPet
}) => {

    const handleClick = () => {
        if (pet) {
            onSelectPet(pet.id, slotIndex);
        } else {
            onAddPet(slotIndex);
        }
    };

    return (
        <div className={`${styles.slotCard} ${!pet ? styles.empty : ''}`} onClick={handleClick}>
            {pet ? (
                <>
                    <div className={styles.petImageContainer}>
                        <Image src={pet.imageUrl} alt={pet.name} width={80} height={80} style={{ objectFit: 'contain' }} />
                    </div>
                    <div className={styles.petInfo}>
                        <div className={styles.petNameId}>{pet.name} <span className={styles.petId}>(ID: {pet.id})</span></div>
                        <div className={styles.petDetail}><span className={styles.label}>Species:</span> {pet.species}</div>
                        <div className={styles.petDetail}><span className={styles.label}>Status:</span> <span className={`${styles.status} ${styles[pet.status.toLowerCase()]}`}>{pet.status}</span></div>
                        <div className={styles.petDetail}><span className={styles.label}>Mood:</span> {pet.mood}%</div> {/* Add mood indicator later */}
                        <div className={styles.petDetail}><span className={styles.label}>Trades:</span> {pet.trades}</div>
                        <div className={styles.petWLBE}><span className={styles.label}>Stats:</span> {pet.wlbeRatio}</div>
                    </div>
                </>
            ) : (
                <div className={styles.addPetButton}>
                    + Add Pet
                </div>
            )}
        </div>
    );
};

export default PetSlotCard;