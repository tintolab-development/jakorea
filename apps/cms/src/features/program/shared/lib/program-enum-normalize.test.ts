import { describe, expect, it } from 'vitest'
import {
  educationProcessDisplayLabel,
  normalizeCourseDeliveredByFormValue,
  normalizeEducationProcessFormValue,
  normalizeIpOwnedSelectValue,
} from './program-enum-normalize'

describe('normalizeEducationProcessFormValue', () => {
  it.each([
    ['digital_computer', 'digital_computer'],
    ['Digital (Computer)', 'digital_computer'],
    ['traditional_paper', 'traditional_paper'],
    ['Traditional (Paper)', 'traditional_paper'],
    ['blended_paper_computer', 'blended_paper_computer'],
    ['Blended (Paper & Computer)', 'blended_paper_computer'],
  ] as const)('%s → %s', (input, expected) => {
    expect(normalizeEducationProcessFormValue(input)).toBe(expected)
  })

  it.each([null, undefined, '', '   '])('%j → 미선택', raw => {
    expect(normalizeEducationProcessFormValue(raw)).toBeUndefined()
  })

  it('미지원 원문을 보존한다', () => {
    expect(normalizeEducationProcessFormValue('Hybrid')).toBe('Hybrid')
  })
})

describe('educationProcessDisplayLabel', () => {
  it('maps API code to registration label', () => {
    expect(educationProcessDisplayLabel('digital_computer')).toBe('Digital (Computer)')
  })

  it('keeps stored label as label', () => {
    expect(educationProcessDisplayLabel('Traditional (Paper)')).toBe('Traditional (Paper)')
  })

  it('empty → -', () => {
    expect(educationProcessDisplayLabel(null)).toBe('-')
  })
})

describe('normalizeCourseDeliveredByFormValue', () => {
  it.each([
    ['ja', 'JA'],
    ['JA', 'JA'],
    [' partner ', 'Partner'],
    ['Partner', 'Partner'],
    ['jointly', 'Jointly'],
    ['Jointly', 'Jointly'],
    ['joint', 'Jointly'],
    ['JOINT', 'Jointly'],
  ] as const)('%s → %s', (input, expected) => {
    expect(normalizeCourseDeliveredByFormValue(input)).toBe(expected)
  })

  it.each([null, undefined, '', '   '])('%j → 미선택', raw => {
    expect(normalizeCourseDeliveredByFormValue(raw)).toBeUndefined()
  })

  it('미지원 값을 JA 로 치환하지 않는다', () => {
    expect(normalizeCourseDeliveredByFormValue('TEACHER')).toBeUndefined()
    expect(normalizeCourseDeliveredByFormValue('ja_korea')).toBeUndefined()
  })
})

describe('normalizeIpOwnedSelectValue', () => {
  it.each([
    ['ja', 'JA'],
    ['JA', 'JA'],
    ['partner', 'Partner'],
    ['Jointly', 'Jointly'],
    ['jointly', 'Jointly'],
    ['joint', 'Joint'],
  ] as const)('%s → %s', (input, expected) => {
    expect(normalizeIpOwnedSelectValue(input)).toBe(expected)
  })

  it.each([null, undefined, '', '   '])('%j → 미선택', raw => {
    expect(normalizeIpOwnedSelectValue(raw)).toBeUndefined()
  })

  it('미지원 원문을 보존한다', () => {
    expect(normalizeIpOwnedSelectValue('TEACHER')).toBe('TEACHER')
  })
})
