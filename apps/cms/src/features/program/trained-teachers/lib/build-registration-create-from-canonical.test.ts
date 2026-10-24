import { describe, expect, it } from 'vitest'
import { mapTrainedTeacherToCreateRequest } from '@/features/program/trained-teachers/api/adapters'
import { buildTrainedTeacherProgramFromCanonical } from './build-registration-create-from-canonical'
import { emptyTrainedTeachersApplicationFormState } from './application-form-state'
import { emptyTrainedTeachersRecruitFormState } from './recruit-form-state'
import {
  TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION,
  type TrainedTeachersRegistrationCanonical,
  type TrainedTeachersRegistrationEditorMeta,
} from './registration-canonical-types'
import { trainedTeachersApplicationEditorState, readTrainedTeachersApplicationEditorState } from './application-form-state'
import { trainedTeachersRecruitEditorState, readTrainedTeachersRecruitEditorState } from './recruit-form-state'

const participant = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
} as const

function editor(
  patch: Partial<TrainedTeachersRegistrationEditorMeta> = {}
): TrainedTeachersRegistrationEditorMeta {
  return {
    educationStructure: 'curriculum',
    sessionRound: 'single',
    educationFormScheduleDetail: 'common',
    participationScheduleDetail: 'common',
    ipsScheduleDetail: 'common',
    curriculumSessionCount: 2,
    curriculumChartSessionCount: 2,
    scheduleCurriculumDetailCount: 1,
    scheduleCurriculumGroupCount: 1,
    educationScheduleMode: 'date',
    teacherTrainingEnabled: false,
    participant,
    ...patch,
  }
}

function canonical(
  patch: Partial<TrainedTeachersRegistrationCanonical['common']> & {
    educationStructure?: TrainedTeachersRegistrationCanonical['common']['educationStructure']
    sessionRound?: TrainedTeachersRegistrationCanonical['common']['sessionRound']
    teacherTrainingEnabled?: boolean
  } = {}
): TrainedTeachersRegistrationCanonical {
  const educationStructure = patch.educationStructure ?? 'curriculum'
  const sessionRound = patch.sessionRound ?? 'single'
  const teacherTrainingEnabled = patch.teacherTrainingEnabled ?? false
  return {
    schemaVersion: TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION,
    editor: editor({
      educationStructure,
      sessionRound,
      teacherTrainingEnabled,
    }),
    common: {
      title: '공고용 프로그램',
      mainTitle: '대표명',
      titleEn: 'Title EN',
      announcementTitle: '공고용 프로그램',
      detailedProgramId: '163009',
      detailedProgramName: 'UJAT 사전교육',
      textbookName: '1사1교 금융특강',
      businessArea: '경제금융',
      partnerInvolvement: false,
      sponsorManagementIds: ['1627251'],
      sponsorManagerContactIds: [],
      venueDetail: '',
      educationStructure,
      sessionRound,
      teacherTrainingEnabled,
      educationJournalEnabled: false,
      curriculumSessions:
        educationStructure === 'curriculum'
          ? [
              {
                sessionLabel: sessionRound === 'multi' ? '1회차' : '1차시',
                title: teacherTrainingEnabled ? '교육 연수' : '단원1',
                description: '내용1',
                ipsTypeSummary: teacherTrainingEnabled ? 'Prepare' : undefined,
              },
              {
                sessionLabel: sessionRound === 'multi' ? '2회차' : '2차시',
                title: '단원2',
                description: '내용2',
              },
            ]
          : [],
      scheduleDetails:
        educationStructure === 'schedule'
          ? [
              {
                scheduleLabel: teacherTrainingEnabled ? '교육 연수' : '세부 일정 01',
                name: teacherTrainingEnabled ? '교육 연수' : '일정1',
                ipsTypeSummary: teacherTrainingEnabled ? 'Prepare' : undefined,
              },
              { scheduleLabel: '세부 일정 02', name: '일정2' },
            ]
          : [],
      educationScheduleMode: 'date',
      educationScheduleLines: educationStructure === 'schedule' ? [] : ['2026.04.01 10:00-12:00'],
      educationScheduleRange: null,
      generalSurveyMenuKeys: ['survey'],
      educationForm: 'offline',
      ...patch,
    },
    recruit: {
      ...emptyTrainedTeachersRecruitFormState(),
      programDescription: '모집 설명',
      recruitRangeSeal: { start: '2026-11-01', end: '2026-11-10' },
      programRangeSeal: { start: '2026-04-01', end: '2026-12-31' },
    },
    application: emptyTrainedTeachersApplicationFormState(),
  }
}

