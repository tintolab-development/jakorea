/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import {
  shouldRequireRemoteApplicationDraft,
  shouldShowApplicationFormPreviewLoading,
} from './application-form-preview-loading'

describe('application form preview loading', () => {
  it('버전 id가 있으면 원격 draft를 기다린다', () => {
    expect(shouldRequireRemoteApplicationDraft(2590)).toBe(true)
    expect(shouldRequireRemoteApplicationDraft(undefined)).toBe(false)
  })

  it('바인딩 로딩 또는 draft 로딩이면 FormDraftLoading 조건이다', () => {
    expect(
      shouldShowApplicationFormPreviewLoading({ bindingsLoading: true, isDraftLoading: false })
    ).toBe(true)
    expect(
      shouldShowApplicationFormPreviewLoading({ bindingsLoading: false, isDraftLoading: true })
    ).toBe(true)
    expect(
      shouldShowApplicationFormPreviewLoading({ bindingsLoading: false, isDraftLoading: false })
    ).toBe(false)
  })
})
