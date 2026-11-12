import { describe, expect, it } from 'vitest'
import {
  describeIncompleteTrainedTeachersProgramRegistrationRequiredFields,
  hasIncompleteTrainedTeachersProgramRegistrationRequiredFields,
  listIncompleteTrainedTeachersProgramRegistrationRequiredFieldLabels,
  type TrainedTeachersRegistrationRequiredFieldContext,
} from './trained-teachers-program-registration-required-fields'

const orgParticipant = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
} as const

function ctx(
  patch?: Partial<TrainedTeachersRegistrationRequiredFieldContext>
): TrainedTeachersRegistrationRequiredFieldContext {
  return {
    participant: { ...orgParticipant },
    programType: 'curriculum',
    sessionRoundType: 'single',
    educationFormScheduleDetail: 'common',
    participationScheduleDetail: 'common',
    ipsScheduleDetail: 'common',
    curriculumSessionCount: 1,
    curriculumChartSessionCount: 2,
    scheduleCurriculumDetailCount: 1,
    scheduleCurriculumGroupCount: 1,
    teacherTrainingEnabled: false,
    educationScheduleMode: 'date',
    sponsorId: '',
    sponsorContactId: '',
    programTitleKo: '교육받은 교사 프로그램',
    ...patch,
  }
}

function filledOverlay(patch?: Record<string, unknown>): Record<string, unknown> {
  return {
    'trainedTeachersRegistration.basicInfo.programTitleEn': 'Trained Teachers',
    'trainedTeachersRegistration.basicInfo.publicProgramTitle': '공고용 프로그램',
    'trainedTeachersRegistration.basicInfo.detailedProgramId': '163006',
    'trainedTeachersRegistration.basicInfo.operationRangeSeal': {
      start: '2026-03-01T00:00:00.000Z',
      end: '2026-12-31T00:00:00.000Z',
    },
    'trainedTeachersRegistration.basicInfo.businessField': 'economy',
    'trainedTeachersRegistration.basicInfo.educationCourse': 'ja',
    'trainedTeachersRegistration.basicInfo.ipOwned': 'ja',
    'trainedTeachersRegistration.basicInfo.courseDeliveredBy': 'ja',
    'trainedTeachersRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
    'trainedTeachersRegistration.educationCurriculum.unitNameBySession': {
      1: '단원 1',
      2: '단원 2',
    },
    'trainedTeachersRegistration.educationCurriculum.unitContentBySession': {
      1: '교육 내용 1',
      2: '교육 내용 2',
    },
    'trainedTeachersRegistration.educationScheduleSettings.scheduleLines': [
      '2026-04-01 10:00-12:00',
    ],
    ...patch,
  }
}

describe('hasIncompleteTrainedTeachersProgramRegistrationRequiredFields', () => {
  it('빈 overlay면 미완료이다', () => {
    expect(hasIncompleteTrainedTeachersProgramRegistrationRequiredFields({}, ctx())).toBe(true)
  })

  it('빈 overlay면 누락된 화면 라벨을 모두 돌려준다', () => {
    const labels = listIncompleteTrainedTeachersProgramRegistrationRequiredFieldLabels({}, ctx())
    expect(labels).toEqual(
      expect.arrayContaining([
        '대표 프로그램명 (영문)',
        '공고용 프로그램명',
        '세부 프로그램명',
        '사업 운영 기간',
        '사업 분야',
        '교육 과정',
        'IP Owned',
        'Course Delivered By',
        'IPS 유형',
        '1차시 단원명',
        '1차시 교육 내용',
        '교육 진행 예정일',
      ])
    )
    expect(labels).not.toContain('후원사')
    expect(labels).not.toContain('후원사 담당자')
  })

  it('필수값을 채우면 누락 라벨이 없다', () => {
    expect(
      listIncompleteTrainedTeachersProgramRegistrationRequiredFieldLabels(filledOverlay(), ctx())
    ).toEqual([])
  })

  it('KPI·임금 없이도 필수값을 채우면 완료이다', () => {
    expect(hasIncompleteTrainedTeachersProgramRegistrationRequiredFields(filledOverlay(), ctx())).toBe(
      false
    )
  })

  it('후원사만 선택하고 담당자 미선택(빈 contact)이어도 완료이다', () => {
    expect(
      hasIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({ sponsorId: '163302', sponsorContactId: '' })
      )
    ).toBe(false)
  })

  it('후원사 전체(빈 값)는 완료이다', () => {
    expect(
      hasIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({ sponsorId: '', sponsorContactId: '' })
      )
    ).toBe(false)
  })

  it('커리큘럼·교사 연수 ON — 별도 블록이라 진행 일정(시간 포함)이 없으면 미완료이다', () => {
    expect(
      describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        filledOverlay(),
        ctx({ teacherTrainingEnabled: true })
      )
    ).toBe('curriculum.preEducationScheduleLine')
    // 날짜만 있고 시간이 없으면 미완료
    expect(
      describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.educationCurriculum.preEducationScheduleLine': '2026.04.01(수)',
        }),
        ctx({ teacherTrainingEnabled: true })
      )
    ).toBe('curriculum.preEducationScheduleLine')
  })

  it('커리큘럼·교사 연수 ON — 진행 일정을 채우면 완료이고 차시 번호는 그대로다', () => {
    expect(
      hasIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        filledOverlay({
          'generalRegistration.educationCurriculum.preEducationScheduleLine':
            '2026.04.01(수) 10:00 ~ 12:00',
        }),
        ctx({ teacherTrainingEnabled: true })
      )
    ).toBe(false)
  })

  it('일정형·복수회차·교육 연수 ON — 첫 세부 진행 일정이 없으면 미완료이다', () => {
    expect(
      describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        filledOverlay({
          'trainedTeachersRegistration.educationScheduleCurriculum.eventNameByDetail': {
            1: '교육 연수',
          },
        }),
        ctx({
          programType: 'schedule',
          sessionRoundType: 'multi',
          teacherTrainingEnabled: true,
          scheduleCurriculumDetailCount: 1,
        })
      )
    ).toBe('scheduleCurriculum.scheduleDate[1]')
  })

  it('일정형·복수회차·교육 연수 ON — 진행 일정을 채우면 완료이다', () => {
    expect(
      hasIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        filledOverlay({
          'trainedTeachersRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
            1: '2026-04-20 09:30-12:20',
          },
        }),
        ctx({
          programType: 'schedule',
          sessionRoundType: 'multi',
          teacherTrainingEnabled: true,
          scheduleCurriculumDetailCount: 1,
        })
      )
    ).toBe(false)
  })

  it('일정형·복수회차·교육 연수 ON — 날짜만 있으면 미완료이다', () => {
    expect(
      describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        filledOverlay({
          'trainedTeachersRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
            1: '2026-04-20',
          },
        }),
        ctx({
          programType: 'schedule',
          sessionRoundType: 'multi',
          teacherTrainingEnabled: true,
          scheduleCurriculumDetailCount: 1,
        })
      )
    ).toBe('scheduleCurriculum.scheduleDate[1]')
  })
})
