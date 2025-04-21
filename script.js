document.addEventListener('DOMContentLoaded', () => {

    // ============ MATRIX RAIN SCRIPT ============
    const matrixContainer = document.getElementById('matrix-container');
    if (matrixContainer) {
        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-canvas';
        matrixContainer.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        let canvasWidth = canvas.width = window.innerWidth;
        let canvasHeight = canvas.height = window.innerHeight;

        const katakana = 'アカサタナハマヤラワガザダバパイキシチニヒミリヰギジヂビピウクスツヌフムユルグズヅブプエケセテネヘメレヱゲゼデベペオコソトノホモヨロヲゴゾドボポヴ';
        // Add alphanumeric for variety?
        // const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        // const characters = (katakana + alphanumeric).split('');
        const characters = katakana.split(''); // Stick to Katakana for now

        const fontSize = 16;
        let columns = Math.floor(canvasWidth / fontSize);
        let drops = Array(columns).fill(1);

        let frameCount = 0;
        const fadeStartFrame = 300; // Start fading after ~5 seconds (60fps * 5)
        const fadeDurationFrames = 900; // Fade over ~15 seconds (60fps * 15)
        let currentOpacity = 0.5; // Initial container opacity
        let currentFillOpacity = 1.0; // Initial character fill opacity
        let currentFadeRate = 0.05; // Initial screen fade rate
        const targetFillOpacity = 0.05; // Fade characters to almost invisible
        const targetFadeRate = 0.15; // Make trails disappear faster

        function drawMatrix() {
            frameCount++;

            // --- Adjust fade parameters over time ---
            if (frameCount > fadeStartFrame) {
                const fadeProgress = Math.min(1, (frameCount - fadeStartFrame) / fadeDurationFrames);

                // Gradually reduce character opacity
                currentFillOpacity = 1.0 - (1.0 - targetFillOpacity) * fadeProgress;

                // Gradually increase screen fade rate
                currentFadeRate = 0.05 + (targetFadeRate - 0.05) * fadeProgress;

                // Optional: Fade the entire container slightly more if needed
                // matrixContainer.style.opacity = 0.5 - (0.3 * fadeProgress); // Example: fade from 0.5 to 0.2
            }

            // --- Draw frame ---
            // Fade the screen
            ctx.fillStyle = `rgba(13, 17, 23, ${currentFadeRate})`; // Use background color + fade rate
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Set character style (with fading opacity)
            ctx.fillStyle = `rgba(0, 245, 255, ${currentFillOpacity})`; // Use themed cyan color
            ctx.font = fontSize + 'px Roboto Mono'; // Use main monospace font

            // Draw characters
            for (let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Reset drop randomly (adjust probability for speed)
                // Gradually increase reset chance slightly to thin out drops?
                let resetChance = 0.975;
                if (frameCount > fadeStartFrame) {
                   resetChance = 0.96 - (0.02 * Math.min(1, (frameCount - fadeStartFrame) / fadeDurationFrames)); // Gets more likely to reset
                }

                if (drops[i] * fontSize > canvasHeight && Math.random() > resetChance) {
                    drops[i] = 0;
                }
                drops[i]++;
            }

            requestAnimationFrame(drawMatrix);
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            canvasWidth = canvas.width = window.innerWidth;
            canvasHeight = canvas.height = window.innerHeight;
            columns = Math.floor(canvasWidth / fontSize);
            drops = Array(columns).fill(1);
            // Reset frameCount if you want fade to restart on resize? Or just let it continue.
        });

        // Start matrix rain
        requestAnimationFrame(drawMatrix);

    } // End if matrixContainer exists


    // ============ SCROLL ANIMATIONS ============
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // observer.unobserve(entry.target); // Uncomment to animate only once
            } else {
                 entry.target.classList.remove('visible'); // Re-animate when scrolling back up
            }
        });
    };
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => observer.observe(el));


    // ============ WALLET CONNECTION PLACEHOLDER ============
    const connectWalletButtons = document.querySelectorAll('.connect-wallet-btn');
    connectWalletButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert('[Initiating Wallet Connection Sequence...]');
            // connectToWallet(); // Implement actual connection logic
        });
    });

    // ============ SMOOTH SCROLL ============
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            // Correctly handle cases where href is just "#"
            if (targetId && targetId.length > 1) {
                 const targetElement = document.querySelector(targetId);
                 if(targetElement) {
                     targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }
            }
        });
    });

    // ============ DYNAMIC YEAR IN FOOTER ============
    const yearSpan = document.getElementById("year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ============ MOBILE MENU TOGGLE ============
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if(menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Optional: Change toggle button appearance (e.g., hamburger to X)
            // menuToggle.textContent = navLinks.classList.contains('active') ? 'X' : '|||';
        });
    }

}); // End DOMContentLoaded
