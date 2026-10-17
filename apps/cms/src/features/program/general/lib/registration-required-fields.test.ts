import { describe, expect, it } from 'vitest'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import {
  describeIncompleteGeneralProgramRegistrationRequiredFields,
  hasIncompleteGeneralProgramRegistrationRequiredFields,
  type GeneralProgramRegistrationRequiredFieldContext,
} from './registration-required-fields'

function ctx(
  patch?: Partial<GeneralProgramRegistrationRequiredFieldContext>
): GeneralProgramRegistrationRequiredFieldContext {
  return {
    participant: {
      individual: true,
      organization: false,
      teacherInstructor: false,
      volunteer: false,
    },
    programType: 'curriculum',
    sessionRoundType: 'single',
    educationFormScheduleDetail: 'common',
    participationScheduleDetail: 'common',
    ipsScheduleDetail: 'common',
    curriculumSessionCount: 1,
    curriculumChartSessionCount: 1,
    scheduleCurriculumDetailCount: 1,
    scheduleCurriculumGroupCount: 1,
    scheduleCurriculumPreEducation: false,
    educationScheduleMode: 'date',
    sponsorId: 'sponsor-1',
    sponsorContactId: 'contact-1',
    programTitleKo: '테스트 프로그램',
    ...patch,
  }
}

function filledOverlay(patch?: Record<string, unknown>): Record<string, unknown> {
  return {
    'generalRegistration.basicInfo.programTitleEn': 'Test Program',
    'generalRegistration.basicInfo.publicProgramTitle': '공고용 프로그램',
    'generalRegistration.basicInfo.detailedProgramId': '163001',
    'generalRegistration.basicInfo.operationRangeSeal': {
      start: '2026-03-01T00:00:00.000Z',
      end: '2026-12-31T00:00:00.000Z',
    },
    'generalRegistration.basicInfo.businessField': 'economy',
    'generalRegistration.basicInfo.educationVenueDetail': '본관 3층',
    'generalRegistration.basicInfo.surveyItems': { survey: true, satisfaction: false, lecture_evaluation: false },
    'generalRegistration.basicInfo.educationCourse': 'ja',
    'generalRegistration.basicInfo.ipOwned': 'ja',
    'generalRegistration.basicInfo.courseDeliveredBy': 'ja',
    'generalRegistration.kpi.participantCount': 10,
    'generalRegistration.wageInfo.grade1Fee': 100000,
    'generalRegistration.wageInfo.grade2Fee': 80000,
    'generalRegistration.wageInfo.grade3Fee': 60000,
    'generalRegistration.wageInfo.paymentItemValues': ['instructor_fee'],
    'generalRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
    'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원 1' },
    'generalRegistration.educationCurriculum.unitContentBySession': { 1: '교육 내용' },
    'generalRegistration.educationScheduleSettings.scheduleLines': ['2026-04-01 10:00-12:00'],
    ...patch,
  }
}

