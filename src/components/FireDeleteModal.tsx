import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { FireSeed } from '../types/fireSeed';

type FireDeleteModalProps = {
  seed: FireSeed;
  onConfirm: () => void;
  onCancel: () => void;
};

export function FireDeleteModal({ seed, onConfirm, onCancel }: FireDeleteModalProps) {
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
    <div className="fire-delete-backdrop" role="presentation" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="fire-delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fire-delete-title"
        aria-describedby="fire-delete-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fire-delete-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 7h16" />
            <path d="M9 7V4h6v3" />
            <path d="M7 7l1 13h8l1-13" />
            <path d="M10 11v5M14 11v5" />
          </svg>
        </div>
        <p className="fire-delete-kicker">Remove task</p>
        <h2 id="fire-delete-title" className="fire-delete-heading">このタスクを削除しますか？</h2>
        <p id="fire-delete-description" className="fire-delete-copy">
          削除すると元に戻せません。迷う場合は、そのまま残しておくのがおすすめです。
        </p>
        <p className="fire-delete-seed">{seed.title}</p>
        <div className="fire-delete-actions">
          <button ref={cancelRef} className="fire-delete-cancel" type="button" onClick={onCancel}>
            残しておく
          </button>
          <button className="fire-delete-confirm" type="button" onClick={onConfirm}>
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
