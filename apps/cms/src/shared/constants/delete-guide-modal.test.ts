import { describe, expect, it } from 'vitest'
import {
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
  WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE,
  matchesDeleteGuideTypedConfirm,
  normalizeDeleteGuideTypedConfirmInput,
} from './delete-guide-modal'

describe('normalizeDeleteGuideTypedConfirmInput', () => {
  it('trims whitespace', () => {
    expect(normalizeDeleteGuideTypedConfirmInput('  삭제  ')).toBe('삭제')
  })

  it('strips a single surrounding bracket pair', () => {
    expect(normalizeDeleteGuideTypedConfirmInput('[삭제]')).toBe('삭제')
    expect(normalizeDeleteGuideTypedConfirmInput(' [탈퇴] ')).toBe('탈퇴')
  })

  it('does not strip partial brackets', () => {
    expect(normalizeDeleteGuideTypedConfirmInput('[삭제')).toBe('[삭제')
    expect(normalizeDeleteGuideTypedConfirmInput('삭제]')).toBe('삭제]')
  })
})

describe('matchesDeleteGuideTypedConfirm', () => {
  it('matches exact required value', () => {
    expect(matchesDeleteGuideTypedConfirm('삭제', DELETE_GUIDE_TYPED_CONFIRM_VALUE)).toBe(true)
    expect(matchesDeleteGuideTypedConfirm('탈퇴', WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE)).toBe(true)
  })

  it('matches placeholder-style bracketed input', () => {
    expect(matchesDeleteGuideTypedConfirm('[삭제]', DELETE_GUIDE_TYPED_CONFIRM_VALUE)).toBe(true)
    expect(matchesDeleteGuideTypedConfirm('[탈퇴]', WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE)).toBe(true)
  })

  it('rejects unrelated input', () => {
    expect(matchesDeleteGuideTypedConfirm('delete', DELETE_GUIDE_TYPED_CONFIRM_VALUE)).toBe(false)
    expect(matchesDeleteGuideTypedConfirm('[삭 제]', DELETE_GUIDE_TYPED_CONFIRM_VALUE)).toBe(false)
  })
})