describe('hasIncompleteGeneralProgramRegistrationRequiredFields', () => {
  it('빈 overlay면 미완료이다', () => {
    expect(hasIncompleteGeneralProgramRegistrationRequiredFields({}, ctx())).toBe(true)
  })

  it('공통 정보 필수값을 채우면 완료이다', () => {
    expect(hasIncompleteGeneralProgramRegistrationRequiredFields(filledOverlay(), ctx())).toBe(false)
  })

  it('후원사 담당자 미선택 sentinel이면 완료이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({ sponsorContactId: '__sponsor_contact_unselected__' })
      )
    ).toBe(false)
  })

  it('기관이어도 최종 파견 학교·학급 수 없이 완료이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({
          participant: {
            individual: false,
            organization: true,
            teacherInstructor: false,
            volunteer: false,
          },
        })
      )
    ).toBe(false)
  })

  it('대표 프로그램명(국문)이 비면 미완료이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({ programTitleKo: '   ' })
      )
    ).toBe(true)
  })

  it('강사 KPI는 강사 참여자일 때만 필수이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({
          participant: {
            individual: true,
            organization: false,
            teacherInstructor: true,
            volunteer: false,
          },
        })
      )
    ).toBe(true)
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({ 'generalRegistration.kpi.instructor': 3 }),
        ctx({
          participant: {
            individual: true,
            organization: false,
            teacherInstructor: true,
            volunteer: false,
          },
        })
      )
    ).toBe(false)
  })

  it('설문 진행 항목을 하나도 고르지 않아도 완료이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.basicInfo.surveyItems': {
            survey: false,
            satisfaction: false,
            lecture_evaluation: false,
          },
        }),
        ctx()
      )
    ).toBe(false)
  })

  it('교육 장소 상세는 기타(직접입력)일 때만 필수이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.basicInfo.educationVenueKind': 'inside',
          'generalRegistration.basicInfo.educationVenueDetail': '',
        }),
        ctx()
      )
    ).toBe(false)
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.basicInfo.educationVenueKind': 'outside',
          'generalRegistration.basicInfo.educationVenueDetail': '   ',
        }),
        ctx()
      )
    ).toBe(false)
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.basicInfo.educationVenueKind': 'other',
          'generalRegistration.basicInfo.educationVenueDetail': '',
        }),
        ctx()
      )
    ).toBe(true)
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.basicInfo.educationVenueKind': 'other',
          'generalRegistration.basicInfo.educationVenueDetail': '외부 교육장',
        }),
        ctx()
      )
    ).toBe(false)
  })

  it('일정형·사전 교육 ON — 일정명 overlay 미기록(UI 기본값)이어도 완료이다', () => {
    const overlay = filledOverlay({
      'generalRegistration.basicInfo.detailedProgramId': undefined,
      'generalRegistration.kpi.dispatchedSchool': 10,
      'generalRegistration.kpi.dispatchedClass': 5,
      'generalRegistration.typeSettings.ipsType': { category: 'succeed', detail: 'conference' },
      'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
        1: '세부 일정 내용',
      },
      'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': {
        1: [{ startTime: '08:46', endTime: '09:46' }],
      },
      'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
        0: '2026-09-18 08:46-09:46',
      },
      'generalRegistration.educationScheduleSettings.scheduleLines': [
        '2026-09-18(금) 08:46 ~ 09:46',
      ],
    })
    delete overlay['generalRegistration.educationScheduleCurriculum.preEducationName']

    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        overlay,
        ctx({
          participant: {
            individual: false,
            organization: true,
            teacherInstructor: false,
            volunteer: false,
          },
          programType: 'schedule',
          sessionRoundType: 'single',
          scheduleCurriculumPreEducation: true,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 1,
        })
      )
    ).toBe(false)
  })

  it('일정형·사전 교육 ON — 일정명을 비우면 미완료이다', () => {
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.kpi.dispatchedSchool': 10,
          'generalRegistration.kpi.dispatchedClass': 5,
          'generalRegistration.typeSettings.ipsType': { category: 'succeed', detail: 'conference' },
          'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
            1: '세부 일정 내용',
          },
          'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': {
            1: [{ startTime: '08:46', endTime: '09:46' }],
          },
          'generalRegistration.educationScheduleCurriculum.preEducationName': '   ',
          'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
            0: '2026-09-18 08:46-09:46',
          },
          'generalRegistration.educationScheduleSettings.scheduleLines': [
            '2026-09-18(금) 08:46 ~ 09:46',
          ],
        }),
        ctx({
          participant: {
            individual: false,
            organization: true,
            teacherInstructor: false,
            volunteer: false,
          },
          programType: 'schedule',
          sessionRoundType: 'single',
          scheduleCurriculumPreEducation: true,
        })
      )
    ).toBe(true)
  })

  it('일정형·사전 교육 ON — 진행 일정이 없으면 미완료이다', () => {
    const overlay = filledOverlay({
      'generalRegistration.basicInfo.detailedProgramId': undefined,
      'generalRegistration.kpi.dispatchedSchool': 10,
      'generalRegistration.kpi.dispatchedClass': 5,
      'generalRegistration.typeSettings.ipsType': { category: 'succeed', detail: 'conference' },
      'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
        1: '세부 일정 내용',
      },
      'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': {
        1: [{ startTime: '08:46', endTime: '09:46' }],
      },
      'generalRegistration.educationScheduleSettings.scheduleLines': [
        '2026-09-18(금) 08:46 ~ 09:46',
      ],
    })

    expect(
      describeIncompleteGeneralProgramRegistrationRequiredFields(
        overlay,
        ctx({
          participant: {
            individual: false,
            organization: true,
            teacherInstructor: false,
            volunteer: false,
          },
          programType: 'schedule',
          sessionRoundType: 'single',
          scheduleCurriculumPreEducation: true,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 1,
        })
      )
    ).toBe('scheduleCurriculum.preEducationScheduleDate')
  })

  it('일정형·replaceFirst(교육 연수) — 첫 세부 진행 일정이 없으면 미완료이다', () => {
    expect(
      describeIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.basicInfo.detailedProgramId': undefined,
          'generalRegistration.kpi.dispatchedSchool': 10,
          'generalRegistration.kpi.dispatchedClass': 5,
          'generalRegistration.typeSettings.ipsType': { category: 'succeed', detail: 'conference' },
          'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
            1: '교육 연수',
          },
          'generalRegistration.educationScheduleSettings.scheduleLines': [
            '2026-09-18(금) 08:46 ~ 09:46',
          ],
        }),
        ctx({
          participant: {
            individual: false,
            organization: true,
            teacherInstructor: false,
            volunteer: false,
          },
          programType: 'schedule',
          sessionRoundType: 'multi',
          scheduleCurriculumPreEducation: true,
          preEducationDisplayMode: 'replaceFirst',
          omitKpiAndWage: true,
          allowEmptySponsor: true,
          scheduleCurriculumDetailCount: 1,
        })
      )
    ).toBe('scheduleCurriculum.scheduleDate[1]')
  })

  it('커리큘럼·단일회차·사전 교육 ON — 진행 일정이 없으면 미완료이다', () => {
    expect(
      describeIncompleteGeneralProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({
          scheduleCurriculumPreEducation: true,
        })
      )
    ).toBe('curriculum.preEducationScheduleLine')
  })
})

