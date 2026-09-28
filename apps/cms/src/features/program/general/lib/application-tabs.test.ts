import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resolveGeneralApplicationEditorVariant } from './application-tabs'

function program(partial: Partial<Program> & Pick<Program, 'id'>): Program {
  return {
    title: '',
    mainTitle: '',
    generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    ...partial,
  } as Program
}

describe('resolveGeneralApplicationEditorVariant', () => {
  it('maps 1사1교 institution tab to economy application variant', () => {
    const economyProgram = program({ id: 'economy-prog-1' })
    expect(resolveGeneralApplicationEditorVariant(economyProgram, 'institutions')).toBe(
      'economy-application-institution'
    )
    expect(resolveGeneralApplicationEditorVariant(economyProgram, 'instructors')).toBe('instructor')
  })

  it('keeps general institution tab on standard institution variant', () => {
    const generalProgram = program({ id: 'general-prog-1' })
    expect(resolveGeneralApplicationEditorVariant(generalProgram, 'institutions')).toBe(
      'institution'
    )
  })
})
