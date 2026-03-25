import { useState } from 'react';
import { todayStr, getStartingNumberForDate, formatDate } from './gameLogic';
import './Modal.css';

function getHighScore(dateStr) {
  try {
    const raw = localStorage.getItem(`collatz-hs-${dateStr}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function ClassicStats() {
  const today = todayStr();
  const dates = [];
  for (let i = 0; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dates.push(str);
  }

  const played = dates.filter(d => getHighScore(d) !== null);
  const scores = played.map(d => getHighScore(d).score);
  const best = scores.length ? Math.max(...scores) : null;
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <>
      <div className="stats-summary">
        <div className="summary-card">
          <div className="summary-val">{played.length}</div>
          <div className="summary-label">Days Played</div>
        </div>
        <div className="summary-card">
          <div className="summary-val">{best ?? '—'}</div>
          <div className="summary-label">Best Score</div>
        </div>
        <div className="summary-card">
          <div className="summary-val">{avg ?? '—'}</div>
          <div className="summary-label">Avg Score</div>
        </div>
      </div>

      {played.length === 0 ? (
        <div className="stats-empty">No games played yet. Go play!</div>
      ) : (
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Start</th>
                <th>Score</th>
                <th>Cheats</th>
              </tr>
            </thead>
            <tbody>
              {played.map(d => {
                const hs = getHighScore(d);
                return (
                  <tr key={d} className={d === today ? 'stats-row--today' : ''}>
                    <td>{formatDate(d)}{d === today && <span className="today-dot"> ●</span>}</td>
                    <td className="mono">{getStartingNumberForDate(d)}</td>
                    <td className="mono score-cell">{hs.score}</td>
                    <td className="mono">{hs.cheatedAt?.length ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function NegativeStats() {
  return (
    <div className="stats-coming-soon">
      <div className="stats-coming-soon-text">
        Negative Collatz (3x − 1) statistics will appear here once that mode is available.
      </div>
    </div>
  );
}

export default function StatisticsModal({ onClose }) {
  const [tab, setTab] = useState('classic');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Statistics</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'classic' ? 'modal-tab--active' : ''}`}
            onClick={() => setTab('classic')}
          >
            Classic
          </button>
          <button
            className={`modal-tab ${tab === 'negative' ? 'modal-tab--active' : ''}`}
            onClick={() => setTab('negative')}
          >
            Negative Collatz
          </button>
        </div>

        <div className="modal-body">
          {tab === 'classic' ? <ClassicStats /> : <NegativeStats />}
        </div>
      </div>
    </div>
  );
}
