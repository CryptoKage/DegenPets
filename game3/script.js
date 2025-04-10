// --- Configuration ---
const API_BASE_URL = 'http://127.0.0.1:5000/api'; // Your backend API address
const POLLING_INTERVAL_MS = 8000; // How often to refresh game state (e.g., 8 seconds)

// --- Global State Variables ---
let gameState = {
    player_dgpt: 0,
    pets: [],
    markets: {},
    definitions: {
        pets: {},
        consumables: {}
    }
};
let pollingIntervalId = null; // To store the interval ID for stopping later
let currentUsername = ''; // Store username after login

// --- DOM Element References ---
// Auth Section
const authSection = document.getElementById('auth-section');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const registerUsernameInput = document.getElementById('register-username');
const registerPasswordInput = document.getElementById('register-password');
const registerButton = document.getElementById('register-button');
const authMessage = document.getElementById('auth-message');

// Game Area
const gameArea = document.getElementById('game-area');
const playerUsernameSpan = document.getElementById('player-username');
const playerDgptSpan = document.getElementById('player-dgpt');
const logoutButton = document.getElementById('logout-button');
const notificationsDiv = document.getElementById('notifications');
const marketListUl = document.getElementById('market-list');
const petListUl = document.getElementById('pet-list');
const petShopListUl = document.getElementById('pet-shop-list');
const consumableShopListUl = document.getElementById('consumable-shop-list');
const leaderboardListOl = document.getElementById('leaderboard-list');

// Pet Details Modal
const petDetailsModal = document.getElementById('pet-details-modal');
const petDetailsContentDiv = document.getElementById('pet-details-content');
const closeModalButton = document.getElementById('close-modal-button');


// --- Utility Functions ---

/** Displays messages to the user (notifications or auth feedback) */
function showMessage(element, message, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.className = 'message'; // Reset class
    element.classList.add(isError ? 'error' : 'success');
    element.style.display = 'block';
    // Optional: fade out message after a few seconds
     if (element.id === 'notifications') { // Only auto-fade notifications
         setTimeout(() => { if (element.textContent === message) element.style.display = 'none'; }, 5000);
     }
}

/** Clears message areas */
function clearMessage(element) {
     if (!element) return;
    element.textContent = '';
    element.style.display = 'none';
}

/** Generic API Fetch function */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
        // Credentials 'include' is crucial for sending/receiving session cookies
        const response = await fetch(url, { credentials: 'include', ...options });

        if (response.status === 401) { // Unauthorized (likely session expired or not logged in)
            console.warn('API request unauthorized. Forcing logout.');
            handleLogout(false); // Don't call API again if already unauthorized
            throw new Error('Unauthorized');
        }

        // Try parsing JSON, but handle cases where response might be empty (e.g., successful logout)
        let data = {};
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else if (!response.ok) {
            // If not OK and not JSON, throw error with status text
             throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        // If response is OK, but no JSON, return success=true (e.g. for logout)
        if (response.ok && !data.success && Object.keys(data).length === 0) {
             return { success: true }; // Assume success if OK and empty
        }


        // Check for backend-defined success flag
        if (!response.ok || (data.success === false)) {
            const errorMessage = data.message || `HTTP error ${response.status}`;
            console.error(`API Error on ${endpoint}:`, errorMessage, data);
            throw new Error(errorMessage);
        }

        return data; // Contains { success: true, ... } or other data
    } catch (error) {
        console.error(`Fetch Error on ${endpoint}:`, error);
        // Don't show generic fetch error if it was an intentional Unauthorized logout
        if (error.message !== 'Unauthorized') {
            showMessage(notificationsDiv, `Network or API error: ${error.message}`, true);
        }
        throw error; // Re-throw to stop promise chain if needed
    }
}


// --- Authentication Functions ---

async function handleLogin() {
    clearMessage(authMessage);
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (!username || !password) {
        showMessage(authMessage, 'Username and password required.', true);
        return;
    }

    loginButton.disabled = true;
    try {
        const data = await apiFetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (data.success) {
            currentUsername = username; // Store username
            showGameArea();
            startGamePolling(); // Start fetching game state periodically
            fetchInitialGameData(); // Get shops, leaderboard etc. once
        } else {
            // Error message should be thrown by apiFetch and caught below
        }
    } catch (error) {
        showMessage(authMessage, error.message || 'Login failed.', true);
    } finally {
         loginButton.disabled = false;
         loginPasswordInput.value = ''; // Clear password field
    }
}

