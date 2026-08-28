import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(', ');

const isHiddenInsideClosedDetails = (element: HTMLElement) => {
  const closedDetails = element.closest<HTMLDetailsElement>('details:not([open])');
  if (!closedDetails) return false;

  const summary = closedDetails.querySelector<HTMLElement>(':scope > summary');
  return element !== summary;
};

const isReachableFocusTarget = (element: HTMLElement) => {
  if (element.closest('[hidden], [aria-hidden="true"], [inert]')) return false;
  if (isHiddenInsideClosedDetails(element)) return false;

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  // Closed disclosures and other CSS-hidden descendants can keep a nominal
  // display value while producing no box. Match the browser's real Tab order.
  return element.getClientRects().length > 0;
};

const isRadioInput = (element: HTMLElement): element is HTMLInputElement => (
  element instanceof HTMLInputElement && element.type === 'radio' && element.name.length > 0
);

const isNativeRadioTabStop = (element: HTMLElement, reachable: HTMLElement[]) => {
  if (!isRadioInput(element)) return true;

  const group = reachable.filter((candidate): candidate is HTMLInputElement => (
    isRadioInput(candidate)
    && candidate.name === element.name
    && candidate.form === element.form
  ));
  const tabStop = group.find((radio) => radio.checked) ?? group[0];
  return element === tabStop;
};

const getReachableFocusTargets = (container: HTMLElement) => {
  const reachable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
    .filter(isReachableFocusTarget);

  // Native radio groups are one sequential Tab stop, not one stop per radio.
  // Keep the checked item (or the first enabled item when nothing is checked)
  // so trap boundaries match the browser's keyboard model.
  return reachable.filter((element) => isNativeRadioTabStop(element, reachable));
};

/**
 * Traps keyboard focus inside the referenced container while `active` is true.
 * Existing intentional focus inside the container (for example an autoFocused
 * primary input) is preserved; otherwise focus moves to the first reachable
 * control. Hidden descendants of closed disclosures and non-tabbable members
 * of native radio groups are excluded so the trap's first/last targets match
 * the browser's actual Tab order.
 * Returns a ref to attach to the container element.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const initialFocusable = getReachableFocusTargets(container);
    const activeElement = document.activeElement;
    const hasIntentionalFocusInside = activeElement instanceof HTMLElement
      && container.contains(activeElement)
      && initialFocusable.includes(activeElement);

    // React/browser autofocus runs during commit before passive effects. Do not
    // replace that intentional target with an earlier close button in the DOM.
    if (!hasIntentionalFocusInside) {
      initialFocusable[0]?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const elements = getReachableFocusTargets(container);
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return containerRef;
}
