import { describe, expect, it, vi, afterEach } from 'vitest'
import type { Program } from '@/types/domain'
import {
  isGeneralProgramFeSeedId,
  isGeneralProgramFeSeedsEnabled,
  mergeGeneralProgramFeSeedsIntoList,
  shouldUseGeneralProgramFeSeed,
} from '@/features/program/general/lib/general-program-fe-seed'

function stubProgram(id: string, title = id): Program {
  return { id, title } as Program
}

describe('isGeneralProgramFeSeedId', () => {
  it('matches general-prog- prefix', () => {
    expect(isGeneralProgramFeSeedId('general-prog-type-ind-curriculum-multi')).toBe(true)
    expect(isGeneralProgramFeSeedId('general-prog-scheduled-001')).toBe(true)
  })

  it('rejects API numeric / other ids', () => {
    expect(isGeneralProgramFeSeedId('123')).toBe(false)
    expect(isGeneralProgramFeSeedId('company-school-1')).toBe(false)
    expect(isGeneralProgramFeSeedId(undefined)).toBe(false)
    expect(isGeneralProgramFeSeedId(null)).toBe(false)
    expect(isGeneralProgramFeSeedId('')).toBe(false)
  })
})

describe('shouldUseGeneralProgramFeSeed', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('requires VITE_GENERAL_PROGRAM_FE_SEEDS_ENABLED=true', () => {
    vi.stubEnv('VITE_GENERAL_PROGRAM_FE_SEEDS_ENABLED', 'true')
    expect(isGeneralProgramFeSeedsEnabled()).toBe(true)
    expect(shouldUseGeneralProgramFeSeed('general-prog-a')).toBe(true)
    expect(shouldUseGeneralProgramFeSeed('99')).toBe(false)

    vi.stubEnv('VITE_GENERAL_PROGRAM_FE_SEEDS_ENABLED', '')
    expect(isGeneralProgramFeSeedsEnabled()).toBe(false)
    expect(shouldUseGeneralProgramFeSeed('general-prog-a')).toBe(false)
  })
})

describe('mergeGeneralProgramFeSeedsIntoList', () => {
  it('places FE seeds first and dedupes by id', () => {
    const seeds = [stubProgram('general-prog-a', 'Seed A')]
    const remote = [
      stubProgram('general-prog-a', 'API dup'),
      stubProgram('99', 'API only'),
    ]
    const merged = mergeGeneralProgramFeSeedsIntoList(remote, seeds)
    expect(merged.map(p => p.id)).toEqual(['general-prog-a', '99'])
    expect(merged[0]?.title).toBe('Seed A')
  })

  it('returns remote as-is when no seeds', () => {
    const remote = [stubProgram('1')]
    expect(mergeGeneralProgramFeSeedsIntoList(remote, [])).toEqual(remote)
  })
})
