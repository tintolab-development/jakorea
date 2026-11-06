import { describe, expect, it } from 'vitest'
import type { ProgramRound } from '@/types/domain'
import {
  mapProgramRoundToWriteRequest,
  mapProgramRoundsToWriteRequest,
  persistedProgramScheduleId,
} from './round-write'

const existing: ProgramRound = {
  id: '187700',
  programId: '186551',
  roundNumber: 1,
  startDate: '2026-03-01T00:00:00.000Z',
  endDate: '2026-03-01T01:00:00.000Z',
  status: 'active',
  capacity: 20,
  classCount: 2,
  curriculum: '1회차',
  deliveryType: 'offline',
}

describe('persistedProgramScheduleId', () => {
  it('keeps GET program_schedule PK strings', () => {
    expect(persistedProgramScheduleId('187700')).toBe('187700')
    expect(persistedProgramScheduleId(187700)).toBe('187700')
  })

  it('drops client placeholder ids and blank values', () => {
    expect(persistedProgramScheduleId('186551-round-1')).toBeUndefined()
    expect(persistedProgramScheduleId('round-1')).toBeUndefined()
    expect(persistedProgramScheduleId('')).toBeUndefined()
    expect(persistedProgramScheduleId(undefined)).toBeUndefined()
  })
})

describe('mapProgramRoundsToWriteRequest', () => {
  it('includes GET id on existing rounds and omits id on new rows', () => {
    const created: ProgramRound = {
      ...existing,
      id: '186551-round-2',
      roundNumber: 2,
    }
    const rounds = mapProgramRoundsToWriteRequest(
      { rounds: [existing, created] },
      value => (typeof value === 'string' ? value : undefined)
    )
    expect(rounds[0]?.id).toBe('187700')
    expect(rounds[1]).not.toHaveProperty('id')
    expect(rounds[0]).toEqual(
      expect.objectContaining({
        id: '187700',
        roundNumber: 1,
        capacity: 20,
        classCount: 2,
        status: 'active',
        curriculum: '1회차',
        deliveryType: 'offline',
      })
    )
  })

  it('does not strip id when mapping a single persisted round', () => {
    expect(
      mapProgramRoundToWriteRequest(existing, {
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-01T01:00:00.000Z',
      }).id
    ).toBe('187700')
  })
})
