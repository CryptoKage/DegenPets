// MATRIX RAIN EFFECT WITH GRADUAL FADE AND SLOWING
const canvas = document.getElementById("matrix-container");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const kanji = "アイウエオカキクケコサシスセソタDEGEN-PETSチツテトナニヌネノマミムメモヤユヨラリルレロワヲン".split("");
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = Array.from({ length: columns }, () => Math.random() * canvas.height);

let speed = 1;
let fadeOpacity = 1;
let startTime = Date.now();

function drawMatrix() {
    ctx.fillStyle = `rgba(0, 0, 0, ${0.05 * fadeOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(0, 255, 136, ${fadeOpacity})`; // Cyber green with fade
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        const text = kanji[Math.floor(Math.random() * kanji.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        } else {
            drops[i] += speed;
        }
    }

    // Slowly reduce speed and fade
    const elapsed = Date.now() - startTime;
    if (elapsed < 40000) { // 40 seconds fade
        fadeOpacity = 1 - elapsed / 40000;
        speed = Math.max(0.1, 1 - elapsed / 40000);
        requestAnimationFrame(drawMatrix);
    } else {
        // Once faded out, stop drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

drawMatrix();

// Animate on scroll setup
const animatedItems = document.querySelectorAll(".animate-on-scroll");

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, {
    threshold: 0.1
});

animatedItems.forEach(item => observer.observe(item));
