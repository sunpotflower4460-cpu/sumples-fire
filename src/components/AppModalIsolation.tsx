import { useEffect } from 'react';

type SavedAccessibilityState = {
  ariaHidden: string | null;
  inert: boolean;
};

const MODAL_OVERLAY_SELECTOR = '.sheet-backdrop, .fire-delete-backdrop';

const isElement = (node: Element): node is HTMLElement => node instanceof HTMLElement;

/**
 * `aria-modal` and a keyboard trap do not guarantee that every screen reader's
 * virtual cursor will ignore background content. While an in-shell modal is
 * mounted, make the app-shell siblings around that overlay both inert and
 * aria-hidden. The overlay itself remains fully interactive.
 *
 * This component intentionally lives outside <App /> so it is never one of the
 * shell children it temporarily isolates.
 */
export function AppModalIsolation() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.mobile-app-shell');
    if (!shell) return;

    const savedStates = new Map<HTMLElement, SavedAccessibilityState>();

    const restoreBackground = () => {
      for (const [element, state] of savedStates) {
        if (!element.isConnected) continue;

        if (state.inert) {
          element.setAttribute('inert', '');
        } else {
          element.removeAttribute('inert');
        }

        if (state.ariaHidden === null) {
          element.removeAttribute('aria-hidden');
        } else {
          element.setAttribute('aria-hidden', state.ariaHidden);
        }
      }
      savedStates.clear();
    };

    const syncIsolation = () => {
      const children = Array.from(shell.children).filter(isElement);
      const overlay = children.find((child) => child.matches(MODAL_OVERLAY_SELECTOR));

      if (!overlay) {
        restoreBackground();
        return;
      }

      for (const child of children) {
        if (child === overlay || savedStates.has(child)) continue;

        savedStates.set(child, {
          ariaHidden: child.getAttribute('aria-hidden'),
          inert: child.hasAttribute('inert'),
        });
        child.setAttribute('inert', '');
        child.setAttribute('aria-hidden', 'true');
      }
    };

    const observer = new MutationObserver(syncIsolation);
    observer.observe(shell, { childList: true });
    syncIsolation();

    return () => {
      observer.disconnect();
      restoreBackground();
    };
  }, []);

  return null;
}
