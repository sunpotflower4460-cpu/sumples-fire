import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { COPY } from '../plusCopy';

type PlusDialogProps = {
  titleId: string;
  title: string;
  screen: string;
  /** More than one Plus screen is open: show a back button. */
  canGoBack: boolean;
  onBack: () => void;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  );
}

function CloseX() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

/**
 * Full-height sheet for every Plus screen. It reuses the app's modal contract:
 * role=dialog + aria-modal, a focus trap, Escape, and (via AppModalIsolation,
 * which recognises `.plus-backdrop`) an inert background. Content scrolls inside
 * the sheet, so large text and small screens never push the actions out of reach.
 */
export function PlusDialog({ titleId, title, screen, canGoBack, onBack, onClose, footer, children }: PlusDialogProps) {
  const dialogRef = useFocusTrap<HTMLElement>(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (canGoBack) onBack();
      else onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, onBack, onClose]);

  return (
    <div className="plus-backdrop" data-plus-backdrop={screen}>
      <section
        ref={dialogRef}
        className="plus-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-plus-screen={screen}
      >
        <header className="plus-dialog-header">
          {canGoBack ? (
            <button type="button" className="plus-icon-button" aria-label={COPY.back} onClick={onBack}>
              <ChevronLeft />
            </button>
          ) : (
            <span className="plus-header-spacer" aria-hidden="true" />
          )}
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="plus-icon-button" aria-label={COPY.close} onClick={onClose}>
            <CloseX />
          </button>
        </header>
        <div className="plus-dialog-body">{children}</div>
        {footer ? <footer className="plus-dialog-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