async function handleRegister() {
    clearMessage(authMessage);
    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value.trim();
    if (!username || !password) {
        showMessage(authMessage, 'Username and password required.', true);
        return;
    }
     if (password.length < 4) { // Example simple validation
         showMessage(authMessage, 'Password must be at least 4 characters.', true);
         return;
     }

    registerButton.disabled = true;
    try {
        const data = await apiFetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (data.success) {
            // API automatically logs in on successful registration
            currentUsername = username;
            showGameArea();
            startGamePolling();
            fetchInitialGameData();
        } else {
             // Error handled by catch
        }
    } catch (error) {
        showMessage(authMessage, error.message || 'Registration failed.', true);
    } finally {
        registerButton.disabled = false;
        registerPasswordInput.value = ''; // Clear password field
    }
}

async function handleLogout(callApi = true) {
    stopGamePolling(); // Stop fetching data
    showAuthArea(); // Show login screen first

    if (callApi) {
        try {
            await apiFetch('/logout', { method: 'POST' });
            // No need to do anything with response, just ensure it doesn't error
        } catch (error) {
            // Log error but proceed with UI cleanup
            console.error("Logout API call failed:", error);
        }
    }
    // Clear sensitive data
    currentUsername = '';
    gameState = { player_dgpt: 0, pets: [], markets: {}, definitions: { pets: {}, consumables: {} } };
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
    registerUsernameInput.value = '';
    registerPasswordInput.value = '';
    clearMessage(authMessage);
    clearMessage(notificationsDiv);
    // Clear dynamic content areas
    marketListUl.innerHTML = '<li>Logged out.</li>';
    petListUl.innerHTML = '<li>Logged out.</li>';
    petShopListUl.innerHTML = '<li>Logged out.</li>';
    consumableShopListUl.innerHTML = '<li>Logged out.</li>';
    leaderboardListOl.innerHTML = '<li>Logged out.</li>';
}


// --- UI Update Functions ---

function showAuthArea() {
    authSection.style.display = 'block';
    gameArea.style.display = 'none';
}

function showGameArea() {
    authSection.style.display = 'none';
    gameArea.style.display = 'block';
    playerUsernameSpan.textContent = currentUsername; // Update username display
}

function updatePlayerInfo() {
    playerDgptSpan.textContent = gameState.player_dgpt.toFixed(2);
}

function updateMarketList() {
    marketListUl.innerHTML = ''; // Clear previous list
    if (Object.keys(gameState.markets).length === 0) {
        marketListUl.innerHTML = '<li>No market data available.</li>';
        return;
    }

    for (const marketId in gameState.markets) {
        const market = gameState.markets[marketId];
        const li = document.createElement('li');
        li.className = 'market-item'; // Add class for styling

        // Add classes based on signals/levels for styling
        const emaClass = market.ema_signal === 'BULL' ? 'signal-bull' : 'signal-bear';
        const momClass = market.momentum_signal === 'BULL' ? 'signal-bull' : 'signal-bear';
        const volClass = market.volatility_level === 'HIGH' ? 'vol-high' : 'vol-low';

        li.innerHTML = `
            <strong>${marketId}</strong><br>
            Date: <span class="data">${market.date}</span> |
            Close: <span class="data">${market.close.toFixed(2)}</span><br>
            EMA: <span class="${emaClass}">${market.ema_signal}</span> |
            Momentum: <span class="${momClass}">${market.momentum_signal}</span> |
            Volatility: <span class="${volClass}">${market.volatility_level} (${market.volatility_raw})</span>
        `;
        marketListUl.appendChild(li);
    }
}