describe('TRAINED_TEACHER 등록 canonical CREATE', () => {
  it('교재명과 세부 프로그램명을 분리하고 담당자 [] 를 유지한다', () => {
    const program = buildTrainedTeacherProgramFromCanonical({
      id: 'tt-create',
      canonical: canonical(),
    })
    expect(program.title).toBe('공고용 프로그램')
    expect(program.mainTitle).toBe('대표명')
    expect(program.mainTitle).not.toBe(program.title)
    expect(program.textbookName).toBe('1사1교 금융특강')
    expect(program.generalCommonInfo?.detailedProgramName).toBe('UJAT 사전교육')
    expect(program.textbookName).not.toBe(program.generalCommonInfo?.detailedProgramName)
    expect(program.generalCommonInfo?.sponsorManagerContactIds).toEqual([])
    expect(program.generalSurveyMenuKeys).toEqual(['survey'])
    expect(program.registrationOverlay).toBeUndefined()
  })

  it('설문 [] 를 기본 3개로 복원하지 않는다', () => {
    const program = buildTrainedTeacherProgramFromCanonical({
      id: 'tt-create',
      canonical: canonical({ generalSurveyMenuKeys: [] }),
    })
    expect(program.generalSurveyMenuKeys).toEqual([])
  })

  it('과제 필드를 신규 생성하지 않는다', () => {
    const program = buildTrainedTeacherProgramFromCanonical({
      id: 'tt-create',
      canonical: canonical(),
    })
    expect(JSON.stringify(program.generalCommonInfo?.curriculumSessions)).not.toContain(
      'assignmentPeriod'
    )
    expect(JSON.stringify(program.generalCommonInfo?.curriculumSessions)).not.toContain(
      'assignmentEnabled'
    )
  })

  it('기간형 줄에서 educationScheduleRange를 CREATE JSON에 싣는다', () => {
    const program = buildTrainedTeacherProgramFromCanonical({
      id: 'tt-create',
      canonical: canonical({
        educationStructure: 'schedule',
        educationScheduleMode: 'period',
        educationScheduleLines: ['2026.11.11(수) ~ 2026.11.18(수)'],
      }),
    })
    expect(program.generalCommonInfo?.educationScheduleRange).toMatchObject({
      start: expect.any(String),
      end: expect.any(String),
    })
    const seoulDay = (iso: string) =>
      new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
    expect(seoulDay(program.generalCommonInfo!.educationScheduleRange!.start)).toBe('2026-11-11')
    expect(seoulDay(program.generalCommonInfo!.educationScheduleRange!.end)).toBe('2026-11-18')
    const request = mapTrainedTeacherToCreateRequest(program)
    const json = JSON.parse(String(request.serviceDetailJson)) as {
      program?: {
        generalCommonInfo?: {
          educationScheduleRange?: { start: string; end: string } | null
          educationScheduleLines?: string[]
        }
      }
    }
    expect(json.program?.generalCommonInfo?.educationScheduleLines).toEqual([
      '2026.11.11(수) ~ 2026.11.18(수)',
    ])
    expect(seoulDay(json.program!.generalCommonInfo!.educationScheduleRange!.start)).toBe(
      '2026-11-11'
    )
    expect(seoulDay(json.program!.generalCommonInfo!.educationScheduleRange!.end)).toBe('2026-11-18')
  })

  it('날짜 지정이면 CREATE JSON educationScheduleRange가 null이다', () => {
    const program = buildTrainedTeacherProgramFromCanonical({
      id: 'tt-create',
      canonical: canonical({ educationScheduleMode: 'date' }),
    })
    expect(program.generalCommonInfo?.educationScheduleRange).toBeNull()
    const request = mapTrainedTeacherToCreateRequest(program)
    const json = JSON.parse(String(request.serviceDetailJson)) as {
      program?: {
        generalCommonInfo?: { educationScheduleRange?: { start: string; end: string } | null }
      }
    }
    expect(json.program?.generalCommonInfo?.educationScheduleRange).toBeNull()
  })

  it('공고명과 대표명을 서로 파생하지 않고 공통 IPS와 차시 IPS를 분리한다', () => {
    const program = buildTrainedTeacherProgramFromCanonical({
      id: 'tt-create',
      canonical: canonical({
        ips: 'Prepare',
        programCategory: '경제',
        curriculumSessions: [
          {
            sessionLabel: '1차시',
            title: '단원1',
            description: '내용1',
            ipsTypeSummary: 'Inspire',
          },
        ],
      }),
    })
    expect(program.title).toBe('공고용 프로그램')
    expect(program.mainTitle).toBe('대표명')
    expect(program.ips).toBe('Prepare')
    expect(program.generalCommonInfo?.curriculumSessions?.[0]?.ipsTypeSummary).toBe('Inspire')
    const request = mapTrainedTeacherToCreateRequest(program)
    expect(request.title).toBe('공고용 프로그램')
    expect(request.mainTitle).toBe('대표명')
    expect(request.ips).toBe('Prepare')
    const json = JSON.parse(String(request.serviceDetailJson)) as {
      program?: {
        generalCommonInfo?: {
          curriculumSessions?: Array<{ ipsTypeSummary?: string }>
        }
      }
    }
    expect(json.program?.generalCommonInfo?.curriculumSessions?.[0]?.ipsTypeSummary).toBe(
      'Inspire'
    )
  })

  it('대표명이 비어 있으면 공고명으로 채우지 않는다', () => {
    const program = buildTrainedTeacherProgramFromCanonical({
      id: 'tt-create',
      canonical: canonical({ mainTitle: '' }),
    })
    expect(program.title).toBe('공고용 프로그램')
    expect(program.mainTitle).toBeUndefined()
  })

  it('CREATE serviceDetailJson 에 registration.overlay 와 surveyItems 가 없다', () => {
    const program = buildTrainedTeacherProgramFromCanonical({
      id: 'tt-create',
      canonical: canonical(),
    })
    const request = mapTrainedTeacherToCreateRequest(program)
    const json = JSON.parse(String(request.serviceDetailJson)) as {
      registration?: { overlay?: unknown }
      generalSurveyMenuKeys?: string[]
    }
    expect(json.registration).toBeUndefined()
    expect(JSON.stringify(json)).not.toContain('surveyItems')
    expect(json.generalSurveyMenuKeys).toEqual(['survey'])
    expect(request.textbookName).toBe('1사1교 금융특강')
  })
})

