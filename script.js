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
  ctx.fillStyle = '##00ffc3'; // Cybernetic green
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
}, 50000);

// Handle canvas resizing
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