it('커리큘럼·IPS 일정별 — Inspire 2차 미선택(빈 문자열)도「해당 없음」으로 완료이다', () => {
  const overlay = filledOverlay({
    'generalRegistration.basicInfo.programTitleEn': 'ㅇㅇ',
    'generalRegistration.basicInfo.publicProgramTitle': 'ㅇ이ㅣㅇ',
    'generalRegistration.basicInfo.detailedProgramId': '163006',
    'generalRegistration.basicInfo.businessField': 'career',
    'generalRegistration.basicInfo.educationVenueDetail': 'ㅂㅂㅂㅂㅂ',
    'generalRegistration.basicInfo.educationCourse': 'digital',
    'generalRegistration.basicInfo.ipOwned': 'partner',
    'generalRegistration.basicInfo.courseDeliveredBy': 'ja',
    'generalRegistration.kpi.participantCount': 1111,
    'generalRegistration.wageInfo.grade1Fee': 221,
    'generalRegistration.wageInfo.grade2Fee': 212,
    'generalRegistration.wageInfo.grade3Fee': 12,
    'generalRegistration.wageInfo.paymentItemValues': ['student_transport'],
    'generalRegistration.typeSettings.ipsType': { category: 'succeed', detail: '' },
    'generalRegistration.educationCurriculum.unitNameBySession': { 1: 'ㅈㅈㅈ', 2: 'ㅈㅈㅂㅈㅂㅈ' },
    'generalRegistration.educationCurriculum.unitContentBySession': { 1: 'ㅈㅂㅈㅈ', 2: 'ㅂㅂㅂ' },
    'generalRegistration.educationCurriculum.ipsBySession': {
      1: { category: 'prepare', detail: 'none' },
      2: { category: 'inspire', detail: '' },
    },
    'generalRegistration.educationScheduleSettings.scheduleLines': [
      '26년 9월 18일(금) 10:29 ~ 11:29',
      '26년 9월 22일(화) 10:29 ~ 11:29',
      '26년 9월 26일(토) 10:29 ~ 11:29',
    ],
  })
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      overlay,
      ctx({
        curriculumChartSessionCount: 2,
        ipsScheduleDetail: 'perSchedule',
      })
    )
  ).toBe(false)
})

