// src/app/trading-desk/page.tsx
"use client";

import Layout from "@/components/Layout";
import baseStyles from "@/components/Layout.module.css"; // Base container styles
import terminalStyles from './TradingDesk.module.css'; // Page specific styles
import { useState, useEffect } from "react"; // Import hooks
import Image from "next/image";
import { PET_DATA } from "@/data/petData"; // For displaying base info
import TradingChartComponent from '@/components/TradingChart'; // Import the Chart Component

// --- Mock Data & Types ---
interface MockAssignedPet { slotIndex: number; tokenId: number; key: string; name: string; species: string; imageUrl: string; status: 'Idle' | 'Trading' | 'Error'; mood: number; trades: number; wlbeRatio: string; }
type PetData = { name: string; strategyName?: string; description?: string; parameters?: any[] };
type PetDataMap = { [key: string]: PetData; };
interface MockTrade { id: number; result: 'Win' | 'Loss' | 'BreakEven'; pnl: string; mood: string; }

const MOCK_ASSIGNED_PETS: (MockAssignedPet | null)[] = [
    { slotIndex: 1, tokenId: 101, key: "TokenGators", name: "CyGator", species: "TokenGators", imageUrl: "/PetImages/TokenGators.png", status: 'Trading', mood: 85, trades: 12, wlbeRatio: "W5/B2/E1 L3/S1" },
    { slotIndex: 2, tokenId: 205, key: "Cat", name: "GlitchCat", species: "Cat", imageUrl: "/PetImages/Cat.png", status: 'Idle', mood: 95, trades: 0, wlbeRatio: "W0/B0/E0 L0/S0" },
    null,
    { slotIndex: 4, tokenId: 45, key: "Crab", name: "Crabby", species: "Crab", imageUrl: "/PetImages/Crab.png", status: 'Idle', mood: 75, trades: 3, wlbeRatio: "W1/B0/E0 L2/S0" },
];
const mockTrades: MockTrade[] = [
    { id: 1, result: 'Win', pnl: '+10.5 $DGPT', mood: '+1' }, { id: 2, result: 'Loss', pnl: '-5.2 $DGPT', mood: '-2' },
    { id: 3, result: 'Win', pnl: '+8.1 $DGPT', mood: '+1' }, { id: 4, result: 'BreakEven', pnl: '+0.1 $DGPT', mood: '0' },
    { id: 5, result: 'Win', pnl: '+12.0 $DGPT', mood: '+1' }, { id: 6, result: 'Loss', pnl: '-3.5 $DGPT', mood: '-2' },
    { id: 7, result: 'Win', pnl: '+7.7 $DGPT', mood: '+1' }, { id: 8, result: 'Win', pnl: '+9.9 $DGPT', mood: '+1' },
    { id: 9, result: 'Loss', pnl: '-6.0 $DGPT', mood: '-2' }, { id: 10, result: 'Win', pnl: '+15.1 $DGPT', mood: '+1' },
    { id: 11, result: 'Loss', pnl: '-2.5 $DGPT', mood: '-2' }, { id: 12, result: 'Win', pnl: '+3.3 $DGPT', mood: '+1' },
];
const mockMarkets = ["APE/USD", "BTC/USD", "ETH/USD", "DEGEN/USD"];
const CHART_UNLOCK_COST = 150;
// --- End Mock Data ---

// **** Dev Toggle for Chart ****
const ENABLE_MOCK_CHART_UNLOCKED = false; // Set true to simulate chart being unlocked
// **** End Dev Toggle ****


