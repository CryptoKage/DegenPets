// pets.js - Logic for the Pet Showcase page (Corrected)

// --- Imports ---
import { ethers } from 'ethers'; // <<< IMPORT ADDED
import { PET_DATA } from './src/petData.js'; // Import shared pet data

// --- App Constants (from petData or specific needed here) ---
// Define addresses needed for link generation if not implicitly in PET_DATA
const BAYC_SHADOW_ADDRESS = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
// const MAYC_SHADOW_ADDRESS = "0x60E4d786628Fea6478F785A6d7e704777c86a7c6"; // Needed if linking MAYC specifically


// --- DOM Elements for this page ---
const gridContainer = document.getElementById('petThumbnailGrid');
const displayArea = document.getElementById('petDisplayArea');
const selectedPetImage = document.getElementById('selectedPetImage');
const selectedPetName = document.getElementById('selectedPetName');
const selectedPetStrategyName = document.getElementById('selectedPetStrategyName');
const selectedPetStrategyDesc = document.getElementById('selectedPetStrategyDesc');
const selectedPetParamList = document.getElementById('selectedPetParamList');
const selectedPetSupplyValue = document.getElementById('selectedPetSupplyValue');
// Affinity Box Elements
const affinityInfoBox = document.getElementById('affinityInfoBox');
const affinityTriggerType = document.getElementById('affinityTriggerType');
const affinityCollectionName = document.getElementById('affinityCollectionName');
const affinityStatus = document.getElementById('affinityStatus');
const affinityApescanLink = document.getElementById('affinityApescanLink');
const affinityMELink = document.getElementById('affinityMELink');
const affinityXLink = document.getElementById('affinityXLink');
const yearSpan = document.getElementById('year'); // Footer year
// Optional: Mobile Menu Elements
// const menuToggle = document.getElementById('mobile-menu-toggle');
// const navLinks = document.getElementById('nav-links');


// --- Functions ---

function sanitizePetKey(key) {
    return key.replace(/[\s()]/g, ''); // Removes spaces and parentheses for filename
}

// Function to update the main display area
function displayPetDetails(petKey) {
    console.log(`DEBUG: Displaying details for: ${petKey}`);
    const petData = PET_DATA[petKey];

    // Check required elements exist
    if (!gridContainer || !displayArea || !selectedPetImage || !selectedPetName || !selectedPetStrategyName || !selectedPetStrategyDesc || !selectedPetParamList || !selectedPetSupplyValue || !affinityInfoBox || !affinityTriggerType || !affinityCollectionName || !affinityStatus || !affinityApescanLink || !affinityMELink || !affinityXLink) {
        console.error("Error: One or more essential display elements not found for pets page.");
        // Display a generic error in a prominent place if needed
        if (selectedPetName) selectedPetName.textContent = "Display Error";
        return;
    }

    if (!petData) {
        console.error("Error: Pet data not found for key:", petKey);
        selectedPetName.textContent = "Error Loading Data";
        selectedPetImage.src = ''; selectedPetImage.alt = 'Error loading image';
        selectedPetStrategyName.textContent = '--'; selectedPetStrategyDesc.textContent = 'Could not load details.'; selectedPetParamList.innerHTML = '';
        selectedPetSupplyValue.textContent = '--'; affinityInfoBox.classList.add('hidden');
        displayArea.classList.remove('hidden');
        return;
    }

    // --- Update Core Pet Info ---
    selectedPetName.textContent = petData.name;
    const imgName = sanitizePetKey(petKey);
    selectedPetImage.src = `/PetPromos/${imgName}promo.png`;
    selectedPetImage.alt = `${petData.name} Pet Image`;

    // --- Update Strategy Info ---
    selectedPetStrategyName.textContent = petData.strategyName || '--';
    selectedPetStrategyDesc.textContent = petData.description || 'No description available.';

    // --- Update Parameters List ---
    selectedPetParamList.innerHTML = ''; // Clear previous parameters
    if (petData.parameters && Array.isArray(petData.parameters)) {
        petData.parameters.forEach(param => {
            const li = document.createElement('li');
            // Use textContent for safety unless HTML is intended
            li.innerHTML = `<strong>${param.name || 'Param'}:</strong> ${param.range || '--'}<br><em>${param.effect || ''}</em>`;
            selectedPetParamList.appendChild(li);
        });
    } else {
        const li = document.createElement('li'); li.textContent = 'No parameter details available.'; selectedPetParamList.appendChild(li);
    }

    // --- Update Supply Info ---
    selectedPetSupplyValue.textContent = (typeof petData.supply === 'number') ? petData.supply.toLocaleString() : (petData.supply || '--');

    // --- Update Affinity Info Box ---
    affinityTriggerType.textContent = petData.affinityTriggerType || '--';
    affinityCollectionName.textContent = petData.affinityCollectionName || '--';
    affinityStatus.textContent = petData.affinityStatus || 'Unknown';
    affinityStatus.className = 'status-value'; // Reset class
    if (petData.affinityStatus?.toLowerCase() === 'confirmed') affinityStatus.classList.add('confirmed');
    else if (petData.affinityStatus?.toLowerCase() === 'unconfirmed') affinityStatus.classList.add('unconfirmed');

    // --- Updated Link Logic ---
    const hasValidAddress = petData.affinityContractAddress && ethers.utils.isAddress(petData.affinityContractAddress); // Use imported ethers

    // ApeScan Link
    if (affinityApescanLink) {
        if (hasValidAddress) { affinityApescanLink.href = `https://apescan.io/token/${petData.affinityContractAddress}`; affinityApescanLink.classList.remove('hidden'); }
        else { affinityApescanLink.classList.add('hidden'); }
    }

    // Magic Eden / Custom Link
    if (affinityMELink) {
        if (petKey === "Invo" || petKey === "Visor" || petKey === "Ape (Cult)") {
            affinityMELink.href = "https://notacult.xyz"; affinityMELink.textContent = "[View Not A Cult]";
            affinityMELink.target = "_blank"; affinityMELink.rel = "noopener noreferrer"; affinityMELink.classList.remove('hidden');
            console.log(`DEBUG: Set custom CULT link for ${petKey}`);
        } else if (petKey === "Ape (Blue)" || petKey === "Ape (Red)") {
             affinityMELink.href = `https://magiceden.io/collections/apechain/${BAYC_SHADOW_ADDRESS}`; // Link BAYC
             affinityMELink.textContent = "[View Shadow Collection]"; affinityMELink.target = "_blank"; affinityMELink.rel = "noopener noreferrer"; affinityMELink.classList.remove('hidden');
             console.log(`DEBUG: Set Shadow link for ${petKey}`);
        } else if (hasValidAddress) { // Standard ME Link using affinityContractAddress
            affinityMELink.href = `https://magiceden.io/collections/apechain/${petData.affinityContractAddress}`;
            affinityMELink.textContent = "[View on Magic Eden]"; affinityMELink.target = "_blank"; affinityMELink.rel = "noopener noreferrer"; affinityMELink.classList.remove('hidden');
            console.log(`DEBUG: Set Magic Eden link for ${petKey}`);
        } else { // Hide if no specific link applicable
            affinityMELink.classList.add('hidden'); affinityMELink.href = "#"; affinityMELink.textContent = "[View on Magic Eden]";
            console.log(`DEBUG: Hiding ME link for ${petKey}`);
        }
    }

    // X Account Link
    if (affinityXLink) {
        if (petData.xAccountLink && typeof petData.xAccountLink === 'string' && petData.xAccountLink.startsWith('https://')) { // Basic URL check
             affinityXLink.href = petData.xAccountLink; affinityXLink.classList.remove('hidden');
        } else { affinityXLink.classList.add('hidden'); }
    }
    affinityInfoBox.classList.remove('hidden'); // Show the affinity box

    // --- Show Display Area & Update Thumbnails ---
    displayArea.classList.remove('hidden');
    const thumbnails = gridContainer?.querySelectorAll('.pet-thumbnail'); // Add null check
    thumbnails?.forEach(thumb => { thumb.classList.toggle('active', thumb.dataset.petKey === petKey); });
}


