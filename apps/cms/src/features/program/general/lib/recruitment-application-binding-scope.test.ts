import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import {
  recruitmentApplicationBindingScope,
  resolveRowApplicationBinding,
} from './operational-form-bindings'
import { resolveApplicationFormLoadSource } from './sync-registration-form-bindings'

const bindings: ProgramFormBindingResponse[] = [
  {
    bindingId: 9001,
    active: true,
    formType: 'APPLICATION',
    targetRole: 'ORGANIZATION',
    targetScope: 'PROGRAM',
    templateId: 55,
    templateVersionId: 501,
    templateName: '기관 신청',
  },
  {
    bindingId: 1682410,
    active: true,
    formType: 'APPLICATION',
    targetRole: 'ORGANIZATION',
    targetScope: 'RECRUITMENT',
    targetScopeId: 168241,
    templateId: 88,
    templateVersionId: 880,
    templateName: '기관 신청',
  },
]

function program(overrides: Partial<Program> = {}): Program {
  return {
    id: '168004',
    backendProgramType: 'GENERAL_ORGANIZATION',
    activeRecruitmentId: 168241,
    programRecruitments: [
      { id: 168241, applicationFormBindingId: 1682410 },
      { id: 168242, applicationFormBindingId: null },
    ],
    ...overrides,
  } as Program
}

describe('recruitment application binding scope', () => {
  it('APPLICATION만 모집 행 id를 targetScopeId로 둔다', () => {
    expect(recruitmentApplicationBindingScope(program(), 'APPLICATION')).toEqual({
      targetScope: 'RECRUITMENT',
      targetScopeId: 168241,
    })
    expect(recruitmentApplicationBindingScope(program(), 'RECRUITMENT')).toBeUndefined()
    expect(
      recruitmentApplicationBindingScope(
        program({ backendProgramType: 'COMPANY_SCHOOL' }),
        'APPLICATION'
      )
    ).toBeUndefined()
  })

  it('applicationFormBindingId가 null이면 프로그램 바인딩을 고르지 않는다', () => {
    const row = resolveRowApplicationBinding(
      program({ activeRecruitmentId: 168242 }),
      bindings,
      { formType: 'APPLICATION' }
    )
    expect(row).toEqual({ kind: 'missing' })
    const source = resolveApplicationFormLoadSource({
      programId: '168004',
      program: program({ activeRecruitmentId: 168242 }),
      templateCode: 'application-participant-school',
      bindings,
      catalogTemplateId: 10,
    })
    expect(source).toEqual({ preferLocalDraft: true })
  })

  it('그 행의 applicationFormBindingId만 로드한다', () => {
    const source = resolveApplicationFormLoadSource({
      programId: '168004',
      program: program(),
      templateCode: 'application-participant-school',
      bindings,
      catalogTemplateId: 10,
    })
    expect(source).toEqual({ templateVersionId: 880, preferLocalDraft: false })
  })
})
