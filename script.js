document.addEventListener('DOMContentLoaded', () => {

    // --- Intersection Observer for Animations ---
    const observerOptions = {
        root: null, // relative to document viewport
        rootMargin: '0px',
        threshold: 0.1 // trigger when 10% of the element is visible
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                 // Optional: Stop observing once visible
                // observer.unobserve(entry.target);
            } else {
                // Optional: Remove class to re-animate on scroll up
                 entry.target.classList.remove('visible');
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => observer.observe(el));


    // --- Placeholder for Wallet Connection ---
    const connectWalletButtons = document.querySelectorAll('.connect-wallet-btn');
    connectWalletButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert('Initiating Wallet Connection Sequence...'); // Themed alert
            // Replace with actual web3 library connection logic
            // connectToWallet();
        });
    });

    // --- Smooth scrolling for internal links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start' // Aligns target to top of viewport
                });
            }
        });
    });

    // --- Placeholder for Kanji Matrix Effect Initialization ---
    // If you have a function like initMatrix('matrix-container');
    // call it here after the DOM is loaded.
    // Example: if (typeof initMatrix === 'function') { initMatrix('matrix-container'); }

});

// Example function for wallet connection (needs web3 library)
// async function connectToWallet() { ... }
