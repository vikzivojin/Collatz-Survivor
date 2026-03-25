import './Modal.css';

export default function RulesModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Rules to Play</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="rules-list">
            <div className="rule-item">
              <div>
                <strong>Goal:</strong> Reach as many unique numbers as possible before landing on one you've already visited.
              </div>
            </div>
            <div className="rule-item">
              <div>
                <strong>Odd numbers:</strong> You must multiply by 3 and add 1.
              </div>
            </div>
            <div className="rule-item">
              <div>
                <strong>Even numbers:</strong> You must divide by 2.
              </div>
            </div>
            <div className="rule-item">
              <div>
                <strong>Cheats:</strong> You can use a cheat on an even number to multiply by 3 and add 1 instead. They are consumed on use. You start with an allotment and can gain additional cheats as you play.
              </div>
            </div>
            <div className="rule-item">
              <div>
                <strong>Repeats:</strong> The game ends when you land on a repeated number.
              </div>
            </div>
            <div className="rule-item">
              <div>
                <strong>Daily:</strong> Each day has a unique starting number, starting cheats, and interval for additional cheats.
              </div>
            </div>
            <div className="rule-divider" />
            <div className="rule-kbd-section">
              <strong>Keyboard shortcuts</strong>
              <div className="rule-kbds">
                <div><kbd>Space</kbd> / <kbd>Enter</kbd> — Continue / Divide by 2</div>
                <div><kbd>C</kbd> / <kbd>M</kbd> — Use cheat (when available)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
