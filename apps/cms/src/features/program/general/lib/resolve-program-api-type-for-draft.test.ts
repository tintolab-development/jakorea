import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resolveProgramApiTypeForDraft } from './resolve-program-api-type-for-draft'

describe('resolveProgramApiTypeForDraft', () => {
  it('returns TRAINED_TEACHER for trained teacher registration local id', () => {
    const program = { id: 'trained-teachers-local-abc' } as Program
    expect(resolveProgramApiTypeForDraft(program)).toBe('TRAINED_TEACHER')
  })

  it('returns UJAT for ujat pending id', () => {
    const program = { id: 'ujat-pending-abc' } as Program
    expect(resolveProgramApiTypeForDraft(program)).toBe('UJAT')
  })
})
