import { afterEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getOperationalFormSpec,
  isRegistrationCatalogTemplateId,
  isSystemCatalogOnlyFormType,
  isSystemCatalogOnlyTemplateCode,
  latestProgramFormBindingsBySlot,
  listAllRegistrationCreateFormSpecs,
  listRecruitmentRowApplicationBindings,
  listVisibleOperationalFormSpecs,
  pickOperationalFormBinding,
  resolveRowApplicationBinding,
} from './operational-form-bindings'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import {
  clearRegistrationStepTemplateSelections,
  setRegistrationStepTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'

describe('isSystemCatalogOnlyFormType', () => {
  it('treats registration, issuance, and certificate forms as catalog-only', () => {
    expect(isSystemCatalogOnlyFormType('REGISTRATION')).toBe(true)
    expect(isSystemCatalogOnlyFormType('ISSUANCE')).toBe(true)
    expect(isSystemCatalogOnlyFormType('CERTIFICATE')).toBe(true)
    expect(isSystemCatalogOnlyFormType('APPLICATION')).toBe(false)
    expect(isSystemCatalogOnlyFormType('RECRUITMENT')).toBe(false)
    expect(isSystemCatalogOnlyTemplateCode('registration-general')).toBe(true)
    expect(isSystemCatalogOnlyTemplateCode('registration-trained-teachers')).toBe(true)
    expect(isSystemCatalogOnlyTemplateCode('application-participant-school')).toBe(false)
    expect(isSystemCatalogOnlyTemplateCode('registration-ujat')).toBe(true)
    expect(isRegistrationCatalogTemplateId(1)).toBe(true)
    expect(isRegistrationCatalogTemplateId(3)).toBe(true)
    expect(isRegistrationCatalogTemplateId(41)).toBe(true)
    expect(isRegistrationCatalogTemplateId(2)).toBe(false)
    expect(isRegistrationCatalogTemplateId(19)).toBe(false)
  })
})

describe('latestProgramFormBindingsBySlot', () => {
  it('같은 슬롯은 최신 1건만 남기고 SURVEY+SCHEDULE은 여러 건을 유지한다', () => {
    const bindings = [
      {
        bindingId: 1,
        formType: 'APPLICATION',
        targetType: 'VOLUNTEER',
        targetScope: 'PROGRAM',
        updatedAt: '2026-11-01T00:00:00+09:00',
        active: true,
      },
      {
        bindingId: 2,
        formType: 'APPLICATION',
        targetType: 'VOLUNTEER',
        targetScope: 'PROGRAM',
        updatedAt: '2026-11-07T00:00:00+09:00',
        active: true,
      },
      {
        bindingId: 3,
        formType: 'RECRUITMENT',
        targetType: 'VOLUNTEER',
        targetScope: 'TERM',
        targetScopeId: 1,
        active: true,
      },
      {
        bindingId: 4,
        formType: 'SURVEY',
        targetScope: 'SCHEDULE',
        targetScopeId: 101,
        active: true,
      },
      {
        bindingId: 5,
        formType: 'SURVEY',
        targetScope: 'SCHEDULE',
        targetScopeId: 102,
        active: true,
      },
    ] as ProgramFormBindingResponse[]
    const latest = latestProgramFormBindingsBySlot(bindings)
    expect(latest.filter(item => item.formType === 'APPLICATION').map(item => item.bindingId)).toEqual([2])
    expect(
      latest
        .filter(item => item.formType === 'RECRUITMENT')
        .map(item => item.bindingId)
    ).toEqual([3])
    expect(latest.filter(item => item.formType === 'SURVEY').map(item => item.bindingId)).toEqual([4, 5])
  })
})

describe('listAllRegistrationCreateFormSpecs', () => {
  afterEach(() => {
    clearRegistrationStepTemplateSelections()
  })
  it('includes REGISTRATION + operational specs for GENERAL', () => {
    const program = { id: '100001' } as Program
    const specs = listAllRegistrationCreateFormSpecs(program)
    expect(specs[0]?.formType).toBe('REGISTRATION')
    expect(specs[0]?.templateCode).toBe('registration-general')
    expect(
      specs.every(
        s =>
          s.formType === 'REGISTRATION' ||
          s.formType === 'RECRUITMENT' ||
          s.formType === 'APPLICATION'
      )
    ).toBe(true)
  })

  it('uses registration-economy for COMPANY_SCHOOL', () => {
    const program = { id: '170001' } as Program
    const specs = listAllRegistrationCreateFormSpecs(program)
    expect(specs[0]?.templateCode).toBe('registration-economy')
  })

  it('uses registration-trained-teachers for TRAINED_TEACHER', () => {
    const program = { id: '186001' } as Program
    const specs = listAllRegistrationCreateFormSpecs(program)
    expect(specs[0]?.templateCode).toBe('registration-trained-teachers')
  })

  it('uses trained-teachers copy codes for wizard pending id (not registration-general)', () => {
    const program = {
      id: 'trained-teachers-local-pending-registration',
      generalParticipantTypes: ['school_institution'],
    } as Program
    const specs = listAllRegistrationCreateFormSpecs(program)
    expect(specs.map(spec => spec.templateCode)).toEqual(
      expect.arrayContaining([
        'registration-trained-teachers',
        'recruitment-trained-teachers',
        'application-trained-teachers',
      ])
    )
    expect(specs.some(spec => spec.templateCode.includes('-general'))).toBe(false)
  })

  it('uses registration-ujat for UJAT and still binds fixed application templates', () => {
    const program = { id: '182101' } as Program
    const specs = listAllRegistrationCreateFormSpecs(program)
    expect(specs[0]?.templateCode).toBe('registration-ujat')
    expect(specs.map(spec => spec.templateCode)).toEqual(
      expect.arrayContaining([
        'registration-ujat',
        'recruitment-ujat-school',
        'recruitment-ujat-volunteer',
        'application-ujat-school',
        'application-ujat-volunteer',
      ])
    )
  })

  it('keeps step targetRole when a different 모집 양식을 선택한다', () => {
    setRegistrationStepTemplateSelection(
      'GENERAL',
      'recruit-participant-school',
      'recruitment-instructor'
    )
    const program = {
      id: '100001',
      generalParticipantTypes: ['school_institution'],
    } as Program
    const specs = listVisibleOperationalFormSpecs(program)
    const schoolRecruit = specs.find(
      spec => spec.targetRole === 'ORGANIZATION' && spec.formType === 'RECRUITMENT'
    )
    expect(schoolRecruit?.templateCode).toBe('recruitment-instructor')
  })

  it('resolves copy suffix specs without changing formType', () => {
    const spec = getOperationalFormSpec('recruitment-participant-school-copy-12')
    expect(spec?.formType).toBe('RECRUITMENT')
    expect(spec?.targetRole).toBe('ORGANIZATION')
    expect(spec?.templateCode).toBe('recruitment-participant-school-copy-12')
  })

  it('resolves custom suffix specs without changing formType', () => {
    const spec = getOperationalFormSpec('recruitment-participant-school-custom-01')
    expect(spec?.formType).toBe('RECRUITMENT')
    expect(spec?.templateCode).toBe('recruitment-participant-school-custom-01')
  })

  it('targetType가 ORGANIZATION인 TEACHER role 바인딩을 강사 바인딩으로 오인하지 않는다', () => {
    const bindings: ProgramFormBindingResponse[] = [
      {
        bindingId: 189454,
        formType: 'APPLICATION',
        targetType: 'ORGANIZATION',
        targetRole: 'TEACHER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 101,
        templateVersionId: 1,
      },
      {
        bindingId: 189455,
        formType: 'APPLICATION',
        targetType: 'TEACHER',
        targetRole: 'TEACHER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 102,
        templateVersionId: 2,
      },
      {
        bindingId: 189456,
        formType: 'APPLICATION',
        targetType: 'VOLUNTEER',
        targetRole: 'VOLUNTEER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 103,
        templateVersionId: 3,
      },
    ]
    const program = { backendProgramType: 'GENERAL' } as Program

    expect(
      listRecruitmentRowApplicationBindings(program, bindings, {
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
      }).map(binding => binding.bindingId)
    ).toEqual([189454])
    expect(
      listRecruitmentRowApplicationBindings(program, bindings, {
        formType: 'APPLICATION',
        targetRole: 'INSTRUCTOR',
      }).map(binding => binding.bindingId)
    ).toEqual([189455])
    expect(
      listRecruitmentRowApplicationBindings(program, bindings, {
        formType: 'APPLICATION',
        targetRole: 'VOLUNTEER',
      }).map(binding => binding.bindingId)
    ).toEqual([189456])
  })

  it('UJAT 봉사자 양식은 ORGANIZATION 바인딩을 고르지 않는다', () => {
    const orgBinding: ProgramFormBindingResponse = {
      bindingId: 11,
      formType: 'RECRUITMENT',
      targetType: 'ORGANIZATION',
      targetRole: 'ORGANIZATION',
      templateName: '참여 기관 모집',
      templateVersionId: 301,
    }
    expect(
      pickOperationalFormBinding([orgBinding], {
        formType: 'RECRUITMENT',
        targetRole: 'VOLUNTEER',
        nameHints: ['봉사자 모집', 'UJAT 봉사자 모집'],
      })
    ).toBeUndefined()
    expect(
      pickOperationalFormBinding([orgBinding], {
        formType: 'RECRUITMENT',
        targetRole: 'ORGANIZATION',
        nameHints: ['참여 기관 모집', 'UJAT 기관 모집'],
      })?.bindingId
    ).toBe(11)
  })

  it('서로 다른 스펙에 이미 선택된 bindingId는 고르지 않는다', () => {
    const binding: ProgramFormBindingResponse = {
      bindingId: 189454,
      formType: 'APPLICATION',
      targetType: 'ORGANIZATION',
      targetRole: 'ORGANIZATION',
      templateName: '기관 신청',
    }
    expect(
      pickOperationalFormBinding(
        [binding],
        { formType: 'APPLICATION', targetRole: 'ORGANIZATION', nameHints: ['기관 신청'] },
        { claimedBindingIds: new Set([189454]) }
      )
    ).toBeUndefined()
  })

  it('역할이 있는 스펙은 APPLICATION이 하나여도 역할이 다르면 고르지 않는다', () => {
    const instructorOnly: ProgramFormBindingResponse = {
      bindingId: 189778,
      formType: 'APPLICATION',
      targetType: 'INSTRUCTOR',
      targetRole: 'INSTRUCTOR',
      targetScope: 'RECRUITMENT',
      targetScopeId: 501,
      templateVersionId: 68,
      active: true,
    }
    expect(
      pickOperationalFormBinding([instructorOnly], {
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        nameHints: ['기관 신청', '1사1교 신청'],
      })
    ).toBeUndefined()
    expect(
      pickOperationalFormBinding([instructorOnly], {
        formType: 'APPLICATION',
        targetRole: 'INSTRUCTOR',
        nameHints: ['강사 신청'],
      })?.bindingId
    ).toBe(189778)
  })

  it('기존 활성 binding의 고정 templateVersionId를 최신 버전으로 치환하지 않는다', () => {
    const pinnedBinding: ProgramFormBindingResponse = {
      bindingId: 189289,
      formType: 'APPLICATION',
      targetType: 'ORGANIZATION',
      targetRole: 'ORGANIZATION',
      targetScope: 'RECRUITMENT',
      targetScopeId: 186363,
      templateId: 10,
      templateVersionId: 70,
      templateName: '기관 신청',
      active: true,
    }

    const selected = pickOperationalFormBinding([pinnedBinding], {
      formType: 'APPLICATION',
      targetRole: 'ORGANIZATION',
      nameHints: ['기관 신청'],
      catalogTemplateId: 10,
    })

    expect(selected?.bindingId).toBe(189289)
    expect(selected?.templateVersionId).toBe(70)
  })
})

describe('강사 모집 행 fan-out 바인딩(targetType INSTRUCTOR + targetRole MEMBER)', () => {
  const instructorRow = {
    bindingId: 189485,
    formType: 'APPLICATION',
    targetType: 'INSTRUCTOR',
    targetRole: 'MEMBER',
    targetScope: 'RECRUITMENT',
    targetScopeId: 186839,
    templateId: 12,
    templateVersionId: 1,
    active: true,
  } as ProgramFormBindingResponse
  const orgRow = {
    bindingId: 189484,
    formType: 'APPLICATION',
    targetType: 'ORGANIZATION',
    targetRole: 'TEACHER',
    targetScope: 'RECRUITMENT',
    targetScopeId: 186838,
    active: true,
  } as ProgramFormBindingResponse
  const program = {
    id: '186394',
    backendProgramType: 'GENERAL',
    activeRecruitmentId: 186839,
    programRecruitments: [{ id: 186839, recruitmentType: 'INSTRUCTOR' }],
  } as unknown as Program
  const spec = { formType: 'APPLICATION', targetRole: 'INSTRUCTOR' } as const

  it('모집 행 강사 바인딩을 강사 신청으로 인식해 그 행을 갱신 대상으로 고른다', () => {
    const resolved = resolveRowApplicationBinding(program, [orgRow, instructorRow], spec)
    expect(resolved).toEqual({ kind: 'binding', binding: instructorRow })
    expect(
      listRecruitmentRowApplicationBindings(program, [orgRow, instructorRow], spec).map(
        item => item.bindingId
      )
    ).toEqual([189485])
  })

  it('ORGANIZATION + TEACHER 기관 바인딩은 여전히 강사로 보지 않는다', () => {
    expect(listRecruitmentRowApplicationBindings(program, [orgRow], spec)).toEqual([])
  })
})

describe('신청 바인딩 대상 별칭 — BE canonicalTarget와 같은 규칙', () => {
  const program = {
    id: '1',
    backendProgramType: 'GENERAL',
    activeRecruitmentId: 20,
    programRecruitments: [{ id: 20 }],
  } as unknown as Program
  const row = (bindingId: number, targetType: string, targetRole?: string) =>
    ({
      bindingId,
      formType: 'APPLICATION',
      targetType,
      targetRole,
      targetScope: 'RECRUITMENT',
      targetScopeId: 20,
      active: true,
    }) as ProgramFormBindingResponse
  const ids = (role: string, bindings: ProgramFormBindingResponse[]) =>
    listRecruitmentRowApplicationBindings(program, bindings, {
      formType: 'APPLICATION',
      targetRole: role,
    }).map(item => item.bindingId)

  it('봉사자는 COLLEGE_STUDENT·VOLUNTEER 모두 인식한다', () => {
    expect(
      ids('VOLUNTEER', [row(1, 'COLLEGE_STUDENT', 'VOLUNTEER'), row(2, 'VOLUNTEER', 'MEMBER')])
    ).toEqual([1, 2])
  })
  it('targetType이 비고 targetRole만 MEMBER인 봉사자 행도 인식한다', () => {
    expect(ids('VOLUNTEER', [row(9, '', 'MEMBER')])).toEqual([9])
  })
  it('UJAT 봉사자 모집 TERM 2행도 RECRUITMENT scope로 모은다', () => {
    const recruit = (bindingId: number, scopeId: number) =>
      ({
        bindingId,
        formType: 'RECRUITMENT',
        targetType: 'VOLUNTEER',
        targetScope: 'RECRUITMENT',
        targetScopeId: scopeId,
        active: true,
      }) as ProgramFormBindingResponse
    expect(
      listRecruitmentRowApplicationBindings(program, [recruit(1, 801), recruit(2, 802)], {
        formType: 'RECRUITMENT',
        targetRole: 'VOLUNTEER',
      }).map(item => item.bindingId)
    ).toEqual([1, 2])
  })
  it('기관은 ORGANIZATION·SCHOOL·INSTITUTION, 개인은 INDIVIDUAL·PERSONAL을 인식한다', () => {
    const all = [
      row(1, 'SCHOOL'),
      row(2, 'INSTITUTION'),
      row(3, 'ORGANIZATION', 'TEACHER'),
      row(4, 'PERSONAL'),
      row(5, 'INDIVIDUAL'),
    ]
    expect(ids('ORGANIZATION', all)).toEqual([1, 2, 3])
    expect(ids('INDIVIDUAL', all)).toEqual([4, 5])
    expect(ids('INSTRUCTOR', all)).toEqual([])
  })
  it('대상 유형이 다른 바인딩은 targetRole이 같아도 고르지 않는다', () => {
    expect(ids('VOLUNTEER', [row(1, 'INSTRUCTOR', 'VOLUNTEER')])).toEqual([])
  })
  it('targetType이 빈 레거시 행은 targetRole로 판단한다', () => {
    expect(ids('INSTRUCTOR', [row(1, '', 'INSTRUCTOR')])).toEqual([1])
    expect(ids('INDIVIDUAL', [row(2, '', 'MEMBER')])).toEqual([2])
  })
})
