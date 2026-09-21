import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { listAllRegistrationCreateFormSpecs } from './operational-form-bindings'

describe('listAllRegistrationCreateFormSpecs', () => {
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

  it('uses registration-ujat for UJAT', () => {
    const program = { id: '182101' } as Program
    const specs = listAllRegistrationCreateFormSpecs(program)
    expect(specs[0]?.templateCode).toBe('registration-ujat')
  })
})
