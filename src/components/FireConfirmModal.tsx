import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { FireSeed } from '../types/fireSeed';
import { difficultyLabels, quadrantLabels } from '../types/fireSeed';

type FireConfirmModalProps = {
  seed: FireSeed;
  onConfirm: () => void;
  onCancel: () => void;
};

function FlameGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.5 3c.6 3.2-2.2 4.2-1 6.5.5 1 1.5 1.4 2.3 1.1 1.1-.5 1.4-1.9 1.1-3.4 2.3 1.8 3.6 4 3.6 6.5A7.5 7.5 0 1 1 4.5 14c0-3.4 2-5.9 5.2-8.2-.1 2 .2 3.3 1.1 4 .2-2.6.9-4.7 2.7-6.8Z" />
      <path d="M12 13.2c1.8 1.5 2.7 2.8 2.7 4a2.7 2.7 0 0 1-5.4 0c0-1.2.9-2.5 2.7-4Z" fill="rgba(255,255,255,.55)" />
    </svg>
  );
}

export function FireConfirmModal({ seed, onConfirm, onCancel }: FireConfirmModalProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.setTimeout(() => cancelRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.setTimeout(() => previousFocusRef.current?.focus(), 0);
    };
  }, [onCancel]);

  return (
    <div className="fire-confirm-backdrop" role="presentation" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="fire-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fire-confirm-title"
        aria-describedby="fire-confirm-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fire-confirm-icon" aria-hidden="true"><FlameGlyph /></div>

        <p className="fire-confirm-kicker">Ritual of Fire</p>
        <h2 id="fire-confirm-title" className="fire-confirm-heading">
          このタスクを<br />燃やしますか？
        </h2>
        <p id="fire-confirm-description" className="fire-confirm-description">
          Fireすると完了として炭の記録へ移ります。
        </p>

        <div className="fire-confirm-seed-info">
          <p className="fire-confirm-seed-title">{seed.title}</p>
          <div className="fire-confirm-seed-meta">
            <span>{quadrantLabels[seed.quadrant]}</span>
            <span>{difficultyLabels[seed.difficulty]}</span>
            <span className="fire-confirm-ash">+{seed.ashPoints} 炭</span>
          </div>
        </div>

        <div className="fire-confirm-actions">
          <button className="fire-confirm-yes" type="button" onClick={onConfirm}>
            Fire する
          </button>
          <button ref={cancelRef} className="fire-confirm-no" type="button" onClick={onCancel}>
            やめる
          </button>
        </div>
      </div>
    </div>
  );
}
