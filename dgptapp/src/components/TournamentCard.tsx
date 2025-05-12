// src/components/TournamentCard.tsx
"use client";

import React from 'react';
import styles from './TournamentCard.module.css';
import Link from 'next/link';

// Define the structure of tournament data
export interface TournamentInfo {
    id: string | number;
    name: string;
    type: 'Weekly' | 'Monthly';
    status: 'Registering' | 'Live' | 'Ended';
    entryFee: number; // $DGPT amount, 0 for free
    prizePool: number; // $DGPT amount
    startTime?: number; // Timestamp (optional, for Live/Ended)
    endTime?: number; // Timestamp (optional, for Registering/Live)
    registrationCloses?: number; // Timestamp (optional, for Registering)
}

interface TournamentCardProps {
    tournament: TournamentInfo;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {

    const formatTimestamp = (timestamp?: number): string => {
        if (!timestamp) return 'TBD';
        // Simple date formatting, consider using a library like date-fns for more complex needs
        try {
            return new Date(timestamp * 1000).toLocaleString(); // Assumes timestamp is in seconds
        } catch {
            return 'Invalid Date';
        }
    };

    const getStatusClass = (status: TournamentInfo['status']) => {
        switch (status) {
            case 'Registering': return styles.statusRegistering;
            case 'Live': return styles.statusLive;
            case 'Ended': return styles.statusEnded;
            default: return '';
        }
    };

    const getActionText = (status: TournamentInfo['status']) => {
        switch (status) {
            case 'Registering': return 'Enter Now';
            case 'Live': return 'View Live';
            case 'Ended': return 'View Results';
            default: return 'View';
        }
    };

     const getActionLink = (id: string | number) => {
         // Assuming detail page is /tournaments/[id]
         return `/tournaments/${id}`;
     };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{tournament.name} ({tournament.type})</h3>
                <span className={`${styles.statusBadge} ${getStatusClass(tournament.status)}`}>
                    {tournament.status}
                </span>
            </div>
            <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Entry Fee</span>
                    <span className={styles.detailValue}>
                        {tournament.entryFee > 0 ? `${tournament.entryFee.toLocaleString()} $DGPT` : 'Free'}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Prize Pool</span>
                    <span className={`${styles.detailValue} ${styles.detailValueHighlight}`}>
                         {tournament.prizePool.toLocaleString()} $DGPT
                    </span>
                </div>
                {tournament.registrationCloses && tournament.status === 'Registering' && (
                     <div className={styles.detailItem}>
                         <span className={styles.detailLabel}>Registration Closes</span>
                         <span className={styles.detailValue}>{formatTimestamp(tournament.registrationCloses)}</span>
                     </div>
                 )}
                 {tournament.startTime && (tournament.status === 'Live' || tournament.status === 'Ended') && (
                     <div className={styles.detailItem}>
                         <span className={styles.detailLabel}>Started</span>
                         <span className={styles.detailValue}>{formatTimestamp(tournament.startTime)}</span>
                     </div>
                 )}
                 {tournament.endTime && (tournament.status === 'Registering' || tournament.status === 'Live') && (
                     <div className={styles.detailItem}>
                         <span className={styles.detailLabel}>Ends</span>
                         <span className={styles.detailValue}>{formatTimestamp(tournament.endTime)}</span>
                     </div>
                 )}
                  {tournament.endTime && tournament.status === 'Ended' && (
                     <div className={styles.detailItem}>
                         <span className={styles.detailLabel}>Ended</span>
                         <span className={styles.detailValue}>{formatTimestamp(tournament.endTime)}</span>
                     </div>
                 )}
            </div>
            <div className={styles.actions}>
                 <Link href={getActionLink(tournament.id)} passHref>
                     <button className={`button ${tournament.status === 'Registering' ? 'button-primary' : 'button-secondary'} ${styles.actionButton}`}>
                         {getActionText(tournament.status)}
                     </button>
                 </Link>
            </div>
        </div>
    );
};

export default TournamentCard;