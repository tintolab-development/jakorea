import { describe, expect, it } from 'vitest'
import {
  parseProgramParticipantCount,
  sumProgramParticipantCount,
} from './program-participant-count'

describe('parseProgramParticipantCount', () => {
  it('reads the actual count before a slash', () => {
    expect(parseProgramParticipantCount('10 / 30')).toBe(10)
    expect(parseProgramParticipantCount('0 / 30')).toBe(0)
  })

  it('reads a plain number', () => {
    expect(parseProgramParticipantCount('915')).toBe(915)
    expect(parseProgramParticipantCount('1,234명')).toBe(1234)
  })

  it('returns 0 for empty or non-numeric values', () => {
    expect(parseProgramParticipantCount('')).toBe(0)
    expect(parseProgramParticipantCount(undefined)).toBe(0)
    expect(parseProgramParticipantCount('명')).toBe(0)
  })
})

describe('sumProgramParticipantCount', () => {
  const rows = [
    { year: 2026, participantCount: '30 / 30' },
    { year: 2026, participantCount: '10 / 30' },
    { year: 2025, participantCount: '3 / 30' },
  ]

  it('sums all program participants', () => {
    expect(sumProgramParticipantCount(rows)).toBe(43)
  })

  it('sums participants for one year', () => {
    expect(sumProgramParticipantCount(rows, 2026)).toBe(40)
    expect(sumProgramParticipantCount(rows, 2024)).toBe(0)
  })
})
