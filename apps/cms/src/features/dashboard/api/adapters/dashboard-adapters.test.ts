import { describe, expect, it } from 'vitest'
import { mapKpiProgressListResponse, mapProgramInquiryListResponse } from './dashboard-adapters'

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
    expect(result[0]?.programTitle).toBe('프로그램 1')
  })

  it('actual*·프로그램명을 카드 실적·제목으로 매핑한다', () => {
    const result = mapKpiProgressListResponse({
      items: [
        {
          programId: 165301,
          nameKo: '지역 경제교육',
          programNameKo: '지역 경제교육',
          programCode: 'GVT-A-01',
          targetParticipantCount: 120,
          targetSchoolCount: 4,
          targetClassCount: 6,
          actualParticipantCount: 80,
          actualSchoolCount: 2,
          actualClassCount: 3,
        },
      ],
    })

    expect(result[0]?.programTitle).toBe('지역 경제교육')
    expect(result[0]?.kpis).toEqual([
      expect.objectContaining({ key: 'finalParticipants', achieved: 80, target: 120 }),
      expect.objectContaining({ key: 'finalSchools', achieved: 2, target: 4 }),
      expect.objectContaining({ key: 'finalClasses', achieved: 3, target: 6 }),
    ])
  })
})

describe('mapProgramInquiryListResponse', () => {
  it('백엔드 RECEIVED/IN_PROGRESS를 미답변, ANSWERED를 답변 완료로 집계한다', () => {
    const result = mapProgramInquiryListResponse({
      items: [
        { programNameSnapshot: '봉사시간', inquiryStatus: 'ANSWERED', answeredAt: '2026-08-01T00:00:00Z' },
        { programNameSnapshot: '활동', inquiryStatus: 'RECEIVED' },
        { programNameSnapshot: '시스템', inquiryStatus: 'IN_PROGRESS' },
        { programNameSnapshot: '시스템', inquiryStatus: 'ANSWERED', answeredAt: '2026-08-02T00:00:00Z' },
      ],
    })

    const byName = Object.fromEntries(result.map(row => [row.programName, row]))
    expect(byName['봉사시간']).toMatchObject({ pending: 0, answered: 1, total: 1 })
    expect(byName['활동']).toMatchObject({ pending: 1, answered: 0, total: 1 })
    expect(byName['시스템']).toMatchObject({ pending: 1, answered: 1, total: 2 })
  })
})
