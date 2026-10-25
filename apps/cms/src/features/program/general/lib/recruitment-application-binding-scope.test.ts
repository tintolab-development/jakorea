import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import {
  programForApplicationFormEditor,
  programWithApplicationFormRecruitmentScope,
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
    ).toEqual({
      targetScope: 'RECRUITMENT',
      targetScopeId: 168241,
    })
    expect(
      recruitmentApplicationBindingScope(
        program({ backendProgramType: 'TRAINED_TEACHER' }),
        'APPLICATION'
      )
    ).toEqual({
      targetScope: 'RECRUITMENT',
      targetScopeId: 168241,
    })
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

  it('activeRecruitmentId 없으면 모집 scope로 묶지 않는다', () => {
    expect(
      recruitmentApplicationBindingScope(
        program({ activeRecruitmentId: undefined }),
        'APPLICATION'
      )
    ).toBeUndefined()
  })

  it('applicationFormBindingId가 없어도 같은 모집 RECRUITMENT 바인딩을 고른다', () => {
    const row = resolveRowApplicationBinding(
      program({
        activeRecruitmentId: 168241,
        programRecruitments: [{ id: 168241, applicationFormBindingId: null }],
      }),
      bindings,
      { formType: 'APPLICATION', targetRole: 'ORGANIZATION' }
    )
    expect(row).toEqual({ kind: 'binding', binding: bindings[1] })
  })

  it('강사 탭은 INSTRUCTOR 모집 행 id를 activeRecruitmentId로 둔다', () => {
    const scoped = programWithApplicationFormRecruitmentScope(
      program({
        activeRecruitmentId: undefined,
        programRecruitments: [
          { id: 168241, recruitmentType: 'PARTICIPANT', applicationFormBindingId: 1682410 },
          { id: 186080, recruitmentType: 'INSTRUCTOR', applicationFormBindingId: 1860800 },
        ],
      }),
      'instructor'
    )
    expect(scoped.activeRecruitmentId).toBe(186080)
    expect(recruitmentApplicationBindingScope(scoped, 'APPLICATION')).toEqual({
      targetScope: 'RECRUITMENT',
      targetScopeId: 186080,
    })
  })

  it('1사1교 역할 탭은 기관·강사 모집 행을 각각 지정한다', () => {
    const unscoped = program({
      backendProgramType: 'COMPANY_SCHOOL',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      activeRecruitmentId: undefined,
      programRecruitments: [
        {
          id: 41,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          applicationFormBindingId: 410,
        },
        { id: 42, recruitmentType: 'INSTRUCTOR', applicationFormBindingId: 420 },
      ],
    })
    expect(
      programForApplicationFormEditor(unscoped, 'economy-application-institution')
        .activeRecruitmentId
    ).toBe(41)
    expect(programForApplicationFormEditor(unscoped, 'instructor').activeRecruitmentId).toBe(42)
  })

  it('편집 variant로 모집 행 범위를 맞춘다', () => {
    const unscoped = program({
      activeRecruitmentId: undefined,
      generalParticipantTypes: ['school_institution'],
      programRecruitments: [
        { id: 168241, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
        { id: 186080, recruitmentType: 'INSTRUCTOR' },
      ],
    })
    expect(recruitmentApplicationBindingScope(unscoped, 'APPLICATION')).toBeUndefined()
    expect(programForApplicationFormEditor(unscoped, 'institution').activeRecruitmentId).toBe(
      168241
    )
    expect(programForApplicationFormEditor(unscoped, 'instructor').activeRecruitmentId).toBe(
      186080
    )
  })
})
