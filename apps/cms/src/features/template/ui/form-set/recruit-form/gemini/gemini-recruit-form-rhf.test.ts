// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  GEMINI_RECRUIT_FIELD_KEYS,
  getActiveGeminiRecruitForm,
  getGeminiRecruitFormRecord,
  peekGeminiRecruitFormRecord,
  replaceGeminiRecruitFormExact,
  replaceGeminiRecruitFormForScope,
  resetAllGeminiRecruitForms,
  setGeminiRecruitFormScope,
  useGeminiRecruitField,
} from './gemini-recruit-form-rhf'

describe('gemini recruit form (RHF)', () => {
  beforeEach(() => {
    resetAllGeminiRecruitForms()
  })

  it('단락 입력은 활성 양식 RHF 값에 들어가고 dirty 가 된다', () => {
    setGeminiRecruitFormScope('tpl-a')
    const { result } = renderHook(() => useGeminiRecruitField(GEMINI_RECRUIT_FIELD_KEYS.title, ''))
    expect(result.current[0]).toBe('')
    act(() => result.current[1]('공고'))
    expect(result.current[0]).toBe('공고')
    const form = getActiveGeminiRecruitForm()
    expect(form.getValues('geminiRecruit.title')).toBe('공고')
    expect(form.getFieldState('geminiRecruit.title').isDirty).toBe(true)
    expect(getGeminiRecruitFormRecord()).toEqual({ [GEMINI_RECRUIT_FIELD_KEYS.title]: '공고' })
  })

  it('양식(templateCode)별로 값이 분리된다', () => {
    replaceGeminiRecruitFormForScope('tpl-a', { [GEMINI_RECRUIT_FIELD_KEYS.title]: 'A' })
    replaceGeminiRecruitFormForScope('tpl-b', { [GEMINI_RECRUIT_FIELD_KEYS.title]: 'B' })
    expect(peekGeminiRecruitFormRecord('tpl-a')).toEqual({ [GEMINI_RECRUIT_FIELD_KEYS.title]: 'A' })
    expect(peekGeminiRecruitFormRecord('tpl-b')).toEqual({ [GEMINI_RECRUIT_FIELD_KEYS.title]: 'B' })
  })

  it('없는 키는 없는 채로, null 은 null 로, 폼 밖 키는 그대로 직렬화한다', () => {
    replaceGeminiRecruitFormExact({
      [GEMINI_RECRUIT_FIELD_KEYS.minStudentCount]: null,
      'custom.passthrough': 1,
    })
    expect(getGeminiRecruitFormRecord()).toEqual({
      [GEMINI_RECRUIT_FIELD_KEYS.minStudentCount]: null,
      'custom.passthrough': 1,
    })
  })

  it('외부 reset 후 훅이 새 값을 읽는다', () => {
    const { result } = renderHook(() =>
      useGeminiRecruitField<number | null>(GEMINI_RECRUIT_FIELD_KEYS.minStudentCount, 15)
    )
    act(() => replaceGeminiRecruitFormExact({ [GEMINI_RECRUIT_FIELD_KEYS.minStudentCount]: 30 }))
    expect(result.current[0]).toBe(30)
  })
})
