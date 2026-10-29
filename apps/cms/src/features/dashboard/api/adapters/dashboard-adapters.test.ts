import { describe, expect, it } from 'vitest'
import {
  filterRecruitmentListForWidget,
  formatDashboardCountLabel,
  formatDashboardHeaderTotalCount,
  formatRecruitmentCount,
  formatRecruitmentWindowStatus,
  mapDashboardHomeResponse,
  mapKpiProgressListResponse,
  mapNotificationUnreadCount,
  mapProgramInquiryListResponse,
  mapProgramOptionsForWidget,
  mapRecruitmentListResponse,
  countsAfterShortcutReadOptimistic,
  readCountMapValue,
  shouldPostDashboardShortcutRead,
  shouldShowShortcutBadge,
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
      expect.objectContaining({ key: 'finalParticipants', applicable: true, target: 50 }),
      expect.objectContaining({ key: 'finalSchools', applicable: false, target: null }),
      expect.objectContaining({ key: 'finalClasses', applicable: false, target: null }),
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

  it('summaries 필드가 없으면 0으로 채우지 않고 null을 유지한다', () => {
    const result = mapProgramInquiryListResponse({
      summaries: [{ programId: 11, programName: '봉사시간' }],
    })
    expect(result[0]).toMatchObject({
      pending: null,
      answered: null,
      total: null,
      unreadCount: null,
    })
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
    expect(result.rows[0]).toMatchObject({
      id: '7',
      title: '경제교육',
      participantApplied: 12,
      participantCapacity: 30,
      volunteerApplied: 4,
      volunteerCapacity: 10,
      recruitmentWindowStatus: 'RECRUITING',
    })
  })

  it('CLOSED를 봉사자 모집 완료(lifecycle)로 바꾸지 않는다', () => {
    const result = mapRecruitmentListResponse({
      items: [{ programId: 186412, nameKo: 'JOB담', recruitmentStatus: 'CLOSED' }],
    })
    expect(result.rows[0]?.recruitmentWindowStatus).toBe('CLOSED')
    expect(formatRecruitmentWindowStatus(result.rows[0]?.recruitmentWindowStatus)).toBe('모집 마감')
    expect(formatRecruitmentWindowStatus(result.rows[0]?.recruitmentWindowStatus)).not.toContain(
      '봉사자 모집 완료'
    )
    expect(formatRecruitmentWindowStatus('RECRUITING_CUSTOM')).toBe('모집 중')
  })

  it('강사 지원 수를 봉사자 지원 수로 별칭하지 않는다', () => {
    const result = mapRecruitmentListResponse({
      items: [
        {
          programId: 8,
          nameKo: '별칭 금지',
          instructorAppliedCount: 9,
          instructorCapacity: 20,
        },
      ],
    })
    expect(result.rows[0]?.volunteerApplied).toBeNull()
    expect(result.rows[0]?.volunteerCapacity).toBeNull()
    expect(result.rows[0]?.participantApplied).toBeNull()
  })

  it('카운트가 없으면 null을 유지한다', () => {
    const result = mapRecruitmentListResponse({
      items: [{ programId: 9, nameKo: '빈 값', recruitmentStatus: 'OPEN' }],
    })
    expect(result.rows[0]?.participantApplied).toBeNull()
    expect(result.rows[0]?.participantCapacity).toBeNull()
    expect(formatRecruitmentCount(result.rows[0]?.participantApplied, result.rows[0]?.participantCapacity)).toBe(
      '-'
    )
  })

  it('studentAppliedCount는 참여자 신청 별칭이고 approvedStudentCount는 쓰지 않는다', () => {
    const result = mapRecruitmentListResponse({
      items: [
        {
          programId: 186410,
          nameKo: '겨울 워크숍',
          studentAppliedCount: 4,
          studentCapacity: 70,
          approvedStudentCount: 1,
        } as never,
      ],
    })
    expect(result.rows[0]).toMatchObject({
      participantApplied: 4,
      participantCapacity: 70,
    })
  })

  it('totalCount를 items.length로 대체하지 않는다', () => {
    const result = mapRecruitmentListResponse({
      items: [{ programId: 1, nameKo: '잘린 페이지' }],
      totalCount: 50,
      totalElements: 50,
    } as never)
    expect(result.rows).toHaveLength(1)
    expect(result.totalCount).toBe(50)
    expect(formatDashboardHeaderTotalCount(result.totalCount)).toBe('총 50건')
  })

  it('모집 유형 키 생략은 0이 아니라 하이픈이고 페이징 totalCount를 행 수로 바꾸지 않는다', () => {
    const result = mapRecruitmentListResponse({
      items: [
        {
          programId: 101,
          nameKo: 'DASH-PART-ONLY',
          programType: 'GENERAL_INDIVIDUAL',
          recruitmentStatus: 'OPEN',
          participantAppliedCount: 0,
          participantCapacity: 30,
          studentAppliedCount: 0,
          studentCapacity: 30,
        },
        {
          programId: 102,
          nameKo: 'DASH-VOL-INS',
          programType: 'UJAT',
          recruitmentStatus: 'CLOSED',
          volunteerAppliedCount: 0,
          volunteerCapacity: 10,
          instructorAppliedCount: 0,
          instructorCapacity: 5,
        },
      ],
      totalCount: 96,
      totalElements: 96,
    } as never)
    expect(result.rows).toHaveLength(2)
    expect(result.totalCount).toBe(96)
    expect(formatDashboardHeaderTotalCount(result.totalCount)).toBe('총 96건')
    expect(
      formatRecruitmentCount(result.rows[0]?.participantApplied, result.rows[0]?.participantCapacity)
    ).toBe('0 / 30')
    expect(
      formatRecruitmentCount(result.rows[0]?.volunteerApplied, result.rows[0]?.volunteerCapacity)
    ).toBe('-')
    expect(
      formatRecruitmentCount(result.rows[1]?.participantApplied, result.rows[1]?.participantCapacity)
    ).toBe('-')
    expect(
      formatRecruitmentCount(result.rows[1]?.volunteerApplied, result.rows[1]?.volunteerCapacity)
    ).toBe('0 / 10')
  })

  it('actualParticipantCount를 참여자 신청 수로 쓰지 않는다', () => {
    const result = mapRecruitmentListResponse({
      items: [
        {
          programId: 3,
          nameKo: 'KPI 혼용 금지',
          actualParticipantCount: 39,
        } as never,
      ],
    })
    expect(result.rows[0]?.participantApplied).toBeNull()
  })

  it('totalCount가 없으면 items.length로 헤더를 채우지 않는다', () => {
    const result = mapRecruitmentListResponse({
      items: [
        { programId: 1, nameKo: 'A' },
        { programId: 2, nameKo: 'B' },
      ],
    })
    expect(result.rows).toHaveLength(2)
    expect(result.totalCount).toBeNull()
    expect(formatDashboardHeaderTotalCount(result.totalCount)).toBe('총 -')
  })
})

