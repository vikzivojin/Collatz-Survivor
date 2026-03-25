import { useState, useEffect, useRef } from 'react';
import { ThemeProvider, useTheme, THEMES } from './ThemeContext';
import Game from './Game';
import DatePicker from './DatePicker';
import RulesModal from './RulesModal';
import StatisticsModal from './StatisticsModal';
import SplashScreen from './SplashScreen';
import PrivacyPage from './PrivacyPage';
import ContactPage from './ContactPage';
import { todayStr, getDailyParams, formatDate } from './gameLogic';
import './App.css';

function AppInner() {
  const { theme, setTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [gameKey, setGameKey] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modal, setModal] = useState(null); // 'rules' | 'stats' | null
  const [activePage, setActivePage] = useState('play'); // 'play' | 'negative' | 'privacy' | 'contact'
  const [showSplash, setShowSplash] = useState(true);

  const { startingNumber, initialCheats, rechargeInterval } = getDailyParams(selectedDate);

  function handleDateSelect(date) {
    setSelectedDate(date);
    setShowDatePicker(false);
    setGameKey(k => k + 1);
  }

  function handleRestart() {
    setGameKey(k => k + 1);
  }

  function handlePlay() {
    setShowSplash(false);
  }

  function handleSplashRules() {
    setShowSplash(false);
    setModal('rules');
  }

  // Splash screen
  if (showSplash) {
    return (
      <SplashScreen
        startingNumber={startingNumber}
        initialCheats={initialCheats}
        rechargeInterval={rechargeInterval}
        onPlay={handlePlay}
        onRules={handleSplashRules}
        onPrivacy={() => { setShowSplash(false); setActivePage('privacy'); }}
        onContact={() => { setShowSplash(false); setActivePage('contact'); }}
      />
    );
  }

  // Full-screen info pages
  if (activePage === 'privacy') {
    return <PrivacyPage onBack={() => setActivePage('play')} />;
  }
  if (activePage === 'contact') {
    return <ContactPage onBack={() => setActivePage('play')} />;
  }

  return (
    <div className="app">
      {/* ── Navigation ── */}
      <nav className="nav">
        <button className="nav-logo" onClick={() => setShowSplash(true)}>
          Collatz <span>Survivor</span>
        </button>

        <div className="nav-links">
          <button
            className={`nav-link ${activePage === 'play' ? 'nav-link--active' : ''}`}
            onClick={() => setActivePage('play')}
          >
            Play
          </button>
          <button
            className="nav-link"
            onClick={() => setModal('rules')}
          >
            Rules
          </button>
          <button
            className={`nav-link ${activePage === 'negative' ? 'nav-link--active' : ''}`}
            onClick={() => setActivePage('negative')}
          >
            Negative Collatz
          </button>
          <button
            className="nav-link"
            onClick={() => setModal('stats')}
          >
            Statistics
          </button>
        </div>

        <div className="nav-right">
          <button
            className="nav-date-btn"
            onClick={() => setShowDatePicker(v => !v)}
          >
            📅 {formatDate(selectedDate)}
          </button>
          <ThemeDropdown />
        </div>
      </nav>

      {/* ── Date Picker ── */}
      {showDatePicker && (
        <DatePicker
          currentDate={selectedDate}
          onSelect={handleDateSelect}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* ── Modals ── */}
      {modal === 'rules' && <RulesModal onClose={() => setModal(null)} />}
      {modal === 'stats' && <StatisticsModal onClose={() => setModal(null)} />}

      {/* ── Page content ── */}
      {activePage === 'play' ? (
        <div className="app-body">
          {/* Daily params info panel */}
          <div className="daily-info-panel">
            <div className="daily-info-row">
              <span className="daily-info-label">Starting Number</span>
              <span className="daily-info-val">{startingNumber}</span>
            </div>
            <div className="daily-info-row">
              <span className="daily-info-label">Starting Cheats</span>
              <span className="daily-info-val">{initialCheats}</span>
            </div>
            <div className="daily-info-row">
              <span className="daily-info-label">Additional Cheats</span>
              <span className="daily-info-val">Every {rechargeInterval} even numbers</span>
            </div>
          </div>

          <main className="app-main">
            <Game
              key={`${gameKey}-${selectedDate}`}
              startingNumber={startingNumber}
              initialCheats={initialCheats}
              rechargeInterval={rechargeInterval}
              selectedDate={selectedDate}
              onRestart={handleRestart}
            />
          </main>
          <SequenceSidebar key={`seq-${gameKey}-${selectedDate}`} />
        </div>
      ) : (
        <NegativeCollatzPage />
      )}
    </div>
  );
}

// Theme dropdown component
function ThemeDropdown() {
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
    <div className="theme-dropdown" ref={ref}>
      <button className="theme-dropdown-btn" onClick={() => setOpen(v => !v)}>
        <span className="theme-dot" style={{ background: THEME_COLORS[theme] }} />
        <span>{current.label}</span>
        <span className="theme-dropdown-arrow">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="theme-dropdown-menu">
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

const THEME_COLORS = {
  light:  '#c0b8a8',
  dark:   '#4d4d6a',
  red:    '#ff4444',
  blue:   '#4488ff',
  green:  '#44dd66',
  pink:   '#ff66cc',
  orange: '#ff8800',
};

// Sidebar driven by custom events from Game
function SequenceSidebar() {
  const [items, setItems] = useState([]);
  const [cheatedAtSet, setCheatedAtSet] = useState(new Set());
  const scrollRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      setItems([...e.detail.sequence]);
      setCheatedAtSet(new Set(e.detail.cheatedAt));
    }
    window.addEventListener('collatz-update', handler);
    return () => window.removeEventListener('collatz-update', handler);
  }, []);

  // Auto-scroll to bottom whenever items change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items]);

  return (
    <aside className="sequence-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">Sequence</div>
        <div className="sidebar-count">{items.length} steps</div>
      </div>
      <div className="sidebar-scroll" ref={scrollRef}>
        {items.map((n, i) => {
          const isEvenNum = n % 2 === 0;
          const prevN = items[i - 1];
          const wasCheated = i > 0 && cheatedAtSet.has(prevN);
          const isLast = i === items.length - 1;
          const isRepeated = isLast && items.slice(0, i).includes(n);
          return (
            <div
              key={i}
              className={`seq-item
                ${isRepeated ? 'seq-item--repeated' : ''}
                ${wasCheated ? 'seq-item--cheated' : (isEvenNum ? 'seq-item--even' : 'seq-item--odd')}
              `}
            >
              <span className="seq-item-index">{i + 1}</span>
              <span>{n.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function NegativeCollatzPage() {
  return (
    <div className="app-body">
      <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Negative Collatz Coming Soon
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            The 3x − 1 variant will be playable here in a future update.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
