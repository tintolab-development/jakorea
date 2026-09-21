import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resolveProgramOperationalBindingKind } from './program-operational-binding-profile'

function program(partial: Partial<Program> & Pick<Program, 'id' | 'title'>): Program {
  const now = new Date().toISOString()
  return {
    sponsorId: 's1',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: now,
    endDate: now,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

describe('resolveProgramOperationalBindingKind', () => {
  it('detects UJAT by id prefix', () => {
    expect(resolveProgramOperationalBindingKind(program({ id: 'ujat-local-1', title: 't' }))).toBe(
      'UJAT'
    )
  })

  it('detects company school programs', () => {
    expect(
      resolveProgramOperationalBindingKind(
        program({ id: 'company-school-local-1', title: '1사1교 경제교육' })
      )
    ).toBe('COMPANY_SCHOOL')
  })

  it('detects trained teacher programs', () => {
    expect(
      resolveProgramOperationalBindingKind(
        program({ id: 'trained-teachers-local-1', title: '교육받은 교사' })
      )
    ).toBe('TRAINED_TEACHER')
  })

  it('defaults to GENERAL', () => {
    expect(resolveProgramOperationalBindingKind(program({ id: 'general-local-1', title: 'g' }))).toBe(
      'GENERAL'
    )
  })
})
