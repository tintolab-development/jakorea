import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  detailEditValuesToProgramPatch,
  programToDetailEditValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { mapTrainedTeacherToUpdateRequest } from '@/features/program/trained-teachers/api/adapters'
import {
  mapTrainedTeacherInfoSaveToRequest,
  mergeTrainedTeacherInfoDetailIntoProgram,
  parseTrainedTeacherInfoConfigJson,
} from '@/features/program/trained-teachers/api/info-detail-adapters'
import { serializeTrainedTeacherServiceDetailJson } from '@/features/program/trained-teachers/api/service-detail-json'
import {
  describeIncompleteTrainedTeachersProgramRegistrationRequiredFields,
  hasIncompleteTrainedTeachersProgramRegistrationRequiredFields,
  type TrainedTeachersRegistrationRequiredFieldContext,
} from './trained-teachers-program-registration-required-fields'
import {
  buildTrainedTeachersCommonInfoSaveSlices,
  omitTrainedTeacherStaleSessionOverlayKeys,
  resolveTrainedTeachersCanonicalCommonInfo,
} from './common-info-persist'

const MIGRATED_OVERLAY_KEYS = [
  'trainedTeachersRegistration.basicInfo.detailedProgramId',
  'trainedTeachersRegistration.basicInfo.detailedProgramName',
  'trainedTeachersRegistration.basicInfo.businessField',
  'trainedTeachersRegistration.basicInfo.ipOwned',
  'trainedTeachersRegistration.basicInfo.courseDeliveredBy',
  'trainedTeachersRegistration.basicInfo.partnerInvolvement',
  'trainedTeachersRegistration.basicInfo.educationVenueKind',
  'trainedTeachersRegistration.basicInfo.educationVenueDetail',
  'trainedTeachersRegistration.basicInfo.programTitleKo',
  'trainedTeachersRegistration.basicInfo.programTitleEn',
  'trainedTeachersRegistration.basicInfo.publicProgramTitle',
  'trainedTeachersRegistration.basicInfo.sponsorId',
  'trainedTeachersRegistration.basicInfo.sponsorIds',
  'trainedTeachersRegistration.basicInfo.managerContactId',
  'trainedTeachersRegistration.basicInfo.managerContactIds',
  'trainedTeachersRegistration.basicInfo.textbookName',
  'generalRegistration.educationCurriculum.educationJournalEnabled',
  'generalRegistration.educationScheduleSettings.scheduleLines',
  'trainedTeachersRegistration.educationScheduleSettings.scheduleLines',
] as const

function legacyOverlay(): Record<string, unknown> {
  return {
    'trainedTeachersRegistration.basicInfo.surveyItems': { survey: true },
    'trainedTeachersRegistration.basicInfo.detailedProgramId': '163010',
    'trainedTeachersRegistration.basicInfo.detailedProgramName': 'overlay 세부명',
    'trainedTeachersRegistration.basicInfo.textbookName': 'overlay 교재명',
    'trainedTeachersRegistration.basicInfo.sponsorId': '1627251',
    'trainedTeachersRegistration.basicInfo.managerContactIds': ['1627251::old'],
    'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled': 'yes',
    'generalRegistration.educationScheduleSettings.scheduleLines': ['2026.11.06(금)'],
    'application.institution.teacherTel': '02-111-1111',
    'recruitment.participant.period': '2026.11.03 ~ 11.06',
  }
}

