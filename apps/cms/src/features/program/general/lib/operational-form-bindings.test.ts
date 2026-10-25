import { afterEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getOperationalFormSpec,
  listAllRegistrationCreateFormSpecs,
  listRecruitmentRowApplicationBindings,
  listVisibleOperationalFormSpecs,
  pickOperationalFormBinding,
} from './operational-form-bindings'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import {
  clearRegistrationStepTemplateSelections,
  setRegistrationStepTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'

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

  it('서로 다른 스펙에 이미 선택된 bindingId를 다시 선택하면 실패한다', () => {
    const binding: ProgramFormBindingResponse = {
      bindingId: 189454,
      formType: 'APPLICATION',
      targetType: 'ORGANIZATION',
      targetRole: 'ORGANIZATION',
      templateName: '기관 신청',
    }
    expect(() =>
      pickOperationalFormBinding(
        [binding],
        { formType: 'APPLICATION', targetRole: 'ORGANIZATION', nameHints: ['기관 신청'] },
        { claimedBindingIds: new Set([189454]) }
      )
    ).toThrow('같은 운영 바인딩')
  })
})
