import { useCallback, useEffect, useRef, type MouseEvent } from 'react';
import { ambientPlayer } from '../ambientPlayer';
import type { AmbientMix } from '../ambientOptions';
import { FlameComparison } from './FlameComparison';
import { SceneAudition } from './SceneAudition';
import styles from './showcase.module.css';
import icon from './media/icon.png';
import comparison from './media/fire-task-flames-live.mp4';
import comparisonPoster from './media/flame-film-live.webp';
import walkthrough from './media/fire-task-plus-live.mp4';
import walkthroughPoster from './media/video-cover.webp';
import picker from './media/flames-screen.webp';
import burning from './media/actual-fire.webp';
import embers from './media/fire-embers.webp';
import presets from './media/sets-screen.webp';
import personalSets from './media/my-sets-screen.webp';
import audioPanel from './media/audio-screen.webp';
import review from './media/review-screen.webp';

const chapters = [
  { name: '炎を選んでFireする', time: 3.2 },
  { name: '景色と音量を選ぶ', time: 13.49 },
  { name: '月の記録を開く', time: 21.7 },
];

function Screen({ image, caption, alt }: { image: string; caption: string; alt: string }) {
  return (
    <figure className={styles.screen}>
      <img src={image} width="393" height="760" alt={alt} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** The purchase sheet and the standalone showcase render the same local catalog and media. */
export default function Showcase({ embedded = false }: { embedded?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const tour = useRef<HTMLVideoElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const audioRequest = useRef(0);
  const stopSound = useCallback(() => {
    audioRequest.current += 1;
    ambientPlayer.stop();
  }, []);
  const playSound = async (mix: AmbientMix) => {
    const request = ++audioRequest.current;
    film.current?.pause();
    tour.current?.pause();
    const started = await ambientPlayer.start(mix);
    return request === audioRequest.current ? started : undefined;
  };

  useEffect(() => {
    if (!embedded && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    const tourVideo = tour.current;
    const filmVideo = film.current;
    const stop = () => { tourVideo?.pause(); filmVideo?.pause(); stopSound(); };
    const onHide = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', stop);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', stop);
      stop();
    };
  }, [embedded, stopSound]);

  const jump = (event: MouseEvent<HTMLElement>) => {
    if (!embedded || !(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const section = root.current?.querySelector<HTMLElement>(link.hash);
    if (section) {
      event.preventDefault();
      section.scrollIntoView({ block: 'start' });
      section.focus({ preventScroll: true });
    }
  };
  const playChapter = (time: number) => {
    const video = tour.current;
    if (!video) return;
    video.scrollIntoView({ block: 'center' });
    video.focus({ preventScroll: true });
    video.currentTime = time;
    void video.play().catch(() => {});
  };

  return (
    <article ref={root} className={styles.page} id="top" tabIndex={-1} onClick={jump}
      onPlayCapture={(event) => {
        if (event.target === tour.current) film.current?.pause();
        else if (event.target === film.current) tour.current?.pause();
        else return;
        stopSound();
      }}>
      {!embedded && <a className={styles.skip} href="#flames">炎の比較へ</a>}
      <header className={styles.mast}>
        <div className={styles.wrap}>
          {!embedded && <a className={styles.brand} href="#top"><img src={icon} width="32" height="32" alt="" />Fire Task <span>Plus</span></a>}
          <nav aria-label="紹介ページ内の案内">
            <a href="#flames">炎</a><a href="#film">動画</a><a href="#sets">セット</a>
            <a href="#scenes">景色と音</a><a href="#review">ふりかえり</a>
          </nav>
        </div>
      </header>
      <section id="flames" tabIndex={-1} className={styles.hero} aria-labelledby="guide-flames">
        <div className={styles.wrap}>
          <p className={styles.kicker}>おまかせの炎9種類・Plus専用13種類</p>
          <h1 id="guide-flames">22種類の炎を見比べる</h1>
          <p className={styles.lead}>左右の炎を選んで、火の形と揺れ方を比べられます。</p>
          <FlameComparison embedded={embedded} />
          <p className={styles.lead}>無料版では9種類の炎が自動で現れます。Plusでは専用の13種類を含む全22種類から、毎回使う炎やお気に入りを選べます。</p>
        </div>
      </section>
      <section id="film" tabIndex={-1} className={styles.section} aria-labelledby="guide-film">
        <div className={styles.wrap}>
          <h2 id="guide-film">動画で見る</h2>
          <div className={styles.movies}>
            <figure>
              <h3>22種類の炎の見分け方</h3>
              <video ref={film} controls playsInline preload="none" width="810" height="1008" poster={comparisonPoster}
                src={comparison} aria-label="全22種類の炎を2種類ずつ比較する動画" />
              <figcaption>2種類ずつ、同じ尺度で火の幅と火先を比較。26秒・無音</figcaption>
              {!embedded && <a className={styles.textLink} href={comparison} download="Fire-Task-Flames.mp4">比較動画を保存</a>}
            </figure>
            <figure>
              <h3>Plusの使い方</h3>
              <video ref={tour} controls playsInline preload="none" width="900" height="1440" poster={walkthroughPoster}
                src={walkthrough} aria-label="Fire Task Plusを実際に操作した紹介動画" />
              <figcaption>炎の選択から日別の記録まで。約30秒・環境音あり</figcaption>
              <div className={styles.chapters} aria-label="操作動画の章">
                {chapters.map((chapter) => <button key={chapter.time} type="button" onClick={() => playChapter(chapter.time)}>{chapter.name}</button>)}
              </div>
              {!embedded && <a className={styles.textLink} href={walkthrough} download="Fire-Task-Plus.mp4">操作動画を保存</a>}
            </figure>
          </div>
          <details className={styles.disclosure}>
            <summary>アプリで着火してから、炭が残るまで</summary>
            <div className={styles.stages}>
              <Screen image={picker} caption="炎を選ぶ" alt="海硝子の炎を選んだ画面" />
              <Screen image={burning} caption="タスクを燃やす" alt="タスク名の上で、フェニックスの二筋の炎が燃えている" />
              <Screen image={embers} caption="熾火が残る" alt="燃え終わると、炭の上に火の粉が舞う" />
            </div>
          </details>
        </div>
      </section>
      <section id="sets" tabIndex={-1} className={styles.section} aria-labelledby="guide-sets">
        <div className={styles.wrap}>
          <p className={styles.kicker}>おすすめ6種類・マイセット4枠</p><h2 id="guide-sets">焚き火をセットで選ぶ</h2>
          <p className={styles.lead}>「波を待つ浜辺」なら、海硝子の炎、入り江の景色、波音が一緒に切り替わります。自分で選んだ組み合わせにも名前を付けて保存できます。</p>
          <div className={styles.screens}>
            <Screen image={presets} caption="おすすめ「波を待つ浜辺」" alt="夕凪の入り江に海硝子の炎が揺れるセット選択画面" />
            <Screen image={personalSets} caption="マイセット「海辺のひと息」" alt="海硝子の炎と波音の組み合わせを「海辺のひと息」として保存した画面" />
          </div>
        </div>
      </section>
      <section id="scenes" tabIndex={-1} className={styles.section} aria-labelledby="guide-scenes">
        <div className={styles.wrap}>
          <p className={styles.kicker}>9種類の景色・6種類の環境音</p><h2 id="guide-scenes">景色を見て、音を聴く。</h2>
          <p className={styles.lead}>オーロラがたなびき、入り江には波が寄せます。景色を選んで、動きと環境音を試せます。</p>
          <SceneAudition playSound={playSound} stopSound={stopSound} />
          <details className={styles.disclosure}>
            <summary>音量を調整する画面を見る</summary>
            <Screen image={audioPanel} caption="夕凪の入り江" alt="波音の音量を76パーセントに調整している画面" />
          </details>
        </div>
      </section>
      <section id="review" tabIndex={-1} className={styles.section} aria-labelledby="guide-review">
        <div className={styles.wrap}>
          <p className={styles.kicker}>月別・年間ふりかえり</p><h2 id="guide-review">終えた日を、ひらく。</h2>
          <p className={styles.lead}>Fireした件数、炭の合計、Fireした日数を年単位で確認できます。月を選ぶと、その日に終えたタスクまでたどれます。</p>
          <Screen image={review} caption="年間のふりかえり" alt="1月から12月の件数と炭の合計が並ぶ年間表示" />
          <button type="button" className={styles.textLink} onClick={() => playChapter(chapters[2].time)}>日別一覧の操作を動画で見る</button>
        </div>
      </section>
      <footer className={styles.footer}><div className={styles.wrap}>
        <p>Fire Task Plusは一度の購入で使える追加機能です。</p><a className={styles.textLink} href="#top">先頭に戻る ↑</a>
      </div></footer>
    </article>
  );
}
