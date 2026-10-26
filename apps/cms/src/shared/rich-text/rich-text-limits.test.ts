/**
 * @vitest-environment node
 *
 * `countRichTextCharacters` 회귀 테스트.
 * 스냅샷(__snapshots__/rich-text-limits.test.ts.snap)은 배열 전개(`[...segmenter.segment(text)]`)
 * 구현(3f62a21ff 시점)으로 생성했다. 카운트 구현을 바꿔도 같은 값이 나와야 한다.
 */
import { describe, expect, it } from 'vitest'
import { countRichTextCharacters, RICH_TEXT_MAX_TEXT_CHARACTERS } from '@jakorea/rich-text'

const SNAPSHOT_INPUTS: Record<string, string> = {
  empty: '',
  asciiWord: 'hello',
  asciiSentence: 'The quick brown fox jumps over the lazy dog. 0123456789 !@#$%^&*()',
  asciiSpaces: '   ',
  newlineLf: 'a\nb\n\nc',
  newlineCrLf: 'a\r\nb\r\n',
  tab: 'a\tb',
  koreanSyllables: '가나다라마바사',
  koreanSentence: '본문은 최대 5만 자까지 입력할 수 있습니다.',
  koreanJamoSequence: '\u1100\u1161\u11A8\u1100\u1161',
  koreanCompatJamo: 'ㄱㅏㄴ',
  syllablePlusTrailingJamo: '\uAC00\u11A8',
  emojiSimple: '😀',
  emojiRepeated: '😀😀😀',
  emojiSkinTone: '👍🏽',
  emojiZwjFamily: '👨‍👩‍👧‍👦',
  emojiFlag: '🇰🇷',
  emojiFlags: '🇰🇷🇺🇸',
  emojiKeycap: '1️⃣',
  variationSelector: '❤️',
  combiningAcute: 'e\u0301',
  combiningStack: 'a\u0300\u0301\u0302',
  precomposed: '\u00e9',
  cjkIdeographs: '漢字かなカナ',
  thai: 'ภาษาไทย',
  devanagari: 'नमस्ते',
  loneHighSurrogate: 'a\uD83Db',
  loneLowSurrogate: 'a\uDE00b',
  zeroWidthSpace: 'a\u200Bb',
  nbsp: 'a\u00A0b',
  mixed: 'BOT 테스트 😀 e\u0301 🇰🇷\n둘째 줄 👨‍👩‍👧‍👦',
  korean5000: '가'.repeat(5000),
  ascii5000: 'a'.repeat(5000),
  emoji2000: '😀'.repeat(2000),
  zwj500: '👨‍👩‍👧‍👦'.repeat(500),
  mixed1000: 'a가😀e\u0301🇰🇷\n'.repeat(1000),
}

describe('countRichTextCharacters (기존 구현 스냅샷과 동일)', () => {
  it('matches the outputs captured from the array-spread implementation', () => {
    const result = Object.fromEntries(
      Object.entries(SNAPSHOT_INPUTS).map(([name, text]) => [name, countRichTextCharacters(text)])
    )
    expect(result).toMatchSnapshot()
  })
})

describe('countRichTextCharacters (단위·경계)', () => {
  it('returns 0 for empty input', () => {
    expect(countRichTextCharacters('')).toBe(0)
  })

  it('counts ASCII one per character', () => {
    expect(countRichTextCharacters('abc 123')).toBe(7)
  })

  it('counts each Korean syllable as one character', () => {
    expect(countRichTextCharacters('가나다')).toBe(3)
    expect(countRichTextCharacters('\u1100\u1161\u11A8')).toBe(1)
  })

  it('counts surrogate-pair and composed emoji as one visible character', () => {
    expect('😀'.length).toBe(2)
    expect(countRichTextCharacters('😀')).toBe(1)
    expect(countRichTextCharacters('👍🏽')).toBe(1)
    expect(countRichTextCharacters('👨‍👩‍👧‍👦')).toBe(1)
    expect(countRichTextCharacters('🇰🇷')).toBe(1)
    expect(countRichTextCharacters('e\u0301')).toBe(1)
  })

  it('counts exactly at and just above the 50,000 character limit without blowing up', () => {
    const atLimit = '가'.repeat(RICH_TEXT_MAX_TEXT_CHARACTERS)
    expect(countRichTextCharacters(atLimit)).toBe(RICH_TEXT_MAX_TEXT_CHARACTERS)
    expect(countRichTextCharacters(`${atLimit}나`)).toBe(RICH_TEXT_MAX_TEXT_CHARACTERS + 1)
    expect(countRichTextCharacters(`${atLimit.slice(1)}😀`)).toBe(RICH_TEXT_MAX_TEXT_CHARACTERS)
  })
})
