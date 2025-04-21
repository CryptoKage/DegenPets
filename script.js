// script.js

// ============ MATRIX RAIN SCRIPT ============
const canvas = document.createElement('canvas');
canvas.id = 'matrix-canvas';
document.getElementById('matrix-container').appendChild(canvas);

const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const katakana = 'アカサタナハマヤラワガザダバパイキシチニヒミリヰギジヂビピウクスツヌフムユルグズヅブプエケセテネヘメレヱゲゼデベペオコソトノホモヨロヲゴゾドボポヴ'.split('');
const fontSize = 16;
const columns = Math.floor(canvas.width / fontSize);
const drops = Array(columns).fill(1);

function drawMatrix() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00e0ff'; // Cybernetic blue
  ctx.font = fontSize + 'px Orbitron';

  for (let i = 0; i < drops.length; i++) {
    const text = katakana[Math.floor(Math.random() * katakana.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }

  requestAnimationFrame(drawMatrix);
}

// Start matrix rain
requestAnimationFrame(drawMatrix);

// Fade out matrix container after 40s with smooth transition
setTimeout(() => {
  const container = document.getElementById('matrix-container');
  container.style.transition = 'opacity 4s ease';
  container.style.opacity = '0';
  setTimeout(() => {
    container.style.display = 'none';
  }, 4000);
}, 20000);