// Function to populate the thumbnail grid
function populateGrid() {
    if (!gridContainer) { console.error("Pet thumbnail grid container not found!"); return; }
    gridContainer.innerHTML = ''; // Clear loading message

    const petKeys = Object.keys(PET_DATA);
    petKeys.sort((a, b) => PET_DATA[a].name.localeCompare(PET_DATA[b].name)); // Sort by name

    petKeys.forEach(key => {
        const petData = PET_DATA[key];
        if (petData) {
            const imgName = sanitizePetKey(key);
            const thumb = document.createElement('img');
            thumb.classList.add('pet-thumbnail');
            thumb.src = `/PetPromos/${imgName}promo.png`;
            thumb.alt = `Thumbnail for ${petData.name}`;
            thumb.title = `${petData.name} - Click for details`;
            thumb.dataset.petKey = key;
            thumb.loading = 'lazy';
            gridContainer.appendChild(thumb);
        }
    });
}

// --- Event Listeners ---
gridContainer?.addEventListener('click', (event) => {
    const target = event.target;
    if (target?.classList.contains('pet-thumbnail') && target.dataset.petKey) {
        displayPetDetails(target.dataset.petKey);
    }
});

// --- Initial Setup on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Pet Showcase Page DOM Ready");
    if(yearSpan) yearSpan.textContent = new Date().getFullYear();

    // --- Scroll Animation Setup ---
    try {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
        const observerCallback = (entries) => { entries.forEach(entry => entry.target.classList.toggle('visible', entry.isIntersecting)); };
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
        if (elementsToAnimate.length > 0) { elementsToAnimate.forEach(el => observer.observe(el)); }
        else { console.warn("No elements found for scroll animation on pets page."); }
    } catch(scrollError) { console.error("Scroll Animation Setup Error:", scrollError); }
    // --- End Scroll Animation ---

    // --- Mobile Menu Toggle Logic (Example - ensure elements exist in pets.html header) ---
    const menuTogglePets = document.getElementById('mobile-menu-toggle');
    const navLinksPets = document.getElementById('nav-links');
    if(menuTogglePets && navLinksPets) {
        console.log("DEBUG: Attaching mobile menu listener for pets page.");
        menuTogglePets.addEventListener('click', () => {
            navLinksPets.classList.toggle('active');
            menuTogglePets.classList.toggle('is-active');
        });
        navLinksPets.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinksPets.classList.contains('active')) {
                     navLinksPets.classList.remove('active');
                     menuTogglePets.classList.remove('is-active');
                }
            });
       });
    } else {
         if (!menuTogglePets) console.warn("Mobile menu toggle not found on pets page.");
         if (!navLinksPets) console.warn("Nav links container not found on pets page.");
    }
    // --- End Mobile Menu ---

    populateGrid(); // Populate thumbnails

    // Display first pet (or Crab) by default
    const firstPetKey = Object.keys(PET_DATA).sort((a, b) => PET_DATA[a].name.localeCompare(PET_DATA[b].name))[0] || "Crab";
    if (firstPetKey && PET_DATA[firstPetKey]) { displayPetDetails(firstPetKey); }
    else { console.warn("No default pet key found."); if(displayArea) displayArea.classList.remove('hidden'); }

     console.log("DEBUG: Pets Page Script Initialized.");
}); // End DOMContentLoaded