import { describe, expect, it } from 'vitest'
import {
  isGeminiInstructorIdentityBlank,
  isGeminiInstructorIdentityPartial,
} from './instructor-identity'

describe('gemini instructor identity', () => {
  it('treats empty name and phone as blank', () => {
    expect(isGeminiInstructorIdentityBlank('', '')).toBe(true)
    expect(isGeminiInstructorIdentityBlank('  ', '---')).toBe(true)
    expect(isGeminiInstructorIdentityPartial('', '')).toBe(false)
  })

  it('treats name-only or phone-only as partial', () => {
    expect(isGeminiInstructorIdentityBlank('홍길동', '')).toBe(false)
    expect(isGeminiInstructorIdentityPartial('홍길동', '')).toBe(true)
    expect(isGeminiInstructorIdentityPartial('', '01012345678')).toBe(true)
  })

  it('treats both present as neither blank nor partial', () => {
    expect(isGeminiInstructorIdentityBlank('홍길동', '010-1234-5678')).toBe(false)
    expect(isGeminiInstructorIdentityPartial('홍길동', '010-1234-5678')).toBe(false)
  })
})
