import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  applyGeneralRegistrationOverlayToProgram,
  normalizeRegistrationOverlayForApply,
} from './registration-overlay-to-program'
import type { Program } from '@/types/domain'

function baseProgram(): Program {
  const now = new Date().toISOString()
  return {
    id: 'test-1',
    sponsorId: 's1',
    title: 'fallback',
    mainTitle: 'fallback',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '일반 프로그램 등록(임시 저장)',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    applicationStartDate: now,
    applicationEndDate: now,
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    targetLevel: 'elementary',
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalCommonInfo: {
      educationScheduleMode: 'date',
      educationScheduleLines: ['26년 9월 16일(수) 9:22 ~ 10:22'],
    },
    generalParticipantTypes: ['school_institution'],
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
    rounds: [
      {
        id: 'r1',
        programId: 'test-1',
        roundNumber: 1,
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-15T23:59:59.999Z',
        capacity: 30,
        status: 'active',
        curriculum: 'fallback 커리큘럼',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

describe('applyGeneralRegistrationOverlayToProgram', () => {
  it('maps basic info, kpi, wage, and curriculum overlay into Program', () => {
    const overlay: Record<string, unknown> = {
      'generalRegistration.basicInfo.localProgramTitleKo': '대표 프로그램명 (국문)',
      'generalRegistration.basicInfo.programTitleEn': 'Program Title EN',
      'generalRegistration.basicInfo.publicProgramTitle': '공고용 프로그램명',
      'generalRegistration.basicInfo.businessField': 'career_employment',
      'generalRegistration.basicInfo.partnerInvolvement': 'yes',
      'generalRegistration.basicInfo.educationVenueKind': 'outside',
      'generalRegistration.basicInfo.educationVenueDetail': '강의실 A',
      'generalRegistration.basicInfo.educationCourse': 'digital_computer',
      'generalRegistration.basicInfo.ipOwned': 'ja',
      'generalRegistration.basicInfo.courseDeliveredBy': 'partner',
      'generalRegistration.basicInfo.operationRangeSeal': {
        start: '2026-05-01',
        end: '2026-11-30',
      },
      'generalRegistration.basicInfo.localSponsorIds': ['163302'],
      'generalRegistration.basicInfo.surveyItems': {
        survey: true,
        satisfaction: false,
        lecture_evaluation: true,
      },
      'generalRegistration.kpi.participantCount': 100,
      'generalRegistration.kpi.instructor': 12,
      'generalRegistration.kpi.volunteer': 5,
      'generalRegistration.kpi.dispatchedSchool': 8,
      'generalRegistration.kpi.dispatchedClass': 20,
      'generalRegistration.wageInfo.grade1Fee': 500000,
      'generalRegistration.wageInfo.grade2Fee': 400000,
      'generalRegistration.wageInfo.grade3Fee': 300000,
      'generalRegistration.wageInfo.paymentItemValues': ['__payment_none__'],
      'generalRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
      'generalRegistration.typeSettings.singleEducationForm': 'offline',
      'generalRegistration.typeSettings.singleParticipation': 'team',
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원1' },
      'generalRegistration.educationCurriculum.unitContentBySession': { 1: '내용1' },
      'generalRegistration.educationScheduleSettings.scheduleLines': [
        '26년 9월 16일(수) 9:22 ~ 10:22',
        '26년 9월 24일(목) 9:19 ~ 10:19',
      ],
    }

    const next = applyGeneralRegistrationOverlayToProgram(baseProgram(), overlay, {
      programType: 'curriculum',
      sessionRoundType: 'single',
      educationScheduleMode: 'date',
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      curriculumChartSessionCount: 1,
      participantOrganization: true,
    })

    expect(next.title).toBe('대표 프로그램명 (국문)')
    expect(next.titleEn).toBe('Program Title EN')
    expect(next.businessArea).toBe('진로취업')
    expect(next.partnerInvolvement).toBe(true)
    expect(next.institutionType).toBe('outside_school')
    expect(next.generalCommonInfo?.venueDetail).toBe('강의실 A')
    expect(next.partnerInvolvement).toBe(true)
    expect(next.generalCommonInfo?.paymentItems).toBe('해당없음')
    expect(next.ipOwned).toBe('JA')
    expect(next.courseDeliveredBy).toBe('Partner')
    expect(dayjs(next.startDate).format('YYYY-MM-DD')).toBe('2026-05-01')
    expect(dayjs(next.endDate).format('YYYY-MM-DD')).toBe('2026-11-30')
    expect(next.approvedStudentCount).toBe(100)
    expect(next.instructors).toBe(12)
    expect(next.generalVolunteers).toBe(5)
    expect(next.participatingSchoolCount).toBe(8)
    expect(next.generalSurveyMenuKeys).toEqual(['survey', 'lecture_evaluation'])
    expect(next.generalCommonInfo?.announcementTitle).toBe('공고용 프로그램명')
    expect(next.generalCommonInfo?.kpi).toEqual({
      finalParticipants: 100,
      instructorCount: 12,
      volunteerCount: 5,
      finalSchools: 8,
      finalClasses: 20,
    })
    expect(next.generalCommonInfo?.wageGradeRows?.[0]?.pricing).toContain('500,000')
    expect(next.generalCommonInfo?.curriculumSessions?.[0]).toMatchObject({
      sessionLabel: '1차시',
      title: '단원1',
      description: '내용1',
    })
    expect(next.generalCommonInfo?.educationFormLabel).toBeTruthy()
    expect(next.generalCommonInfo?.participationMethod).toBe('team')
    expect(next.type).toBe('offline')
    expect(next.ips).toBe('Prepare')
  })

  it('defaults partner yes and payment 해당없음 when overlay keys are missing', () => {
    const next = applyGeneralRegistrationOverlayToProgram(baseProgram(), {}, {
      programType: 'curriculum',
      sessionRoundType: 'single',
      curriculumChartSessionCount: 1,
    })
    expect(next.partnerInvolvement).toBe(true)
    expect(next.generalCommonInfo?.paymentItems).toBe('해당없음')
  })

  it('uses overlay detailedProgramName and paymentItemLabels', () => {
    const next = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      {
        'generalRegistration.basicInfo.partnerInvolvement': 'no',
        'generalRegistration.basicInfo.detailedProgramId': '163006',
        'generalRegistration.basicInfo.detailedProgramName': '특별한 JOB담',
        'generalRegistration.wageInfo.paymentItemLabels': '교통비(일반), 숙박비',
        'generalRegistration.basicInfo.sponsorManagerLine': '김담당 팀장 | 010-1234-5678',
        'generalRegistration.basicInfo.localManagerContactId': '1627251::1627253',
      },
      {
        programType: 'curriculum',
        sessionRoundType: 'single',
        curriculumChartSessionCount: 1,
      }
    )
    expect(next.partnerInvolvement).toBe(false)
    expect(next.generalCommonInfo?.detailedProgramName).toBe('특별한 JOB담')
    expect(next.detailedProgramId).toBe('163006')
    expect(next.textbookName).toBeUndefined()
    expect(next.generalCommonInfo?.paymentItems).toBe('교통비(일반), 숙박비')
    expect(next.generalCommonInfo?.sponsorManagerLine).toBe('김담당 팀장 | 010-1234-5678')
  })

  it('does not store contact ref as sponsorManagerLine', () => {
    const next = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      {
        'generalRegistration.basicInfo.localManagerContactId': '1627251::1627253',
      },
      {
        programType: 'curriculum',
        sessionRoundType: 'single',
        curriculumChartSessionCount: 1,
      }
    )
    expect(next.generalCommonInfo?.sponsorManagerLine).toBeUndefined()
  })
})

describe('normalizeRegistrationOverlayForApply', () => {
  it('maps trainedTeachersRegistration overlay keys to generalRegistration keys', () => {
    const normalized = normalizeRegistrationOverlayForApply(
      {
        'trainedTeachersRegistration.basicInfo.sponsorId': '42',
        'trainedTeachersRegistration.basicInfo.managerContactId': '99',
        'trainedTeachersRegistration.basicInfo.programTitleKo': '교육받은 교사 프로그램',
        'trainedTeachersRegistration.basicInfo.detailedProgramName': '1사1교 경제금융교육',
        'trainedTeachersRegistration.typeSettings.educationForm': 'offline',
      },
      'trainedTeachers'
    )

    expect(normalized['generalRegistration.basicInfo.localSponsorId']).toBe('42')
    expect(normalized['generalRegistration.basicInfo.localManagerContactId']).toBe('99')
    expect(normalized['generalRegistration.basicInfo.localProgramTitleKo']).toBe(
      '교육받은 교사 프로그램'
    )
    expect(normalized['generalRegistration.basicInfo.detailedProgramName']).toBe(
      '1사1교 경제금융교육'
    )
    expect(normalized['generalRegistration.typeSettings.educationForm']).toBe('offline')
    expect(normalized['generalRegistration.basicInfo.localSponsorIds']).toEqual(['42'])
  })
})
