'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';

const MODES = ['bars', 'circular', 'wave', 'particles'];
const MODE_LABELS = ['Equalizer', 'Circular', 'Waves', 'Particles'];

export default function AudioVisualizer({ mode: externalMode, fullscreen = false }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const { getFFTData, getWaveformData, state } = usePlayer();
  const [currentMode, setCurrentMode] = useState(externalMode || 'bars');
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);

  const getAccentColor = () => {
    const colors = {
      bars: { r: 29, g: 185, b: 84 },
      circular: { r: 124, g: 58, b: 237 },
      wave: { r: 236, g: 72, b: 153 },
      particles: { r: 59, g: 130, b: 246 },
    };
    return colors[currentMode] || colors.bars;
  };

  const drawBars = useCallback((ctx, dataArray, width, height) => {
    const barCount = 64;
    const barWidth = (width / barCount) - 2;
    const color = getAccentColor();

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * Math.floor(dataArray.length / barCount)] || 0;
      const barHeight = (value / 255) * height * 0.85;
      const x = i * (barWidth + 2);
      const y = height - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 1)`);
      gradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
      ctx.fill();

      // Glow effect
      ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
      ctx.shadowBlur = 10;
      ctx.fillRect(x, y, barWidth, 2);
      ctx.shadowBlur = 0;
    }
  }, [currentMode]);

  const drawCircular = useCallback((ctx, dataArray, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    const color = getAccentColor();
    const bars = 128;

    for (let i = 0; i < bars; i++) {
      const value = dataArray[i * Math.floor(dataArray.length / bars)] || 0;
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const barLength = (value / 255) * radius * 0.8;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barLength);
      const y2 = centerY + Math.sin(angle) * (radius + barLength);

      const alpha = 0.3 + (value / 255) * 0.7;
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.4);
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }, [currentMode]);

  const drawWave = useCallback((ctx, waveData, width, height) => {
    const color = getAccentColor();
    const sliceWidth = width / waveData.length;

    // Draw multiple waves with different offsets
    for (let w = 0; w < 3; w++) {
      const alpha = 1 - w * 0.3;
      const offset = w * 4;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.lineWidth = 2.5 - w * 0.5;

      for (let i = 0; i < waveData.length; i++) {
        const v = (waveData[i] || 128) / 128.0;
        const y = (v * height / 2) + offset;
        const x = i * sliceWidth;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Bottom reflection
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    for (let i = 0; i < waveData.length; i++) {
      const v = (waveData[i] || 128) / 128.0;
      const y = height - (v * height / 2);
      const x = i * sliceWidth;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [currentMode]);

  const drawParticles = useCallback((ctx, dataArray, width, height) => {
    const color = getAccentColor();
    const particles = particlesRef.current;
    const bass = (dataArray[2] || 0) + (dataArray[3] || 0) + (dataArray[4] || 0);
    const bassLevel = bass / (255 * 3);

    // Spawn new particles based on bass
    if (bassLevel > 0.3 && particles.length < 200) {
      for (let i = 0; i < Math.floor(bassLevel * 5); i++) {
        particles.push({
          x: Math.random() * width,
          y: height,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 4 - 2,
          size: Math.random() * 4 + 1,
          life: 1,
          decay: Math.random() * 0.02 + 0.005,
          hue: Math.random() * 60,
        });
      }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // gravity
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color.r + p.hue}, ${color.g}, ${color.b}, ${p.life * 0.8})`;
      ctx.fill();

      // Glow
      ctx.shadowColor = `rgba(${color.r + p.hue}, ${color.g}, ${color.b}, ${p.life * 0.5})`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [currentMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const fftData = getFFTData ? getFFTData() : null;
      const waveData = getWaveformData ? getWaveformData() : null;

      if (!fftData && !waveData) {
        // Draw idle animation
        const time = Date.now() / 1000;
        const color = getAccentColor();
        for (let i = 0; i < 32; i++) {
          const x = i * (width / 32);
          const h = (Math.sin(time * 2 + i * 0.3) + 1) * 8 + 4;
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
          ctx.fillRect(x + 2, height - h, width / 32 - 4, h);
        }
      } else {
        switch (currentMode) {
          case 'bars':
            drawBars(ctx, fftData || new Uint8Array(128), width, height);
            break;
          case 'circular':
            drawCircular(ctx, fftData || new Uint8Array(128), width, height);
            break;
          case 'wave':
            drawWave(ctx, waveData || new Uint8Array(128), width, height);
            break;
          case 'particles':
            drawParticles(ctx, fftData || new Uint8Array(128), width, height);
            break;
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentMode, drawBars, drawCircular, drawWave, drawParticles, getFFTData, getWaveformData]);

  return (
    <div className={`visualizer ${isFullscreen ? 'visualizer--fullscreen' : ''}`}>
      <canvas ref={canvasRef} className="visualizer__canvas" />
      <div className="visualizer__controls">
        {MODES.map((mode, i) => (
          <button
            key={mode}
            className={`visualizer__mode-btn ${currentMode === mode ? 'visualizer__mode-btn--active' : ''}`}
            onClick={() => setCurrentMode(mode)}
          >
            {MODE_LABELS[i]}
          </button>
        ))}
        <button
          className="visualizer__fullscreen-btn"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function MiniVisualizer() {
  const { state } = usePlayer();
  const { isPlaying } = state;

  return (
    <div className={`mini-visualizer ${isPlaying ? 'mini-visualizer--playing' : ''}`}>
      <span className="mini-visualizer__bar" style={{ animationDelay: '0s' }} />
      <span className="mini-visualizer__bar" style={{ animationDelay: '0.2s' }} />
      <span className="mini-visualizer__bar" style={{ animationDelay: '0.1s' }} />
      <span className="mini-visualizer__bar" style={{ animationDelay: '0.3s' }} />
    </div>
  );
}