function baseProgram(patch: Partial<Program> = {}): Program {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: '186312',
    sponsorId: '1627253',
    title: '공고명',
    mainTitle: '대표명',
    titleEn: 'Title En',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [
      {
        id: 'r1',
        programId: '186312',
        roundNumber: 1,
        startDate: '2026-11-03',
        endDate: '2026-12-30',
        status: 'pending',
      },
    ],
    startDate: '2026-10-22',
    endDate: '2026-11-05',
    applicationStartDate: '2026-11-03',
    applicationEndDate: '2026-11-06',
    status: 'pending',
    backendProgramType: 'TRAINED_TEACHER',
    detailedProgramId: '163009',
    textbookName: '1사1교 금융특강',
    businessArea: '진로취업',
    partnerInvolvement: false,
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalParticipantTypes: ['school_institution'],
    generalSurveyMenuKeys: ['survey'],
    generalCommonInfo: {
      announcementTitle: '공고명',
      detailedProgramName: 'UJAT 사전교육',
      sponsorManagementIds: ['1627253'],
      sponsorManagerContactIds: ['1627253::1627253'],
      venueKind: 'outside',
      venueDetail: '학교 시청각실',
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      educationScheduleMode: 'period',
      educationScheduleLines: ['2026.10.29(목) ~ 2026.10.31(토)'],
      curriculumSessions: [
        { sessionLabel: '1회차', title: '1', description: '본문' },
      ],
      scheduleDetails: [],
      participantRecruitmentInfo: { remarks: '모집 비고' },
    },
    registrationOverlay: legacyOverlay(),
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

describe('TRAINED_TEACHER canonical SSOT', () => {
  it('legacy overlay GET 이 canonical 교재명·세부명·후원사를 덮지 않는다', () => {
    const program = baseProgram()
    const values = programToDetailEditValues(program)
    const canonical = resolveTrainedTeachersCanonicalCommonInfo(program)
    expect(values.detailedProgramId).toBe('163009')
    expect(values.detailedProgramName).toBe('UJAT 사전교육')
    expect(values.textbookName).toBe('1사1교 금융특강')
    expect(values.sponsorManagementIds).toEqual(['1627253'])
    expect(canonical.educationJournalEnabled).toBe(false)
    expect(canonical.educationScheduleLines).toEqual(['2026.10.29(목) ~ 2026.10.31(토)'])
  })

  it('교재명을 수정해도 세부 프로그램명은 master 값을 유지한다', () => {
    const program = baseProgram()
    const values = {
      ...programToDetailEditValues(program),
      textbookName: '수정 교재명',
    }
    const patch = detailEditValuesToProgramPatch(values, program)
    const request = mapTrainedTeacherToUpdateRequest(program, patch)
    expect(request.textbookName).toBe('수정 교재명')
    expect(request.detailedProgramId).toBe(163009)
    expect(patch.generalCommonInfo?.detailedProgramName).toBe('UJAT 사전교육')
    expect(request.textbookName).not.toBe(patch.generalCommonInfo?.detailedProgramName)
  })

  it('담당자 [] 는 기존 ID 로 복원하지 않는다', () => {
    const program = baseProgram()
    const values = {
      ...programToDetailEditValues(program),
      sponsorManagerContactIds: [],
    }
    const patch = detailEditValuesToProgramPatch(values, program)
    expect(patch.generalCommonInfo?.sponsorManagerContactIds).toEqual([])
    expect(patch.generalCommonInfo?.sponsorManagerContactId).toBeUndefined()
    const request = mapTrainedTeacherToUpdateRequest(program, patch)
    expect(request.sponsors?.every(row => !row.sponsorContactId)).toBe(true)
  })

  it('명시적 false 와 빈 배열이 B payload 에 남는다', () => {
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      curriculumSessions: [],
      scheduleDetails: [{ scheduleLabel: 'stale', name: 'x' }],
      educationScheduleLines: [],
      educationScheduleMode: 'period',
    })
    const request = mapTrainedTeacherInfoSaveToRequest({
      commonInfo: slices.infoDetailCommonInfo,
    })
    expect(request.teacherTrainingEnabled).toBe(false)
    expect(request.educationJournalEnabled).toBe(false)
    expect(request.configJson).toContain('"teacherTrainingEnabled":false')
    expect(request.configJson).toContain('"educationJournalEnabled":false')
    expect(request.configJson).toContain('"curriculumSessions":[]')
    expect(request.configJson).toContain('"scheduleDetails":[]')
    expect(request.configJson).toContain('"educationScheduleLines":[]')
  })

  it('migrated overlay 키는 신규 persist 에 만들지 않고 설문·신청 키는 보존한다', () => {
    const program = baseProgram()
    const parsed = JSON.parse(serializeTrainedTeacherServiceDetailJson(program, {
      omitInfoDetailOwnedFields: true,
    })) as { registration?: { overlay?: Record<string, unknown> } }
    const overlay = parsed.registration?.overlay ?? {}
    for (const key of MIGRATED_OVERLAY_KEYS) {
      expect(overlay).not.toHaveProperty(key)
    }
    expect(overlay['trainedTeachersRegistration.basicInfo.surveyItems']).toMatchObject({
      survey: true,
    })
    expect(overlay['application.institution.teacherTel']).toBe('02-111-1111')
    expect(overlay['recruitment.participant.period']).toBe('2026.11.03 ~ 11.06')
    expect(
      omitTrainedTeacherStaleSessionOverlayKeys(legacyOverlay())?.['application.institution.teacherTel']
    ).toBe('02-111-1111')
  })

  it('A PATCH 는 B 소유 nested 를 재전송하지 않는다', () => {
    const program = baseProgram()
    const request = mapTrainedTeacherToUpdateRequest(program, {
      textbookName: '1사1교 금융특강',
      partnerInvolvement: false,
      generalCommonInfo: program.generalCommonInfo,
    })
    const json = JSON.parse(request.serviceDetailJson ?? '{}') as {
      program?: {
        generalCommonInfo?: Record<string, unknown>
        rounds?: unknown[]
      }
    }
    expect(json.program?.generalCommonInfo?.curriculumSessions).toBeUndefined()
    expect(json.program?.generalCommonInfo?.scheduleDetails).toBeUndefined()
    expect(json.program?.generalCommonInfo?.educationScheduleLines).toBeUndefined()
    expect(json.program?.generalCommonInfo?.teacherTrainingEnabled).toBeUndefined()
    expect(json.program?.generalCommonInfo?.educationJournalEnabled).toBeUndefined()
    expect(json.program?.generalCommonInfo?.detailedProgramName).toBeUndefined()
    expect(request.textbookName).toBe('1사1교 금융특강')
    expect(request.partnerInvolvement).toBe(false)
    expect(request.rounds).toHaveLength(1)
    expect(request.applicationStartDate).toBe('2026-11-03')
  })

  it('잘못된 B configJson 은 기존 nested 를 지우지 않는다', () => {
    const existing = baseProgram()
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(existing, {
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      configJson: '{not-json',
    })
    expect(merged.generalCommonInfo?.curriculumSessions).toEqual(
      existing.generalCommonInfo?.curriculumSessions
    )
    expect(parseTrainedTeacherInfoConfigJson('{not-json}')).toEqual({})
  })

  it('교육 연수 replaceFirst 계약을 유지한다', () => {
    const requiredCtx = (
      patch: Partial<TrainedTeachersRegistrationRequiredFieldContext>
    ): TrainedTeachersRegistrationRequiredFieldContext => ({
      participant: {
        individual: false,
        organization: true,
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
      teacherTrainingEnabled: false,
      educationScheduleMode: 'date',
      sponsorId: '',
      sponsorContactId: '',
      programTitleKo: '교육받은 교사 프로그램',
      ...patch,
    })
    const filledOverlay = {
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
    }

    expect(
      hasIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        filledOverlay,
        requiredCtx({ teacherTrainingEnabled: true })
      )
    ).toBe(false)

    expect(
      hasIncompleteTrainedTeachersProgramRegistrationRequiredFields(
        {
          ...filledOverlay,
          'trainedTeachersRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
            1: '2026-04-20 09:30-12:20',
          },
        },
        requiredCtx({
          programType: 'schedule',
          sessionRoundType: 'multi',
          teacherTrainingEnabled: true,
          scheduleCurriculumDetailCount: 1,
        })
      )
    ).toBe(false)

    const prependReasons = describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(
      filledOverlay,
      requiredCtx({ teacherTrainingEnabled: true })
    )
    expect(prependReasons).not.toBe('curriculum.preEducationScheduleName')
    expect(prependReasons).not.toBe('curriculum.preEducationScheduleLine')
  })
})

