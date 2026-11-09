import { describe, expect, it } from 'vitest'
import { toSurveyTemplateVersionId } from './survey-template-version-id'

describe('toSurveyTemplateVersionId', () => {
  it('원격 등록 설문 id를 version id로 돌려준다', () => {
    expect(toSurveyTemplateVersionId({ id: '2698' }, true)).toBe(2698)
  })

  it('원격이 아니거나 숫자 id가 아니면 undefined', () => {
    expect(toSurveyTemplateVersionId({ id: '2698' }, false)).toBeUndefined()
    expect(toSurveyTemplateVersionId({ id: 'satisfaction-mock-1' }, true)).toBeUndefined()
    expect(toSurveyTemplateVersionId({ id: '0' }, true)).toBeUndefined()
    expect(toSurveyTemplateVersionId(null, true)).toBeUndefined()
  })
})
