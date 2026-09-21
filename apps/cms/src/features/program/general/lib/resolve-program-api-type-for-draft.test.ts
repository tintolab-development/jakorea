import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  resolveProgramApiTypeForDraft,
  resolveRegistrationProgramDraftProgramType,
} from './resolve-program-api-type-for-draft'

describe('resolveProgramApiTypeForDraft', () => {
  it('returns TRAINED_TEACHER for trained teacher registration local id', () => {
    const program = { id: 'trained-teachers-local-abc' } as Program
    expect(resolveProgramApiTypeForDraft(program)).toBe('TRAINED_TEACHER')
  })

  it('returns UJAT for ujat pending id', () => {
    const program = { id: 'ujat-pending-abc' } as Program
    expect(resolveProgramApiTypeForDraft(program)).toBe('UJAT')
  })

  it('returns GENERAL_INDIVIDUAL for individual general create body', () => {
    const program = {
      id: 'pending-abc',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    } as Program
    expect(resolveProgramApiTypeForDraft(program)).toBe('GENERAL_INDIVIDUAL')
  })
})

describe('resolveRegistrationProgramDraftProgramType', () => {
  it('uses coarse GENERAL for individual general program-draft key', () => {
    const program = {
      id: 'pending-abc',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    } as Program
    expect(resolveRegistrationProgramDraftProgramType(program)).toBe('GENERAL')
  })
})
