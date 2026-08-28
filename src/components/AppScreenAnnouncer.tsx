import { useEffect, useRef, useState } from 'react';

const screenNameFromTitle = (title: string) => title.split(' — ')[0]?.trim() || 'Fire Task';

export function AppScreenAnnouncer() {
  const [announcement, setAnnouncement] = useState('');
  const previousTitleRef = useRef('');

  useEffect(() => {
    previousTitleRef.current = document.title;
    const titleElement = document.querySelector('title');
    if (!titleElement) return;

    const announceScreenChange = () => {
      const nextTitle = document.title;
      if (!nextTitle || nextTitle === previousTitleRef.current) return;
      previousTitleRef.current = nextTitle;
      setAnnouncement(`${screenNameFromTitle(nextTitle)}画面を表示しました`);
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
