import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { FireSeed } from '../types/fireSeed';
import { difficultyLabels, quadrantLabels } from '../types/fireSeed';

type FireConfirmModalProps = {
  seed: FireSeed;
  onConfirm: () => void;
  onCancel: () => void;
};

export function FireConfirmModal({ seed, onConfirm, onCancel }: FireConfirmModalProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fire-confirm-icon" aria-hidden="true">🔥</div>

        <p className="fire-confirm-kicker">Ritual of Fire</p>
        <h2 id="fire-confirm-title" className="fire-confirm-heading">
          このタスクを<br />燃やしますか？
        </h2>

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
          <button className="fire-confirm-no" type="button" onClick={onCancel}>
            やめる
          </button>
        </div>
      </div>
    </div>
  );
}
