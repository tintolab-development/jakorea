import { afterEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { getOperationalFormSpec, listAllRegistrationCreateFormSpecs, listVisibleOperationalFormSpecs } from './operational-form-bindings'
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
    expect(specs.every(s => s.formType === 'REGISTRATION' || s.formType === 'RECRUITMENT' || s.formType === 'APPLICATION')).toBe(true)
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
    const schoolRecruit = specs.find(spec => spec.targetRole === 'ORGANIZATION' && spec.formType === 'RECRUITMENT')
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
})
