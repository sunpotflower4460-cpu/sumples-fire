import { useEffect, useRef, useState } from 'react';
import { SCENES, type SceneId } from '../scenes';
import './sceneLandscape.css';

const VISIBLE_AREA = 0.15;

type SceneMotionProps = {
  src: string;
  paused: boolean;
  setPaused: (paused: boolean) => void;
};

function SceneMotion({ src, paused, setPaused }: SceneMotionProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const player = video.current;
    return () => player?.pause();
  }, []);

  const toggle = () => {
    const player = video.current;
    if (!player) return;
    if (player.paused) {
      setPaused(false);
      void player.play().catch(() => {});
    } else {
      setPaused(true);
      player.pause();
    }
  };

  if (unavailable) return null;
  return (
    <>
      <video ref={video} className="scene-landscape-motion" data-playing={playing}
        src={src} autoPlay={!paused} loop muted playsInline preload="none" disablePictureInPicture
        aria-hidden="true" onError={() => setUnavailable(true)}
        onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <button type="button" className="scene-motion-button" data-playing={playing}
        aria-label={playing ? '景色の動きを止める' : '景色を動かす'} onClick={toggle} />
    </>
  );
}

/** The still and the silent motion clip share the same crop. Only visible previews load a clip. */
export function SceneLandscape({ scene, active = true }: { scene: SceneId; active?: boolean }) {
  const { artwork, motion } = SCENES[scene];
  const landscape = useRef<HTMLDivElement>(null);
  const [eligible, setEligible] = useState(false);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setEligible(!document.hidden && !reduceMotion.matches);
    sync();
    reduceMotion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      reduceMotion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  useEffect(() => {
    if (!landscape.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= VISIBLE_AREA), {
      threshold: VISIBLE_AREA,
    });
    observer.observe(landscape.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={landscape} className="scene-landscape" aria-hidden="true">
        {artwork && <img src={artwork} alt="" decoding="async" />}
      </div>
      {motion && active && eligible && inView && <SceneMotion key={motion} src={motion} paused={paused} setPaused={setPaused} />}
    </>
  );
}
