import { describe, expect, it } from 'vitest'
import type { SponsorProgramHistoryRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  matchesProgramHistoryFilter,
  SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
} from './match-program-history-filter'

const baseRow: SponsorProgramHistoryRow = {
  id: '1',
  programId: 'p1',
  title: 'JA Korea 초등 경제교육',
  year: 2026,
  lifecycleStatus: 'planned',
  managerName: '홍길동',
  participantCount: '10 / 30',
  participantType: 'school',
  educationTarget: 'elementary',
}

describe('matchesProgramHistoryFilter', () => {
  it('matches participantType when set', () => {
    expect(
      matchesProgramHistoryFilter(baseRow, {
        title: '',
        year: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
        lifecycleStatus: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
        participantType: 'school',
        educationTarget: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
        managerName: '',
      })
    ).toBe(true)
    expect(
      matchesProgramHistoryFilter(baseRow, {
        title: '',
        year: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
        lifecycleStatus: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
        participantType: 'volunteer',
        educationTarget: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
        managerName: '',
      })
    ).toBe(false)
  })
})
