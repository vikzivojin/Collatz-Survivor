import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collatzNext, cheatNext, isEven,
  todayStr, formatDate
} from './gameLogic';
import SequenceChart, { ChartCanvas } from './SequenceChart';
import ShareModal from './ShareModal';
import './Game.css';

function getHighScoreKey(dateStr) {
  return `collatz-hs-${dateStr}`;
}

function loadHighScore(dateStr) {
  try {
    const raw = localStorage.getItem(getHighScoreKey(dateStr));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveHighScore(dateStr, score, cheatedAt) {
  localStorage.setItem(getHighScoreKey(dateStr), JSON.stringify({ score, cheatedAt }));
}

function emitUpdate(sequence, cheatedAt) {
  window.dispatchEvent(new CustomEvent('collatz-update', {
    detail: { sequence, cheatedAt }
  }));
}

export default function Game({ startingNumber, initialCheats, rechargeInterval, selectedDate, onRestart }) {
  const [sequence, setSequence] = useState([startingNumber]);
  const [visited, setVisited] = useState(new Set([startingNumber]));
  const [cheats, setCheats] = useState(initialCheats);
  const [evenCount, setEvenCount] = useState(0);
  const [cheatedAt, setCheatedAt] = useState([]);
  const [cheatedAtSteps, setCheatedAtSteps] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [repeatedNumber, setRepeatedNumber] = useState(null);
  const [highScore, setHighScore] = useState(() => loadHighScore(selectedDate));
  const [justRecharged, setJustRecharged] = useState(false);
  // fade: null | 'normal' | 'cheat'
  const [fadeType, setFadeType] = useState(null);
  // cheat counter animation key
  const [cheatAnimKey, setCheatAnimKey] = useState(0);
  const [showChart, setShowChart] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showLiveChart, setShowLiveChart] = useState(true);

  const current = sequence[sequence.length - 1];
  const isCurrentEven = isEven(current);
  const normalNext = collatzNext(current);
  const cheatNextVal = isCurrentEven ? cheatNext(current) : null;
  const canCheat = isCurrentEven && cheats > 0 && !gameOver;

  const normalWouldRepeat = visited.has(normalNext);
  const cheatWouldRepeat = cheatNextVal !== null && visited.has(cheatNextVal);

  const repeatedIsStart = repeatedNumber !== null && repeatedNumber === startingNumber;

  // Emit sequence updates to sidebar
  useEffect(() => {
    emitUpdate(sequence, cheatedAt);
  }, [sequence, cheatedAt]);

  useEffect(() => {
    emitUpdate([startingNumber], []);
  }, []);

  const advanceTo = useCallback((nextVal, didCheat) => {
    // Trigger fade animation
    setFadeType(didCheat ? 'cheat' : 'normal');
    setTimeout(() => setFadeType(null), 320);

    setSequence(prev => {
      const newSeq = [...prev, nextVal];
      const newVisited = new Set([...prev, nextVal]);
      const prevCurrent = prev[prev.length - 1];
      const newCheatedAt = didCheat ? [...cheatedAt, prevCurrent] : cheatedAt;
      // Track which step number each cheat was used at (1-indexed = prev.length)
      const newCheatedAtSteps = didCheat ? [...cheatedAtSteps, prev.length] : cheatedAtSteps;

      let newEvenCount = evenCount;
      let newCheats = didCheat ? cheats - 1 : cheats;
      let recharged = false;

      if (isEven(nextVal)) {
        newEvenCount = evenCount + 1;
        const rechargesEarned = Math.floor(newEvenCount / rechargeInterval);
        const prevRecharges = Math.floor(evenCount / rechargeInterval);
        if (rechargesEarned > prevRecharges) {
          newCheats += 1;
          recharged = true;
        }
      }

      setCheats(newCheats);
      setEvenCount(newEvenCount);
      setCheatedAt(newCheatedAt);
      setCheatedAtSteps(newCheatedAtSteps);
      setVisited(newVisited);
      setJustRecharged(recharged);
      if (didCheat) setCheatAnimKey(k => k + 1);

      if (visited.has(nextVal)) {
        setRepeatedNumber(nextVal);
        setGameOver(true);
        const score = newSeq.length;
        const hs = loadHighScore(selectedDate);
        if (!hs || score > hs.score) {
          saveHighScore(selectedDate, score, newCheatedAt);
          setHighScore({ score, cheatedAt: newCheatedAt });
        } else {
          setHighScore(hs);
        }
      }

      setTimeout(() => emitUpdate(newSeq, newCheatedAt), 0);
      return newSeq;
    });
  }, [cheatedAt, cheats, evenCount, visited, selectedDate]);

  function handleNormal() {
    if (gameOver) return;
    advanceTo(normalNext, false);
  }

  function handleCheat() {
    if (!canCheat || gameOver) return;
    advanceTo(cheatNextVal, true);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (gameOver) return;
      const key = e.key;
      if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        handleNormal();
      } else if ((key === 'm' || key === 'c') && canCheat) {
        e.preventDefault();
        handleCheat();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameOver, canCheat, handleNormal, handleCheat]);

  const score = sequence.length;
  const isNewHighScore = gameOver && highScore && highScore.score === score;

  return (
    <div className="game">
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Step</div>
          <div className="stat-val">{score}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Evens Hit</div>
          <div className="stat-val">{evenCount}</div>
        </div>
        <div className={`stat-card ${justRecharged ? 'stat-card--glow' : ''}`}>
          <div className="stat-label">Cheats</div>
          <div key={cheatAnimKey} className="stat-val stat-val--cheat cheat-anim">{cheats}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Best</div>
          <div className="stat-val stat-val--best">{highScore ? highScore.score : '—'}</div>
        </div>
      </div>

      {justRecharged && (
        <div className="recharge-banner">+1 cheat recharged — {rechargeInterval} evens milestone!</div>
      )}

      {/* Game area */}
      {!gameOver && (
        <div className="play-area">
          {/* Current number with fade */}
          <div className="current-card">
            <div
              key={current}
              className={`current-num
                ${isCurrentEven ? 'current-num--even' : 'current-num--odd'}
                ${fadeType === 'cheat' ? 'fade-in-cheat' : 'fade-in-normal'}
              `}
            >
              {current.toLocaleString()}
            </div>
          </div>

          {/* Action row */}
          <div className="action-row">
            <div className={`action-card action-card--normal ${normalWouldRepeat ? 'action-card--danger' : ''}`}>
              <div className="action-op">{isCurrentEven ? '÷ 2' : '× 3 + 1'}</div>
              <div className={`action-result ${normalWouldRepeat ? 'action-result--danger' : ''}`}>
                {normalNext.toLocaleString()}
                {normalWouldRepeat && <span className="repeat-pill">REPEAT</span>}
              </div>
              <button className="game-btn game-btn--normal" onClick={handleNormal}>
                {isCurrentEven ? 'Divide by 2' : 'Continue'}
                <kbd className="kbd-desktop">Space</kbd>
              </button>
            </div>

            <div className={`action-card action-card--cheat
              ${!isCurrentEven || cheats === 0 ? 'action-card--locked' : ''}
              ${cheatWouldRepeat && isCurrentEven ? 'action-card--danger' : ''}
            `}>
              <div className="action-op">× 3 + 1</div>
              <div className={`action-result ${cheatWouldRepeat && isCurrentEven ? 'action-result--danger' : ''}`}>
                {isCurrentEven && cheatNextVal !== null ? (
                  <>
                    {cheatNextVal.toLocaleString()}
                    {cheatWouldRepeat && <span className="repeat-pill">REPEAT</span>}
                  </>
                ) : (
                  <span className="locked-text">{!isCurrentEven ? 'Odd number' : 'No cheats'}</span>
                )}
              </div>
              <button
                className="game-btn game-btn--cheat"
                onClick={handleCheat}
                disabled={!canCheat}
              >
                {cheats > 0 ? `Cheat (${cheats} left)` : 'No cheats left'}
                {canCheat && <kbd className="kbd-desktop">C</kbd>}
              </button>
            </div>
          </div>

          <div className="kbd-hint">
            <kbd>Space</kbd> / <kbd>Enter</kbd> to continue &nbsp;·&nbsp;
            <kbd>C</kbd> / <kbd>M</kbd> to cheat
          </div>
          <button
            className={`live-chart-toggle ${showLiveChart ? 'live-chart-toggle--active' : ''}`}
            onClick={() => setShowLiveChart(v => !v)}
          >
            {showLiveChart ? '▾ Hide Chart' : '▸ Show Live Chart'}
          </button>
          {showLiveChart && (
            <div className="live-chart-panel">
              <ChartCanvas sequence={sequence} cheatedAt={cheatedAt} animated={false} height={200} />
            </div>
          )}
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="gameover-card">
          {repeatedIsStart && (
            <div className="gameover-award">
              🏅 Full Circle! You ended on the starting number!
            </div>
          )}
          <div className={`gameover-badge ${isNewHighScore ? 'gameover-badge--new' : ''}`}>
            {isNewHighScore ? 'New High Score!' : 'Game Over'}
          </div>
          <div className="gameover-score">{score}</div>
          <div className="gameover-sub">numbers reached</div>

          {repeatedNumber !== null && (
            <div className={`gameover-repeat ${repeatedIsStart ? 'gameover-repeat--special' : ''}`}>
              You repeated <strong>{repeatedNumber.toLocaleString()}</strong>
              {repeatedIsStart && ' (starting number!)'}
            </div>
          )}

          {highScore && !isNewHighScore && (
            <div className="gameover-hs">
              Date best: <strong>{highScore.score}</strong>
            </div>
          )}

          <div className="gameover-cheats">
            <div className="gameover-cheats-label">
              {cheatedAt.length === 0 ? 'No cheats used — pure run!' : `You cheated at ${cheatedAt.length} number${cheatedAt.length > 1 ? 's' : ''}:`}
            </div>
            {cheatedAt.length > 0 && (
              <>
                <div className="cheat-tags">
                  {cheatedAt.map((n, i) => (
                    <span key={i} className="cheat-tag">{n.toLocaleString()}</span>
                  ))}
                </div>
                <div className="gameover-cheats-label" style={{ marginTop: 6 }}>
                  You cheated at step{cheatedAtSteps.length > 1 ? 's' : ''}:
                </div>
                <div className="cheat-tags">
                  {cheatedAtSteps.map((s, i) => (
                    <span key={i} className="cheat-tag">{s}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="gameover-actions">
            <button className="game-btn game-btn--share" onClick={() => setShowShare(true)}>
              🔗 Share Score
            </button>
            <button className="game-btn game-btn--chart" onClick={() => setShowChart(true)}>
              📈 See Your Path
            </button>
            <button className="game-btn game-btn--restart" onClick={onRestart}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {showChart && (
        <SequenceChart
          sequence={sequence}
          cheatedAt={cheatedAt}
          onClose={() => setShowChart(false)}
        />
      )}

      {showShare && (
        <ShareModal
          score={score}
          selectedDate={selectedDate}
          highScore={highScore}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
