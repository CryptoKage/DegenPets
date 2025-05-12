// src/app/dashboard/page.tsx
"use client";

import Layout from "@/components/Layout";
import { useWallet } from "@/context/WalletContext";
import { useEffect, useState } from "react";
import styles from "@/components/Layout.module.css"; // For .pageContainer style
import dashboardStyles from './Dashboard.module.css'; // Import dashboard specific styles
import { Contract, parseUnits } from 'ethers';
import Link from "next/link"; // Import Link for navigation

// --- Constants ---
const APECHAIN_ID = 33111; // Curtis Testnet Chain ID
const TRADING_DESK_CONTRACT_ADDRESS = "0xF595441554CBCf5d2920F831B368d8aca058Dd5D"; // Curtis Proxy Address

// --- TRADING DESK ABI ---
// **** PASTE YOUR FULL TRADING DESK ABI JSON ARRAY HERE ****
const TRADING_DESK_ABI = [{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},{"inputs":[{"internalType":"address","name":"implementation","type":"address"}],"name":"ERC1967InvalidImplementation","type":"error"},{"inputs":[],"name":"ERC1967NonPayable","type":"error"},{"inputs":[],"name":"EnforcedPause","type":"error"},{"inputs":[],"name":"ExpectedPause","type":"error"},{"inputs":[],"name":"FailedCall","type":"error"},{"inputs":[],"name":"InvalidInitialization","type":"error"},{"inputs":[],"name":"NotInitializing","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[{"internalType":"uint256","name":"sent","type":"uint256"},{"internalType":"uint256","name":"required","type":"uint256"}],"name":"TradingDesk__IncorrectPaymentAmount","type":"error"},{"inputs":[{"internalType":"address","name":"zeroAddress","type":"address"}],"name":"TradingDesk__InvalidAddress","type":"error"},{"inputs":[],"name":"TradingDesk__InvalidBasisPoints","type":"error"},{"inputs":[],"name":"TradingDesk__InvalidPrice","type":"error"},{"inputs":[],"name":"TradingDesk__TransferFailed","type":"error"},{"inputs":[],"name":"UUPSUnauthorizedCallContext","type":"error"},{"inputs":[{"internalType":"bytes32","name":"slot","type":"bytes32"}],"name":"UUPSUnsupportedProxiableUUID","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"pricePaidApe","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"lpShareApe","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"treasuryShareApe","type":"uint256"}],"name":"DeskPurchased","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newPriceApe","type":"uint256"}],"name":"PriceUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"newSpeciesId","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"newGeneration","type":"uint8"}],"name":"StarterPetUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newLpWallet","type":"address"},{"indexed":false,"internalType":"address","name":"newTreasuryWallet","type":"address"}],"name":"WalletsUpdated","type":"event"},{"inputs":[],"name":"LP_SEEDING_BPS","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TOTAL_BPS","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TREASURY_BPS","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"UPGRADE_INTERFACE_VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"degenPetNFTContract","outputs":[{"internalType":"contract DegenPetNFT","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"},{"internalType":"address","name":"_nftContractAddress","type":"address"},{"internalType":"address","name":"_lpWallet","type":"address"},{"internalType":"address","name":"_treasuryWallet","type":"address"},{"internalType":"uint256","name":"_initialPriceApe","type":"uint256"},{"internalType":"uint8","name":"_initialStarterSpecies","type":"uint8"},{"internalType":"uint8","name":"_initialStarterGen","type":"uint8"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"lpSeedingWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"purchasePriceApe","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"purchaseStarterPet","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"newPriceApe","type":"uint256"}],"name":"setPrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"newSpeciesId","type":"uint8"},{"internalType":"uint8","name":"newGeneration","type":"uint8"}],"name":"setStarterPet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newLpWallet","type":"address"},{"internalType":"address","name":"newTreasuryWallet","type":"address"}],"name":"setWallets","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"starterGeneration","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"starterSpeciesId","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"treasuryWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenAddress","type":"address"}],"name":"withdrawStuckTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
// --- END ABI ---
// **** END ABI PASTE AREA ****

// **** MOCKING FLAG ****
const ENABLE_MOCK_AUTH_AND_DESK = true; // Set true to bypass auth/desk check, false for real flow
// **** END MOCKING FLAG ****

