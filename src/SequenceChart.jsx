import { useEffect, useRef, useState, useCallback } from 'react';
import './SequenceChart.css';

// Measure the widest Y-label so we can set left padding dynamically
function measureMaxLabelWidth(ctx, values, font) {
  ctx.font = font;
  let max = 0;
  for (const v of values) {
    const w = ctx.measureText(formatLabel(v)).width;
    if (w > max) max = w;
  }
  return max;
}

function formatLabel(v) {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (v >= 1_000_000)     return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000)         return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return Math.round(v).toString();
}

const POINT_RADIUS = 3;
const LABEL_FONT = '11px JetBrains Mono, monospace';
const BASE_PAD = { top: 24, right: 24, bottom: 44 };

function drawChart({ canvas, sequence, cheatedAt, visibleCount, done, hoveredCheatIdx }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const visible = sequence.slice(0, visibleCount);
  if (visible.length < 1) return;

  const minVal = Math.min(...visible);
  const maxVal = Math.max(...visible);
  const range = maxVal - minVal || 1;

  // Compute grid values first to measure label width
  const gridLines = 5;
  const gridVals = Array.from({ length: gridLines + 1 }, (_, i) =>
    minVal + (range * i) / gridLines
  );

  // Measure Y labels with a temp context
  const tempCtx = document.createElement('canvas').getContext('2d');
  const maxLabelW = measureMaxLabelWidth(tempCtx, gridVals, LABEL_FONT);
  const leftPad = Math.ceil(maxLabelW) + 20; // 20px gap between label and axis

  const PAD = { ...BASE_PAD, left: leftPad };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const cheatedSet = new Set(cheatedAt);

  // CSS vars
  const style = getComputedStyle(document.documentElement);
  const colText    = style.getPropertyValue('--text').trim()        || '#f0f0f5';
  const colMuted   = style.getPropertyValue('--text-faint').trim()  || '#55556a';
  const colBorder  = style.getPropertyValue('--border').trim()      || '#2e2e3a';
  const colNormal  = style.getPropertyValue('--normal').trim()      || '#4d8fff';
  const colCheat   = style.getPropertyValue('--cheat').trim()       || '#ff5a4e';
  const colSurface = style.getPropertyValue('--surface').trim()     || '#1c1c24';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = colSurface;
  ctx.fillRect(0, 0, W, H);

  // Grid lines + Y labels
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = colBorder;
  ctx.lineWidth = 1;
  ctx.fillStyle = colMuted;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= gridLines; i++) {
    const val = gridVals[i];
    const y = PAD.top + innerH - (innerH * i) / gridLines;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
    ctx.fillText(formatLabel(val), PAD.left - 8, y);
  }
  ctx.setLineDash([]);
  ctx.textBaseline = 'alphabetic';

  // X axis line
  ctx.strokeStyle = colBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, H - PAD.bottom);
  ctx.lineTo(W - PAD.right, H - PAD.bottom);
  ctx.stroke();

  // X label
  ctx.fillStyle = colMuted;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'center';
  ctx.fillText('Step', W / 2, H - 8);

  function cx(i) {
    return PAD.left + (innerW * i) / Math.max(sequence.length - 1, 1);
  }
  function cy(v) {
    return PAD.top + innerH - (innerH * (v - minVal)) / range;
  }

  if (visible.length < 2) return { cx, cy, PAD, cheatedSet };

  // Gradient fill
  const grad = ctx.createLinearGradient(0, PAD.top, 0, H - PAD.bottom);
  grad.addColorStop(0, colNormal + '44');
  grad.addColorStop(1, colNormal + '00');
  ctx.beginPath();
  ctx.moveTo(cx(0), cy(visible[0]));
  for (let i = 1; i < visible.length; i++) ctx.lineTo(cx(i), cy(visible[i]));
  ctx.lineTo(cx(visible.length - 1), H - PAD.bottom);
  ctx.lineTo(cx(0), H - PAD.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line segments
  for (let i = 1; i < visible.length; i++) {
    const wasCheated = cheatedSet.has(sequence[i - 1]);
    ctx.beginPath();
    ctx.moveTo(cx(i - 1), cy(visible[i - 1]));
    ctx.lineTo(cx(i), cy(visible[i]));
    ctx.strokeStyle = wasCheated ? colCheat : colNormal;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Dots
  const drawAllDots = visible.length <= 60;
  for (let i = 0; i < visible.length; i++) {
    const wasCheated = i > 0 && cheatedSet.has(sequence[i - 1]);
    const isLast = i === visible.length - 1;
    if (!drawAllDots && !wasCheated && !isLast) continue;

    const r = wasCheated ? POINT_RADIUS + 1.5 : POINT_RADIUS;
    ctx.beginPath();
    ctx.arc(cx(i), cy(visible[i]), r, 0, Math.PI * 2);
    ctx.fillStyle = wasCheated ? colCheat : (isLast ? colText : colNormal);
    ctx.fill();
    ctx.strokeStyle = colSurface;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Animated front dot
  if (!done && visible.length > 0) {
    const last = visible.length - 1;
    ctx.beginPath();
    ctx.arc(cx(last), cy(visible[last]), POINT_RADIUS + 2, 0, Math.PI * 2);
    ctx.fillStyle = colNormal;
    ctx.fill();
  }

  // Hover tooltip for cheat point
  if (hoveredCheatIdx !== null && hoveredCheatIdx < visible.length) {
    const x = cx(hoveredCheatIdx);
    const y = cy(visible[hoveredCheatIdx]);
    const label = visible[hoveredCheatIdx].toLocaleString();
    ctx.font = '12px JetBrains Mono, monospace';
    const tw = ctx.measureText(label).width;
    const bw = tw + 16, bh = 26, br = 6;
    let bx = x - bw / 2;
    let by = y - bh - 10;
    // Keep inside canvas
    bx = Math.max(PAD.left, Math.min(W - PAD.right - bw, bx));
    if (by < PAD.top) by = y + 10;

    ctx.fillStyle = colCheat;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, br);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + bw / 2, by + bh / 2);
    ctx.textBaseline = 'alphabetic';

    // Highlight dot
    ctx.beginPath();
    ctx.arc(x, y, POINT_RADIUS + 3, 0, Math.PI * 2);
    ctx.strokeStyle = colCheat;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  return { cx, cy, PAD, cheatedSet };
}

// ── Shared canvas chart (used both in modal and live) ──────────────────────
export function ChartCanvas({ sequence, cheatedAt, animated = true, height = null }) {
  const canvasRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(animated ? 1 : sequence.length);
  const [done, setDone] = useState(!animated);
  const [hoveredCheatIdx, setHoveredCheatIdx] = useState(null);
  // Store last draw info for hit-testing
  const drawInfo = useRef(null);

  // Re-animate when sequence grows (for live chart)
  const prevLen = useRef(sequence.length);
  useEffect(() => {
    if (!animated) {
      setVisibleCount(sequence.length);
      return;
    }
    if (sequence.length !== prevLen.current) {
      prevLen.current = sequence.length;
      // Just jump to current length for live chart (no re-animation from 1)
      setVisibleCount(sequence.length);
    }
  }, [sequence.length, animated]);

  // Animation ticker (only for modal use)
  useEffect(() => {
    if (!animated || visibleCount >= sequence.length) {
      setDone(true);
      return;
    }
    const speed = sequence.length > 200 ? 6 : sequence.length > 80 ? 14 : 28;
    const t = setTimeout(() => setVisibleCount(v => v + 1), speed);
    return () => clearTimeout(t);
  }, [visibleCount, sequence.length, animated]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const info = drawChart({ canvas, sequence, cheatedAt, visibleCount, done, hoveredCheatIdx });
    drawInfo.current = info;
  }, [visibleCount, sequence, cheatedAt, done, hoveredCheatIdx]);

  // Resize
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      canvas.width = parent.offsetWidth - 2;
      canvas.height = height || Math.min(300, Math.max(180, parent.offsetWidth * 0.38));
      setVisibleCount(v => v); // redraw
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [height]);

  // Mouse hover for cheat tooltips
  const handleMouseMove = useCallback((e) => {
    const info = drawInfo.current;
    if (!info) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const { cx, PAD, cheatedSet } = info;

    const visible = sequence.slice(0, visibleCount);
    let found = null;
    for (let i = 0; i < visible.length; i++) {
      const wasCheated = i > 0 && cheatedSet.has(sequence[i - 1]);
      if (!wasCheated) continue;
      const px = cx(i);
      if (Math.abs(mx - px) < 12) { found = i; break; }
    }
    setHoveredCheatIdx(found);
  }, [sequence, visibleCount]);

  const handleMouseLeave = useCallback(() => setHoveredCheatIdx(null), []);

  return (
    <div className="chart-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="chart-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: hoveredCheatIdx !== null ? 'crosshair' : 'default' }}
      />
      {animated && !done && (
        <div className="chart-progress">{visibleCount} / {sequence.length}</div>
      )}
    </div>
  );
}

