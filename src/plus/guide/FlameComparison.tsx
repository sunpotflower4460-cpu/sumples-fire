import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { CombustionFlame } from '../../components/CombustionFlame';
import { PLUS_BURN_TYPES, isPlusBurnSpectacle } from '../../lib/fireBurnSpectacle';
import { AUTO_FLAME_IDS, FLAME_IDS, FLAME_TRAITS, getFlameEntry, isFlameId, type FlameId } from '../flames';
import sheet from './media/flame-sheet.webp';
import styles from './showcase.module.css';

const groups = [
  { label: 'おまかせの炎', ids: AUTO_FLAME_IDS },
  { label: 'Plus専用', ids: PLUS_BURN_TYPES },
] as const;

export function FlameComparison({ embedded }: { embedded: boolean }) {
  const prefix = useId();
  const [pair, setPair] = useState<[FlameId, FlameId]>(['lantern', 'magma']);
  const [replay, setReplay] = useState(0);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const choose = (index: number, id: string) => {
    if (!isFlameId(id)) return;
    setPair(([left, right]) => index === 0
      ? [id, right === id ? left : right]
      : [left === id ? right : left, id]);
    setReplay((round) => round + 1);
  };

  return (
    <>
      <div className={styles.pair} role="group" aria-label="2種類の炎を同じ大きさで比較">
        {pair.map((id, index) => {
          const flame = getFlameEntry(id);
          const inputId = prefix + index;
          return (
            <div key={index} className={styles.sample} data-guide-flame={id}>
              <div className={styles.stage} style={{ '--sample-glow': flame.spectacle.bgGlowColor } as CSSProperties}>
                <CombustionFlame key={replay} flame={id} size={248} motion="glimpse" />
              </div>
              <div className={styles.sampleBody}>
                <label htmlFor={inputId}>{index === 0 ? '左の炎' : '右の炎'}</label>
                <div className={styles.flameSelect}>
                  <span aria-hidden="true">{flame.label}</span>
                  <select id={inputId} value={id} onChange={(event) => choose(index, event.target.value)}>
                    {groups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.ids.map((option) => <option key={option} value={option}>{getFlameEntry(option).label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div aria-live="polite" aria-atomic="true">
                  <p className={styles.trait}>{FLAME_TRAITS[id]}</p>
                  <small>{isPlusBurnSpectacle(id) ? 'Plus専用' : 'おまかせの炎'}</small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.compareActions}>
        <button type="button" className={styles.replay} onClick={() => setReplay((round) => round + 1)}>
          2つの炎をもう一度再生
        </button>
      </div>
      <details className={styles.disclosure} onToggle={(event) => setCatalogOpen(event.currentTarget.open)}>
        <summary>全{FLAME_IDS.length}種類の炎を一覧で見る</summary>
        {catalogOpen && groups.map((group) => (
          <section key={group.label} className={styles.catalogGroup} aria-label={group.label}>
            <h3>{group.label}・{group.ids.length}種類</h3>
            <ul className={styles.catalog}>
              {group.ids.map((id) => (
                <li key={id}>
                  <CombustionFlame flame={id} size={84} />
                  <strong>{getFlameEntry(id).label}</strong>
                  <span>{FLAME_TRAITS[id]}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!embedded && <a href={sheet} className={styles.textLink} download="Fire-Task-Flames.webp">一覧画像を保存</a>}
      </details>
    </>
  );
}