it('reproduce org multi curriculum volunteer preEdu', () => {
  const overlay = filledOverlay({
    'generalRegistration.basicInfo.programTitleEn': 'ㅇㅇㅇㅇ',
    'generalRegistration.basicInfo.publicProgramTitle': 'ㅏㅏㅏㅏ',
    'generalRegistration.basicInfo.detailedProgramId': '163007',
    'generalRegistration.basicInfo.detailedProgramName': '대학생 멘토링',
    'generalRegistration.basicInfo.businessField': 'economy',
    'generalRegistration.basicInfo.educationVenueDetail': 'ㅋㅋㅋ',
    'generalRegistration.basicInfo.educationCourse': 'traditional',
    'generalRegistration.basicInfo.ipOwned': 'partner',
    'generalRegistration.basicInfo.courseDeliveredBy': 'partner',
    'generalRegistration.kpi.participantCount': 222,
    'generalRegistration.kpi.volunteer': 22,
    'generalRegistration.kpi.dispatchedSchool': 12,
    'generalRegistration.kpi.dispatchedClass': 222,
    'generalRegistration.wageInfo.grade1Fee': 1222,
    'generalRegistration.wageInfo.grade2Fee': 1222,
    'generalRegistration.wageInfo.grade3Fee': 1222,
    'generalRegistration.wageInfo.paymentItemValues': ['activity', 'lodging'],
    'generalRegistration.typeSettings.ipsType': { category: '', detail: '' },
    'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '3', 2: '5' },
    'generalRegistration.educationCurriculum.roundContentByRound': { 1: 'ㄴㄴㄴㄴ', 2: 'ㄴㅁㄴㅁㄴ' },
    'generalRegistration.educationCurriculum.educationFormBySession': {
      1: 'online_offline',
      2: 'offline',
    },
    'generalRegistration.educationCurriculum.ipsBySession': {
      1: { category: 'prepare', detail: 'none' },
      2: { category: 'inspire', detail: '' },
    },
    'generalRegistration.educationCurriculum.preEducationScheduleLine':
      '26년 9월 18일(금) 10:40 ~ 11:40',
    'generalRegistration.educationScheduleSettings.scheduleLines': [
      '26년 9월 18일(금) 10:40 ~ 11:40',
      '26년 9월 28일(월) 10:40 ~ 11:40',
    ],
  })
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      overlay,
      ctx({
        participant: {
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: true,
        },
        sessionRoundType: 'multi',
        curriculumSessionCount: 2,
        educationFormScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'perSchedule',
        scheduleCurriculumPreEducation: true,
      })
    )
  ).toBe(false)
})

it('기관·복수회차 — 과제 overlay 잔존해도 완료이다', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.basicInfo.detailedProgramId': '163007',
        'generalRegistration.basicInfo.detailedProgramName': '대학생 멘토링',
        'generalRegistration.kpi.volunteer': 22,
        'generalRegistration.kpi.dispatchedSchool': 12,
        'generalRegistration.kpi.dispatchedClass': 222,
        'generalRegistration.typeSettings.ipsType': { category: '', detail: '' },
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '3', 2: '5' },
        'generalRegistration.educationCurriculum.roundContentByRound': {
          1: 'ㄴㄴㄴㄴ',
          2: 'ㄴㅁㄴㅁㄴ',
        },
        'generalRegistration.educationCurriculum.ipsBySession': {
          1: { category: 'prepare', detail: 'none' },
          2: { category: 'inspire', detail: '' },
        },
        'generalRegistration.educationCurriculum.assignmentByRound': {
          1: { enabled: true, period: '' },
        },
        'generalRegistration.educationCurriculum.preEducationScheduleLine':
      '26년 9월 18일(금) 10:40 ~ 11:40',
        'generalRegistration.educationScheduleSettings.scheduleLines': [
          '26년 9월 18일(금) 10:40 ~ 11:40',
          '26년 9월 28일(월) 10:40 ~ 11:40',
        ],
      }),
      ctx({
        participant: {
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: true,
        },
        sessionRoundType: 'multi',
        curriculumSessionCount: 2,
        educationFormScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'perSchedule',
        scheduleCurriculumPreEducation: true,
      })
    )
  ).toBe(false)
})

it('개인·복수회차 — 과제 ON·기간 비어 있으면 미완료이다', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
        'generalRegistration.educationCurriculum.roundContentByRound': { 1: '내용' },
        'generalRegistration.educationCurriculum.ipsBySession': {
          1: { category: 'prepare', detail: 'none' },
        },
        'generalRegistration.educationCurriculum.assignmentByRound': {
          1: { enabled: true, period: '' },
        },
        'generalRegistration.educationCurriculum.participationBySession': {
          1: 'individual',
        },
      }),
      ctx({
        sessionRoundType: 'multi',
        curriculumSessionCount: 1,
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'perSchedule',
      })
    )
  ).toBe(true)
})

it('기관·복수회차·일정 공통 — 교육 형태 overlay가 비어도 기본 온라인으로 완료이다', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.kpi.dispatchedSchool': 33,
        'generalRegistration.kpi.dispatchedClass': 33,
        'generalRegistration.kpi.volunteer': 22,
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '2', 2: '2' },
        'generalRegistration.educationCurriculum.roundContentByRound': { 1: 'ㅇㅇ', 2: 'ㄹㄹㄹㄹ' },
      }),
      ctx({
        participant: {
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: true,
        },
        sessionRoundType: 'multi',
        curriculumSessionCount: 2,
        educationFormScheduleDetail: 'common',
      })
    )
  ).toBe(false)
})

