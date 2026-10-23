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
    expect(next.generalCommonInfo?.venueKind).toBe('outside')
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
    expect(next.generalCommonInfo?.scheduleDetails).toEqual([])
    expect(next.generalCommonInfo?.educationFormLabel).toBeTruthy()
    expect(next.generalCommonInfo?.participationMethod).toBeUndefined()
    expect(next.type).toBe('offline')
    expect(next.ips).toBe('Prepare')
    expect(next.generalCommonInfo?.educationScheduleLines).toEqual([
      '26년 9월 16일(수) 9:22 ~ 10:22',
      '26년 9월 24일(목) 9:19 ~ 10:19',
    ])
  })

  it('keeps participationMethod for individual audience programs', () => {
    const next = applyGeneralRegistrationOverlayToProgram(
      {
        ...baseProgram(),
        generalProgramAudience: 'individual',
        generalParticipantTypes: ['individual'],
      },
      {
        'generalRegistration.typeSettings.singleParticipation': 'team',
      },
      {
        programType: 'curriculum',
        sessionRoundType: 'single',
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'common',
        ipsScheduleDetail: 'common',
        curriculumChartSessionCount: 1,
        participantOrganization: false,
      }
    )
    expect(next.generalCommonInfo?.participationMethod).toBe('team')
  })

  it('복수 회차 extras여도 단원 맵이 더 많으면 교육 진행을 단원 맵으로 저장한다', () => {
    const next = applyGeneralRegistrationOverlayToProgram(
      {
        ...baseProgram(),
        generalProgramAudience: 'individual',
        generalParticipantTypes: ['individual'],
        generalProgramSessionRound: 'multi',
        generalCommonInfo: {
          ...baseProgram().generalCommonInfo,
          curriculumSessions: [
            {
              sessionLabel: '1회차',
              title: '1차시',
              description: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
              assignmentEnabled: true,
              assignmentPeriod: '26년 10월 13일(화) 10:00 ~ 12:00',
              ipsTypeSummary: 'Succeed | Competition (대회+시상)',
            },
          ],
        },
      },
      {
        'generalRegistration.educationCurriculum.unitNameBySession': {
          1: '개인 커리큘럼 단일1',
          2: '개인 커리큘럼 단일2',
        },
        'generalRegistration.educationCurriculum.unitContentBySession': {
          1: '개인 커리큘럼 단일11',
          2: '개인 커리큘럼 단일22',
        },
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
        'generalRegistration.educationCurriculum.roundContentByRound': {
          1: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
        },
        'generalRegistration.educationCurriculum.ipsBySession': {
          1: { category: 'succeed', detail: 'competition' },
          2: { category: 'prepare', detail: 'none' },
        },
        'generalRegistration.educationCurriculum.assignmentByRound': {
          1: { enabled: true, period: '26년 10월 13일(화) 10:00 ~ 12:00' },
        },
      },
      {
        programType: 'curriculum',
        sessionRoundType: 'multi',
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'common',
        ipsScheduleDetail: 'perSchedule',
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 1,
        participantOrganization: false,
      }
    )

    expect(next.generalCommonInfo?.curriculumSessions).toEqual([
      expect.objectContaining({
        sessionLabel: '1회차',
        title: '개인 커리큘럼 단일1',
        description: '개인 커리큘럼 단일11',
        ipsTypeSummary: expect.stringMatching(/Succeed/),
      }),
      expect.objectContaining({
        sessionLabel: '2회차',
        title: '개인 커리큘럼 단일2',
        description: '개인 커리큘럼 단일22',
        ipsTypeSummary: expect.stringMatching(/Prepare/),
      }),
    ])
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

  it('keeps stored partner no and kpi when overlay keys are missing', () => {
    const next = applyGeneralRegistrationOverlayToProgram(
      {
        ...baseProgram(),
        partnerInvolvement: false,
        approvedStudentCount: 40,
        instructors: 3,
        generalVolunteers: 2,
        participatingSchoolCount: 6,
        generalCommonInfo: {
          ...baseProgram().generalCommonInfo,
          kpi: {
            finalParticipants: 40,
            instructorCount: 3,
            volunteerCount: 2,
            finalSchools: 6,
            finalClasses: 9,
          },
        },
      },
      {},
      {
        programType: 'curriculum',
        sessionRoundType: 'single',
        curriculumChartSessionCount: 1,
      }
    )
    expect(next.partnerInvolvement).toBe(false)
    expect(next.generalCommonInfo?.kpi).toEqual({
      finalParticipants: 40,
      instructorCount: 3,
      volunteerCount: 2,
      finalSchools: 6,
      finalClasses: 9,
    })
    expect(next.approvedStudentCount).toBe(40)
  })

  it('does not restore stored kpi when overlay kpi keys were cleared to null', () => {
    const next = applyGeneralRegistrationOverlayToProgram(
      {
        ...baseProgram(),
        approvedStudentCount: 40,
        instructors: 3,
        generalVolunteers: 2,
        generalCommonInfo: {
          ...baseProgram().generalCommonInfo,
          kpi: {
            finalParticipants: 40,
            instructorCount: 3,
            volunteerCount: 2,
            finalSchools: 6,
            finalClasses: 9,
          },
        },
      },
      {
        'generalRegistration.kpi.participantCount': null,
        'generalRegistration.kpi.instructor': null,
        'generalRegistration.kpi.volunteer': null,
      },
      {
        programType: 'curriculum',
        sessionRoundType: 'single',
        curriculumChartSessionCount: 1,
      }
    )
    expect(next.generalCommonInfo?.kpi).toMatchObject({
      finalParticipants: 0,
      instructorCount: 0,
      volunteerCount: 0,
    })
    expect(next.approvedStudentCount).toBe(0)
    expect(next.instructors).toBe(0)
    expect(next.generalVolunteers).toBe(0)
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
    expect(next.generalCommonInfo?.sponsorManagerContactIds).toEqual(['1627251::1627253'])
    expect(next.generalCommonInfo?.sponsorManagerContactId).toBe('1627251::1627253')
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
    expect(next.generalCommonInfo?.sponsorManagerContactIds).toEqual(['1627251::1627253'])
  })

  it('maps multiple manager contact refs from overlay array', () => {
    const next = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      {
        'generalRegistration.basicInfo.localSponsorIds': ['1627251', '163302'],
        'generalRegistration.basicInfo.localManagerContactIds': [
          '1627251::1627253',
          '163302::111',
        ],
        'generalRegistration.basicInfo.sponsorManagerLine':
          '김담당 팀장 | 010-1234-5678, 이담당 책임 | 010-9999-0000',
      },
      {
        programType: 'curriculum',
        sessionRoundType: 'single',
        curriculumChartSessionCount: 1,
      }
    )
    expect(next.generalCommonInfo?.sponsorManagementIds).toEqual(['1627251', '163302'])
    expect(next.generalCommonInfo?.sponsorManagerContactIds).toEqual([
      '1627251::1627253',
      '163302::111',
    ])
    expect(next.generalCommonInfo?.sponsorManagerContactId).toBe('1627251::1627253')
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
    expect(normalized['generalRegistration.typeSettings.singleEducationForm']).toBe('offline')
    expect(normalized['generalRegistration.basicInfo.localSponsorIds']).toEqual(['42'])
    expect(normalized['generalRegistration.basicInfo.localManagerContactIds']).toEqual(['99'])
  })
})

