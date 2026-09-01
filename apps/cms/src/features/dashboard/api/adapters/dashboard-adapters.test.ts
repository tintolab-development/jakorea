import { describe, expect, it } from 'vitest'
import {
  mapKpiProgressListResponse,
  mapProgramInquiryListResponse,
  mapRecruitmentListResponse,
  recruitmentStatusFromPeriod,
} from './dashboard-adapters'

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
    expect(result[0]?.kpis.every(kpi => kpi.applicable)).toBe(true)
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
      expect.objectContaining({ key: 'finalParticipants', achieved: 80, target: 120, applicable: true }),
      expect.objectContaining({ key: 'finalSchools', achieved: 2, target: 4, applicable: true }),
      expect.objectContaining({ key: 'finalClasses', achieved: 3, target: 6, applicable: true }),
    ])
  })

  it('개인 대상은 학교·학급 KPI를 비활성한다', () => {
    const result = mapKpiProgressListResponse({
      items: [
        {
          programId: 2,
          programType: 'individual',
          targetParticipantCount: 50,
          actualParticipantCount: 10,
        },
      ],
    })
    expect(result[0]?.kpis).toEqual([
      expect.objectContaining({ key: 'finalParticipants', applicable: true }),
      expect.objectContaining({ key: 'finalSchools', applicable: false }),
      expect.objectContaining({ key: 'finalClasses', applicable: false }),
    ])
  })

  it('교육받은 교사는 모든 KPI를 비활성한다', () => {
    const result = mapKpiProgressListResponse({
      items: [
        {
          programId: 3,
          programType: 'trained_teachers',
          programNameKo: '교육받은 교사 연수',
          targetParticipantCount: 20,
        },
      ],
    })
    expect(result[0]?.kpis.every(kpi => kpi.applicable === false)).toBe(true)
  })

  it('API *Applicable 플래그가 있으면 휴리스틱보다 우선한다', () => {
    const result = mapKpiProgressListResponse({
      items: [
        {
          programId: 4,
          programType: 'general',
          participantApplicable: false,
          schoolApplicable: true,
          classApplicable: false,
          targetParticipantCount: 10,
        },
      ],
    })
    expect(result[0]?.kpis).toEqual([
      expect.objectContaining({ key: 'finalParticipants', applicable: false }),
      expect.objectContaining({ key: 'finalSchools', applicable: true }),
      expect.objectContaining({ key: 'finalClasses', applicable: false }),
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
    expect(byName['활동']).toMatchObject({ pending: 1, answered: 0, total: 1, unreadCount: 1 })
    expect(byName['시스템']).toMatchObject({ pending: 1, answered: 1, total: 2, unreadCount: 1 })
  })

  it('programId가 있으면 그 기준으로 묶고 행 키로 쓴다', () => {
    const result = mapProgramInquiryListResponse({
      items: [
        { programId: 11, programNameSnapshot: '동일명', inquiryStatus: 'RECEIVED' },
        { programId: 22, programNameSnapshot: '동일명', inquiryStatus: 'RECEIVED' },
      ],
    })
    expect(result).toHaveLength(2)
    expect(result.map(row => row.programId)).toEqual(['11', '22'])
    expect(result[0]?.key).toBe('11')
  })

  it('summaries가 있으면 건 리스트 집계 대신 백엔드 집계를 쓴다', () => {
    const result = mapProgramInquiryListResponse({
      summaries: [
        {
          programId: 11,
          programName: '봉사시간',
          pending: 2,
          answered: 3,
          total: 5,
          unreadCount: 1,
        },
      ],
      items: [{ programId: 11, programNameSnapshot: '봉사시간', inquiryStatus: 'RECEIVED' }],
    })
    expect(result).toEqual([
      {
        key: '11',
        programId: '11',
        programName: '봉사시간',
        pending: 2,
        answered: 3,
        total: 5,
        unreadCount: 1,
      },
    ])
  })
})

describe('mapRecruitmentListResponse', () => {
  it('참여자·봉사자 지원/정원 필드를 프로그램 행에 매핑한다', () => {
    const result = mapRecruitmentListResponse({
      items: [
        {
          programId: 7,
          nameKo: '경제교육',
          recruitmentStatus: 'RECRUITING',
          participantAppliedCount: 12,
          participantCapacity: 30,
          volunteerAppliedCount: 4,
          volunteerCapacity: 10,
        },
      ],
    })
    expect(result[0]).toMatchObject({
      id: '7',
      title: '경제교육',
      approvedStudentCount: 12,
      instructors: 4,
      instructorCapacity: 10,
      lifecycleStatus: 'recruiting_students',
    })
    expect(result[0]?.rounds[0]?.capacity).toBe(30)
  })
})

describe('recruitmentStatusFromPeriod', () => {
  it('모집 기간 중이면 모집 중으로 본다', () => {
    expect(
      recruitmentStatusFromPeriod('2000-01-01T00:00:00Z', '2099-01-01T00:00:00Z')
    ).toBe('recruiting_students')
  })
})
