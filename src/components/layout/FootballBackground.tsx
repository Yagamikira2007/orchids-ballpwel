import { useEffect, useRef } from 'react';

const FootballBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const drawField = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // ── Grass stripe bands ──────────────────────────────────────────
      const stripeCount = 12;
      const stripeH = h / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        const even = i % 2 === 0;
        ctx.fillStyle = even
          ? 'rgba(20,80,20,0.07)'
          : 'rgba(10,60,10,0.04)';
        ctx.fillRect(0, i * stripeH, w, stripeH);
      }

      // ── Pitch layout (top-down perspective, centered, occupying ~70% of viewport) ──
      const pitchW = Math.min(w * 0.82, 900);
      const pitchH = pitchW * 0.65;
      const px = (w - pitchW) / 2;
      const py = (h - pitchH) / 2;
      const cx = w / 2;
      const cy = h / 2;

      const line = (alpha: number) => `rgba(180,230,160,${alpha})`;

      ctx.save();
      ctx.lineWidth = 1.2;

      // Outer boundary
      ctx.strokeStyle = line(0.18);
      ctx.strokeRect(px, py, pitchW, pitchH);

      // Halfway line
      ctx.beginPath();
      ctx.moveTo(cx, py);
      ctx.lineTo(cx, py + pitchH);
      ctx.strokeStyle = line(0.14);
      ctx.stroke();

      // Centre circle
      const centerR = pitchH * 0.18;
      ctx.beginPath();
      ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
      ctx.strokeStyle = line(0.14);
      ctx.stroke();

      // Centre spot
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = line(0.25);
      ctx.fill();

      // ── Penalty areas ───────────────────────────────────────────────
      const penW = pitchW * 0.16;
      const penH = pitchH * 0.42;
      // Left
      ctx.strokeStyle = line(0.15);
      ctx.strokeRect(px, cy - penH / 2, penW, penH);
      // Right
      ctx.strokeRect(px + pitchW - penW, cy - penH / 2, penW, penH);

      // ── Six-yard boxes ──────────────────────────────────────────────
      const sixW = pitchW * 0.065;
      const sixH = pitchH * 0.2;
      ctx.strokeStyle = line(0.12);
      ctx.strokeRect(px, cy - sixH / 2, sixW, sixH);
      ctx.strokeRect(px + pitchW - sixW, cy - sixH / 2, sixW, sixH);

      // ── Penalty arcs ────────────────────────────────────────────────
      const penSpotX = px + penW * 0.68;
      const penSpotXR = px + pitchW - penW * 0.68;
      const arcR = centerR;
      ctx.strokeStyle = line(0.11);
      ctx.beginPath();
      ctx.arc(penSpotX, cy, arcR, -Math.PI * 0.48, Math.PI * 0.48);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(penSpotXR, cy, arcR, Math.PI * 0.52, Math.PI * 1.48);
      ctx.stroke();

      // Penalty spots
      ctx.fillStyle = line(0.2);
      ctx.beginPath();
      ctx.arc(penSpotX, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(penSpotXR, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // ── Corner arcs ─────────────────────────────────────────────────
      const cornerR = pitchH * 0.04;
      ctx.strokeStyle = line(0.12);
      const corners = [
        { x: px, y: py, a1: 0, a2: Math.PI / 2 },
        { x: px + pitchW, y: py, a1: Math.PI / 2, a2: Math.PI },
        { x: px + pitchW, y: py + pitchH, a1: Math.PI, a2: Math.PI * 1.5 },
        { x: px, y: py + pitchH, a1: Math.PI * 1.5, a2: Math.PI * 2 },
      ];
      corners.forEach(({ x, y, a1, a2 }) => {
        ctx.beginPath();
        ctx.arc(x, y, cornerR, a1, a2);
        ctx.stroke();
      });

      ctx.restore();

      // ── Stadium floodlights ─────────────────────────────────────────
      const lightPositions = [
        { x: px - 40, y: py - 50 },
        { x: cx, y: py - 55 },
        { x: px + pitchW + 40, y: py - 50 },
        { x: px - 40, y: py + pitchH + 50 },
        { x: cx, y: py + pitchH + 55 },
        { x: px + pitchW + 40, y: py + pitchH + 50 },
      ];
      lightPositions.forEach((lp, i) => {
        const flicker = 0.6 + 0.4 * Math.sin(time * 0.018 + i * 1.3);
        const grd = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, 90);
        grd.addColorStop(0, `rgba(220,255,180,${0.06 * flicker})`);
        grd.addColorStop(0.4, `rgba(150,220,100,${0.025 * flicker})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(lp.x, lp.y, 90, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Floating atmosphere particles ───────────────────────────────
      for (let i = 0; i < 28; i++) {
        const seed = i * 137.5;
        const fx = (seed * 6.1 + time * 0.12 * (0.4 + (i % 6) * 0.12)) % w;
        const fy = (seed * 4.3 + Math.sin(time * 0.007 + i) * 35) % h;
        const fSize = 1 + (i % 3) * 0.6;
        const fAlpha = 0.03 + 0.02 * Math.sin(time * 0.013 + i * 0.9);
        ctx.beginPath();
        ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,255,120,${fAlpha})`;
        ctx.fill();
      }
    };

    const animate = () => {
      time++;
      drawField();
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default FootballBackground;