describe('trained teacher curriculum overlay', () => {
  it('replaces the first session with 교육 연수 without prepending an extra block', () => {
    const overlay = normalizeRegistrationOverlayForApply(
      {
        'trainedTeachersRegistration.educationCurriculum.unitNameBySession': {
          1: '단원1',
          2: '단원2',
        },
        'trainedTeachersRegistration.educationCurriculum.unitContentBySession': {
          1: '내용1',
          2: '내용2',
        },
      },
      'trainedTeachers'
    )
    const next = applyGeneralRegistrationOverlayToProgram(baseProgram(), overlay, {
      programType: 'curriculum',
      sessionRoundType: 'single',
      curriculumChartSessionCount: 2,
      scheduleCurriculumPreEducation: true,
      teacherTrainingEnabled: true,
      participantOrganization: true,
    })

    expect(next.generalCommonInfo?.teacherTrainingEnabled).toBe(true)
    expect(next.generalCommonInfo?.curriculumSessions).toEqual([
      expect.objectContaining({
        sessionLabel: '교육 연수',
        title: '단원1',
        description: '내용1',
        ipsTypeSummary: 'Prepare | 해당없음',
      }),
      expect.objectContaining({ sessionLabel: '2차시', title: '단원2', description: '내용2' }),
    ])
  })
})