function updatePetList() {
    petListUl.innerHTML = ''; // Clear previous list
    if (gameState.pets.length === 0) {
        petListUl.innerHTML = '<li>You have no pets. Visit the shop!</li>';
        return;
    }

    // Create market options for the assignment dropdown
     const marketOptionsHtml = Object.keys(gameState.markets)
         .map(id => `<option value="${id}">${id}</option>`)
         .join('');

    gameState.pets.forEach(pet => {
        const li = document.createElement('li');
        li.className = 'pet-item'; // Add class for styling
        li.dataset.petId = pet.instance_id; // Store pet ID for actions

        // Add classes based on mood/position for styling
        const moodClass = pet.mood >= 0.1 ? 'mood-good' : (pet.mood <= -0.1 ? 'mood-bad' : 'mood-neutral');
        const positionClass = `position-${pet.position.toLowerCase()}`;

        // Build active effects string
         let effectsStr = 'None';
         if (pet.active_effects && Object.keys(pet.active_effects).length > 0) {
             effectsStr = Object.entries(pet.active_effects)
                 .map(([key, value]) => `${key.replace('_', ' ')}: ${value}`)
                 .join(', ');
         }

        li.innerHTML = `
            <strong>${pet.display_name} (ID: ${pet.instance_id})</strong> - ${pet.pet_type}<br>
            Market: <span class="data">${pet.assigned_ticker || 'None'}</span> |
            Position: <span class="${positionClass}">${pet.position} ${pet.entry_price ? `(@ ${pet.entry_price.toFixed(2)})` : ''}</span><br>
            Mood: <span class="${moodClass}">${pet.mood.toFixed(2)}</span> |
            Trades: <span class="data">${pet.trade_count}</span> |
            Badges: <span class="data">${pet.badges.length}</span><br>
            Active Effects: <span class="data">${effectsStr}</span>

            <div class="pet-actions">
                 <button class="details-button">Details</button>
                <select class="assign-market-select ${!marketOptionsHtml ? 'hidden' : ''}" ${!marketOptionsHtml ? 'disabled' : ''}>
                    <option value="">Assign Market...</option>
                    ${marketOptionsHtml}
                 </select>
                 <button class="assign-button" ${!marketOptionsHtml ? 'disabled' : ''}>Assign</button>
                 <select class="feed-item-select">
                      <option value="">Feed Item...</option>
                      <!-- Consumable options added dynamically here -->
                 </select>
                 <button class="feed-button" disabled>Feed</button> <!-- Disabled until item selected -->
            </div>
        `;

        // Add event listeners for this pet's buttons/selects
        li.querySelector('.details-button').addEventListener('click', () => showPetDetails(pet.instance_id));
        li.querySelector('.assign-button').addEventListener('click', (e) => {
             const select = e.target.previousElementSibling; // Find the select element right before the button
             const marketId = select.value;
             if (marketId) {
                 assignPet(pet.instance_id, marketId);
             } else {
                 showMessage(notificationsDiv, 'Please select a market to assign.', true);
             }
        });

         const feedSelect = li.querySelector('.feed-item-select');
         const feedButton = li.querySelector('.feed-button');

        // Populate feed dropdown
         feedSelect.innerHTML = '<option value="">Feed Item...</option>'; // Reset
         if (gameState.definitions.consumables && Object.keys(gameState.definitions.consumables).length > 0) {
             for (const itemId in gameState.definitions.consumables) {
                 const item = gameState.definitions.consumables[itemId];
                 feedSelect.innerHTML += `<option value="${itemId}">${item.name} ($${item.cost.toFixed(2)})</option>`;
             }
         } else {
             feedSelect.disabled = true; // Disable if no items loaded yet
         }

         // Enable feed button only when an item is selected
         feedSelect.addEventListener('change', (e) => {
             feedButton.disabled = !e.target.value; // Disable if the value is empty ""
         });

         feedButton.addEventListener('click', (e) => {
             const itemId = feedSelect.value;
             if (itemId) {
                 feedPet(pet.instance_id, itemId);
             }
        });

        petListUl.appendChild(li);
    });
}