it('IPS 1차 미선택이면 일정 공통에서도 미완료이다', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.typeSettings.ipsType': { category: '', detail: '' },
      }),
      ctx({ ipsScheduleDetail: 'common' })
    )
  ).toBe(true)
})

it('커리큘럼 — 세부 프로그램 id·name 모두 없으면 미완료이다', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.basicInfo.detailedProgramId': '',
        'generalRegistration.basicInfo.detailedProgramName': '',
      }),
      ctx()
    )
  ).toBe(true)
})

it('커리큘럼 — 세부 프로그램「해당없음」sentinel 은 미완료이다 (BE 마스터 id 필수)', () => {
  expect(
    describeIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.basicInfo.detailedProgramId': TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
        'generalRegistration.basicInfo.detailedProgramName': '해당없음',
      }),
      ctx()
    )
  ).toBe('basicInfo.detailedProgram')
})

it('커리큘럼 — 세부 프로그램 name 만 있고 id 가 비면 미완료이다', () => {
  expect(
    describeIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.basicInfo.detailedProgramId': '',
        'generalRegistration.basicInfo.detailedProgramName': '대학생 멘토링',
      }),
      ctx()
    )
  ).toBe('basicInfo.detailedProgram')
})

it('커리큘럼 — 숫자 마스터 id 면 완료이다', () => {
  expect(
    describeIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({ 'generalRegistration.basicInfo.detailedProgramId': '163006' }),
      ctx()
    )
  ).toBeNull()
})

it('일정형 — 세부 프로그램「해당없음」sentinel 이어도 완료이다', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.basicInfo.detailedProgramId': TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
        'generalRegistration.basicInfo.detailedProgramName': '해당없음',
        'generalRegistration.kpi.dispatchedSchool': 10,
        'generalRegistration.kpi.dispatchedClass': 5,
        'generalRegistration.educationScheduleCurriculum.eventNameByDetail': { 1: '세부 일정' },
        'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': {
          1: [{ startTime: '08:00', endTime: '09:00' }],
        },
      }),
      ctx({
        participant: {
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: false,
        },
        programType: 'schedule',
        sessionRoundType: 'single',
      })
    )
  ).toBe(false)
})

it('개인·복수회차·일정 공통 — 참여 방식 overlay가 비어도 기본 개인으로 완료이다', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1', 2: '1' },
        'generalRegistration.educationCurriculum.roundContentByRound': { 1: '내용1', 2: '내용2' },
      }),
      ctx({
        sessionRoundType: 'multi',
        curriculumSessionCount: 2,
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'common',
      })
    )
  ).toBe(false)
})

it('일정형·IPS 일정별 — 행별 overlay 없어도 Prepare 기본값으로 IPS 미완료 아님', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.basicInfo.detailedProgramId': undefined,
        'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
          1: '행사 1',
          2: '행사 2',
        },
        'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
          1: '2026-10-16 10:00-12:00',
          2: '2026-10-17 14:00-16:00',
        },
      }),
      ctx({
        programType: 'schedule',
        sessionRoundType: 'multi',
        educationFormScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'perSchedule',
        scheduleCurriculumDetailCount: 2,
      })
    )
  ).toBe(false)
})

it('일정형·복수 회차 — 진행 일정에 시각이 있으면 groupTimes 없이 완료이다', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.basicInfo.detailedProgramId': undefined,
        'generalRegistration.kpi.dispatchedSchool': 10,
        'generalRegistration.kpi.dispatchedClass': 5,
        'generalRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
        'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
          1: '행사 1',
          2: '행사 2',
          3: '행사 3',
        },
        'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
          1: '26년 10월 16일(금) 10:00 ~ 12:00',
          2: '26년 10월 11일(일) 9:30 ~ 12:00',
          3: '26년 10월 1일(목) 14:00 ~ 16:00',
        },
      }),
      ctx({
        participant: {
          individual: true,
          organization: false,
          teacherInstructor: false,
          volunteer: false,
        },
        programType: 'schedule',
        sessionRoundType: 'multi',
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'common',
        ipsScheduleDetail: 'common',
        scheduleCurriculumDetailCount: 3,
        scheduleCurriculumGroupCount: 1,
      })
    )
  ).toBe(false)
})

