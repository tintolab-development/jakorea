import { describe, expect, it } from 'vitest'
import {
  mapProgramManagerResponsesToRows,
  mapProgramManagerRole,
} from './program-managers-adapters'

describe('mapProgramManagerRole', () => {
  it('maps OWNER/PARTNER/ASSISTANT', () => {
    expect(mapProgramManagerRole('OWNER')).toBe('OWNER')
    expect(mapProgramManagerRole('partner')).toBe('PARTNER')
    expect(mapProgramManagerRole('ASSISTANT')).toBe('ASSISTANT')
  })

  it('maps aliases and unknown to safe defaults', () => {
    expect(mapProgramManagerRole('PM')).toBe('OWNER')
    expect(mapProgramManagerRole('VIEWER')).toBe('ASSISTANT')
    expect(mapProgramManagerRole('???')).toBe('ASSISTANT')
  })
})

describe('mapProgramManagerResponsesToRows', () => {
  it('sorts by assignedAt ascending and assigns no', () => {
    const rows = mapProgramManagerResponsesToRows([
      {
        id: 2,
        adminName: '후배',
        adminEmail: 'b@test.com',
        role: 'PARTNER',
        assignedAt: '2026-02-01T10:00:00Z',
      },
      {
        id: 1,
        adminName: '선배',
        adminEmail: 'a@test.com',
        role: 'OWNER',
        assignedAt: '2026-01-01T10:00:00Z',
        adminId: 11,
      },
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ id: '1', no: 1, name: '선배', role: 'OWNER', adminId: 11 })
    expect(rows[1]).toMatchObject({ id: '2', no: 2, name: '후배', role: 'PARTNER' })
    expect(rows[0].phone).toBe('')
  })
})
