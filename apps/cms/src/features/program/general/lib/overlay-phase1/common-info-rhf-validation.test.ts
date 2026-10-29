/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  listIncompleteGeneralProgramRegistrationRequiredFields,
  type GeneralProgramRegistrationRequiredFieldContext,
} from '@/features/program/general/lib/registration-required-fields'
import { extrasFromGeneralProgram } from '@/features/program/general/lib/registration-overlay-sync'
import {
  EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE,
  programToGeneralCommonInfoEditValues,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  applyCurriculumPreEducationBlock,
  applyEducationStructureChangeToForm,
  applySchedulePreEducationBlock,
  applySessionRoundChangeToForm,
  createEmptyScheduleDetailBlock,
  PRE_EDUCATION_SCHEDULE_LABEL,
} from '@/features/program/general/lib/schedule-detail-form'
import { createGeneralProgramCommonInfoIndependentSave } from './common-info-independent-save'
import { deriveIndependentEditorExtrasFromProgram } from './common-info-domain'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import {
  curriculumRegularSessionContentValidationKeys,
  hasRhfCurriculumMultiDateScheduleCountMismatch,
  parseGeneralCommonInfoRhfValidation,
  resolveGeneralCommonInfoValidationAlert,
} from './common-info-rhf-validation'
import {
  GENERAL_COMMON_INFO_VALIDATION_UX_STATUS,
  GENERAL_DETAIL_REQUIRED_VALIDATION_STATUS,
} from './general-detail-rhf-save-path'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import { findEducationScheduleLinesOutsideOperationRange } from '@/features/program/shared/lib/education-schedule-change'