function updatePetShop() {
    petShopListUl.innerHTML = ''; // Clear list
    if (Object.keys(gameState.definitions.pets).length === 0) {
        petShopListUl.innerHTML = '<li>Pet shop data unavailable.</li>';
        return;
    }
    for (const petId in gameState.definitions.pets) {
        const pet = gameState.definitions.pets[petId];
        const li = document.createElement('li');
        li.className = 'shop-item';
        li.innerHTML = `
            <strong>${pet.display_name}</strong> - Type: ${petId}<br>
            Cost: <span class="cost">$${pet.cost.toFixed(2)} $dgpt</span><br>
            Strategy: <span class="desc">${pet.flavor_text || 'Trades automatically.'}</span>
            <button class="buy-pet-button" data-pet-type="${petId}">Adopt ($${pet.cost.toFixed(2)})</button>
        `;
        // Add event listener for the buy button
         li.querySelector('.buy-pet-button').addEventListener('click', (e) => {
             const typeId = e.target.dataset.petType;
             buyPet(typeId);
         });
        petShopListUl.appendChild(li);
    }
}


function updateConsumableShop() {
    consumableShopListUl.innerHTML = ''; // Clear list
    if (Object.keys(gameState.definitions.consumables).length === 0) {
        consumableShopListUl.innerHTML = '<li>Item shop data unavailable.</li>';
        return;
    }
    for (const itemId in gameState.definitions.consumables) {
        const item = gameState.definitions.consumables[itemId];
        const li = document.createElement('li');
         li.className = 'shop-item';
        li.innerHTML = `
            <strong>${item.name}</strong> - Type: ${itemId}<br>
            Cost: <span class="cost">$${item.cost.toFixed(2)} $dgpt</span><br>
            Effect: <span class="desc">${item.description || 'Improves pet performance.'}</span><br>
            <i>(Use items via the 'Feed' button on your pets list)</i>
        `;
         // We don't add a buy button here, items are used directly from the pet list
        consumableShopListUl.appendChild(li);
    }
     // Update feed dropdowns in the pet list now that consumables are loaded
     updatePetList();
}


function updateLeaderboard() {
    leaderboardListOl.innerHTML = ''; // Clear list
    if (!gameState.leaderboard || gameState.leaderboard.length === 0) {
        leaderboardListOl.innerHTML = '<li>Leaderboard is empty.</li>';
        return;
    }
    gameState.leaderboard.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        li.innerHTML = `
            <span class="rank">#${entry.rank}</span>
            <span class="name">${entry.player_name}</span> -
            <span class="score">${entry.dgpt.toFixed(2)} $dgpt</span>
        `;
        leaderboardListOl.appendChild(li);
    });
}


// --- Game Action Functions ---

async function fetchGameState() {
    console.log("Polling for game state..."); // Log polling attempts
    try {
        const data = await apiFetch('/gamestate'); // Use GET by default
        if (data) { // Ensure data is received (apiFetch throws on error)
             // Deep merge might be safer, but for now, overwrite
             // Only update if data seems valid
             if (data.pets !== undefined && data.markets !== undefined && data.player_dgpt !== undefined) {
                 gameState.pets = data.pets;
                 gameState.markets = data.markets;
                 gameState.player_dgpt = data.player_dgpt;

                 // Update relevant UI parts
                 updatePlayerInfo();
                 updateMarketList();
                 updatePetList(); // This needs market and pet data
             } else {
                 console.warn("Received incomplete gamestate data:", data);
             }
        }
    } catch (error) {
        // Error is likely handled by apiFetch (e.g., unauthorized, network error)
        // Stop polling if unauthorized to prevent spamming requests
        if (error.message === 'Unauthorized') {
             console.warn("Stopping polling due to authorization error.");
             stopGamePolling();
        } else {
            console.error("Error fetching game state:", error);
            // Optionally show a persistent error in the UI?
            // showMessage(notificationsDiv, "Failed to update game state.", true);
        }
    }
}

async function fetchInitialGameData() {
    // Fetch things that don't change often like definitions and leaderboard
    try {
        const [petsDef, consumablesDef, leaderboardData, initialGameState] = await Promise.all([
            apiFetch('/definitions/pets'),
            apiFetch('/definitions/consumables'),
            apiFetch('/leaderboard'),
            apiFetch('/gamestate') // Fetch initial state immediately on login
        ]);

        if(petsDef) gameState.definitions.pets = petsDef;
        if(consumablesDef) gameState.definitions.consumables = consumablesDef;
        if(leaderboardData && leaderboardData.leaderboard) gameState.leaderboard = leaderboardData.leaderboard;

         // Process initial game state
        if (initialGameState && initialGameState.pets !== undefined) {
            gameState.pets = initialGameState.pets;
            gameState.markets = initialGameState.markets;
            gameState.player_dgpt = initialGameState.player_dgpt;
        }


        // Update UI with fetched definitions and leaderboard
        updatePetShop();
        updateConsumableShop(); // This will also repopulate feed dropdowns via updatePetList()
        updateLeaderboard();

        // Update UI with initial game state
         updatePlayerInfo();
         updateMarketList();
         updatePetList(); // This is called again by updateConsumableShop, but safe to call here too.


    } catch (error) {
        console.error("Error fetching initial game data:", error);
        showMessage(notificationsDiv, "Failed to load shop or leaderboard data.", true);
    }
}


