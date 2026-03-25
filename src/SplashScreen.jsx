import { useRef, useEffect, useState } from 'react';
import { useTheme, THEMES } from './ThemeContext';
import './SplashScreen.css';

const THEME_COLORS = {
  light:  '#c0b8a8',
  dark:   '#4d4d6a',
  red:    '#ff4444',
  blue:   '#4488ff',
  green:  '#44dd66',
  pink:   '#ff66cc',
  orange: '#ff8800',
};

function SplashThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = THEMES.find(t => t.id === theme);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="splash-theme-dropdown" ref={ref}>
      <button className="splash-theme-btn" onClick={() => setOpen(v => !v)}>
        <span className="theme-dot" style={{ background: THEME_COLORS[theme] }} />
        <span>{current.label}</span>
        <span className="theme-dropdown-arrow">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="theme-dropdown-menu splash-theme-menu">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={`theme-menu-item ${theme === t.id ? 'theme-menu-item--active' : ''}`}
              onClick={() => { setTheme(t.id); setOpen(false); }}
            >
              <span className="theme-dot" style={{ background: THEME_COLORS[t.id] }} />
              <span>{t.label}</span>
              {theme === t.id && <span className="theme-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SplashScreen({ startingNumber, initialCheats, rechargeInterval, onPlay, onRules, onPrivacy, onContact }) {
  return (
    <div className="splash">
      <div className="splash-top-bar">
        <SplashThemeDropdown />
      </div>

      <div className="splash-content">
        <div className="splash-logo">
          <span className="splash-logo-collatz">Collatz</span>
          <span className="splash-logo-survivor">Survivor</span>
        </div>

        <p className="splash-tagline">
          Survive as long as you can.
        </p>

        <div className="splash-daily">
          <div className="splash-daily-label">Today's Scenario</div>
          <div className="splash-daily-stats">
            <div className="splash-stat">
              <span className="splash-stat-label">Starting Number</span>
              <span className="splash-stat-val">{startingNumber}</span>
            </div>
            <div className="splash-stat-divider" />
            <div className="splash-stat">
              <span className="splash-stat-label">Starting Cheats</span>
              <span className="splash-stat-val">{initialCheats}</span>
            </div>
            <div className="splash-stat-divider" />
            <div className="splash-stat">
              <span className="splash-stat-label">Additional Cheats</span>
              <span className="splash-stat-val">Every {rechargeInterval} even numbers</span>
            </div>
          </div>
        </div>

        <div className="splash-actions">
          <button className="splash-play-btn" onClick={onPlay}>
            Play
          </button>
          <button className="splash-rules-btn" onClick={onRules}>
            Rules
          </button>
        </div>

        <footer className="splash-footer">
          <button className="splash-footer-link" onClick={onPrivacy}>Privacy Policy</button>
          <span className="splash-footer-sep">·</span>
          <button className="splash-footer-link" onClick={onContact}>Contact</button>
        </footer>
      </div>
    </div>
  );
}