describe('trained teacher schedule-type detailedProgramName (버그 수정)', () => {
  it('일정형이어도 사용자가 선택한 세부 프로그램명을 스케줄 상세명으로 덮어쓰지 않는다', () => {
    const overlay = normalizeRegistrationOverlayForApply(
      {
        'trainedTeachersRegistration.basicInfo.detailedProgramId': '163006',
        'trainedTeachersRegistration.basicInfo.detailedProgramName': '실제 선택한 세부 프로그램명',
        'trainedTeachersRegistration.educationScheduleSettings.scheduleLines': [
          '삭제 가능 샘플',
        ],
      },
      'trainedTeachers'
    )

    const next = applyGeneralRegistrationOverlayToProgram(baseProgram(), overlay, {
      programType: 'schedule',
      sessionRoundType: 'single',
      scheduleCurriculumDetailCount: 1,
      isTrainedTeachers: true,
    })

    expect(next.generalCommonInfo?.detailedProgramName).toBe('실제 선택한 세부 프로그램명')
    expect(next.detailedProgramId).toBe('163006')
  })

  it('(대조군) 일반 일정형은 여전히 세부 프로그램명이 스케줄 상세명으로 잠긴다', () => {
    const next = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      {
        'generalRegistration.basicInfo.detailedProgramId': '163006',
        'generalRegistration.basicInfo.detailedProgramName': '실제 선택한 세부 프로그램명',
      },
      {
        programType: 'schedule',
        sessionRoundType: 'single',
        scheduleCurriculumDetailCount: 1,
      }
    )

    expect(next.generalCommonInfo?.detailedProgramName).not.toBe('실제 선택한 세부 프로그램명')
    expect(next.detailedProgramId).toBeUndefined()
    expect(
      Object.prototype.hasOwnProperty.call(next.generalCommonInfo, 'detailedProgramId')
    ).toBe(false)
  })

  it('커리큘럼형 — 수동 선택한 세부 프로그램명이 그대로 반영된다', () => {
    const overlay = normalizeRegistrationOverlayForApply(
      {
        'trainedTeachersRegistration.basicInfo.detailedProgramId': '163006',
        'trainedTeachersRegistration.basicInfo.detailedProgramName': '실제 선택한 세부 프로그램명',
      },
      'trainedTeachers'
    )

    const next = applyGeneralRegistrationOverlayToProgram(baseProgram(), overlay, {
      programType: 'curriculum',
      sessionRoundType: 'single',
      isTrainedTeachers: true,
    })

    expect(next.generalCommonInfo?.detailedProgramName).toBe('실제 선택한 세부 프로그램명')
    expect(next.detailedProgramId).toBe('163006')
    expect(next.textbookName).toBeUndefined()
  })

  it('참여자 extras가 모두 있으면 generalParticipantTypes를 등록과 같이 반영한다', () => {
    const next = applyGeneralRegistrationOverlayToProgram(baseProgram(), {}, {
      programType: 'curriculum',
      sessionRoundType: 'single',
      participantIndividual: false,
      participantOrganization: true,
      participantTeacherInstructor: true,
      participantVolunteer: false,
    })
    expect(next.generalParticipantTypes).toEqual(['school_institution', 'teacher_instructor'])
    expect(next.generalProgramAudience).toBe('organization')
  })
})

describe('일정형 사전 교육 overlay 교육 형태', () => {
  it('educationFormByDetail 0을 사전 교육 행에 넣는다', () => {
    const next = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      {
        'generalRegistration.educationScheduleCurriculum.preEducationName': '사전 교육',
        'generalRegistration.educationScheduleCurriculum.educationFormByDetail': {
          0: 'offline',
        },
        'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
          1: '오리엔테이션',
        },
      },
      {
        programType: 'schedule',
        sessionRoundType: 'single',
        scheduleCurriculumPreEducation: true,
        scheduleCurriculumDetailCount: 1,
        educationFormScheduleDetail: 'common',
      }
    )

    expect(next.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(next.generalCommonInfo?.scheduleDetails?.[0]).toEqual(
      expect.objectContaining({
        scheduleLabel: '사전 교육',
        educationFormLabel: '오프라인',
      })
    )
  })
})
