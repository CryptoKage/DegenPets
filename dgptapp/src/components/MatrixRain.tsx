// src/components/MatrixRain.tsx
'use client'; // This component uses browser APIs, so mark as client component

import { useEffect, useRef } from 'react';
import styles from './MatrixRain.module.css';

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let canvasWidth = canvas.width = window.innerWidth;
    let canvasHeight = canvas.height = window.innerHeight;

    // Get CSS variables for colors
    const computedStyle = getComputedStyle(document.documentElement);
    const bodyBgColor = computedStyle.getPropertyValue('--bg-color').trim() || '#0d1117';
    const secondaryColor = computedStyle.getPropertyValue('--secondary-color').trim() || '#00f5ff';

    const katakana = 'アカサタナハマヤラワガザダバパイキシチニヒミリヰギジヂビピウクスツヌフムユルグズヅブプエケセテネヘメレヱゲゼデベペオコソトノホモヨロヲゴゾドボポヴ';
    const characters = katakana.split('');
    const fontSize = 16;
    let columns = Math.floor(canvasWidth / fontSize);
    let drops = Array(columns).fill(1);

    let frameCount = 0;
    const fadeStartFrame = 300; // Start fading a bit earlier for app
    const fadeDurationFrames = 1200;
    const slowDownStartFrame = 250;
    let currentFillOpacity = 0.6; // Start a bit more subtle for app
    let currentFadeRate = 0.08; // Start a bit more subtle for app
    const targetFillOpacity = 0.03;
    const targetFadeRate = 0.18;
    let frameSkip = 1; // Controls speed, 1 is fastest

    let animationFrameId: number;

    const draw = () => {
      frameCount++;
      if (frameCount > fadeStartFrame) {
        const fadeProgress = Math.min(1, (frameCount - fadeStartFrame) / fadeDurationFrames);
        currentFillOpacity = 0.6 - (0.6 - targetFillOpacity) * fadeProgress;
        currentFadeRate = 0.08 + (targetFadeRate - 0.08) * fadeProgress;
      }
      if (frameCount > slowDownStartFrame) {
        if (frameCount > slowDownStartFrame + 1200) frameSkip = 4;
        else if (frameCount > slowDownStartFrame + 600) frameSkip = 3;
        else frameSkip = 2;
      }

      if (frameCount % frameSkip === 0) {
        const rgbaBg = `rgba(${hexToRgb(bodyBgColor)}, ${currentFadeRate})`;
        ctx.fillStyle = rgbaBg;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const rgbaText = `rgba(${hexToRgb(secondaryColor)}, ${currentFillOpacity})`;
        ctx.fillStyle = rgbaText;
        ctx.font = `${fontSize}px var(--font-main)`; // Use CSS variable

        for (let i = 0; i < drops.length; i++) {
          const text = characters[Math.floor(Math.random() * characters.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          let resetChance = 0.975;
          if (frameCount > fadeStartFrame) {
            resetChance = 0.96 - (0.02 * Math.min(1, (frameCount - fadeStartFrame) / fadeDurationFrames));
          }
          if (drops[i] * fontSize > canvasHeight && Math.random() > resetChance) {
            drops[i] = 0;
          }
          if (drops[i] !== 0 || Math.random() < 0.05 / frameSkip) {
            drops[i]++;
          }
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    const hexToRgb = (hex: string) => {
      let r = '0', g = '0', b = '0';
      if (hex.length === 4) { // #RGB
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
      } else if (hex.length === 7) { // #RRGGBB
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
      }
      return `${+r},${+g},${+b}`;
    };


    const handleResize = () => {
      canvasWidth = canvas.width = window.innerWidth;
      canvasHeight = canvas.height = window.innerHeight;
      columns = Math.floor(canvasWidth / fontSize);
      drops = Array(columns).fill(1);
    };

    window.addEventListener('resize', handleResize);
    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.matrixCanvas}></canvas>;
};

export default MatrixRain;