export default function DashboardPage() {
    const {
        isConnected,
        userAddress,
        signer,
        authToken: realAuthToken, // Get real token from context
        signIn,
        isAuthenticating,
        currentChainId
    } = useWallet();

    // --- Mock State ---
    const authToken = ENABLE_MOCK_AUTH_AND_DESK && isConnected ? "mock_auth_token" : realAuthToken;
    const [mockHasDesk, setMockHasDesk] = useState(true);
    // --- End Mock State ---

    // --- Real State ---
    const [hasTradingDesk, setHasTradingDesk] = useState<boolean | null>(null);
    const [isCheckingDesk, setIsCheckingDesk] = useState<boolean>(false);
    const [isPurchasingDesk, setIsPurchasingDesk] = useState<boolean>(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [dashboardMessage, setDashboardMessage] = useState<string>("");
    // --- End Real State ---

    // --- Mock Data State ---
    const [mockDgptBalance, setMockDgptBalance] = useState<string>("Loading...");
    const [mockOwnedPets, setMockOwnedPets] = useState<number | string>("Loading...");
    const [mockActivePets, setMockActivePets] = useState<string>("Loading...");
    const [mockGlobalPetsForged, setMockGlobalPetsForged] = useState<string>("Loading...");
    const [mockGlobalCircSupply, setMockGlobalCircSupply] = useState<string>("Loading...");
    // --- End Mock Data State ---
    const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

    // Effect to "fetch" mock data
    useEffect(() => {
        console.log("Fetching mock player stats...");
        setIsLoadingStats(true); // Set loading true (need to define this state if used)

        const timer1 = setTimeout(() => {
            setMockDgptBalance("1,234.56");
            setMockOwnedPets(7);
            setMockActivePets("1 / 4");
            // setIsLoadingStats(false); // Set loading false
            console.log("Mock player stats loaded.");
        }, 1000);
        const timer2 = setTimeout(() => {
            setMockGlobalPetsForged("1,052");
            setMockGlobalCircSupply("9,000,000");
            console.log("Mock global stats loaded.");
        }, 1500);

        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);


    // Effect to trigger SIWE (Only run if NOT mocking)
    useEffect(() => {
        if (ENABLE_MOCK_AUTH_AND_DESK || !isConnected) return;

        console.log(`DashboardPage SIWE Check State: isConnected=${isConnected}, authToken=${realAuthToken}, isAuth=${isAuthenticating}, chainId=${currentChainId}, signer=${!!signer}`);
        if (isConnected === true && signer && realAuthToken === null && !isAuthenticating && currentChainId === APECHAIN_ID) {
            console.log("DashboardPage: Conditions met for SIWE, calling signIn()");
            setDashboardMessage("Attempting Sign-In With Ethereum...");
            signIn().then(success => {
                console.log(`DashboardPage: signIn() resolved, success=${success}`);
                if (!success) {
                    setDashboardMessage("SIWE failed or was cancelled. Please try again or reconnect wallet.");
                }
            });
        }
    }, [isConnected, signer, realAuthToken, isAuthenticating, currentChainId, signIn]); // Use realAuthToken

    // Effect to check desk status (Handles mocking internally)
    useEffect(() => {
        const effectiveAuthToken = ENABLE_MOCK_AUTH_AND_DESK && isConnected ? "mock_auth_token" : realAuthToken;
        if (!effectiveAuthToken) { setHasTradingDesk(null); return; }
        if (ENABLE_MOCK_AUTH_AND_DESK) { setHasTradingDesk(mockHasDesk); return; }

        const checkDeskStatus = async () => {
            // Ensure ABI is populated before checking typeof
             if (signer && userAddress && currentChainId === APECHAIN_ID && TRADING_DESK_ABI && TRADING_DESK_ABI.length > 0) {
                setIsCheckingDesk(true); setHasTradingDesk(null); setDashboardMessage("Verifying Access Pass...");
                try {
                    const contract = new Contract(TRADING_DESK_CONTRACT_ADDRESS, TRADING_DESK_ABI, signer);
                    if (typeof contract.hasTradingDesk !== 'function') throw new Error("ABI missing 'hasTradingDesk'");
                    const userHasDesk = await contract.hasTradingDesk(userAddress);
                    setHasTradingDesk(userHasDesk); setDashboardMessage(userHasDesk ? "Desk Active" : "Desk Not Found");
                    console.log("DashboardPage: Real Desk check result:", userHasDesk);
                } catch (error: any) { console.error("Desk check error:", error); setDashboardMessage(`Desk Check Error: ${error.reason || error.message}`); setHasTradingDesk(false); }
                finally { setIsCheckingDesk(false); }
            } else {
                setHasTradingDesk(null);
                if (currentChainId !== APECHAIN_ID) setDashboardMessage("Switch to Curtis Testnet for Desk Check.");
                else if (!signer) setDashboardMessage("Signer not available for Desk Check.");
                else if (!userAddress) setDashboardMessage("User address not available for Desk Check.");
                else if (!TRADING_DESK_ABI || TRADING_DESK_ABI.length === 0) setDashboardMessage("ABI not configured for Desk Check."); // Check for empty ABI
            }
        };
        const timer = setTimeout(checkDeskStatus, 100); return () => clearTimeout(timer);

    }, [isConnected, realAuthToken, signer, userAddress, currentChainId, mockHasDesk, ENABLE_MOCK_AUTH_AND_DESK]); // Updated dependencies


    // Purchase Desk handler
    const handlePurchaseDesk = async () => {
        if (ENABLE_MOCK_AUTH_AND_DESK) { alert("Purchase disabled while mocking is enabled."); return; }
        if (!signer || currentChainId !== APECHAIN_ID) { alert("Connect to Curtis Testnet first."); return; }
        if (!TRADING_DESK_ABI || TRADING_DESK_ABI.length === 0) { alert("Contract ABI error."); setPurchaseError("ABI config error."); return; }
        setIsPurchasingDesk(true); setPurchaseError(null); setDashboardMessage("Processing purchase...");
        try {
            const contract = new Contract(TRADING_DESK_CONTRACT_ADDRESS, TRADING_DESK_ABI, signer);
            if (typeof contract.purchaseStarterPet !== 'function') { throw new Error("ABI missing 'purchaseStarterPet'"); }
            const purchaseValue = parseUnits("0.01", 18); // Test value
            const tx = await contract.purchaseStarterPet({ value: purchaseValue });
            setDashboardMessage(`Tx sent: ${tx.hash}. Waiting...`); console.log("Tx sent:", tx.hash);
            const receipt = await tx.wait(); console.log("Tx confirmed!", receipt);
            setDashboardMessage("Desk & Pet Purchased!"); setHasTradingDesk(true); // Update real state
        } catch (error: any) {
            console.error("Purchase error:", error); let friendlyError = "Purchase failed.";
            if (error.code === "INSUFFICIENT_FUNDS") friendlyError = "Insufficient APE for 0.01 + gas.";
            else if (error.code === "ACTION_REJECTED" || error.message?.includes("rejected")) friendlyError = "Transaction rejected.";
            else if (error.reason) friendlyError = `Transaction failed: ${error.reason}`;
            else if (error.message) friendlyError = error.message;
            setPurchaseError(friendlyError); setDashboardMessage(friendlyError);
        } finally { setIsPurchasingDesk(false); }
     };

    // Mock Toggle Button Handler
    const toggleMockDesk = () => { if (ENABLE_MOCK_AUTH_AND_DESK) setMockHasDesk(!mockHasDesk); }


    // --- Render Content function ---
    const renderContent = () => {
        // Use derived authToken (which is mock or real based on flag)
        const effectiveAuthToken = ENABLE_MOCK_AUTH_AND_DESK && isConnected ? "mock_auth_token" : realAuthToken;
        // Use derived desk status
        const effectiveHasDesk = ENABLE_MOCK_AUTH_AND_DESK ? mockHasDesk : hasTradingDesk;
        const effectiveChainId = ENABLE_MOCK_AUTH_AND_DESK ? APECHAIN_ID : currentChainId;

        // 1. Check Connection
        if (!isConnected) {
             return (
                 <div style={{ padding: '30px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '20px' }}>Please connect your wallet to enter the Degen Pets Console.</p>
                    <a href="https://www.degenpets.com" className="button button-secondary">Back to Main Site</a>
                 </div>
             );
        }

        // 2. Check Network (only if NOT mocking)
        if (!ENABLE_MOCK_AUTH_AND_DESK && effectiveChainId !== APECHAIN_ID) {
            return (
                 <div>
                    <p style={{color: 'var(--warning-color)', fontWeight: 'bold', fontSize: '1.1em' }}>
                        ⚠️ Please switch to ApeChain Curtis Testnet in your wallet.
                    </p>
                    <p style={{color: 'var(--text-muted)'}}>
                        (Expected Chain ID: {APECHAIN_ID}, Currently on: {currentChainId || 'Unknown'})
                    </p>
                </div>
            );
        }

        // 3. Check Authentication Status (only if NOT mocking)
        if (!ENABLE_MOCK_AUTH_AND_DESK && isAuthenticating) {
             return <p>Authenticating... Please check your wallet if needed.</p>;
        }
        // If no effective token (real or mock), prompt sign-in (only if not mocking)
        if (!effectiveAuthToken) {
             return (
                 <div>
                     <p>Authentication required.</p>
                     <button onClick={signIn} disabled={!signer || isAuthenticating} className="button button-secondary" style={{marginTop: '15px'}}>
                         {!signer ? 'Initializing...' : 'Sign In Message'}
                     </button>
                 </div>
            );
        }

        // --- Authenticated (Real or Mocked) ---
        // 4. Check Desk Status (show loading only if NOT mocking)
        if (!ENABLE_MOCK_AUTH_AND_DESK && (isCheckingDesk || effectiveHasDesk === null)) {
            return <p>{dashboardMessage || "Verifying Degen Access Pass..."}</p>;
        }

        // 5. Render based on effective desk status
        if (effectiveHasDesk) {
            // --- RENDER DASHBOARD ---
            return (
                <div>
                    <div className={dashboardStyles.dashboardGrid}>
                        {/* Column 1: Stats */}
                        <div className={dashboardStyles.statsColumn}>
                            <section className={dashboardStyles.section}>
                                <h3>Player Stats</h3>
                                <div className={dashboardStyles.statsGrid}>
                                    <div className={dashboardStyles.statItem}>
                                        <span className={dashboardStyles.statLabel}>$DGPT Balance</span>
                                        {/* Use mock data for display */}
                                        <span className={mockDgptBalance === 'Loading...' ? dashboardStyles.statValueLoading : dashboardStyles.statValue}>
                                            {mockDgptBalance}
                                        </span>
                                    </div>
                                    <div className={dashboardStyles.statItem}>
                                        <span className={dashboardStyles.statLabel}>Owned Pets</span>
                                        <span className={mockOwnedPets === 'Loading...' ? dashboardStyles.statValueLoading : dashboardStyles.statValue}>
                                            {mockOwnedPets}
                                        </span>
                                    </div>
                                     <div className={dashboardStyles.statItem}>
                                        <span className={dashboardStyles.statLabel}>Active Pets</span>
                                        <span className={mockActivePets === 'Loading...' ? dashboardStyles.statValueLoading : dashboardStyles.statValue}>
                                            {mockActivePets}
                                        </span>
                                     </div>
                                </div>
                            </section>

                            <section className={dashboardStyles.section}>
                                <h3>Global Stats</h3>
                                <div className={dashboardStyles.statsGrid}>
                                    <div className={dashboardStyles.statItem}>
                                        <span className={dashboardStyles.statLabel}>Total Pets Forged</span>
                                        <span className={dashboardStyles.statValue}>{mockGlobalPetsForged}</span>
                                    </div>
                                    <div className={dashboardStyles.statItem}>
                                        <span className={dashboardStyles.statLabel}>Circulating Supply</span>
                                         <span className={dashboardStyles.statValue}>{mockGlobalCircSupply}</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Column 2: Middle Empty/Graphic? */}
                        <div className={dashboardStyles.middleColumn}>
                            <span>[Center Area]</span>
                        </div>

                        {/* Column 3: News/Updates */}
                        <div className={dashboardStyles.newsColumn}>
                             <section className={dashboardStyles.section}>
                                 <h3>System Updates</h3>
                                 <div className={dashboardStyles.newsContent}>
                                     <p><strong>May 8, 2025:</strong> Console V1 Online. Desk purchases on Curtis Testnet.</p>
                                     <p><strong>May 1, 2025:</strong> Initial species deployed.</p>
                                     <p><a href="#">View All News...</a></p>
                                     <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '15px 0'}} />
                                     <p><strong>Upcoming Tournament:</strong><br/> Cyber Circuit Qualifiers - May 15th</p>
                                 </div>
                             </section>
                        </div>
                    </div> {/* End dashboardGrid */}

                     {/* Navigation Grid Below */}
                     <div className={dashboardStyles.navGrid}>
                          <Link href="/trading-desk" className={dashboardStyles.navLink}> Trading Desk </Link>
                          <Link href="/collection" className={dashboardStyles.navLink}> Collection </Link>
                          <Link href="/shop" className={dashboardStyles.navLink}> Shop </Link>
                          <Link href="/tournaments" className={dashboardStyles.navLink}> Tournaments </Link>
                          <Link href="/forge" className={dashboardStyles.navLink}> Forge </Link>
                          <Link href="https://degen-pets-1.gitbook.io/degen-pets/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.navLink}> Player Guide </Link>
                     </div>
                </div> // Closing div for the main dashboard content
            );
        } else {
            // --- RENDER PURCHASE UI ---
            return (
                <div style={{padding: '20px', border: '1px solid var(--primary-color)', maxWidth: '600px', margin: '20px auto', backgroundColor: 'rgba(0, 169, 255, 0.05)'}}>
                    <h2 style={{color: 'var(--primary-color)'}}>Degen Access Pass Required</h2>
                    <p style={{margin: '15px 0'}}>To unleash your Degen Pets, acquire a Trading Desk & Starter Pet.</p>
                    <p style={{margin: '10px 0', fontSize: '0.9em'}}>Cost: 30 APE (Currently <strong>0.01 APE</strong> for Testnet)</p>
                    <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                         <button
                            onClick={handlePurchaseDesk}
                            disabled={ENABLE_MOCK_AUTH_AND_DESK || isPurchasingDesk || (!ENABLE_MOCK_AUTH_AND_DESK && isCheckingDesk)}
                            className="button button-primary"
                            style={{ minWidth: '180px' }}
                            title={ENABLE_MOCK_AUTH_AND_DESK ? "Purchase disabled in Dev Mode" : ""}
                        >
                            {isPurchasingDesk ? "Processing..." :
                             (!ENABLE_MOCK_AUTH_AND_DESK && isCheckingDesk) ? "Verifying..." : "Purchase Access"}
                        </button>
                         <a href="https://www.degenpets.com" className="button button-secondary" style={{ minWidth: '180px' }}>
                             Learn More
                         </a>
                    </div>
                    {/* Error display */}
                    {!ENABLE_MOCK_AUTH_AND_DESK && purchaseError &&
                        <p style={{ color: 'var(--error-color)', marginTop: '15px', fontWeight: 'bold' }}>Error: {purchaseError}</p>
                    }
                     {/* Status message display */}
                    {!ENABLE_MOCK_AUTH_AND_DESK && dashboardMessage && !isCheckingDesk && !isPurchasingDesk && hasTradingDesk === false && dashboardMessage !== "Trading Desk: Not Found" && !purchaseError &&
                        <p style={{color: 'var(--text-muted)', marginTop: '10px', fontSize: '0.9em'}}>{dashboardMessage}</p>
                    }
                </div>
            );
        }
    };
    // --- End Render Logic ---

    // --- Inline Styles --- (Defined for clarity, move to CSS Modules later)
    const sectionStyle: React.CSSProperties = { marginBottom: '20px', padding: '20px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(13, 17, 23, 0.5)' };
    const deskSlotsContainerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginTop: '15px' }; // Example, not used directly in this refined layout
    const deskSlotStyle: React.CSSProperties = { border: '1px dashed var(--text-muted)', padding: '20px', minWidth: '120px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }; // Example, not used directly in this refined layout
    // --- End Inline Styles ---


    // --- Component Return ---
    return (
        <Layout>
            <div className={styles.pageContainer} style={{ textAlign: 'center' }}>
                <h1 style={{marginBottom: '30px', color: 'var(--secondary-color)'}}>[ Dashboard ]</h1>
                {/* Developer Mock Toggle */}
                {ENABLE_MOCK_AUTH_AND_DESK && (
                     <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(255,255,0,0.1)', border: '1px solid yellow', borderRadius: '4px' }}>
                         <p style={{ color: 'yellow', margin: '0 0 5px 0', fontSize: '0.9em' }}>DEV MODE: Auth/Desk Mocked</p>
                         <label style={{ marginRight: '10px', color: 'var(--text-muted)', fontSize: '0.9em' }}>
                             Simulate Has Desk:
                             <input type="checkbox" checked={mockHasDesk} onChange={toggleMockDesk} style={{ marginLeft: '5px', verticalAlign: 'middle' }}/>
                         </label>
                     </div>
                 )}
                 {/* End Mock Toggle */}

                {renderContent()}
            </div>
        </Layout>
    );
} // --- End of DashboardPage component ---