// src/app/tournaments/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import styles from '@/components/Layout.module.css'; // Base container
import tournamentStyles from './Tournaments.module.css'; // Page styles
import TournamentCard, { TournamentInfo } from '@/components/TournamentCard'; // Import card component
import Link from 'next/link';

// --- MOCK DATA ---
const MOCK_TOURNAMENTS: TournamentInfo[] = [
    {
        id: 'weekly-24-05-10', name: 'Cyber Sprint', type: 'Weekly', status: 'Registering',
        entryFee: 0, prizePool: 50000, registrationCloses: Date.now() / 1000 + 86400 * 2, // Closes in 2 days
        endTime: Date.now() / 1000 + 86400 * 9 // Ends in 9 days
    },
    {
        id: 'monthly-24-05', name: 'Mainframe Major - May', type: 'Monthly', status: 'Live',
        entryFee: 100, prizePool: 500000, startTime: Date.now() / 1000 - 86400 * 3, // Started 3 days ago
        endTime: Date.now() / 1000 + 86400 * 27 // Ends in 27 days
    },
    {
        id: 'weekly-24-05-03', name: 'Data Dash', type: 'Weekly', status: 'Ended',
        entryFee: 0, prizePool: 45000, startTime: Date.now() / 1000 - 86400 * 8, // Started 8 days ago
        endTime: Date.now() / 1000 - 86400 * 1 // Ended 1 day ago
    }
];
// --- END MOCK DATA ---

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<TournamentInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Simulate fetching tournament data
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        console.log("TournamentsPage: Simulating fetch tournaments...");
        const timer = setTimeout(() => {
            // TODO: Replace with actual API call GET /tournaments
            try {
                 // Sort mock data: Live > Registering > Ended
                 const sortedTournaments = [...MOCK_TOURNAMENTS].sort((a, b) => {
                    const statusOrder = { 'Live': 1, 'Registering': 2, 'Ended': 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                 });
                 setTournaments(sortedTournaments);
                 setIsLoading(false);
                 console.log("TournamentsPage: Mock tournaments loaded.");
            } catch(err) {
                 console.error("Error setting mock tournaments:", err);
                 setError("Failed to load tournament data.");
                 setIsLoading(false);
            }
        }, 1000); // Simulate 1 second delay

        return () => clearTimeout(timer);
    }, []);


    return (
        <Layout>
            <div className={`${styles.pageContainer} ${tournamentStyles.tournamentsPage}`}>
                <h1 className={tournamentStyles.pageTitle}>Tournaments</h1>

                {/* Overview Section */}
                <section className={tournamentStyles.section}>
                     <h2 className={tournamentStyles.sectionTitle}>Compete & Earn</h2>
                     <div className={tournamentStyles.overviewText}>
                         <p>Enter your Degen Pets into weekly free tournaments or monthly paid majors to compete for $DGPT prize pools.</p>
                         <p>Select a team of 4 pets, lock them in, and let their simulated trading performance determine your rank!</p>
                     </div>
                </section>

                 {/* Current / Upcoming Tournaments Section */}
                <section className={tournamentStyles.section}>
                    <h2 className={tournamentStyles.sectionTitle}>Active Events</h2>
                    {isLoading ? (
                         <p className={tournamentStyles.loadingMessage}>Loading Tournaments...</p>
                    ) : error ? (
                        <p className={tournamentStyles.errorMessage}>{error}</p>
                    ) : tournaments.length === 0 ? (
                        <p className={tournamentStyles.loadingMessage}>No active tournaments found.</p>
                    ) : (
                        <div className={tournamentStyles.tournamentsGrid}>
                            {tournaments.map(tournament => (
                                <TournamentCard key={tournament.id} tournament={tournament} />
                            ))}
                        </div>
                    )}
                </section>

                 {/* History Link Section */}
                  <section className={tournamentStyles.historyLinkContainer}>
                      {/* TODO: Create /tournaments/history page */}
                      <Link href="/tournaments/history" passHref>
                           <button className="button button-secondary">View Past Tournaments</button>
                      </Link>
                  </section>

            </div>
        </Layout>
    );
}