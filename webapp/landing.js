// landing.js - Script for index.html (Landing Page)

document.addEventListener('DOMContentLoaded', () => {
    console.log("Landing Page DOM Ready");

    // ============ MATRIX RAIN SCRIPT ============
    const matrixContainer = document.getElementById('matrix-container');
    if (matrixContainer) {
        console.log("DEBUG: Initializing Matrix Rain");
        try { // Add error handling for matrix
            const canvas = document.createElement('canvas');
            canvas.id = 'matrix-canvas';
            matrixContainer.appendChild(canvas);
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error("Could not get 2D context for matrix");

            let canvasWidth = canvas.width = window.innerWidth;
            let canvasHeight = canvas.height = window.innerHeight;
            const katakana = 'アカサタナハマヤラワガザダバパイキシチニヒミリヰギジヂビピウクスツヌフムユルグズヅブプエケセテネヘメレヱゲゼデベペオコソトノホモヨロヲゴゾドボポヴ';
            const characters = katakana.split('');
            const fontSize = 16;
            let columns = Math.floor(canvasWidth / fontSize);
            let drops = Array(columns).fill(1);
            let frameCount = 0;
            const fadeStartFrame = 600; const fadeDurationFrames = 1800;
            const slowDownStartFrame = 450;
            let currentFillOpacity = 1.0; let currentFadeRate = 0.05;
            const targetFillOpacity = 0.03; const targetFadeRate = 0.18;
            let frameSkip = 1;

            function drawMatrix() {
                frameCount++;
                if (frameCount > fadeStartFrame) { const fadeProgress = Math.min(1, (frameCount - fadeStartFrame) / fadeDurationFrames); currentFillOpacity = 1.0 - (1.0 - targetFillOpacity) * fadeProgress; currentFadeRate = 0.05 + (targetFadeRate - 0.05) * fadeProgress; }
                if (frameCount > slowDownStartFrame) { if (frameCount > slowDownStartFrame + 1200) frameSkip = 4; else if (frameCount > slowDownStartFrame + 600) frameSkip = 3; else frameSkip = 2; }

                if (frameCount % frameSkip === 0) {
                    // Use computed style to get background color in RGBA for fading
                    const bodyBgColor = window.getComputedStyle(document.body).backgroundColor || 'rgb(13, 17, 23)';
                    const rgbaBg = bodyBgColor.replace('rgb', 'rgba').replace(')', `, ${currentFadeRate})`);
                    ctx.fillStyle = rgbaBg;
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                    // Use computed style for secondary color
                    const secondaryColor = window.getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim() || 'rgb(0, 245, 255)';
                    const rgbaText = secondaryColor.replace('rgb', 'rgba').replace(')', `, ${currentFillOpacity})`);
                    ctx.fillStyle = rgbaText;
                    ctx.font = fontSize + 'px Roboto Mono';

                    for (let i = 0; i < drops.length; i++) {
                        const text = characters[Math.floor(Math.random() * characters.length)];
                        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                        let resetChance = 0.975; if (frameCount > fadeStartFrame) { resetChance = 0.96 - (0.02 * Math.min(1, (frameCount - fadeStartFrame) / fadeDurationFrames)); }
                        if (drops[i] * fontSize > canvasHeight && Math.random() > resetChance) { drops[i] = 0; }
                        if (drops[i] !== 0 || Math.random() < 0.05 / frameSkip) { drops[i]++; }
                    }
                }
                requestAnimationFrame(drawMatrix);
            }

            window.addEventListener('resize', () => {
                canvasWidth = canvas.width = window.innerWidth; canvasHeight = canvas.height = window.innerHeight;
                columns = Math.floor(canvasWidth / fontSize); drops = Array(columns).fill(1);
            });
            requestAnimationFrame(drawMatrix);
        } catch (matrixError) {
            console.error("Matrix Rain Initialization Error:", matrixError);
            if(matrixContainer) matrixContainer.innerHTML = "<p style='color: red; text-align: center;'>Matrix Effect Failed To Load</p>"; // Fallback message
        }
    } else {
        console.warn("Matrix container not found.");
    }


    // ============ SCROLL ANIMATIONS ============
    try { // Add error handling
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
        const observerCallback = (entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); else entry.target.classList.remove('visible'); }); };
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
        if (elementsToAnimate.length > 0) {
             console.log(`DEBUG: Observing ${elementsToAnimate.length} elements for scroll animation.`);
             elementsToAnimate.forEach(el => observer.observe(el));
        } else {
            console.warn("No elements found for scroll animation with class '.animate-on-scroll'");
        }
    } catch(scrollError) {
        console.error("Scroll Animation Setup Error:", scrollError);
    }


    // ============ WALLET CONNECTION PLACEHOLDER ============
    // NOTE: This button connects on THIS page. If you want it to navigate to the checker, change the logic.
    // It might be better to link directly to checker.html: <a href="/checker.html" class="button connect-wallet-btn">[Connect & Check]</a>
    const connectWalletButtons = document.querySelectorAll('.connect-wallet-btn');
    if (connectWalletButtons.length > 0) {
        console.log("DEBUG: Attaching Connect Wallet placeholder listeners.");
        connectWalletButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('Connect Wallet Placeholder Clicked');
                alert('[Wallet Connection Placeholder - Link to Checker App]');
                // Option 1: Navigate to checker page
                // window.location.href = '/checker.html';
                // Option 2: Implement actual connection here if needed on landing page (more complex)
            });
        });
    } else {
         console.warn("Connect wallet button(s) not found.");
    }


    // ============ SMOOTH SCROLL ============
    try { // Add error handling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId && targetId.length > 1) { // Ensure it's not just "#"
                    const targetElement = document.querySelector(targetId);
                    if(targetElement) {
                        e.preventDefault(); // Prevent default jump only if target exists
                        const headerOffset = 80; // Adjust as needed
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                        console.log(`DEBUG: Smooth scrolling to ${targetId}`);
                    } else {
                         console.warn(`Smooth scroll target "${targetId}" not found.`);
                    }
                }
            });
        });
    } catch(smoothScrollError) {
        console.error("Smooth Scroll Setup Error:", smoothScrollError);
    }


    // ============ DYNAMIC YEAR IN FOOTER ============
    const yearSpan = document.getElementById("year");
    if (yearSpan) { yearSpan.textContent = new Date().getFullYear(); }
    else { console.warn("Footer year element not found."); }


    // ============ MOBILE MENU TOGGLE ============
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if(menuToggle && navLinks) {
        console.log("DEBUG: Attaching mobile menu listener.");
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('is-active');
             console.log("DEBUG: Mobile menu toggled.");
        });
        // Close menu if a link is clicked (optional)
        navLinks.querySelectorAll('a').forEach(link => {
             link.addEventListener('click', () => {
                 if (navLinks.classList.contains('active')) {
                      navLinks.classList.remove('active');
                      menuToggle.classList.remove('is-active');
                 }
             });
        });
    } else {
         if (!menuToggle) console.warn("Mobile menu toggle button not found.");
         if (!navLinks) console.warn("Nav links container not found.");
    }

    // ============ CYBER CHART DRAWING ============
    const canvas = document.getElementById("cyberChart");
    const tooltip = document.getElementById("cyberTooltip");
    // Check if elements exist before trying to use them
    if (canvas && tooltip) {
        console.log("DEBUG: Found cyberChart canvas and tooltip. Setting up chart...");
        try { // Add error handling for chart setup
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Failed to get 2D context");

            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            let mouseX = 0; let hoveredCandle = null;
            const candles = Array.from({ length: 40 }, (_, i) => ({ x: i * (canvas.width / 42) + (canvas.width / 42), open: Math.random()*50+100, close: Math.random()*50+100, high: Math.random()*30+125, low: Math.random()*30+75 })); // Adjusted spacing/values
            let glitchIndex = -1; // Start with no glitch

            function draw() {
                if (!ctx) return; // Exit if context somehow lost
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                hoveredCandle = null; // Reset hover on each draw

                // Maybe change glitch index periodically
                if (Math.random() < 0.05) glitchIndex = Math.floor(Math.random() * candles.length);
                else if (Math.random() < 0.1) glitchIndex = -1; // Chance to stop glitching

                candles.forEach((candle, i) => {
                    const isBull = candle.close > candle.open;
                    // Use CSS Variables for colors
                    const bullColor = window.getComputedStyle(document.documentElement).getPropertyValue('--success-color').trim() || '#238636';
                    const bearColor = window.getComputedStyle(document.documentElement).getPropertyValue('--error-color').trim() || '#DA3633';
                    const wickColor = isBull ? bullColor : bearColor; // Wicks match body
                    const bodyColor = isBull ? bullColor : bearColor;
                    const glitchColor = window.getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim() || '#00f5ff';

                    const x = candle.x;
                    const bodyHeight = Math.abs(candle.open - candle.close);
                    const yTop = canvas.height - Math.max(candle.open, candle.close); // Y coord of top of body
                    const yHigh = canvas.height - candle.high;
                    const yLow = canvas.height - candle.low;

                    ctx.shadowBlur = 0; // Reset shadow initially
                    ctx.lineWidth = 1; // Default line width

                    // Highlight glitching candle
                    if (i === glitchIndex) {
                        ctx.strokeStyle = glitchColor;
                        ctx.fillStyle = glitchColor;
                        ctx.lineWidth = 1.5;
                        ctx.shadowColor = glitchColor;
                        ctx.shadowBlur = 8; // Subtle glow
                    } else {
                        ctx.strokeStyle = wickColor;
                        ctx.fillStyle = bodyColor;
                    }

                    // Draw Wick (High to Low line)
                    ctx.beginPath();
                    ctx.moveTo(x, yHigh);
                    ctx.lineTo(x, yLow);
                    ctx.stroke();

                    // Draw Body (Rectangle)
                    // Ensure minimum height for visibility even if open/close are identical
                    const minBodyHeight = 1;
                    ctx.fillRect(x - 4, yTop, 8, Math.max(bodyHeight, minBodyHeight));

                     // Tooltip Hover logic (check if mouse is near candle body/wick)
                    const candleTopY = yHigh; // Use wick top for hover region
                    const candleBottomY = yLow; // Use wick bottom for hover region
                    if (mouseX >= x - 6 && mouseX <= x + 6 && tooltip.style.display !== 'none') { // Only update if tooltip is visible
                        hoveredCandle = candle;
                        // Position tooltip slightly above the candle's highest point
                        tooltip.style.left = `${Math.min(Math.max(10, event.clientX + 15), window.innerWidth - tooltip.offsetWidth - 10)}px`; // Keep within bounds
                        tooltip.style.top = `${Math.min(Math.max(10, event.clientY - 40), window.innerHeight - tooltip.offsetHeight - 10)}px`; // Keep within bounds
                        tooltip.innerHTML = `O:${candle.open.toFixed(1)} H:${candle.high.toFixed(1)}<br>L:${candle.low.toFixed(1)} C:${candle.close.toFixed(1)}`; // More info
                    }
                });
                 // If mouse moved but not over any candle, hide tooltip
                 if (!hoveredCandle && tooltip.style.display === 'block') {
                    // tooltip.style.display = 'none';
                 }

                requestAnimationFrame(draw);
            }

            // Add mouse listeners to canvas for tooltip interaction
            canvas.addEventListener('mousemove', (event) => {
                  const rect = canvas.getBoundingClientRect();
                  mouseX = event.clientX - rect.left;
                  // Make tooltip visible when mouse enters canvas
                  tooltip.style.display = 'block';
            });
             canvas.addEventListener('mouseout', () => {
                   mouseX = -1; // Move mouseX off canvas
                   tooltip.style.display = 'none'; // Hide tooltip
                   hoveredCandle = null;
             });


            draw(); // Start drawing loop

        } catch (chartError) {
            console.error("Cyber Chart Initialization Error:", chartError);
            if(canvas) canvas.parentElement.innerHTML = "<p style='color: red; text-align: center;'>Chart Failed To Load</p>"; // Fallback
        }
    } else {
        if (!canvas) console.warn("Chart canvas element with ID 'cyberChart' not found!");
        if (!tooltip) console.warn("Tooltip element with ID 'cyberTooltip' not found!");
    }


    // ============ PRESALE GLITCH EFFECT ============
    // Check if elements exist for this effect
    const glitchScreen = document.querySelector('.glitch-screen');
    const presaleVisibleCard = document.querySelector('.presale-visible'); // Assumes this class exists on the main card initially

    if (glitchScreen && presaleVisibleCard) {
        console.log("DEBUG: Setting up presale glitch effect.");
        try { // Add error handling
            function startGlitchCycle() {
                function glitchIn() {
                    if (glitchScreen && presaleVisibleCard) { // Check elements again inside interval
                        glitchScreen.style.opacity = 1;
                        presaleVisibleCard.style.opacity = 0.2; // Dim the main card

                        setTimeout(() => {
                            if (glitchScreen && presaleVisibleCard) { // Check again
                                glitchScreen.style.opacity = 0;
                                presaleVisibleCard.style.opacity = 1; // Restore main card opacity
                            }
                        }, 3000); // Shorter visible glitch (3 seconds)
                    }
                }
                // Initial glitch, then interval
                glitchIn();
                setInterval(glitchIn, 15000); // Glitch every 15 seconds (3 on, 12 off)
            }
            startGlitchCycle();
        } catch(glitchError) {
            console.error("Presale Glitch Effect Error:", glitchError);
        }
    } else {
        if (!glitchScreen) console.warn("Element with class '.glitch-screen' not found for presale effect.");
        if (!presaleVisibleCard) console.warn("Element with class '.presale-visible' not found for presale effect.");
    }

    console.log("DEBUG: Landing Page Script Initialized.");

}); // End DOMContentLoaded