import { describe, expect, it } from 'vitest'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import {
  getOperationalFormSpec,
  isProgramScopedOperationalBinding,
  pickOperationalFormBinding,
} from './operational-form-bindings'

function binding(partial: ProgramFormBindingResponse): ProgramFormBindingResponse {
  return { active: true, ...partial }
}

describe('pickOperationalFormBinding', () => {
  it('prefers catalog templateId match for APPLICATION', () => {
    const picked = pickOperationalFormBinding(
      [
        binding({
          formType: 'APPLICATION',
          templateId: 11,
          templateVersionId: 101,
          targetRole: 'INSTRUCTOR',
          templateName: '강사 신청',
        }),
        binding({
          formType: 'APPLICATION',
          templateId: 22,
          templateVersionId: 202,
          targetRole: 'INDIVIDUAL',
          templateName: '참여자 신청',
        }),
      ],
      {
        formType: 'APPLICATION',
        targetRole: 'INDIVIDUAL',
        nameHints: ['참여자 신청'],
        catalogTemplateId: 22,
      }
    )
    expect(picked?.templateVersionId).toBe(202)
  })

  it('matches instructor by role when catalog id is missing', () => {
    const spec = getOperationalFormSpec('application-instructor')
    expect(spec).toBeDefined()
    const picked = pickOperationalFormBinding(
      [
        binding({
          formType: 'APPLICATION',
          templateId: 1,
          targetRole: 'INDIVIDUAL',
          templateName: '참여자 신청',
        }),
        binding({
          formType: 'APPLICATION',
          templateId: 2,
          targetRole: 'TEACHER',
          templateName: '강사 신청 양식',
        }),
      ],
      spec!
    )
    expect(picked?.templateId).toBe(2)
  })

  it('prefers a program-scoped copy over the catalog templateId', () => {
    const picked = pickOperationalFormBinding(
      [
        binding({
          formType: 'APPLICATION',
          templateId: 22,
          templateVersionId: 202,
          targetRole: 'INDIVIDUAL',
          templateName: '참여자 신청',
        }),
        binding({
          formType: 'APPLICATION',
          templateId: 88,
          templateVersionId: 808,
          targetRole: 'INDIVIDUAL',
          versionLabel: 'program-9',
          templateName: '참여자 신청',
        }),
      ],
      {
        formType: 'APPLICATION',
        targetRole: 'INDIVIDUAL',
        nameHints: ['참여자 신청'],
        catalogTemplateId: 22,
      }
    )
    expect(picked?.templateVersionId).toBe(808)
  })

  it('does not pick a recruitment binding for application lookup', () => {
    const spec = getOperationalFormSpec('application-participant-individual')
    const picked = pickOperationalFormBinding(
      [
        binding({
          formType: 'RECRUITMENT',
          templateId: 9,
          targetRole: 'INDIVIDUAL',
          templateName: '참여자 모집',
        }),
      ],
      spec!
    )
    expect(picked).toBeUndefined()
  })
})

describe('isProgramScopedOperationalBinding', () => {
  it('treats a different templateId from catalog as program-scoped', () => {
    expect(
      isProgramScopedOperationalBinding(
        binding({ templateId: 99, versionLabel: 'v2' }),
        10
      )
    ).toBe(true)
  })

  it('treats catalog templateId as shared', () => {
    expect(
      isProgramScopedOperationalBinding(binding({ templateId: 10, versionLabel: 'v1' }), 10)
    ).toBe(false)
  })
})
