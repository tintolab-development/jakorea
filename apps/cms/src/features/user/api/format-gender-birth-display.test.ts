import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatBirthDisplayWithManAge,
  formatGenderBirthDisplayLine,
} from './format-gender-birth-display'

describe('formatBirthDisplayWithManAge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00+09:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('원문 생년월일 — 기존처럼 정확한 만 나이를 계산한다', () => {
    it('원문 yyyy-MM-dd → 점 구분 + 만 나이', () => {
      expect(formatBirthDisplayWithManAge('1990-03-15')).toBe('1990. 03. 15 (만 36세)')
    })

    it('올해 생일이 지난 경우', () => {
      expect(formatBirthDisplayWithManAge('2000-11-01')).toBe('2000. 11. 01 (만 26세)')
    })

    it('올해 생일이 지나지 않은 경우', () => {
      expect(formatBirthDisplayWithManAge('2000-11-03')).toBe('2000. 11. 03 (만 25세)')
    })

    it('서버 age가 있으면 원문에서도 서버 값을 우선한다', () => {
      expect(formatBirthDisplayWithManAge('1990-03-15', { age: 35 })).toBe('1990. 03. 15 (만 35세)')
    })
  })

  describe('마스킹 생년월일 — 월·일을 모르므로 FE가 나이를 지어내지 않는다 (Step 6.4 P3)', () => {
    it('BE 마스킹 2000-**-** 는 나이 없이 2000.**.**', () => {
      expect(formatBirthDisplayWithManAge('2000-**-**')).toBe('2000.**.**')
    })

    it('정책 표기 2000.**.** 도 나이 없이 그대로', () => {
      expect(formatBirthDisplayWithManAge('2000.**.**')).toBe('2000.**.**')
    })

    it('birthYear만 있으면 연도만', () => {
      expect(formatBirthDisplayWithManAge(undefined, { birthYear: 1994 })).toBe('1994.**.**')
    })

    it('forceMaskedDate면 원문 날짜가 있어도 연·**.**만, 나이 계산 없음', () => {
      expect(
        formatBirthDisplayWithManAge('1994-03-02', { birthYear: 1994, forceMaskedDate: true })
      ).toBe('1994.**.**')
    })

    it('서버 age가 있으면 기존 계약대로 붙인다', () => {
      expect(formatBirthDisplayWithManAge('2000-**-**', { age: 25 })).toBe('2000.**.** (만 25세)')
    })

    it('서버 age가 null이면 붙이지 않는다', () => {
      expect(formatBirthDisplayWithManAge('2000-**-**', { age: null })).toBe('2000.**.**')
    })

    it('마스킹 생년월일에 서버 age 0이 와도 만 0세를 표시하지 않는다', () => {
      expect(formatBirthDisplayWithManAge('2026-**-**', { age: 0 })).toBe('2026.**.**')
      expect(formatBirthDisplayWithManAge('2026-**-**')).not.toContain('만 0세')
    })
  })

  describe('미등록·잘못된 값', () => {
    it.each([[null], [undefined], [''], ['   ']])('생년월일 %s 은 "-"', value => {
      expect(formatBirthDisplayWithManAge(value)).toBe('-')
    })

    it('연도를 알 수 없는 잘못된 날짜는 "-" 이고 만 0세가 없다', () => {
      expect(formatBirthDisplayWithManAge('invalid-date')).toBe('-')
      expect(formatBirthDisplayWithManAge('**-**-**')).toBe('-')
    })

    it('달력에 없는 날짜는 원문 날짜로 만들지 않고 나이도 계산하지 않는다', () => {
      const result = formatBirthDisplayWithManAge('2000-13-45')
      expect(result).not.toMatch(/만 \d+세/)
      expect(result).not.toContain('13')
    })
  })
})

describe('formatGenderBirthDisplayLine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00+09:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('성별 ** 와 마스킹 생년을 | 로 연결하고 나이를 지어내지 않는다', () => {
    expect(formatGenderBirthDisplayLine('**', '1985-**-**')).toBe('** | 1985.**.**')
  })

  it('서버 age가 있으면 마스킹 줄에도 붙인다', () => {
    expect(formatGenderBirthDisplayLine('**', '1985-**-**', { age: 41 })).toBe(
      '** | 1985.**.** (만 41세)'
    )
  })
})
