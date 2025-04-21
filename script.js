// === SCROLL ANIMATION ===
document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".animate-on-scroll").forEach((el) => {
    observer.observe(el);
  });
});

// === MATRIX KANJI RAIN EFFECT ===
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.getElementById("matrix-container").appendChild(canvas);

canvas.style.position = "fixed";
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.zIndex = -1;
canvas.style.pointerEvents = "none";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const katakana = "アカサタナハマヤラワガザダバパイキシチニヒミリギジヂビピウクスツヌフムユルグズヅブプエケセテネヘメレゲゼデベペオコソトノホモヨロヲゴゾドボポヴ".split("");
const fontSize = 18;
const columns = Math.floor(canvas.width / fontSize);
const drops = Array(columns).fill(1);

function drawMatrix() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ffc3";
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const text = katakana[Math.floor(Math.random() * katakana.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height || Math.random() > 0.975) {
      drops[i] = 0;
    }

    drops[i]++;
  }
}

setInterval(drawMatrix, 50);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// === Neon Hover Grid Tracker ===
const gridOverlay = document.createElement('div');
gridOverlay.id = 'neon-grid';
document.body.appendChild(gridOverlay);

document.addEventListener('mousemove', (e) => {
  const dot = document.createElement('div');
  dot.className = 'glow-dot';
  dot.style.left = `${e.clientX - 10}px`;
  dot.style.top = `${e.clientY - 10}px`;

  document.body.appendChild(dot);

  setTimeout(() => {
    dot.remove();
  }, 800);
});

// Matrix Effect with Fade
const canvas = document.createElement('canvas');
document.getElementById('matrix-container').appendChild(canvas);
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const kanji = 'デゲンペットシミュレーション'.split('');
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = Array.from({ length: columns }).fill(1);

function drawMatrix() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00bcd4'; // Cybernetic blue
  ctx.font = `${fontSize}px monospace`;

  drops.forEach((y, i) => {
    const text = kanji[Math.floor(Math.random() * kanji.length)];
    ctx.fillText(text, i * fontSize, y * fontSize);
    drops[i] = y * fontSize > canvas.height || Math.random() > 0.975 ? 0 : y + 1;
  });
}

setInterval(drawMatrix, 50);

// Fade out after 5 minutes
setTimeout(() => {
  document.getElementById('matrix-container').style.opacity = '0';
}, 300000);

// Handle canvas resizing
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
