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
