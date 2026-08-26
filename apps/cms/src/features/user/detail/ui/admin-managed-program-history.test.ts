import { describe, expect, it } from 'vitest'
import type { Program, ProgramRound } from '@/types/domain'
import { recruitmentCountDisplay } from './admin-managed-program-history'

function baseRound(partial: Partial<ProgramRound> = {}): ProgramRound {
  return {
    id: 'round-1',
    programId: 'prog-1',
    roundNumber: 1,
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    status: 'active',
    capacity: 0,
    ...partial,
  }
}

function baseProgram(partial: Partial<Program> = {}): Program {
  return {
    id: 'prog-1',
    title: '테스트 프로그램',
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    category: 'school',
    rounds: [baseRound()],
    approvedStudentCount: 0,
    ...partial,
  } as Program
}

describe('recruitmentCountDisplay', () => {
  it('remote + cap 0 + approved 0이면 `-`', () => {
    expect(recruitmentCountDisplay(baseProgram(), true)).toBe('-')
  })

  it('remote + cap 0 + approved > 0이면 `/ 30` 없이 approved만', () => {
    expect(recruitmentCountDisplay(baseProgram({ approvedStudentCount: 12 }), true)).toBe('12')
  })

  it('remote + cap > 0이면 `approved / cap`', () => {
    expect(
      recruitmentCountDisplay(
        baseProgram({
          rounds: [baseRound({ capacity: 25 })],
          approvedStudentCount: 10,
        }),
        true
      )
    ).toBe('10 / 25')
  })

  it('mock 모드 + cap 0이면 `/ 30` fallback', () => {
    expect(recruitmentCountDisplay(baseProgram(), false)).toBe('0 / 30')
  })
})
