import { describe, expect, it } from 'vitest'
import {
  getUjatScheduleAssignDraftRegionState,
  getUjatScheduleAssignRegionState,
  removeUjatScheduleAssignInstitutionRows,
  replaceUjatScheduleAssignRegionState,
} from './store'

describe('removeUjatScheduleAssignInstitutionRows', () => {
  it('해제된 기관 행만 저장·편집 상태에서 지우고, 빈 날짜에는 빈 행을 남긴다', () => {
    replaceUjatScheduleAssignRegionState('seoul', {
      maxClassesPerDay: '',
      estimation: { h1: { expectedVolunteerCount: '' }, h2: { expectedVolunteerCount: '' } },
      days: {
        '2026-04-03': {
          isoDate: '2026-04-03',
          rows: [
            { id: 'r1', institutionRowId: 'released', gradeValues: ['1-1'] },
            { id: 'r2', institutionRowId: 'kept', gradeValues: ['2-1'] },
          ],
        },
        '2026-04-10': {
          isoDate: '2026-04-10',
          rows: [{ id: 'r3', institutionRowId: 'released', gradeValues: ['1-2'] }],
        },
      },
    })

    removeUjatScheduleAssignInstitutionRows(['released'])

    for (const state of [
      getUjatScheduleAssignRegionState('seoul'),
      getUjatScheduleAssignDraftRegionState('seoul'),
    ]) {
      expect(state.days['2026-04-03']?.rows.map(row => row.institutionRowId)).toEqual(['kept'])
      expect(state.days['2026-04-10']?.rows).toHaveLength(1)
      expect(state.days['2026-04-10']?.rows[0]?.institutionRowId).toBeNull()
    }
  })
})