describe('readCountMapValue', () => {
  it('없는 키를 0으로 채우지 않는다', () => {
    expect(readCountMapValue({ 'programs-ujat': 9 }, 'programs-gemini')).toBeUndefined()
    expect(readCountMapValue({ 'programs-ujat': 0 }, 'programs-ujat')).toBe(0)
  })
})

describe('shouldShowShortcutBadge', () => {
  it('0이거나 키 없으면 숨기고 양수만 표시한다', () => {
    const counts = {
      'programs-general-education': 0,
      'programs-economy': 20,
      inquiries: 4,
    }
    expect(shouldShowShortcutBadge(counts, 'programs-general-education')).toBe(false)
    expect(shouldShowShortcutBadge(counts, 'programs-gemini')).toBe(false)
    expect(shouldShowShortcutBadge(counts, 'programs-economy')).toBe(true)
    expect(shouldShowShortcutBadge(counts, 'inquiries')).toBe(true)
  })
})

describe('shouldPostDashboardShortcutRead', () => {
  it('신규 키 양수만 POST하고 대기·0·누락은 보내지 않는다', () => {
    const counts = {
      notices: 1,
      faq: 0,
      inquiries: 4,
      'permission-requests': 1,
    }
    expect(shouldPostDashboardShortcutRead('notices', counts)).toBe(true)
    expect(shouldPostDashboardShortcutRead('faq', counts)).toBe(false)
    expect(shouldPostDashboardShortcutRead('programs-gemini', counts)).toBe(false)
    expect(shouldPostDashboardShortcutRead('inquiries', counts)).toBe(false)
    expect(shouldPostDashboardShortcutRead('permission-requests', counts)).toBe(false)
  })
})

