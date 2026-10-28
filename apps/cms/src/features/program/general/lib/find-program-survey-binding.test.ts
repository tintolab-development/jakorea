import { describe, expect, it } from 'vitest'
import { mapProgramSurveyToRegisteredSurvey } from '@/features/program/general/api/adapters/program-survey-adapters'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { ProgramSurveyResponse } from '@/shared/api/generated/forms-surveys/schemas/programSurveyResponse'
import { findProgramSurveyBinding } from './find-program-survey-binding'

const DAY = 24 * 60 * 60 * 1000
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString()

function binding(overrides: Partial<ProgramFormBindingResponse>): ProgramFormBindingResponse {
  return {
    bindingId: 1,
    formType: 'SURVEY',
    templateId: 10,
    templateVersionId: 100,
    active: true,
    ...overrides,
  } as ProgramFormBindingResponse
}

function listStatus(dto: ProgramSurveyResponse, bindings: ProgramFormBindingResponse[]) {
  return mapProgramSurveyToRegisteredSurvey(dto, 0, findProgramSurveyBinding(dto, bindings)).status
}

describe('findProgramSurveyBinding — 설문 목록 상태 회귀 (bb6f8755f)', () => {
  const dto: ProgramSurveyResponse = { bindingId: 1, templateId: 10, templateVersionId: 100 }

  it('진행 전 바인딩이면 before_start', () => {
    const b = binding({ submissionStartAt: iso(DAY), submissionEndAt: '2099-12-31T14:59:59.999Z' })
    expect(listStatus(dto, [b])).toBe('before_start')
  })

  it('진행 중 바인딩이면 in_progress', () => {
    const b = binding({ submissionStartAt: iso(-DAY), submissionEndAt: '2099-12-31T14:59:59.999Z' })
    expect(listStatus(dto, [b])).toBe('in_progress')
  })

  it('종료 바인딩이면 finished', () => {
    const b = binding({ submissionStartAt: iso(-2 * DAY), submissionEndAt: iso(-DAY) })
    expect(listStatus(dto, [b])).toBe('finished')
  })

  it('같은 템플릿 바인딩이 여러 개면 bindingId로 고른다', () => {
    const other = binding({ bindingId: 2, submissionStartAt: iso(-DAY), submissionEndAt: iso(DAY) })
    const mine = binding({ bindingId: 3, submissionStartAt: iso(DAY), submissionEndAt: iso(2 * DAY) })
    expect(listStatus({ bindingId: 3, templateId: 10, templateVersionId: 100 }, [other, mine])).toBe(
      'before_start'
    )
  })

  it('bindingId가 없으면 templateVersionId → templateId 순으로 찾는다', () => {
    const byVersion = binding({ bindingId: 5, templateVersionId: 200 })
    const byTemplate = binding({ bindingId: 6, templateId: 20, templateVersionId: 300 })
    expect(findProgramSurveyBinding({ templateVersionId: 200 }, [byTemplate, byVersion])).toBe(byVersion)
    expect(findProgramSurveyBinding({ templateId: 20 }, [byVersion, byTemplate])).toBe(byTemplate)
  })

  it('비활성·운영(APPLICATION) 바인딩은 매칭하지 않고 기존처럼 in_progress', () => {
    const inactive = binding({ active: false, submissionStartAt: iso(DAY), submissionEndAt: iso(2 * DAY) })
    const operational = binding({ formType: 'APPLICATION', submissionStartAt: iso(DAY) })
    expect(findProgramSurveyBinding(dto, [inactive, operational])).toBeUndefined()
    expect(listStatus(dto, [inactive, operational])).toBe('in_progress')
  })
})