async function buyPet(petTypeId) {
    console.log(`Attempting to buy pet: ${petTypeId}`);
    try {
        const data = await apiFetch('/action/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_type_id: petTypeId })
        });

        if (data.success) {
            showMessage(notificationsDiv, data.message || `Successfully adopted ${petTypeId}!`, false);
            gameState.player_dgpt = data.new_dgpt_balance; // Update local state
            if (data.new_pet) {
                 gameState.pets.push(data.new_pet); // Add new pet to local state
            }
            updatePlayerInfo(); // Refresh UI
            updatePetList(); // Refresh UI
        } // Errors handled by catch
    } catch (error) {
        showMessage(notificationsDiv, error.message || `Failed to adopt ${petTypeId}.`, true);
    }
}

async function assignPet(petInstanceId, marketId) {
    console.log(`Assigning pet ${petInstanceId} to market ${marketId}`);
     // Find the assign button for this pet to disable it during the request
     const petLi = petListUl.querySelector(`li[data-pet-id="${petInstanceId}"]`);
     const assignButton = petLi ? petLi.querySelector('.assign-button') : null;
     if (assignButton) assignButton.disabled = true;

    try {
        const data = await apiFetch('/action/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_instance_id: petInstanceId, market_id: marketId })
        });

        if (data.success) {
            showMessage(notificationsDiv, data.message || `Pet ${petInstanceId} assigned to ${marketId}.`, false);
            // Update local state immediately for faster UI feedback
            const petIndex = gameState.pets.findIndex(p => p.instance_id === petInstanceId);
            if (petIndex !== -1) {
                gameState.pets[petIndex].assigned_ticker = marketId;
                // Assuming assignment resets position/entry_price (check backend logic)
                 gameState.pets[petIndex].position = "FLAT";
                 gameState.pets[petIndex].entry_price = null;
            }
             updatePetList(); // Refresh UI with new assignment
             // No need to update DGPT here unless assigning costs money
        } // Errors handled by catch
    } catch (error) {
        showMessage(notificationsDiv, error.message || `Failed to assign pet ${petInstanceId}.`, true);
    } finally {
         if (assignButton) assignButton.disabled = false; // Re-enable button
    }
}


async function feedPet(petInstanceId, itemId) {
    console.log(`Feeding item ${itemId} to pet ${petInstanceId}`);
     // Find the feed button for this pet to disable it during the request
     const petLi = petListUl.querySelector(`li[data-pet-id="${petInstanceId}"]`);
     const feedButton = petLi ? petLi.querySelector('.feed-button') : null;
     if (feedButton) feedButton.disabled = true;

    try {
        const data = await apiFetch('/action/feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_instance_id: petInstanceId, item_id: itemId })
        });

        if (data.success) {
            let message = data.message || `Used ${itemId} on pet ${petInstanceId}.`;
            if(data.effect_desc) message += ` Effect: ${data.effect_desc}`;
            if(data.ai_message) message += ` AI: ${data.ai_message}`; // Display AI message if present
            showMessage(notificationsDiv, message, false);

            gameState.player_dgpt = data.new_dgpt_balance; // Update DGPT

            // --- Crucial: Update the specific pet's state locally ---
             // Need to re-fetch the game state OR parse effect_desc (less reliable)
             // Easiest is to trigger an immediate refresh after successful feed
             await fetchGameState(); // Get the latest state reflecting the feed

            updatePlayerInfo();
            // updatePetList(); // fetchGameState already calls this
        } // Errors handled by catch
    } catch (error) {
        showMessage(notificationsDiv, error.message || `Failed to feed pet ${petInstanceId}.`, true);
    } finally {
         if (feedButton) {
             // Re-enable button, but it might become disabled again if the select resets
             feedButton.disabled = !petLi.querySelector('.feed-item-select').value;
         }
         // Optionally reset the feed dropdown?
         // if (petLi) petLi.querySelector('.feed-item-select').value = '';
    }
}

