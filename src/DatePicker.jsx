import { todayStr, formatDate, getDailyParams } from './gameLogic';
import './DatePicker.css';

function getHighScore(dateStr) {
  try {
    const raw = localStorage.getItem(`collatz-hs-${dateStr}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function DatePicker({ currentDate, onSelect, onClose }) {
  const today = todayStr();
  const dates = [];
  for (let i = 0; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dates.push(str);
  }

  return (
    <div className="dp-overlay" onClick={onClose}>
      <div className="dp-panel" onClick={e => e.stopPropagation()}>
        <div className="dp-head">
          <span className="dp-head-title">Select a Date</span>
          <button className="dp-close" onClick={onClose}>✕</button>
        </div>
        <div className="dp-list">
          {dates.map(d => {
            const { startingNumber, initialCheats, rechargeInterval } = getDailyParams(d);
            const hs = getHighScore(d);
            return (
              <button
                key={d}
                className={`dp-row ${d === currentDate ? 'dp-row--active' : ''}`}
                onClick={() => onSelect(d)}
              >
                <div className="dp-row-top">
                  <span className="dp-date-text">{formatDate(d)}</span>
                  <div className="dp-row-top-right">
                    {hs && (
                      <span className="dp-hs">Best: <strong>{hs.score}</strong></span>
                    )}
                    {d === today && <span className="dp-today-pill">Today</span>}
                  </div>
                </div>
                <span className="dp-params">
                  Start: <strong>{startingNumber}</strong>
                  <span className="dp-sep">|</span>
                  Cheats: <strong>{initialCheats}</strong>
                  <span className="dp-sep">|</span>
                  Additional: Every <strong>{rechargeInterval}</strong>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
