import { describe, expect, it } from 'vitest'
import { mapKpiProgressListResponse } from './dashboard-adapters'

describe('mapKpiProgressListResponse', () => {
  it('API 달성 실적 미제공 시 achieved는 null', () => {
    const result = mapKpiProgressListResponse({
      items: [
        {
          programId: 1,
          targetParticipantCount: 100,
          targetSchoolCount: 10,
          targetClassCount: 5,
        },
      ],
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.kpis.every(kpi => kpi.achieved === null)).toBe(true)
    expect(result[0]?.kpis[0]?.target).toBe(100)
  })
})
