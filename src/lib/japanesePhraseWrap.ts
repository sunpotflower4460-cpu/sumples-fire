/**
 * Japanese phrase wrapping.
 *
 * Japanese has no spaces, so the browser's default wrapping can split a
 * compound word in half ("たたき台" → "たたき" / "台"). We insert a zero-width
 * space after grammatical particles and punctuation so `word-break: keep-all`
 * can wrap only at those phrase boundaries. `overflow-wrap: anywhere` remains
 * the last-resort valve for a single unbreakable token that is still too long.
 */

export const JP_SOFT_WRAP = '\u200B';

const BREAK_AFTER_PUNCT = /[、。，．！？!?：；・）\]｝」』】〉》]/;
const NO_BREAK_BEFORE = /[ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー〜〵ゝゞヽヾ、。，．！？!?：；・）\]｝」』】〉》]/;
const OPENING = /[（[｛「『【〈《]/;
const CJK = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;
const ASCII_WORD = /[A-Za-z0-9]/;
const SPACE = /\s/;

const STARTS_NEW_PHRASE = /[\u3400-\u9fff\uf900-\ufaff\u30a0-\u30ffA-Za-z0-9「『【（[｛〈《]/;

/**
 * Longest-first particles. A match only counts when the next character starts a
 * new phrase (kanji, katakana, latin). That keeps verbs like "燃やす" / "まとめる"
 * intact while still splitting "確定申告の書類".
 */
const PARTICLES = [
  'けれども',
  'けれど',
  'ながら',
  'から',
  'まで',
  'より',
  'など',
  'だけ',
  'しか',
  'ほど',
  'くらい',
  'ぐらい',
  'ばかり',
  'こそ',
  'さえ',
  'でも',
  'ては',
  'ても',
  'のに',
  'ので',
  'けど',
  'して',
  'って',
  'は',
  'が',
  'を',
  'に',
  'で',
  'と',
  'も',
  'へ',
  'や',
  'の',
];

const ALWAYS_BREAK_PARTICLES = new Set(['を']);

const matchParticleAt = (source: string, index: number) => {
  if (index === 0 || !CJK.test(source[index - 1] ?? '')) return '';
  for (const particle of PARTICLES) {
    if (!source.startsWith(particle, index)) continue;
    const next = source[index + particle.length];
    if (
      next
      && !ALWAYS_BREAK_PARTICLES.has(particle)
      && !STARTS_NEW_PHRASE.test(next)
      && !BREAK_AFTER_PUNCT.test(next)
      && !SPACE.test(next)
    ) {
      continue;
    }
    return particle;
  }
  return '';
};

export const insertJapaneseSoftWraps = (text: string): string => {
  if (!text) return text;

  const source = text.replace(/\u200B/g, '');
  let out = '';
  let i = 0;

  while (i < source.length) {
    const ch = source[i] ?? '';

    if (ASCII_WORD.test(ch)) {
      let end = i + 1;
      while (end < source.length && ASCII_WORD.test(source[end] ?? '')) end += 1;
      out += source.slice(i, end);
      const next = source[end];
      if (next && !SPACE.test(next) && !NO_BREAK_BEFORE.test(next)) {
        out += JP_SOFT_WRAP;
      }
      i = end;
      continue;
    }

    const particle = matchParticleAt(source, i);
    if (particle) {
      out += particle;
      i += particle.length;
      const next = source[i];
      if (next && !SPACE.test(next) && !NO_BREAK_BEFORE.test(next) && !BREAK_AFTER_PUNCT.test(next)) {
        out += JP_SOFT_WRAP;
      }
      continue;
    }

    out += ch;
    i += 1;
    const next = source[i];
    if (!next || SPACE.test(next) || OPENING.test(ch)) continue;
    if (BREAK_AFTER_PUNCT.test(ch) && !NO_BREAK_BEFORE.test(next)) {
      out += JP_SOFT_WRAP;
    }
  }

  return out;
};

/** Alias used at call sites so wrapping reads as copy, not plumbing. */
export const jp = insertJapaneseSoftWraps;