// --- Pet Details Modal Logic ---
function showPetDetails(petInstanceId) {
    const pet = gameState.pets.find(p => p.instance_id === petInstanceId);
    if (!pet) return;

     // Fetch detailed report data (assuming /api/report exists - ADJUST if needed)
     // Let's simulate for now, using existing gameState data
     // Replace this with an actual API call to /api/report/{pet_id} if you add that endpoint
     const detailsHtml = `
         <p><strong>Name:</strong> ${pet.display_name} (ID: ${pet.instance_id})</p>
         <p><strong>Type:</strong> ${pet.pet_type}</p>
         <p><strong>Assigned Market:</strong> ${pet.assigned_ticker || 'None'}</p>
         <p><strong>Current Position:</strong> ${pet.position} ${pet.entry_price ? `(Entry: ${pet.entry_price.toFixed(2)})` : ''}</p>
         <p><strong>Mood:</strong> ${pet.mood.toFixed(2)}</p>
         <p><strong>Total Trades:</strong> ${pet.trade_count}</p>
         <!-- Add win/loss/streak data here once available from an API -->
         <p><strong>Badges (${pet.badges.length}):</strong> ${pet.badges.join(', ') || 'None'}</p>
         <p><strong>Active Effects:</strong></p>
         <ul>
             ${pet.active_effects && Object.keys(pet.active_effects).length > 0
                 ? Object.entries(pet.active_effects).map(([key, value]) => `<li>${key.replace('_', ' ')}: ${value}</li>`).join('')
                 : '<li>None</li>'
             }
         </ul>
     `;
     petDetailsContentDiv.innerHTML = detailsHtml;
     petDetailsModal.style.display = 'block';
}

function hidePetDetails() {
    petDetailsModal.style.display = 'none';
    petDetailsContentDiv.innerHTML = ''; // Clear content
}


// --- Polling Control ---
function startGamePolling() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId); // Clear any existing interval
    }
    // Fetch immediately first, then start interval
    fetchGameState();
    pollingIntervalId = setInterval(fetchGameState, POLLING_INTERVAL_MS);
    console.log(`Polling started with interval ${POLLING_INTERVAL_MS}ms.`);
}

function stopGamePolling() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
        console.log("Polling stopped.");
    }
}

// --- Initialization and Event Listeners ---
function initialize() {
    console.log("Initializing Frontend...");
    // Add Event Listeners
    loginButton.addEventListener('click', handleLogin);
    registerButton.addEventListener('click', handleRegister);
    logoutButton.addEventListener('click', () => handleLogout(true)); // Pass true to call API

     // Add listeners for modal closing
     closeModalButton.addEventListener('click', hidePetDetails);
     window.addEventListener('click', (event) => { // Close if clicked outside modal content
         if (event.target == petDetailsModal) {
             hidePetDetails();
         }
     });


    // Try to check if user is already logged in (e.g., session cookie exists)
    // We can attempt to fetch user info. If it succeeds, show game area.
     apiFetch('/get_current_user')
         .then(data => {
             if (data.username) {
                 console.log(`User '${data.username}' already logged in.`);
                 currentUsername = data.username;
                 showGameArea();
                 startGamePolling(); // Start polling
                 fetchInitialGameData(); // Fetch static data
             } else {
                // Shouldn't happen if API follows spec, but handle defensively
                 console.log("No active session found.");
                 showAuthArea();
             }
         })
         .catch(error => {
            // This is expected if not logged in (401 Unauthorized)
             if (error.message === 'Unauthorized') {
                 console.log("No active session found (Unauthorized). Showing auth.");
             } else {
                // Log other unexpected errors during initial check
                 console.error("Error checking initial login status:", error);
             }
             showAuthArea();
         });

     console.log("Initialization complete. Waiting for user action or session check.");
}

// --- Run Initialization on Page Load ---
document.addEventListener('DOMContentLoaded', initialize);