function validValues(
  patch: Partial<GeneralProgramCommonInfoEditFormValues> = {}
): GeneralProgramCommonInfoEditFormValues {
  return {
    mainTitle: '대표명',
    titleEn: 'Title EN',
    announcementTitle: '공고명',
    detailedProgramId: 'dp-1',
    startDate: '2026-10-31',
    endDate: '2026-11-01',
    businessArea: '경제금융',
    sponsorManagementIds: ['sponsor-1'],
    sponsorManagerContactIds: ['contact-1'],
    sponsorManagerContactId: 'contact-1',
    venueKind: 'inside',
    venueDetail: '',
    surveySurvey: false,
    surveySatisfaction: false,
    surveyLectureEvaluation: false,
    educationProcess: 'traditional_paper',
    ipOwned: 'ja',
    courseDeliveredBy: 'ja',
    partnerInvolvement: 'no',
    kpiFinalParticipants: 10,
    kpiInstructorCount: 0,
    kpiVolunteerCount: 0,
    kpiFinalSchools: 0,
    kpiFinalClasses: 0,
    wageGrade1Amount: '140000',
    wageGrade2Amount: '120000',
    wageGrade3Amount: '100000',
    wagePaymentItemIds: ['p-1'],
    wageDeductionItems: '',
    educationStructure: 'curriculum',
    sessionRound: 'single',
    educationForm: 'offline',
    educationFormScheduleDetail: 'common',
    educationPlaceScheduleDetail: 'common',
    educationPlaceAddress: '서울특별시 중구 세종대로 110',
    participationScheduleDetail: 'common',
    ipsScheduleDetail: 'common',
    ipsCategory: 'prepare',
    ipsDetail: 'none',
    participationMethod: 'individual',
    participantIndividual: true,
    participantOrganization: false,
    participantTeacherInstructor: false,
    participantVolunteer: false,
    curriculumSessions: [
      {
        sessionLabel: '1차시',
        title: '필요와 욕구',
        description: '본문',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'offline',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
    ],
    scheduleGroupCount: 1,
    scheduleDetails: [],
    scheduleCurriculumPreEducation: false,
    educationScheduleMode: 'date',
    educationScheduleLines: ['26년 10월 31일(토) 10:00 ~ 12:00'],
    ...patch,
  }
}

function programFromSessions(
  sessions: NonNullable<Program['generalCommonInfo']>['curriculumSessions']
): Program {
  const now = '2026-10-21T00:00:00.000Z'
  return {
    id: '186307',
    sponsorId: 'sponsor-1',
    title: '대표명',
    mainTitle: '대표명',
    titleEn: 'Title EN',
    detailedProgramId: 'dp-1',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-10-31T00:00:00.000Z',
    endDate: '2026-11-01T00:00:00.000Z',
    status: 'pending',
    businessArea: '경제금융',
    educationProcess: 'Traditional (Paper)',
    ipOwned: 'JA',
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalParticipantTypes: ['individual'],
    generalCommonInfo: {
      announcementTitle: '공고명',
      curriculumSessions: sessions,
      educationScheduleLines: ['26년 10월 31일(토) 10:00 ~ 12:00'],
    },
    registrationOverlay: {
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '필요와 욕구' },
      'generalRegistration.educationCurriculum.unitContentBySession': { 1: '본문' },
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

describe('일반 상세 공통정보 RHF 필수 검증', () => {
  it('판정 상수는 FIXED 이다', () => {
    expect(GENERAL_DETAIL_REQUIRED_VALIDATION_STATUS).toBe(
      'GENERAL_DETAIL_REQUIRED_VALIDATION_FIXED'
    )
    expect(GENERAL_COMMON_INFO_VALIDATION_UX_STATUS).toBe(
      'GENERAL_COMMON_INFO_VALIDATION_UX_READY'
    )
  })

  it('VAL-01 일반 커리큘럼 2개 모두 입력', () => {
    const result = parseGeneralCommonInfoRhfValidation(
      validValues({
        curriculumSessions: [
          { sessionLabel: '1차시', title: '단원1', description: '본문1' },
          { sessionLabel: '2차시', title: '단원2', description: '본문2' },
        ],
      })
    )
    expect(result.ok).toBe(true)
  })

  it('VAL-02 2개 중 1개 명시 삭제 — 남은 1개만 검증', () => {
    const values = validValues({
      curriculumSessions: [{ sessionLabel: '1차시', title: '단원1', description: '본문1' }],
    })
    const result = parseGeneralCommonInfoRhfValidation(values)
    expect(result.ok).toBe(true)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values,
      program: programFromSessions([
        { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '본문1' },
        { sessionNo: 2, sessionLabel: '2차시', title: '단원2', description: '본문2' },
      ]),
      changedFormKeys: new Set(['curriculumSessions']),
    })
    expect(save.patch.generalCommonInfo?.curriculumSessions).toHaveLength(1)
    expect(save.patch.generalCommonInfo?.curriculumSessions?.[0]?.sessionLabel).toBe('1차시')
  })

  it('VAL-03 사전교육 1개 + 일반 1차시 — 일반 회차는 1개', () => {
    const values = validValues({
      scheduleCurriculumPreEducation: true,
      curriculumSessions: [
        {
          sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL,
          title: '사전 교육ㅋㅋㅋ',
          description: '',
          scheduleDate: '26년 10월 31일(토) 18:43 ~ 19:43',
        },
        { sessionLabel: '1차시', title: '필요와 욕구', description: '본문' },
      ],
    })
    expect(parseGeneralCommonInfoRhfValidation(values).ok).toBe(true)
    const extras = deriveIndependentEditorExtrasFromProgram(
      programFromSessions([
        { sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL, title: '사전 교육ㅋㅋㅋ', description: '' },
        { sessionLabel: '1차시', title: '필요와 욕구', description: '본문' },
      ])
    )
    expect(extras.curriculumChartSessionCount).toBe(1)
  })

  it('VAL-04 사전교육 ON/OFF — 일반 회차 개수 불변', () => {
    const regular = [{ sessionLabel: '1차시', title: '단원1', description: '본문1' }]
    const on = applyCurriculumPreEducationBlock(regular, true, 'single')
    const off = applyCurriculumPreEducationBlock(on, false, 'single')
    expect(on.filter(session => session.sessionLabel !== PRE_EDUCATION_SCHEDULE_LABEL)).toHaveLength(
      1
    )
    expect(off.filter(session => session.sessionLabel !== PRE_EDUCATION_SCHEDULE_LABEL)).toHaveLength(
      1
    )
  })

  it('VAL-05 기존 GET 2개, UI에도 2개 — 시드가 내용을 보존한다', () => {
    const values = programToGeneralCommonInfoEditValues(
      programFromSessions([
        { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '본문1' },
        { sessionNo: 2, sessionLabel: '2차시', title: '단원2', description: '본문2' },
      ])
    )
    expect(values.curriculumSessions).toHaveLength(2)
    expect(values.curriculumSessions.map(row => row.title)).toEqual(['단원1', '단원2'])
  })

  it('VAL-06 기존 GET 2개 중 끝 placeholder 는 숨김이 아니라 trailing blank trim', () => {
    const values = programToGeneralCommonInfoEditValues(
      programFromSessions([
        {
          sessionNo: 1,
          sessionLabel: '1차시',
          title: '필요와 욕구, 현명한 소비12121212',
          description: '본문',
        },
        { sessionNo: 2, sessionLabel: '2차시', title: '2차시', description: '' },
      ])
    )
    expect(values.curriculumSessions).toHaveLength(1)
    expect(values.curriculumSessions[0]?.title).toBe('필요와 욕구, 현명한 소비12121212')
  })

  it('VAL-07 일반 1차시 제목 비움', () => {
    const result = parseGeneralCommonInfoRhfValidation(
      validValues({
        curriculumSessions: [{ sessionLabel: '1차시', title: '', description: '본문' }],
      })
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toBe('1차시 제목을 입력해주세요')
    expect(result.keys).toContain('curriculum.unitName[1]')
  })

  it('기관 커리큘럼 복수 회차 — 회차 추가 기본값 title 1 과 빈 내용은 2회차를 차단한다', () => {
    const values = validValues({
      participantOrganization: true,
      participantIndividual: false,
      sessionRound: 'multi',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      scheduleCurriculumPreEducation: true,
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 11월 5일(목) 00:42 ~ 07:42',
        '26년 11월 16일(월) 02:43 ~ 01:43',
      ],
      curriculumSessions: [
        {
          sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL,
          title: '사전교육',
          description: '',
          scheduleDate: '26년 11월 5일(목) 00:42 ~ 07:42',
        },
        {
          sessionLabel: '1회차',
          title: '1',
          description: 'aaaaaa',
          educationForm: 'online',
          participationMethod: 'individual',
          ipsCategory: 'succeed',
          ipsDetail: 'competition',
        },
        {
          sessionLabel: '2회차',
          title: '1',
          description: '',
          educationForm: 'online',
          participationMethod: 'individual',
          ipsCategory: 'inspire',
          ipsDetail: 'podcast',
        },
      ],
    })
    const result = parseGeneralCommonInfoRhfValidation(values)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toBe('2회차 내용을 입력해주세요')
    expect(result.alertKind).toBe('required-incomplete')
    expect(result.keys).toContain('curriculum.unitContent[2]')
    expect(resolveGeneralCommonInfoValidationAlert(result)).toEqual({
      title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
      content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
    })
    expect(result.issues.some(issue => issue.path.join('.') === 'curriculumSessions.2.description')).toBe(
      true
    )
    expect(curriculumRegularSessionContentValidationKeys(2)).toEqual(
      expect.arrayContaining(['curriculum.unitContent[2]', 'curriculum.roundContent[2]'])
    )
    expect(hasRhfCurriculumMultiDateScheduleCountMismatch(values)).toBe(false)
  })

  it('VAL-08 일반 1차시 내용 비움', () => {
    const result = parseGeneralCommonInfoRhfValidation(
      validValues({
        curriculumSessions: [{ sessionLabel: '1차시', title: '필요와 욕구', description: '' }],
      })
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toBe('1차시 내용을 입력해주세요')
    expect(result.keys).toContain('curriculum.unitContent[1]')
  })

  it('VAL-09 화면에 없는 2차시 허위 필수 오류 없음', () => {
    const values = validValues({
      curriculumSessions: [
        { sessionLabel: '1차시', title: '필요와 욕구', description: '본문' },
        { sessionLabel: '2차시', title: '2차시', description: '' },
      ],
    })
    const result = parseGeneralCommonInfoRhfValidation(values)
    expect(result.ok).toBe(true)
    if (!result.ok) expect(result.keys.some(key => key.includes('[2]'))).toBe(false)
  })

  it('VAL-04 기본 정보 필수값 누락은 공통 안내로 분류한다', () => {
    const result = parseGeneralCommonInfoRhfValidation(validValues({ mainTitle: '' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toBe('대표 프로그램명(국문)을 입력해주세요')
    expect(result.keys).toContain('basicInfo.programTitleKo')
    expect(result.alertKind).toBe('required-incomplete')
    expect(resolveGeneralCommonInfoValidationAlert(result).title).toBe(
      REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE
    )
  })

  it('VAL-05 임금 정보 필수값 누락은 공통 안내로 분류한다', () => {
    const result = parseGeneralCommonInfoRhfValidation(validValues({ wageGrade1Amount: '' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.keys).toContain('wage.grade1Fee')
    expect(result.alertKind).toBe('required-incomplete')
  })

  it('VAL-06 여러 필수값 누락을 모두 식별한다', () => {
    const result = parseGeneralCommonInfoRhfValidation(
      validValues({
        mainTitle: '',
        educationProcess: '',
        wageGrade1Amount: '',
      })
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.keys).toEqual(
      expect.arrayContaining([
        'basicInfo.programTitleKo',
        'basicInfo.educationCourse',
        'wage.grade1Fee',
      ])
    )
    expect(result.alertKind).toBe('required-incomplete')
  })

  it('VAL-10 사업기간 밖 교육 일정', () => {
    const result = parseGeneralCommonInfoRhfValidation(
      validValues({
        startDate: '2026-10-31',
        endDate: '2026-11-01',
        educationScheduleLines: ['26년 10월 24일(토) 10:00 ~ 12:00'],
      })
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toBe('사업 운영기간 안에 교육 진행 일정을 입력해주세요')
    expect(result.title).toBe(EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE)
    expect(result.alertKind).toBe('operation-range')
    expect(resolveGeneralCommonInfoValidationAlert(result)).toEqual({
      title: EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE,
      content: '사업 운영기간 안에 교육 진행 일정을 입력해주세요',
    })
    expect(hasRhfCurriculumMultiDateScheduleCountMismatch(validValues())).toBe(false)
  })

  it('VAL-10 회차 수와 예정일 개수 불일치는 전용 안내 대상이다', () => {
    expect(
      hasRhfCurriculumMultiDateScheduleCountMismatch(
        validValues({
          sessionRound: 'multi',
          educationScheduleMode: 'date',
          educationScheduleLines: [
            '26년 10월 31일(토) 10:00 ~ 12:00',
            '26년 11월 1일(일) 10:00 ~ 12:00',
          ],
          curriculumSessions: [{ sessionLabel: '1회차', title: '1', description: '본문' }],
        })
      )
    ).toBe(true)
  })

  it('VAL-11 정상 유효값', () => {
    expect(parseGeneralCommonInfoRhfValidation(validValues()).ok).toBe(true)
  })

  it('VAL-13 Independent PATCH 에 유령 회차가 없다', () => {
    const values = validValues({
      scheduleCurriculumPreEducation: true,
      curriculumSessions: [
        {
          sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL,
          title: '사전 교육ㅋㅋㅋ',
          description: '',
          scheduleDate: '26년 10월 31일(토) 18:43 ~ 19:43',
        },
        { sessionLabel: '1차시', title: '필요와 욕구', description: '본문' },
        { sessionLabel: '2차시', title: '2차시', description: '' },
      ],
    })
    const save = createGeneralProgramCommonInfoIndependentSave({
      values,
      program: programFromSessions([
        { sessionNo: 1, sessionLabel: '1차시', title: '기존1', description: '기존본문' },
        { sessionNo: 2, sessionLabel: '2차시', title: '2차시', description: '' },
      ]),
      changedFormKeys: new Set(['curriculumSessions']),
    })
    const sessions = save.patch.generalCommonInfo?.curriculumSessions ?? []
    expect(sessions.map(row => row.sessionLabel)).toEqual([PRE_EDUCATION_SCHEDULE_LABEL, '1차시'])
    expect(sessions.some(row => row.sessionLabel === '2차시')).toBe(false)
  })

  it('VAL-14 sparse sessionNo 및 명시 삭제 유지', () => {
    const values = validValues({
      curriculumSessions: [{ sessionLabel: '1차시', title: '단원1', description: '본문1' }],
    })
    const save = createGeneralProgramCommonInfoIndependentSave({
      values,
      program: programFromSessions([
        { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '본문1' },
        { sessionNo: 4, sessionLabel: '2차시', title: '단원4', description: '본문4' },
      ]),
      changedFormKeys: new Set(['curriculumSessions']),
    })
    expect(save.patch.generalCommonInfo?.curriculumSessions).toEqual([
      expect.objectContaining({ sessionNo: 1, title: '단원1' }),
    ])
  })

  it('VAL-15 Overlay 위저드 검사는 extras chartCount 를 유지한다', () => {
    const overlay = {
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '필요와 욕구' },
      'generalRegistration.educationCurriculum.unitContentBySession': { 1: '본문' },
    }
    const ctx: GeneralProgramRegistrationRequiredFieldContext = {
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
      curriculumChartSessionCount: 2,
      scheduleCurriculumDetailCount: 1,
      scheduleCurriculumGroupCount: 1,
      scheduleCurriculumPreEducation: true,
      educationScheduleMode: 'date',
      sponsorId: 'sponsor-1',
      sponsorContactId: 'contact-1',
      programTitleKo: '대표명',
    }
    expect(listIncompleteGeneralProgramRegistrationRequiredFields(overlay, ctx)).toContain(
      'curriculum.unitName[2]'
    )
    const program = programFromSessions([
      { sessionLabel: '1차시', title: '필요와 욕구', description: '본문' },
    ])
    expect(deriveIndependentEditorExtrasFromProgram(program).curriculumChartSessionCount).toBe(1)
    expect(extrasFromGeneralProgram(program).curriculumChartSessionCount).toBe(1)
  })

  it('담당자 미선택 sentinel은 상세 수정 필수 검증을 통과한다', () => {
    const parsed = parseGeneralCommonInfoRhfValidation(
      validValues({
        sponsorManagerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        sponsorManagerContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
      })
    )
    expect(parsed.ok).toBe(true)
  })

  it('담당자 빈 배열은 상세 수정 필수 검증을 실패한다', () => {
    const parsed = parseGeneralCommonInfoRhfValidation(
      validValues({
        sponsorManagerContactIds: [],
        sponsorManagerContactId: '',
      })
    )
    expect(parsed.ok).toBe(false)
  })

  it('186310 커리큘럼형 저장 — 예정일 2건이 운영기간 밖이면 educationScheduleLines만 실패한다', () => {
    const values = validValues({
      startDate: '2026-10-02',
      endDate: '2026-11-04',
      educationStructure: 'curriculum',
      sessionRound: 'multi',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '2026.11.06(금) 10:00 ~ 12:00',
        '2026.11.13(금) 13:30 ~ 16:00',
      ],
      curriculumSessions: [
        {
          sessionLabel: '1회차',
          title: '1차시',
          description: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'online',
          participationMethod: 'individual',
          ipsCategory: '',
          ipsDetail: '',
          scheduleDate: '',
        },
        {
          sessionLabel: '2회차',
          title: '2차시',
          description: '용돈 사용 내역을 보고 한 달 저축 목표와 방법을 정합니다.',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'online',
          participationMethod: 'individual',
          ipsCategory: '',
          ipsDetail: '',
          scheduleDate: '',
        },
      ],
      scheduleDetails: [],
      participantTeacherInstructor: true,
      participantVolunteer: true,
      kpiFinalParticipants: 52,
      kpiInstructorCount: 4,
      kpiVolunteerCount: 15,
    })
    const result = parseGeneralCommonInfoRhfValidation(values)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.alertKind).toBe('operation-range')
    expect(result.issues).toEqual([
      expect.objectContaining({
        path: ['educationScheduleLines'],
        message: '사업 운영기간 안에 교육 진행 일정을 입력해주세요',
      }),
    ])
    expect(result.keys).toEqual(['educationScheduleSettings.singleDateIso'])
    expect(
      findEducationScheduleLinesOutsideOperationRange(
        values.educationScheduleLines,
        values.startDate,
        values.endDate
      )
    ).toEqual([0, 1])
  })

  it('186310 일정형 전환 직후 — 빈 행사 일정 name·scheduleDate가 필수 누락이다', () => {
    const values = validValues({
      startDate: '2026-10-02',
      endDate: '2026-11-04',
      educationStructure: 'schedule',
      sessionRound: 'multi',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '2026.11.06(금) 10:00 ~ 12:00',
        '2026.11.13(금) 13:30 ~ 16:00',
      ],
      curriculumSessions: [],
      detailedProgramId: TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
      scheduleCurriculumPreEducation: false,
      scheduleDetails: [
        {
          scheduleLabel: '행사 일정 01',
          blockKind: 'event',
          name: '',
          groupTimes: [{ startTime: '', endTime: '' }],
          scheduleDate: '',
          assignmentEnabled: false,
          assignmentPeriod: '',
          educationForm: 'online',
          participationMethod: 'individual',
          ipsCategory: 'prepare',
          ipsDetail: 'none',
        },
      ],
      participantTeacherInstructor: true,
      participantVolunteer: true,
      kpiFinalParticipants: 52,
      kpiInstructorCount: 4,
      kpiVolunteerCount: 15,
    })
    const result = parseGeneralCommonInfoRhfValidation(values)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.alertKind).toBe('required-incomplete')
    expect(result.issues.map(issue => ({ path: issue.path, message: issue.message }))).toEqual([
      { path: ['scheduleDetails', 0, 'name'], message: '일정 상세를 입력해주세요' },
      { path: ['scheduleDetails', 0, 'scheduleDate'], message: '일정을 선택해주세요' },
    ])
    expect(result.keys).toEqual([
      'scheduleCurriculum.eventName[1]',
      'scheduleCurriculum.scheduleDate[1]',
    ])
  })

  it('일정형 단일·팀·사전교육 ON·세부 2건 빈 시드 — 사전교육 일정·세부 name/groupTimes·운영기간 밖 예정일', () => {
    const store = validValues({
      startDate: '2026-10-02',
      endDate: '2026-11-04',
      educationStructure: 'curriculum',
      sessionRound: 'multi',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '2026.11.06(금) 10:00 ~ 12:00',
        '2026.11.13(금) 13:30 ~ 16:00',
      ],
      participantTeacherInstructor: true,
      participantVolunteer: true,
      kpiFinalParticipants: 52,
      kpiInstructorCount: 4,
      kpiVolunteerCount: 15,
    })
    const setValue = (key: string, value: unknown) => {
      Object.assign(store, { [key]: value })
    }
    store.educationStructure = 'schedule'
    applyEducationStructureChangeToForm(setValue as never, (() => store) as never, 'schedule')
    store.sessionRound = 'single'
    applySessionRoundChangeToForm(setValue as never, (() => store) as never, 'single')
    store.participationMethod = 'team'
    store.scheduleDetails = applySchedulePreEducationBlock(
      [
        ...store.scheduleDetails,
        createEmptyScheduleDetailBlock(1, { blockKind: 'sub', groupCount: 1 }),
      ],
      true,
      { groupCount: 1 }
    )
    store.scheduleCurriculumPreEducation = true
    const result = parseGeneralCommonInfoRhfValidation(store)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.alertKind).toBe('required-incomplete')
    expect(result.issues.map(issue => ({ path: issue.path, message: issue.message }))).toEqual([
      { path: ['scheduleDetails', 0, 'scheduleDate'], message: '사전 교육 일정을 입력해주세요' },
      { path: ['scheduleDetails', 1, 'name'], message: '일정 상세를 입력해주세요' },
      { path: ['scheduleDetails', 1, 'groupTimes', 0], message: '진행 시간을 입력해주세요' },
      { path: ['scheduleDetails', 2, 'name'], message: '일정 상세를 입력해주세요' },
      { path: ['scheduleDetails', 2, 'groupTimes', 0], message: '진행 시간을 입력해주세요' },
      {
        path: ['educationScheduleLines'],
        message: '사업 운영기간 안에 교육 진행 일정을 입력해주세요',
      },
    ])
  })
})

describe('교육 진행 장소 (개인 대상)', () => {
  it('오프라인 일정 공통 — 장소 미입력이면 typeSettings.educationPlace 필수', () => {
    const result = parseGeneralCommonInfoRhfValidation({
      ...validValues(),
      educationPlaceAddress: '',
    })
    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.keys).toContain('typeSettings.educationPlace')
  })

  it('온라인이면 장소 미입력이어도 필수 아님', () => {
    const result = parseGeneralCommonInfoRhfValidation({
      ...validValues(),
      educationForm: 'online',
      educationPlaceAddress: '',
    })
    expect(result.ok ? [] : result.keys).not.toContain('typeSettings.educationPlace')
  })

  it('기관 대상이면 장소 필수 아님', () => {
    const result = parseGeneralCommonInfoRhfValidation({
      ...validValues(),
      participantOrganization: true,
      educationPlaceAddress: '',
    })
    expect(result.ok ? [] : result.keys).not.toContain('typeSettings.educationPlace')
  })
})
