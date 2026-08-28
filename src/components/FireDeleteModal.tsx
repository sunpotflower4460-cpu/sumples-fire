import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { FireSeed } from '../types/fireSeed';

type FireDeleteModalProps = {
  seed: FireSeed;
  onConfirm: () => void;
  onCancel: () => void;
};

type DeleteOrigin =
  | { kind: 'ash'; index: number }
  | { kind: 'queue'; index: number }
  | { kind: 'generic' };

const indexOfElement = (selector: string, element: HTMLElement) => (
  Array.from(document.querySelectorAll<HTMLElement>(selector)).indexOf(element)
);

const captureDeleteOrigin = (element: HTMLElement | null): DeleteOrigin => {
  if (!element) return { kind: 'generic' };

  if (element.matches('#ash-records-list .ash-record-delete')) {
    const index = indexOfElement('#ash-records-list .ash-record-delete', element);
    return index >= 0 ? { kind: 'ash', index } : { kind: 'generic' };
  }

  if (element.matches('#up-next-list .card-delete-button')) {
    const index = indexOfElement('#up-next-list .card-delete-button', element);
    return index >= 0 ? { kind: 'queue', index } : { kind: 'generic' };
  }

  return { kind: 'generic' };
};

const focusIndexedControl = (selector: string, index: number) => {
  const controls = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const target = controls[Math.min(index, Math.max(0, controls.length - 1))];
  if (!target) return false;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  return true;
};

const focusAfterDelete = (origin: DeleteOrigin) => {
  if (origin.kind === 'ash') {
    if (focusIndexedControl('#ash-records-list .ash-record-delete', origin.index)) return;

    const emptyHeading = document.querySelector<HTMLElement>('#ash-empty-title');
    if (emptyHeading) {
      emptyHeading.tabIndex = -1;
      emptyHeading.focus({ preventScroll: true });
      emptyHeading.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      return;
    }
  }

  if (origin.kind === 'queue') {
    if (focusIndexedControl('#up-next-list .card-delete-button', origin.index)) return;
  }

  const fallback = document.querySelector<HTMLElement>(
    '.focus-seed .fire-button, .all-clear-card .primary-button, .floating-action, .tab-button[aria-current="page"]',
  );
  fallback?.focus({ preventScroll: true });
};

export function FireDeleteModal({ seed, onConfirm, onCancel }: FireDeleteModalProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const deleteOriginRef = useRef<DeleteOrigin>({ kind: 'generic' });
  const hasCapturedOriginRef = useRef(false);
  const shouldRestorePreviousFocusRef = useRef(true);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const isAshRecord = seed.burned;

  useLayoutEffect(() => {
    if (hasCapturedOriginRef.current) return;
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previousFocusRef.current = activeElement;
    deleteOriginRef.current = captureDeleteOrigin(activeElement);
    hasCapturedOriginRef.current = true;
  }, []);

  useEffect(() => {
    window.setTimeout(() => cancelRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (!shouldRestorePreviousFocusRef.current) return;
      window.setTimeout(() => {
        if (previousFocusRef.current?.isConnected) {
          previousFocusRef.current.focus({ preventScroll: true });
        }
      }, 0);
    };
  }, [onCancel]);

  const handleConfirm = () => {
    shouldRestorePreviousFocusRef.current = false;
    const deleteOrigin = deleteOriginRef.current;
    onConfirm();
    window.setTimeout(() => focusAfterDelete(deleteOrigin), 0);
  };

  return (
    <div className="fire-delete-backdrop" role="presentation" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="fire-delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fire-delete-title"
        aria-describedby="fire-delete-seed fire-delete-description"
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
        <p className="fire-delete-kicker">REMOVE</p>
        <h2 id="fire-delete-title" className="fire-delete-heading">
          {isAshRecord ? 'この炭の記録を削除しますか？' : 'このタスクを削除しますか？'}
        </h2>
        <p id="fire-delete-seed" className="fire-delete-seed">{seed.title}</p>
        <p id="fire-delete-description" className="fire-delete-copy">
          {isAshRecord
            ? `削除すると${seed.ashPoints}炭が合計から減り、称号の進捗にも反映されます。連続Fireの記録は変わりません。`
            : '削除すると元に戻せません。迷う場合は、そのまま残しておけます。'}
        </p>
        <div className="fire-delete-actions">
          <button ref={cancelRef} className="fire-delete-cancel" type="button" onClick={onCancel}>
            {isAshRecord ? '記録を残す' : '残しておく'}
          </button>
          <button className="fire-delete-confirm" type="button" onClick={handleConfirm}>
            {isAshRecord ? '炭ごと削除' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  );
}
