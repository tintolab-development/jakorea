import { describe, expect, it } from 'vitest'
import {
  canonicalizeIdTypeResidentInputValue,
  splitIdTypeResidentInputValue,
} from '@/features/template/model/writing-form-draft.schema'

describe('id-type resident input persist/display', () => {
  it('splits a hyphenated server value into two fields', () => {
    expect(splitIdTypeResidentInputValue('970721-1234567')).toEqual({
      front: '970721',
      back: '1234567',
    })
  })

  it('splits a 13-digit server value into two fields', () => {
    expect(splitIdTypeResidentInputValue('9707211234567')).toEqual({
      front: '970721',
      back: '1234567',
    })
  })

  it('joins for a single persist field', () => {
    expect(canonicalizeIdTypeResidentInputValue('9707211234567')).toBe('970721-1234567')
    expect(canonicalizeIdTypeResidentInputValue('970721-1234567')).toBe('970721-1234567')
  })
})