export default function TradingDeskPage() {
    // State for selected pet from the top list
    const [selectedAssignedPet, setSelectedAssignedPet] = useState<MockAssignedPet | null>(() => MOCK_ASSIGNED_PETS.find(p => p !== null) ?? null);
    // State for controls
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1H');
    const [selectedMarket, setSelectedMarket] = useState<string>(mockMarkets[0]);
    // State for chart unlock
    const [isChartUnlocked, setIsChartUnlocked] = useState<boolean>(ENABLE_MOCK_CHART_UNLOCKED);
    const [isUnlockingChart, setIsUnlockingChart] = useState<boolean>(false);

    // --- Handlers ---
    const handleSelectAssignedPet = (pet: MockAssignedPet | null) => {
        if (pet) { setSelectedAssignedPet(pet); }
        else { alert("Implement Add Pet flow"); }
    };
    const handleTimeframeSelect = (timeframe: string) => { setSelectedTimeframe(timeframe); /* TODO: API Call */ };
    const handleMarketChange = () => { alert(`Market change to ${selectedMarket} requested.`); /* TODO: API Call */ };
    const handleUnlockChart = () => {
         setIsUnlockingChart(true); alert(`Implement $DGPT check & spending logic!\nCost: ${CHART_UNLOCK_COST} $DGPT`);
         setTimeout(() => { setIsChartUnlocked(true); setIsUnlockingChart(false); }, 1500); // Simulate success
    };
     // --- End Handlers ---

    // --- Helper Functions ---
    const selectedPetBaseData = selectedAssignedPet ? (PET_DATA as PetDataMap)[selectedAssignedPet.key] : null;
    const sanitizePetKeyForImage = (key: string | null): string => key ? key.replace(/[\s()]/g, '') : 'Default';
    // --- End Helper Functions ---


    // === START RENDER HELPER FUNCTIONS (Defined INSIDE component) ===
    const renderTradesList = (trades: MockTrade[]) => {
        if (!trades || trades.length === 0) { return <p style={{textAlign: 'center', marginTop: '20px'}}>No recent trades.</p>; }
        return (
             <ul className={terminalStyles.tradesList}>
                 {trades.map(trade => (
                     <li key={trade.id} className={ trade.result === 'Win' ? terminalStyles.tradeWin : trade.result === 'Loss' ? terminalStyles.tradeLoss : terminalStyles.tradeNeutral }>
                         {trade.result}: {trade.pnl} (Mood {trade.mood})
                     </li>
                 ))}
             </ul>
        );
    };

    const renderControls = () => {
         return (
             <>
                 <div className={terminalStyles.timeframeSelector}>
                     <h4>Time Frame</h4>
                     <div className={terminalStyles.timeframeButtons}>
                         {['1M', '5M', '30M', '1H', '4H'].map(tf => (
                             <button
                                 key={tf}
                                 className={`${terminalStyles.timeframeButton} ${selectedTimeframe === tf ? terminalStyles.timeframeButtonActive : ''}`}
                                 onClick={() => handleTimeframeSelect(tf)}
                                 disabled={!selectedAssignedPet}
                             >
                                 {tf}
                             </button>
                         ))}
                     </div>
                 </div>
                 <div className={terminalStyles.marketSelector}>
                     <h4>Market</h4>
                     <div className={terminalStyles.marketControls}>
                         <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} disabled={!selectedAssignedPet} >
                             {mockMarkets.map(market => ( <option key={market} value={market}>{market}</option> ))}
                         </select>
                         <button onClick={handleMarketChange} disabled={!selectedAssignedPet} className="button button-secondary" > Change Market </button>
                     </div>
                 </div>
            </>
         );
    };
     // === END RENDER HELPER FUNCTIONS ===


    // --- Main Return Statement ---
    return (
        <Layout>
            <div className={`${baseStyles.pageContainer} ${terminalStyles.tradingTerminalLayout}`}>
                <h1 className={terminalStyles.pageTitle}> Trading Terminal </h1>

                {/* --- Grid Layout --- */}
                <div className={terminalStyles.terminalGrid}>

                    {/* --- Column 1: Pet Select / Details --- */}
                    <div className={terminalStyles.petColumn}>
                         {/* Assigned Pet Selector */}
                         <div className={terminalStyles.assignedPetList}>
                            {MOCK_ASSIGNED_PETS.map((pet, index) => (
                                <div
                                    key={pet?.tokenId ?? `empty-${index}`}
                                    className={`${terminalStyles.assignedPetItem} ${pet === null ? terminalStyles.assignedPetItemEmpty : ''} ${selectedAssignedPet?.tokenId === pet?.tokenId ? terminalStyles.assignedPetItemActive : ''}`}
                                    onClick={() => handleSelectAssignedPet(pet)}
                                    title={pet ? `View ${pet.name} (ID: ${pet.tokenId})` : "Add Pet"}
                                >
                                    {pet ? (
                                        <Image
                                            src={pet.imageUrl} alt={pet.name} width={40} height={40}
                                            style={{ objectFit: 'contain' }}
                                            onError={(e) => { e.currentTarget.src = '/PetImages/Default.png'; }}
                                        />
                                    ) : ( '+' )}
                                </div>
                            ))}
                        </div>
                         {/* Selected Pet Details Area */}
                         <section className={terminalStyles.petDetailsArea}>
                              <h3 className={terminalStyles.areaTitle}>Selected Pet</h3>
                              {selectedAssignedPet ? (
                                <>
                                    <Image
                                         src={selectedAssignedPet.imageUrl} alt={selectedAssignedPet.name} width={180} height={180}
                                         className={terminalStyles.petDetailsImage}
                                         onError={(e) => { e.currentTarget.src = '/PetImages/Default.png'; }}
                                         priority
                                    />
                                    <div className={terminalStyles.petDetailsInfo}>
                                         <h3>{selectedAssignedPet.name} <span>(ID: {selectedAssignedPet.tokenId})</span></h3>
                                         <p><strong>Species:</strong> <span>{selectedAssignedPet.species}</span></p>
                                         <p><strong>Status:</strong> <span className={`${terminalStyles.petStatus} ${terminalStyles[`petStatus${selectedAssignedPet.status.toLowerCase()}`]}`}>{selectedAssignedPet.status}</span></p>
                                         <p><strong>Mood:</strong> <span>{selectedAssignedPet.mood}%</span></p>
                                         <p><strong>Trades:</strong> <span>{selectedAssignedPet.trades}</span></p>
                                         <p><strong>Stats:</strong> <span>{selectedAssignedPet.wlbeRatio}</span></p>
                                         <p><strong>Timeframe:</strong> <span>{selectedTimeframe}</span></p>
                                          <p><strong>Market:</strong> <span>{selectedMarket}</span></p>
                                    </div>
                                </>
                            ) : ( <p style={{textAlign: 'center', margin: 'auto'}}>Select an assigned pet above.</p> )}
                         </section>
                    </div> {/* End Pet Column */}


                    {/* --- Column 2: Chart + Strategy Info --- */}
                    <div className={terminalStyles.chartInfoColumn}>
                         {/* Chart Area */}
                         <div className={terminalStyles.chartArea}>
                             {/* Unlock Overlay */}
                             {!isChartUnlocked && (
                                 <div className={terminalStyles.chartUnlockOverlay}>
                                      <h3 className={terminalStyles.unlockText}>Charting Module Locked</h3>
                                      <p className={terminalStyles.unlockCost}>Unlock Cost: {CHART_UNLOCK_COST} $DGPT</p>
                                      {ENABLE_MOCK_CHART_UNLOCKED && ( <button onClick={() => setIsChartUnlocked(true)} className="button button-secondary" style={{marginBottom: '10px', fontSize: '0.8em'}}>[Dev] Force Unlock</button> )}
                                      <button onClick={handleUnlockChart} disabled={isUnlockingChart} className={`button button-primary ${terminalStyles.unlockButton}`}> {isUnlockingChart ? "Unlocking..." : "Unlock Chart"} </button>
                                 </div>
                             )}
                             {/* Chart Area Content */}
                             <h3 className={terminalStyles.areaTitle}>Chart</h3>
                             {isChartUnlocked ? (
                                 // --- RENDER THE CHART COMPONENT ---
                                 <TradingChartComponent />
                             ) : (
                                 <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}> [Chart Locked] </div>
                             )}
                        </div>
                         {/* Strategy Info Area */}
                         <div className={terminalStyles.strategyInfoArea}>
                             <h3 className={terminalStyles.areaTitle}>Strategy Info</h3>
                             {selectedPetBaseData ? (
                                 <div>
                                     <p><strong>Strategy:</strong> {selectedPetBaseData.strategyName ?? 'N/A'}</p>
                                     <p style={{fontSize: '0.85em', lineHeight: '1.4'}}><strong>Description:</strong> {selectedPetBaseData.description ?? 'N/A'}</p>
                                     <p style={{marginTop: '10px'}}><strong>Base Parameters:</strong></p>
                                     <ul style={{ listStyle: 'none', paddingLeft: '10px', fontSize: '0.85em' }}>
                                          {(selectedPetBaseData.parameters ?? []).map((p: any, i: number) =>
                                             <li key={i} style={{marginBottom: '3px'}}>- {p.name}: {p.range}</li>
                                          )}
                                           {!(selectedPetBaseData.parameters?.length) && <li>N/A</li>}
                                     </ul>
                                 </div>
                             ): (
                                 <p>Select a pet to view strategy details.</p>
                             )}
                        </div>
                    </div> {/* End Chart/Info Column */}


                     {/* --- Column 3: Controls + Trades --- */}
                     <div className={terminalStyles.controlsTradesColumn}>
                          {/* Controls Area */}
                         <div className={terminalStyles.controlsArea}>
                              <h3 className={terminalStyles.areaTitle}>Controls</h3>
                              {renderControls()}
                         </div>
                          {/* Trades List Area */}
                          <div className={terminalStyles.tradesArea}>
                              <h3 className={terminalStyles.areaTitle}>Completed Trades</h3>
                              <div className={terminalStyles.tradesListContainer}>
                                   {selectedAssignedPet ? renderTradesList(mockTrades) : <p style={{textAlign: 'center', marginTop: '20px'}}>Select pet</p> }
                              </div>
                         </div>
                     </div> {/* End Controls/Trades Column */}


                </div> {/* End terminalGrid */}
            </div>
        </Layout>
    );
} // --- End of TradingDeskPage component ---