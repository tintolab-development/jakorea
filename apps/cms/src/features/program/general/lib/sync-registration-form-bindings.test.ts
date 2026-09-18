import { describe, expect, it } from 'vitest'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import { resolveApplicationFormLoadSource } from './sync-registration-form-bindings'

function binding(partial: ProgramFormBindingResponse): ProgramFormBindingResponse {
  return { active: true, ...partial }
}

describe('resolveApplicationFormLoadSource', () => {
  it('prefers local draft while catalog APPLICATION binding is still shared', () => {
    const source = resolveApplicationFormLoadSource({
      programId: 'p1',
      templateCode: 'application-participant-individual',
      catalogTemplateId: 22,
      bindings: [
        binding({
          formType: 'APPLICATION',
          templateId: 22,
          templateVersionId: 202,
          targetRole: 'INDIVIDUAL',
          templateName: '참여자 신청',
        }),
      ],
    })
    expect(source).toEqual({ preferLocalDraft: true })
  })

  it('loads program-scoped binding version when templateId diverged from catalog', () => {
    const source = resolveApplicationFormLoadSource({
      programId: 'p1',
      templateCode: 'application-participant-individual',
      catalogTemplateId: 22,
      bindings: [
        binding({
          formType: 'APPLICATION',
          templateId: 99,
          templateVersionId: 501,
          targetRole: 'INDIVIDUAL',
          templateName: '참여자 신청',
        }),
      ],
    })
    expect(source).toEqual({ templateVersionId: 501, preferLocalDraft: false })
  })
})
