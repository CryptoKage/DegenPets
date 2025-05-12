// src/components/SpeciesCard.tsx
import Image from 'next/image';
import styles from './SpeciesCard.module.css';

interface SpeciesCardProps {
    petKey: string; // Key from PET_DATA
    name: string;
    maxSupply: number | string;
    // currentSupply?: number | string; // Add later when available
    imageUrl: string;
    isSelected?: boolean;
    isSelectable?: boolean;
    onSelect?: (petKey: string) => void;
}

const SpeciesCard: React.FC<SpeciesCardProps> = ({
    petKey, name, maxSupply, imageUrl, isSelected = false, isSelectable = false, onSelect
}) => {
    const handleClick = () => {
        if (isSelectable && onSelect) {
            onSelect(petKey);
        }
    };

    return (
        <div
            className={`${styles.card} ${isSelectable ? styles.cardSelectable : ''} ${isSelected ? styles.cardSelected : ''}`}
            onClick={handleClick}
            title={isSelectable ? `Select ${name} for minting` : name}
        >
            <div className={styles.imageContainer}>
                <Image
                    src={imageUrl}
                    alt={name}
                    width={80} height={80} // Base size, container will control
                    style={{ objectFit: 'contain' }}
                    onError={(e) => { e.currentTarget.src = '/PetImages/Default.png'; }}
                />
            </div>
            <div className={styles.speciesName}>{name}</div>
            <div className={styles.supplyInfo}>
                 {/* <span>NOW: ???</span> */}
                 <span>MAX: <span>{typeof maxSupply === 'number' ? maxSupply.toLocaleString() : maxSupply}</span></span>
            </div>
        </div>
    );
};

export default SpeciesCard;