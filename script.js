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
        const characters = katakana.split('');

        const fontSize = 16;
        let columns = Math.floor(canvasWidth / fontSize);
        let drops = Array(columns).fill(1);

        let frameCount = 0;
        // --- Timing Adjustments ---
        const fadeStartFrame = 600; // Start fading after ~10 seconds (60fps * 10)
        const fadeDurationFrames = 1800; // Fade over ~30 seconds (60fps * 30) - Longer Fade
        const slowDownStartFrame = 450; // Start slowing down scroll after ~7.5 seconds
        // --- ---

        let currentFillOpacity = 1.0; // Initial character fill opacity
        let currentFadeRate = 0.05; // Initial screen fade rate
        const targetFillOpacity = 0.03; // Fade characters to almost invisible
        const targetFadeRate = 0.18; // Increase fade rate more

        // --- Speed Control ---
        let frameSkip = 1; // Draw every 1 frame initially

        function drawMatrix() {
            frameCount++;

            // --- Adjust fade parameters over time ---
            if (frameCount > fadeStartFrame) {
                const fadeProgress = Math.min(1, (frameCount - fadeStartFrame) / fadeDurationFrames);
                // Gradually reduce character opacity
                currentFillOpacity = 1.0 - (1.0 - targetFillOpacity) * fadeProgress;
                // Gradually increase screen fade rate
                currentFadeRate = 0.05 + (targetFadeRate - 0.05) * fadeProgress;
            }

            // --- Adjust scroll speed over time ---
            if (frameCount > slowDownStartFrame) {
                if (frameCount > slowDownStartFrame + 1200) { // After ~20 more seconds
                    frameSkip = 4; // Draw every 4th frame (very slow)
                } else if (frameCount > slowDownStartFrame + 600) { // After ~10 more seconds
                    frameSkip = 3; // Draw every 3rd frame
                } else {
                    frameSkip = 2; // Draw every 2nd frame
                }
            }

            // --- Draw frame only sometimes based on frameSkip ---
            if (frameCount % frameSkip === 0) {
                // Fade the screen (Use body background color)
                // Use rgba with the background color's RGB values
                // Assuming --bg-color: #0d1117 which is rgb(13, 17, 23)
                ctx.fillStyle = `rgba(13, 17, 23, ${currentFadeRate})`;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                // Set character style (Use secondary color)
                // Assuming --secondary-color: #00f5ff which is rgb(0, 245, 255)
                ctx.fillStyle = `rgba(0, 245, 255, ${currentFillOpacity})`;
                ctx.font = fontSize + 'px Roboto Mono'; // Use main monospace font

                // Draw characters & update drops
                for (let i = 0; i < drops.length; i++) {
                    const text = characters[Math.floor(Math.random() * characters.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                    let resetChance = 0.975;
                    if (frameCount > fadeStartFrame) {
                       // Make reset slightly more likely as it fades
                       resetChance = 0.96 - (0.02 * Math.min(1, (frameCount - fadeStartFrame) / fadeDurationFrames));
                    }

                    if (drops[i] * fontSize > canvasHeight && Math.random() > resetChance) {
                        drops[i] = 0;
                    }
                    // Only increment position when drawing
                    if (drops[i] !== 0 || Math.random() < 0.05 / frameSkip) { // Add slight chance for stuck drops to restart
                       drops[i]++;
                    }
                }
            } // End if frameSkip condition

            requestAnimationFrame(drawMatrix);
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            canvasWidth = canvas.width = window.innerWidth;
            canvasHeight = canvas.height = window.innerHeight;
            columns = Math.floor(canvasWidth / fontSize);
            drops = Array(columns).fill(1);
            // Optional: reset frameCount to restart fade/slowdown on resize
            // frameCount = 0;
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
            console.log('Connect Wallet Clicked'); // Use console log for testing
            alert('[Initiating Wallet Connection Sequence...]');
            // connectToWallet(); // Implement actual connection logic here
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
                     // Offset scroll slightly to account for fixed header height
                     const headerOffset = 80; // Adjust this value based on your header's actual height
                     const elementPosition = targetElement.getBoundingClientRect().top;
                     const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                     window.scrollTo({
                         top: offsetPosition,
                         behavior: "smooth"
                     });
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
            // Optional: Change toggle button visual state
            // menuToggle.textContent = navLinks.classList.contains('active') ? 'X' : '|||';
            // Or add/remove a class to change styling via CSS
            menuToggle.classList.toggle('is-active');
        });
    }
const canvas = document.getElementById("cyberChart");
const ctx = canvas.getContext("2d");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

let mouseX = 0;

const candles = Array.from({ length: 40 }, (_, i) => ({
  x: i * 20 + 10,
  open: Math.random() * 100 + 100,
  close: Math.random() * 100 + 100,
  high: Math.random() * 100 + 120,
  low: Math.random() * 100 + 80,
}));

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  candles.forEach(candle => {
    const isBull = candle.close > candle.open;
    const color = isBull ? "#00ff99" : "#ff0066";

    const x = candle.x;
    const yOpen = canvas.height - candle.open;
    const yClose = canvas.height - candle.close;
    const yHigh = canvas.height - candle.high;
    const yLow = canvas.height - candle.low;

    // Wicks
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x - 4, Math.min(yOpen, yClose), 8, Math.abs(yOpen - yClose));

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(x - 2, Math.min(yOpen, yClose), 4, Math.abs(yOpen - yClose));
    ctx.shadowBlur = 0;
  });

  requestAnimationFrame(draw);
}

canvas.addEventListener("mousemove", (e) => {
  mouseX = e.offsetX;
});

draw();

}); // End DOMContentLoaded
