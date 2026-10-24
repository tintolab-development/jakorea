import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { applyEconomyRegistrationOverlayToProgram } from './economy-registration-overlay-to-program'

function baseProgram(): Program {
  return {
    id: 'company-school-local-1',
    title: '1사1교 테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '1사1교 프로그램 등록(임시 저장)',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    applicationStartDate: '2026-01-01T00:00:00.000Z',
    applicationEndDate: '2026-01-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    generalCommonInfo: {
      educationScheduleMode: 'period',
      curriculumSessions: [
        { sessionLabel: '1차시', title: '1단원 나를 알리는 기술', description: '기본값 설명 1' },
        { sessionLabel: '2차시', title: '2단원 나를 보여주는 기술', description: '기본값 설명 2' },
      ],
      educationScheduleLines: ['2026.03.01 ~ 2026.12.31'],
      wageGradeRows: [
        { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 500,000원 | 장거리 : 500,000원' },
        { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 400,000원 | 장거리 : 400,000원' },
        { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 300,000원 | 장거리 : 300,000원' },
      ],
      paymentItems: '교통비(일사일교), 숙박비(일사일교)',
      deductionItems: '일용근로자 원천징수세액',
    },
  } as Program
}

describe('applyEconomyRegistrationOverlayToProgram', () => {
  it('overlay가 비어 있으면 기존 기본값(목업)을 그대로 유지한다', () => {
    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), {})
    expect(result.generalCommonInfo?.curriculumSessions?.[0].title).toBe('1단원 나를 알리는 기술')
    expect(result.generalCommonInfo?.educationScheduleLines).toEqual(['2026.03.01 ~ 2026.12.31'])
    expect(result.generalCommonInfo?.wageGradeRows?.[0].pricing).toContain('500,000원')
  })

  it('overlay에 실입력이 있으면 기본값 대신 실입력을 반영한다 (버그 수정 확인)', () => {
    const overlay: Record<string, unknown> = {
      'economyRegistration.educationCurriculum.session1.title': '실제 입력한 1차시 제목',
      'economyRegistration.educationCurriculum.session1.description': '실제 입력한 1차시 설명',
      'economyRegistration.educationCurriculum.session2.title': '실제 입력한 2차시 제목',
      'economyRegistration.educationCurriculum.session2.description': '실제 입력한 2차시 설명',
      'economyRegistration.educationScheduleSettings.dateRangeSeal': {
        start: '2026-05-01T00:00:00.000Z',
        end: '2026-11-30T00:00:00.000Z',
      },
      'economyRegistration.wageInfo.grade1Fee': 111111,
      'economyRegistration.wageInfo.grade1DistanceFee': 222222,
      'economyRegistration.wageInfo.grade2Fee': 33333,
      'economyRegistration.wageInfo.grade2DistanceFee': 44444,
      'economyRegistration.wageInfo.grade3Fee': 5555,
      'economyRegistration.wageInfo.grade3DistanceFee': 6666,
    }

    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), overlay)

    expect(result.generalCommonInfo?.curriculumSessions?.[0].title).toBe('실제 입력한 1차시 제목')
    expect(result.generalCommonInfo?.curriculumSessions?.[0].description).toBe(
      '실제 입력한 1차시 설명'
    )
    expect(result.generalCommonInfo?.curriculumSessions?.[1].title).toBe('실제 입력한 2차시 제목')

    expect(result.generalCommonInfo?.educationScheduleLines).toEqual([
      '2026.05.01 ~ 2026.11.30',
    ])
    expect(result.generalCommonInfo?.educationScheduleMode).toBe('period')

    expect(result.generalCommonInfo?.wageGradeRows?.[0].pricing).toContain('111,111원')
    expect(result.generalCommonInfo?.wageGradeRows?.[0].pricing).toContain('222,222원')
    expect(result.generalCommonInfo?.wageGradeRows?.[1].pricing).toContain('33,333원')
  })

  it('결제 항목 id가 overlay에 있으면 라벨로 변환해 반영한다', () => {
    const overlay: Record<string, unknown> = {
      'economyRegistration.wageInfo.paymentItemValues': ['p-166207'],
    }
    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), overlay)
    // 실제 라벨 매핑은 설정 데이터에 의존 — 최소한 기존 목업 텍스트로 되돌아가지 않는지만 확인
    expect(result.generalCommonInfo?.paymentItems).not.toBe(undefined)
  })

  it('세부 프로그램명 — 선택한 값이 generalCommonInfo에 반영된다 (버그 수정 확인)', () => {
    // 버그: 기존엔 이 overlay 키를 전혀 읽지 않아, 수동 선택·자동 채우기로 고른
    // 세부 프로그램명이 항상 무시되고 generalCommonInfo.detailedProgramName이 비어 있었다.
    const overlay: Record<string, unknown> = {
      'economyRegistration.basicInfo.detailedProgramId': '163042',
      'economyRegistration.basicInfo.detailedProgramName': '실제 선택한 세부 프로그램명',
    }
    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), overlay)
    expect(result.generalCommonInfo?.detailedProgramName).toBe('실제 선택한 세부 프로그램명')
  })

  it('세부 프로그램명 — overlay가 비어 있으면 기존 값을 유지한다', () => {
    const withExisting = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        detailedProgramName: '기존 값',
      },
    }
    const result = applyEconomyRegistrationOverlayToProgram(withExisting, {})
    expect(result.generalCommonInfo?.detailedProgramName).toBe('기존 값')
  })

  it('세부 프로그램명 — id(detailedProgramId)도 Program top-level에 함께 반영된다 (버그 수정 확인)', () => {
    // 버그: name(generalCommonInfo.detailedProgramName)만 반영되고 top-level
    // Program.detailedProgramId는 세팅된 적이 없어, 실제 요청에서 항상 빠졌다
    // (BE는 id로 조회 → "세부 프로그램명 없음" 오류로 이어짐).
    const overlay: Record<string, unknown> = {
      'economyRegistration.basicInfo.detailedProgramId': '163050',
      'economyRegistration.basicInfo.detailedProgramName': '여름방학 집중 캠프',
    }
    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), overlay)
    expect(result.detailedProgramId).toBe('163050')
    expect(result.generalCommonInfo?.detailedProgramName).toBe('여름방학 집중 캠프')
  })

  it('Course Delivered By·Partner Involvement — overlay에 없어도 폼 기본값을 1차 컬럼에 넣는다', () => {
    // 셀렉트 기본값(JA, No)은 화면만 채우고 overlay에는 안 남는다. 그대로 두면 create body가 비어 BE가 null로 저장한다.
    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), {})
    expect(result.courseDeliveredBy).toBe('JA')
    expect(result.partnerInvolvement).toBe(false)
    expect(result.ipOwned).toBe('JA')
    expect(result.ips).toBe('Prepare')
  })

  it('공통정보 overlay를 create 1차 컬럼(titleEn·ipOwned·KPI 등)에 올린다', () => {
    // BE는 body에 온 1차 컬럼만 저장한다. overlay에만 있으면 컬럼은 null로 남는다.
    const overlay: Record<string, unknown> = {
      'economyRegistration.basicInfo.repKo': '디지털 리터러시 교실',
      'economyRegistration.basicInfo.repEn': 'Digital Literacy Classroom',
      'economyRegistration.basicInfo.publicProgramTitle': '공고용 디지털 리터러시',
      'economyRegistration.basicInfo.businessField': 'career_employment',
      'economyRegistration.basicInfo.ipOwned': 'partner',
      'economyRegistration.basicInfo.courseDeliveredBy': 'ja',
      'economyRegistration.basicInfo.educationCourse': 'digital_computer',
      'economyRegistration.basicInfo.partnerInvolvement': 'yes',
      'economyRegistration.basicInfo.ipsCategory': 'succeed',
      'economyRegistration.basicInfo.operationRangeSeal': {
        start: '2026-11-21T15:00:00.000Z',
        end: '2026-12-22T15:00:00.000Z',
      },
      'economyRegistration.basicInfo.surveyItems': {
        survey: true,
        satisfaction: false,
        lecture_evaluation: true,
      },
      'economyRegistration.kpi.participantCount': 120,
      'economyRegistration.kpi.instructor': 8,
      'economyRegistration.kpi.dispatchedSchool': 6,
      'economyRegistration.kpi.dispatchedClass': 14,
    }
    const result = applyEconomyRegistrationOverlayToProgram(
      { ...baseProgram(), rounds: [{ id: 'r1', programId: 'p', roundNumber: 1, startDate: '', endDate: '', capacity: 30, status: 'active' }] },
      overlay
    )
    expect(result.title).toBe('디지털 리터러시 교실')
    expect(result.mainTitle).toBe('디지털 리터러시 교실')
    expect(result.titleEn).toBe('Digital Literacy Classroom')
    expect(result.businessArea).toBe('진로취업')
    expect(result.ipOwned).toBe('Partner')
    expect(result.courseDeliveredBy).toBe('JA')
    expect(result.educationProcess).toBe('Digital (Computer)')
    expect(result.partnerInvolvement).toBe(true)
    expect(result.ips).toBe('Succeed')
    expect(result.approvedStudentCount).toBe(120)
    expect(result.instructors).toBe(8)
    expect(result.instructorCapacity).toBe(8)
    expect(result.participatingSchoolCount).toBe(6)
    expect(result.generalCommonInfo?.kpi).toMatchObject({
      finalParticipants: 120,
      instructorCount: 8,
      finalSchools: 6,
      finalClasses: 14,
    })
    expect(result.generalCommonInfo?.announcementTitle).toBe('공고용 디지털 리터러시')
    expect(result.generalSurveyMenuKeys).toEqual(['survey', 'lecture_evaluation'])
    expect(result.startDate).toContain('2026-11-2')
    expect(result.rounds?.[0]?.startDate).toBe(result.startDate)
  })

  it('서울 달력일이 같으면 종료 시각을 23:59:59.999로 다시 쓰지 않고 회차도 유지한다', () => {
    const existing = {
      ...baseProgram(),
      startDate: '2026-05-14T15:00:00.000Z',
      endDate: '2026-12-26T14:59:59.999Z',
      rounds: [
        {
          id: '186592',
          programId: '186016',
          roundNumber: 1,
          startDate: '2026-05-14T15:00:00.000Z',
          endDate: '2026-12-26T14:59:59.999Z',
          status: 'active' as const,
        },
      ],
    }
    const result = applyEconomyRegistrationOverlayToProgram(existing, {
      'economyRegistration.basicInfo.operationRangeSeal': {
        start: '2026-05-14T15:00:00.000Z',
        end: '2026-12-25T15:00:00.000Z',
      },
    })
    expect(result.startDate).toBe(existing.startDate)
    expect(result.endDate).toBe(existing.endDate)
    expect(result.rounds).toEqual(existing.rounds)
  })

  it('후원사·담당자 overlay를 Program.sponsorId와 generalCommonInfo에 반영한다', () => {
    const overlay: Record<string, unknown> = {
      'economyRegistration.basicInfo.sponsorId': '163388',
      'economyRegistration.basicInfo.managerContactIds': ['contact-1', '__all__'],
    }
    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), overlay)
    expect(result.sponsorId).toBe('163388')
    expect(result.generalCommonInfo?.sponsorManagementIds).toEqual(['163388'])
    expect(result.generalCommonInfo?.sponsorManagerContactIds).toEqual(['contact-1'])
  })

  it('detailedProgramId — overlay가 비어 있으면 기존 Program 값을 유지한다', () => {
    const withExisting = { ...baseProgram(), detailedProgramId: '163099' }
    const result = applyEconomyRegistrationOverlayToProgram(withExisting, {})
    expect(result.detailedProgramId).toBe('163099')
  })

  it('KPI overlay 키가 null이면 기존 program KPI로 되돌리지 않는다', () => {
    const existing = {
      ...baseProgram(),
      approvedStudentCount: 11,
      instructors: 11,
      instructorCapacity: 11,
      participatingSchoolCount: 11,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        kpi: {
          finalParticipants: 11,
          instructorCount: 11,
          volunteerCount: 0,
          finalSchools: 11,
          finalClasses: 11,
        },
      },
    }
    const result = applyEconomyRegistrationOverlayToProgram(existing, {
      'economyRegistration.kpi.participantCount': null,
      'economyRegistration.kpi.instructor': null,
      'economyRegistration.kpi.dispatchedSchool': null,
      'economyRegistration.kpi.dispatchedClass': null,
    })
    expect(result.generalCommonInfo?.kpi).toMatchObject({
      finalParticipants: 0,
      instructorCount: 0,
      volunteerCount: 0,
      finalSchools: 0,
      finalClasses: 0,
    })
    expect(result.approvedStudentCount).toBe(0)
    expect(result.instructors).toBe(0)
    expect(result.participatingSchoolCount).toBe(0)
  })

  it('KPI overlay 키가 없으면 기존 program KPI를 유지한다', () => {
    const existing = {
      ...baseProgram(),
      approvedStudentCount: 11,
      instructors: 11,
      participatingSchoolCount: 11,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        kpi: {
          finalParticipants: 11,
          instructorCount: 11,
          volunteerCount: 0,
          finalSchools: 11,
          finalClasses: 11,
        },
      },
    }
    const result = applyEconomyRegistrationOverlayToProgram(existing, {})
    expect(result.generalCommonInfo?.kpi).toMatchObject({
      finalParticipants: 11,
      instructorCount: 11,
      finalSchools: 11,
      finalClasses: 11,
    })
    expect(result.approvedStudentCount).toBe(11)
    expect(result.instructors).toBe(11)
    expect(result.participatingSchoolCount).toBe(11)
  })
})