describe('교육 구조 8조합 CREATE', () => {
  const combos = [
    { educationStructure: 'curriculum', sessionRound: 'single', teacherTrainingEnabled: false },
    { educationStructure: 'curriculum', sessionRound: 'single', teacherTrainingEnabled: true },
    { educationStructure: 'curriculum', sessionRound: 'multi', teacherTrainingEnabled: false },
    { educationStructure: 'curriculum', sessionRound: 'multi', teacherTrainingEnabled: true },
    { educationStructure: 'schedule', sessionRound: 'single', teacherTrainingEnabled: false },
    { educationStructure: 'schedule', sessionRound: 'single', teacherTrainingEnabled: true },
    { educationStructure: 'schedule', sessionRound: 'multi', teacherTrainingEnabled: false },
    { educationStructure: 'schedule', sessionRound: 'multi', teacherTrainingEnabled: true },
  ] as const

  it.each(combos)(
    '$educationStructure / $sessionRound / training=$teacherTrainingEnabled',
    combo => {
      const program = buildTrainedTeacherProgramFromCanonical({
        id: 'tt-create',
        canonical: canonical(combo),
      })
      expect(program.generalProgramEducationStructure).toBe(combo.educationStructure)
      expect(program.generalProgramSessionRound).toBe(combo.sessionRound)
      expect(program.generalCommonInfo?.teacherTrainingEnabled).toBe(combo.teacherTrainingEnabled)
      if (combo.educationStructure === 'curriculum') {
        expect(program.generalCommonInfo?.curriculumSessions).toHaveLength(2)
        expect(program.generalCommonInfo?.scheduleDetails).toEqual([])
        if (combo.teacherTrainingEnabled) {
          expect(program.generalCommonInfo?.curriculumSessions?.[0]?.title).toBe('교육 연수')
        }
      } else {
        expect(program.generalCommonInfo?.scheduleDetails).toHaveLength(2)
        expect(program.generalCommonInfo?.curriculumSessions).toEqual([])
        if (combo.teacherTrainingEnabled) {
          expect(program.generalCommonInfo?.scheduleDetails?.[0]?.scheduleLabel).toBe('교육 연수')
        }
      }
      const request = mapTrainedTeacherToCreateRequest(program)
      const json = JSON.parse(String(request.serviceDetailJson)) as {
        program?: { generalCommonInfo?: { teacherTrainingEnabled?: boolean } }
        registration?: unknown
      }
      expect(json.registration).toBeUndefined()
      expect(json.program?.generalCommonInfo?.teacherTrainingEnabled).toBe(
        combo.teacherTrainingEnabled
      )
    }
  )
})

describe('모집·신청 editorState', () => {
  it('모집 typed state 를 editorState 로 왕복하고 overlay 키를 저장하지 않는다', () => {
    const state = {
      ...emptyTrainedTeachersRecruitFormState(),
      programDescription: '설명',
      notes: '비고',
    }
    const editorState = trainedTeachersRecruitEditorState(state)
    expect(editorState.kind).toBe('trainedTeachersRecruitCanonical')
    expect(JSON.stringify(editorState)).not.toContain('trainedTeachersRecruit.detailInfo')
    expect(readTrainedTeachersRecruitEditorState(editorState)?.programDescription).toBe('설명')
  })

  it('신청 typed state 를 editorState 로 왕복한다', () => {
    const state = emptyTrainedTeachersApplicationFormState()
    state.basicInfo.applicationGrade = '초등 3'
    const editorState = trainedTeachersApplicationEditorState(state)
    expect(editorState.kind).toBe('trainedTeachersApplicationCanonical')
    expect(JSON.stringify(editorState)).not.toContain('application.trainedTeachers')
    expect(readTrainedTeachersApplicationEditorState(editorState)?.basicInfo.applicationGrade).toBe(
      '초등 3'
    )
  })
})