// ── Full modal (game-over) ──────────────────────────────────────────────────
export default function SequenceChart({ sequence, cheatedAt, title, onClose }) {
  const peakVal = Math.max(...sequence);
  const peakIdx = sequence.indexOf(peakVal);

  return (
    <div className="chart-overlay" onClick={onClose}>
      <div className="chart-modal" onClick={e => e.stopPropagation()}>
        <div className="chart-header">
          <div className="chart-meta">
            {title && <span className="chart-meta-title">{title}</span>}
            {title && <span className="chart-meta-sep">·</span>}
            <span className="chart-meta-item">{sequence.length} steps</span>
            <span className="chart-meta-sep">·</span>
            <span className="chart-meta-item">Peak: <strong>{peakVal.toLocaleString()}</strong> at step {peakIdx + 1}</span>
            {cheatedAt.length > 0 && (
              <>
                <span className="chart-meta-sep">·</span>
                <span className="chart-meta-item cheat-meta">{cheatedAt.length} cheat{cheatedAt.length > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
          <button className="chart-close" onClick={onClose}>✕</button>
        </div>

        <ChartCanvas sequence={sequence} cheatedAt={cheatedAt} animated={true} />

        <div className="chart-legend">
          <span className="chart-legend-item">
            <span className="chart-legend-dot chart-legend-dot--normal" />
            Normal
          </span>
          <span className="chart-legend-item">
            <span className="chart-legend-dot chart-legend-dot--cheat" />
            After cheat
          </span>
        </div>

        <div className="chart-footer">
          <button className="game-btn game-btn--normal" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