describe('교육 구조 × 회차 × 교육 연수 8조합', () => {
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
      const program = baseProgram({
        generalProgramEducationStructure: combo.educationStructure,
        generalProgramSessionRound: combo.sessionRound,
        generalCommonInfo: {
          ...baseProgram().generalCommonInfo,
          teacherTrainingEnabled: combo.teacherTrainingEnabled,
          curriculumSessions:
            combo.educationStructure === 'curriculum'
              ? [
                  { sessionLabel: combo.sessionRound === 'multi' ? '1회차' : '1차시', title: '1', description: 'a' },
                  { sessionLabel: combo.sessionRound === 'multi' ? '2회차' : '2차시', title: '2', description: 'b' },
                ]
              : [],
          scheduleDetails:
            combo.educationStructure === 'schedule'
              ? [
                  { scheduleLabel: combo.sessionRound === 'multi' ? '행사 일정 01' : '세부 일정 01', name: '일정1' },
                  { scheduleLabel: combo.sessionRound === 'multi' ? '행사 일정 02' : '세부 일정 02', name: '일정2' },
                ]
              : [],
        },
      })
      const values = {
        ...programToDetailEditValues(program),
        teacherTrainingEnabled: combo.teacherTrainingEnabled,
        educationStructure:
          combo.educationStructure === 'curriculum'
            ? ('schedule' as const)
            : ('curriculum' as const),
        sessionRound:
          combo.sessionRound === 'single' ? ('multi' as const) : ('single' as const),
      }
      const patch = detailEditValuesToProgramPatch(values, program)
      expect(patch.generalProgramEducationStructure).toBe(combo.educationStructure)
      expect(patch.generalProgramSessionRound).toBe(combo.sessionRound)

      const slices = buildTrainedTeachersCommonInfoSaveSlices({
        educationStructure: combo.educationStructure,
        teacherTrainingEnabled: combo.teacherTrainingEnabled,
        educationJournalEnabled: false,
        curriculumSessions: program.generalCommonInfo?.curriculumSessions,
        scheduleDetails: program.generalCommonInfo?.scheduleDetails,
      })
      const bRequest = mapTrainedTeacherInfoSaveToRequest({
        commonInfo: slices.infoDetailCommonInfo,
      })
      expect(bRequest.teacherTrainingEnabled).toBe(combo.teacherTrainingEnabled)
      expect(bRequest.educationJournalEnabled).toBe(false)
      if (combo.educationStructure === 'curriculum') {
        expect(slices.infoDetailCommonInfo.curriculumSessions).toHaveLength(2)
        expect(slices.infoDetailCommonInfo.scheduleDetails).toEqual([])
      } else {
        expect(slices.infoDetailCommonInfo.scheduleDetails).toHaveLength(2)
        expect(slices.infoDetailCommonInfo.curriculumSessions).toEqual([])
      }
      expect(JSON.stringify(slices.infoDetailCommonInfo)).not.toContain('assignmentPeriod')
      const merged = mergeTrainedTeacherInfoDetailIntoProgram(program, {
        teacherTrainingEnabled: combo.teacherTrainingEnabled,
        educationJournalEnabled: false,
        configJson: bRequest.configJson,
      })
      const reseed = programToDetailEditValues(merged)
      expect(reseed.teacherTrainingEnabled).toBe(combo.teacherTrainingEnabled)
      expect(reseed.educationStructure).toBe(combo.educationStructure)
      expect(reseed.sessionRound).toBe(combo.sessionRound)
    }
  )
})
