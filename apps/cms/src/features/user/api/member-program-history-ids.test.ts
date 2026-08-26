import { describe, expect, it } from 'vitest'
import {
  collectParticipantIdsFromHistoryRowIds,
  parseMemberProgramHistoryRowId,
  resolveMemberApplicationIdFromApplication,
  resolveParticipantIdFromHistoryRow,
} from '@/features/user/api/member-program-history-ids'
import type { Application, UserHistory } from '@/types/domain'

describe('parseMemberProgramHistoryRowId', () => {
  it('parses application, participant, and program history ids', () => {
    expect(parseMemberProgramHistoryRowId('app-42')).toEqual({
      kind: 'application',
      numericId: 42,
    })
    expect(parseMemberProgramHistoryRowId('part-99')).toEqual({
      kind: 'participant',
      numericId: 99,
    })
    expect(parseMemberProgramHistoryRowId('ph-7')).toEqual({
      kind: 'programHistory',
      numericId: 7,
    })
    expect(parseMemberProgramHistoryRowId('unknown')).toBeNull()
  })
})

describe('resolveMemberApplicationIdFromApplication', () => {
  it('prefers customFields memberApplicationId', () => {
    const app = {
      id: 'app-1',
      customFields: { memberApplicationId: 100 },
    } as unknown as Application
    expect(resolveMemberApplicationIdFromApplication(app)).toBe(100)
  })
})

describe('resolveParticipantIdFromHistoryRow', () => {
  it('reads participantId from UserHistory', () => {
    const history = { id: 'ph-12', participantId: 12 } as UserHistory
    expect(resolveParticipantIdFromHistoryRow(history)).toBe(12)
  })

  it('reads participantId from Application customFields', () => {
    const app = {
      id: 'part-55',
      customFields: { participantId: 55 },
    } as unknown as Application
    expect(resolveParticipantIdFromHistoryRow(app)).toBe(55)
  })
})

describe('collectParticipantIdsFromHistoryRowIds', () => {
  it('collects unique participant ids from part/ph rows', () => {
    expect(collectParticipantIdsFromHistoryRowIds(['app-1', 'part-2', 'ph-2', 'ph-3'])).toEqual([
      2, 3,
    ])
  })
})
