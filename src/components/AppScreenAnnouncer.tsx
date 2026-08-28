import { useEffect, useRef, useState } from 'react';

export function AppScreenAnnouncer() {
  const [announcement, setAnnouncement] = useState('');
  const previousScreenNameRef = useRef('');

  useEffect(() => {
    const titleElement = document.querySelector<HTMLElement>('#app-screen-title');
    if (!titleElement) return;

    previousScreenNameRef.current = titleElement.textContent?.trim() ?? '';

    const announceScreenChange = () => {
      const nextScreenName = titleElement.textContent?.trim() ?? '';
      if (!nextScreenName || nextScreenName === previousScreenNameRef.current) return;
      previousScreenNameRef.current = nextScreenName;
      setAnnouncement(`${nextScreenName}画面を表示しました`);
    };

    const observer = new MutationObserver(announceScreenChange);
    observer.observe(titleElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <p
      className="sr-only app-screen-announcement"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </p>
  );
}