describe('countsAfterShortcutReadOptimistic', () => {
  it('신규 키는 제거하고 대기 키는 유지한다', () => {
    const counts = { notices: 1, faq: 2, inquiries: 4 }
    expect(countsAfterShortcutReadOptimistic(counts, 'notices')).toEqual({
      faq: 2,
      inquiries: 4,
    })
    expect(countsAfterShortcutReadOptimistic(counts, 'inquiries')).toEqual(counts)
  })
})

describe('mapNotificationUnreadCount', () => {
  it('누락이면 0이 아니라 null이다', () => {
    expect(mapNotificationUnreadCount(undefined)).toBeNull()
    expect(mapNotificationUnreadCount(0)).toBe(0)
    expect(formatDashboardCountLabel(null)).toBe('-')
    expect(formatDashboardCountLabel(0)).toBe('0건')
  })
})

describe('mapDashboardHomeResponse', () => {
  it('홈 카운트가 없으면 0이 아니라 null이다', () => {
    expect(mapDashboardHomeResponse({})).toEqual({
      version: '',
      programCount: null,
      memberCount: null,
      unreadNotificationCount: null,
    })
  })
})

describe('filterRecruitmentListForWidget', () => {
  const dto = {
    items: [
      { programId: 1, nameKo: '일반', programType: 'general' },
      { programId: 2, nameKo: '1사1교', programType: 'company_school' },
      { programId: 3, nameKo: 'UJAT', programType: 'ujat' },
    ],
  }

  it('programType 위젯은 해당 유형만 남긴다', () => {
    const filtered = filterRecruitmentListForWidget('program-schedule-general-widget', dto)
    expect(filtered.items?.map((i: { programId?: number }) => i.programId)).toEqual([1])
  })

  it('일반 위젯은 GENERAL/GENERAL_ORGANIZATION/GENERAL_INDIVIDUAL만 남긴다', () => {
    const filtered = filterRecruitmentListForWidget('program-schedule-general-widget', {
      items: [
        { programId: 1, nameKo: '일반', programType: 'GENERAL' },
        { programId: 5, nameKo: '개인', programType: 'GENERAL_INDIVIDUAL' },
        { programId: 6, nameKo: '기관', programType: 'GENERAL_ORGANIZATION' },
        { programId: 4, nameKo: '교육받은 교사', programType: 'TRAINED_TEACHER' },
        { programId: 7, nameKo: '봉사자', programType: 'VOLUNTEER' },
        { programId: 2, nameKo: '1사1교', programType: 'company_school' },
      ],
    })
    expect(filtered.items?.map((i: { programId?: number }) => i.programId)).toEqual([1, 5, 6])
  })

  it('programType 없는 위젯은 전체를 유지한다', () => {
    const filtered = filterRecruitmentListForWidget('recruitment-status-widget', dto)
    expect(filtered.items).toHaveLength(3)
  })
})

describe('mapProgramOptionsForWidget', () => {
  it('위젯별 옵션 목록을 만든다', () => {
    const options = mapProgramOptionsForWidget('program-schedule-ujat-widget', {
      items: [{ programId: 9, nameKo: 'UJAT 프로그램', programType: 'ujat' }],
    })
    expect(options).toEqual([{ id: '9', title: 'UJAT 프로그램' }])
  })
})
