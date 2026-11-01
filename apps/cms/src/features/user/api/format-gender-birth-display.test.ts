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

  it('마스킹 yyyy-**-** → 2017.**.** (만 N세)', () => {
    expect(formatBirthDisplayWithManAge('2017-**-**')).toBe('2017.**.** (만 9세)')
  })

  it('birthYear만 있으면 마스킹 생년·만 나이', () => {
    expect(formatBirthDisplayWithManAge(undefined, { birthYear: 1994 })).toBe(
      '1994.**.** (만 32세)'
    )
  })

  it('원문 yyyy-MM-dd → 점 구분 + 만 나이', () => {
    expect(formatBirthDisplayWithManAge('1990-03-15')).toBe('1990. 03. 15 (만 36세)')
  })

  it('forceMaskedDate면 원문도 연·**.**만', () => {
    expect(
      formatBirthDisplayWithManAge('1994-03-02', { birthYear: 1994, forceMaskedDate: true })
    ).toBe('1994.**.** (만 32세)')
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

  it('성별 ** 와 마스킹 생년을 | 로 연결', () => {
    expect(formatGenderBirthDisplayLine('**', '1985-**-**')).toBe(
      '** | 1985.**.** (만 41세)'
    )
  })
})