it('일정형·복수 회차 — 진행 일정이 날짜만이면 미완료이다', () => {
  expect(
    describeIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.basicInfo.detailedProgramId': undefined,
        'generalRegistration.kpi.dispatchedSchool': 10,
        'generalRegistration.kpi.dispatchedClass': 5,
        'generalRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
        'generalRegistration.educationScheduleCurriculum.eventNameByDetail': { 1: '행사 1' },
        'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
          1: '26년 10월 16일(금)',
        },
      }),
      ctx({
        programType: 'schedule',
        sessionRoundType: 'multi',
        scheduleCurriculumDetailCount: 1,
      })
    )
  ).toBe('scheduleCurriculum.scheduleDate[1]')
})

it('일정형·교육형태 일정별 — overlay 미기록이면 UI 기본 온라인으로 완료이다', () => {
  expect(
    hasIncompleteGeneralProgramRegistrationRequiredFields(
      filledOverlay({
        'generalRegistration.basicInfo.detailedProgramId': undefined,
        'generalRegistration.kpi.dispatchedSchool': 10,
        'generalRegistration.kpi.dispatchedClass': 5,
        'generalRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
        'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
          1: '세부 일정',
        },
        'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': {
          1: [{ startTime: '08:00', endTime: '09:00' }],
        },
      }),
      ctx({
        participant: {
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: false,
        },
        programType: 'schedule',
        sessionRoundType: 'single',
        educationFormScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'common',
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
      })
    )
  ).toBe(false)
})

const AUDIENCES = [
  {
    name: '개인',
    participant: {
      individual: true,
      organization: false,
      teacherInstructor: false,
      volunteer: false,
    },
  },
  {
    name: '기관',
    participant: {
      individual: false,
      organization: true,
      teacherInstructor: false,
      volunteer: false,
    },
  },
  {
    name: '개인+강사',
    participant: {
      individual: true,
      organization: false,
      teacherInstructor: true,
      volunteer: false,
    },
  },
  {
    name: '개인+봉사',
    participant: {
      individual: true,
      organization: false,
      teacherInstructor: false,
      volunteer: true,
    },
  },
  {
    name: '기관+봉사',
    participant: {
      individual: false,
      organization: true,
      teacherInstructor: false,
      volunteer: true,
    },
  },
] as const

describe('유형 매트릭스 — UI 기본값 overlay 미기록은 typeSettings 미입력으로 보지 않는다', () => {
  for (const audience of AUDIENCES) {
    for (const programType of ['curriculum', 'schedule'] as const) {
      for (const sessionRoundType of ['single', 'multi'] as const) {
        it(`${audience.name} · ${programType} · ${sessionRoundType} — 교육형태/참여방식 기본값`, () => {
          const overlay = filledOverlay({
            ...(audience.participant.teacherInstructor
              ? { 'generalRegistration.kpi.instructor': 1 }
              : {}),
            ...(audience.participant.volunteer ? { 'generalRegistration.kpi.volunteer': 2 } : {}),
            ...(!audience.participant.individual
              ? {
                  'generalRegistration.kpi.dispatchedSchool': 3,
                  'generalRegistration.kpi.dispatchedClass': 4,
                }
              : {}),
            ...(programType === 'curriculum' && sessionRoundType === 'multi'
              ? {
                  'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
                  'generalRegistration.educationCurriculum.roundContentByRound': { 1: '내용' },
                }
              : {}),
            ...(programType === 'schedule'
              ? sessionRoundType === 'multi'
                ? {
                    'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
                      1: '세부 일정',
                    },
                    'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
                      1: '2026-10-16 10:00-12:00',
                    },
                  }
                : {
                    'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
                      1: '세부 일정',
                    },
                    'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': {
                      1: [{ startTime: '08:00', endTime: '09:00' }],
                    },
                  }
              : {}),
          })
          const reason = describeIncompleteGeneralProgramRegistrationRequiredFields(
            overlay,
            ctx({
              participant: { ...audience.participant },
              programType,
              sessionRoundType,
              educationFormScheduleDetail: 'common',
              participationScheduleDetail: 'common',
            })
          )
          expect(reason).not.toBe('typeSettings.multiCommonEducationForm')
          expect(reason).not.toBe('typeSettings.multiCommonParticipation')
          expect(reason).toBeNull()
        })
      }
    }
  }
})
