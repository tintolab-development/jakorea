import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import {
  mapAdminProgramDetailToProgram,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { resetProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  applyGeneralRegistrationOverlayToProgram,
  type GeneralRegistrationEditorExtras,
} from './registration-overlay-to-program'
import { resolveEffectiveGeneralProgramTypeFields } from './curriculum-display'
import {
  extrasFromGeneralProgram,
  readGeneralRegistrationOverlayForSave,
  resyncGeneralRegistrationOverlayFromProgram,
  seedGeneralRegistrationOverlayFromProgram,
} from './registration-overlay-sync'
import {
  generalCommonInfoEditValuesToProgramPatch,
  programToGeneralCommonInfoEditValues,
} from '@/features/program/general/model/common-info-edit-schema'

const extras: GeneralRegistrationEditorExtras = {
  programType: 'curriculum',
  sessionRoundType: 'single',
  educationScheduleMode: 'date',
  educationFormScheduleDetail: 'common',
  participationScheduleDetail: 'common',
  ipsScheduleDetail: 'common',
  curriculumChartSessionCount: 1,
  participantOrganization: true,
}

function baseProgram(): Program {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: 'general-roundtrip',
    sponsorId: 'sponsor-1',
    title: '기존 대표명',
    mainTitle: '기존 대표명',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    partnerInvolvement: false,
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      venueKind: 'inside',
      kpi: {
        finalParticipants: 40,
        instructorCount: 3,
        volunteerCount: 2,
        finalSchools: 6,
        finalClasses: 9,
      },
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function reload(request: ReturnType<typeof mapGeneralProgramToUpdateRequest>): Program {
  return mapAdminProgramDetailToProgram({
    id: 'general-roundtrip',
    title: request.title,
    mainTitle: request.mainTitle,
    businessArea: request.businessArea,
    partnerInvolvement: request.partnerInvolvement,
    institutionType: request.institutionType,
    venue: request.venue,
    startDate: request.startDate,
    endDate: request.endDate,
    serviceDetailJson: request.serviceDetailJson,
  } as ProgramResponse)
}

describe('일반 공통정보 저장 왕복', () => {
  beforeEach(() => {
    resetProgramRegistrationOverlay()
  })

  it('공고명·사업분야·교육장소·설문·임금이 요청과 수정 시드에 남는다', () => {
    const overlay: Record<string, unknown> = {
      'generalRegistration.basicInfo.localProgramTitleKo': '기존 대표명',
      'generalRegistration.basicInfo.publicProgramTitle': '바뀐 공고명',
      'generalRegistration.basicInfo.businessField': 'career_employment',
      'generalRegistration.basicInfo.partnerInvolvement': 'no',
      'generalRegistration.basicInfo.educationVenueKind': 'outside',
      'generalRegistration.basicInfo.educationVenueDetail': '외부 강의실',
      'generalRegistration.basicInfo.surveyItems': {
        survey: true,
        satisfaction: false,
        lecture_evaluation: true,
      },
      'generalRegistration.kpi.participantCount': 40,
      'generalRegistration.kpi.instructor': 3,
      'generalRegistration.kpi.volunteer': 2,
      'generalRegistration.kpi.dispatchedSchool': 6,
      'generalRegistration.kpi.dispatchedClass': 9,
      'generalRegistration.wageInfo.grade1Fee': 180000,
      'generalRegistration.wageInfo.grade2Fee': 120000,
      'generalRegistration.wageInfo.grade3Fee': 90000,
    }
    const applied = applyGeneralRegistrationOverlayToProgram(baseProgram(), overlay, extras)
    const request = mapGeneralProgramToUpdateRequest(baseProgram(), {
      title: applied.title,
      mainTitle: applied.mainTitle,
      businessArea: applied.businessArea,
      partnerInvolvement: applied.partnerInvolvement,
      institutionType: applied.institutionType,
      venue: applied.venue,
      generalSurveyMenuKeys: applied.generalSurveyMenuKeys,
      generalCommonInfo: applied.generalCommonInfo,
      registrationOverlay: overlay,
    })

    expect(request.businessArea).toBe('진로취업')
    expect(request.partnerInvolvement).toBe(false)
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      generalCommonInfo?: {
        announcementTitle?: string
        venueKind?: string
        venueDetail?: string
        wageGradeRows?: Array<{ pricing?: string }>
      }
      generalSurveyMenuKeys?: string[]
    }
    expect(detail.generalCommonInfo?.announcementTitle).toBe('바뀐 공고명')
    expect(detail.generalCommonInfo?.venueKind).toBe('outside')
    expect(detail.generalCommonInfo?.venueDetail).toBe('외부 강의실')
    expect(detail.generalCommonInfo?.wageGradeRows?.[0]?.pricing).toContain('180,000')
    expect(detail.generalSurveyMenuKeys).toEqual(['survey', 'lecture_evaluation'])

    const reloaded = reload(request)
    seedGeneralRegistrationOverlayFromProgram(reloaded)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.basicInfo.publicProgramTitle']).toBe('바뀐 공고명')
    expect(saved['generalRegistration.basicInfo.businessField']).toBe('career_employment')
    expect(saved['generalRegistration.basicInfo.educationVenueKind']).toBe('outside')
    expect(saved['generalRegistration.basicInfo.educationVenueDetail']).toBe('외부 강의실')
    expect(saved['generalRegistration.basicInfo.surveyItems']).toEqual({
      survey: true,
      satisfaction: false,
      lecture_evaluation: true,
    })
    expect(saved['generalRegistration.wageInfo.grade1Fee']).toBe(180_000)
  })

  it('사업 기간만 바꿔도 파트너 아니오와 KPI는 유지된다', () => {
    const existing = baseProgram()
    const applied = applyGeneralRegistrationOverlayToProgram(
      existing,
      {
        'generalRegistration.basicInfo.operationRangeSeal': {
          start: '2026-06-01',
          end: '2026-08-31',
        },
      },
      extras
    )
    const request = mapGeneralProgramToUpdateRequest(existing, {
      startDate: applied.startDate,
      endDate: applied.endDate,
      partnerInvolvement: applied.partnerInvolvement,
      generalCommonInfo: applied.generalCommonInfo,
    })

    expect(request.partnerInvolvement).toBe(false)
    expect(request.startDate).toBe(applied.startDate)
    expect(request.endDate).toBe(applied.endDate)
    expect(applied.startDate).not.toBe(existing.startDate)
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      generalCommonInfo?: { kpi?: { finalParticipants?: number; finalClasses?: number } }
    }
    expect(detail.generalCommonInfo?.kpi).toMatchObject({
      finalParticipants: 40,
      instructorCount: 3,
      volunteerCount: 2,
      finalSchools: 6,
      finalClasses: 9,
    })

    const reloaded = reload(request)
    expect(reloaded.partnerInvolvement).toBe(false)
    expect(reloaded.generalCommonInfo?.kpi).toMatchObject({
      finalParticipants: 40,
      instructorCount: 3,
      volunteerCount: 2,
      finalSchools: 6,
      finalClasses: 9,
    })
  })

  it('복수 회차 extras + 단원 맵 저장은 중첩 행과 overlay 맵이 같다', () => {
    const overlay: Record<string, unknown> = {
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
        1: '옛 본문',
      },
      'generalRegistration.educationCurriculum.educationFormBySession': { 1: 'offline' },
      'generalRegistration.educationCurriculum.ipsBySession': {
        1: { category: 'succeed', detail: 'competition' },
        2: { category: 'prepare', detail: 'none' },
      },
    }
    const multiExtras: GeneralRegistrationEditorExtras = {
      ...extras,
      sessionRoundType: 'multi',
      ipsScheduleDetail: 'perSchedule',
      curriculumSessionCount: 1,
      curriculumChartSessionCount: 1,
      participantOrganization: false,
    }
    const existing = {
      ...baseProgram(),
      generalProgramAudience: 'individual' as const,
      generalParticipantTypes: ['individual' as const],
      generalProgramSessionRound: 'multi' as const,
      category: 'individual' as const,
    }
    const applied = applyGeneralRegistrationOverlayToProgram(existing, overlay, multiExtras)
    const withType = {
      ...applied,
      generalProgramSessionRound: multiExtras.sessionRoundType,
      registrationOverlay: overlay,
    }
    const synced = resyncGeneralRegistrationOverlayFromProgram(withType, overlay)
    const request = mapGeneralProgramToUpdateRequest(existing, {
      title: applied.title,
      mainTitle: applied.mainTitle,
      generalCommonInfo: applied.generalCommonInfo,
      registrationOverlay: synced,
      generalProgramSessionRound: 'multi',
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      generalCommonInfo?: {
        curriculumSessions?: Array<{ title?: string; description?: string; sessionLabel?: string }>
      }
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(detail.generalCommonInfo?.curriculumSessions).toEqual([
      expect.objectContaining({
        sessionLabel: '1회차',
        title: '개인 커리큘럼 단일1',
        description: '개인 커리큘럼 단일11',
      }),
      expect.objectContaining({
        sessionLabel: '2회차',
        title: '개인 커리큘럼 단일2',
        description: '개인 커리큘럼 단일22',
      }),
    ])
    expect(detail.registration?.overlay?.['generalRegistration.educationCurriculum.unitNameBySession']).toEqual({
      1: '개인 커리큘럼 단일1',
      2: '개인 커리큘럼 단일2',
    })
    expect(detail.registration?.overlay?.['generalRegistration.educationCurriculum.roundContentByRound']).toEqual({
      1: '개인 커리큘럼 단일11',
      2: '개인 커리큘럼 단일22',
    })
    expect(
      detail.registration?.overlay
    ).not.toHaveProperty('generalRegistration.educationCurriculum.educationFormBySession')

    const reloaded = reload(request)
    seedGeneralRegistrationOverlayFromProgram(reloaded)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.educationCurriculum.unitNameBySession']).toEqual({
      1: '개인 커리큘럼 단일1',
      2: '개인 커리큘럼 단일2',
    })
    expect(saved['generalRegistration.educationCurriculum.unitContentBySession']).toEqual({
      1: '개인 커리큘럼 단일11',
      2: '개인 커리큘럼 단일22',
    })
  })

  it('단수 extras 저장은 overlay 회차 맵이 생겨도 PATCH·GET sessionRound가 single이다', () => {
    const overlay: Record<string, unknown> = {
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
        1: '옛 본문',
      },
    }
    const singleExtras: GeneralRegistrationEditorExtras = {
      ...extras,
      sessionRoundType: 'single',
      curriculumChartSessionCount: 2,
      curriculumSessionCount: 2,
      participantOrganization: false,
    }
    const existing = {
      ...baseProgram(),
      generalProgramAudience: 'individual' as const,
      generalParticipantTypes: ['individual' as const],
      generalProgramSessionRound: 'multi' as const,
      category: 'individual' as const,
    }
    const applied = applyGeneralRegistrationOverlayToProgram(existing, overlay, singleExtras)
    const withType = {
      ...applied,
      generalProgramEducationStructure: singleExtras.programType,
      generalProgramSessionRound: singleExtras.sessionRoundType,
      registrationOverlay: overlay,
    }
    const synced = resyncGeneralRegistrationOverlayFromProgram(withType, overlay)
    const withOverlay = { ...withType, registrationOverlay: synced }
    expect(
      resolveEffectiveGeneralProgramTypeFields({
        generalProgramAudience: withOverlay.generalProgramAudience,
        generalProgramEducationStructure: withOverlay.generalProgramEducationStructure,
        generalProgramSessionRound: withOverlay.generalProgramSessionRound,
        curriculumSessions: withOverlay.generalCommonInfo?.curriculumSessions,
        registrationOverlay: synced,
      }).sessionRound
    ).toBe('single')

    const request = mapGeneralProgramToUpdateRequest(existing, {
      title: applied.title,
      mainTitle: applied.mainTitle,
      generalCommonInfo: applied.generalCommonInfo,
      registrationOverlay: synced,
      generalProgramEducationStructure: singleExtras.programType,
      generalProgramSessionRound: singleExtras.sessionRoundType,
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      generalProgramSessionRound?: string
      generalCommonInfo?: {
        curriculumSessions?: Array<{ sessionLabel?: string }>
      }
    }
    expect(detail.generalProgramSessionRound).toBe('single')
    expect(detail.generalCommonInfo?.curriculumSessions).toEqual([
      expect.objectContaining({ sessionLabel: '1차시' }),
      expect.objectContaining({ sessionLabel: '2차시' }),
    ])

    const reloaded = reload(request)
    expect(reloaded.generalProgramSessionRound).toBe('single')
    expect(extrasFromGeneralProgram(reloaded).sessionRoundType).toBe('single')
  })

  it('커리큘럼에서 일정으로 바꾸면 안 쓰는 curriculumSessions는 빈 배열로 보낸다', () => {
    const overlay: Record<string, unknown> = {
      'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
        1: '오리엔테이션',
      },
    }
    const scheduleExtras: GeneralRegistrationEditorExtras = {
      ...extras,
      programType: 'schedule',
      sessionRoundType: 'single',
      scheduleCurriculumDetailCount: 1,
    }
    const existing = {
      ...baseProgram(),
      generalProgramEducationStructure: 'curriculum' as const,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '1차시', title: '옛 단원', description: '옛 본문' },
        ],
        scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '옛 일정' }],
      },
    }
    const applied = applyGeneralRegistrationOverlayToProgram(existing, overlay, scheduleExtras)
    expect(applied.generalCommonInfo?.curriculumSessions).toEqual([])
    const synced = resyncGeneralRegistrationOverlayFromProgram(
      {
        ...applied,
        generalProgramEducationStructure: 'schedule',
        registrationOverlay: overlay,
      },
      overlay
    )
    const request = mapGeneralProgramToUpdateRequest(existing, {
      generalCommonInfo: applied.generalCommonInfo,
      registrationOverlay: synced,
      generalProgramEducationStructure: 'schedule',
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      generalCommonInfo?: {
        curriculumSessions?: unknown[]
        scheduleDetails?: Array<{ name?: string }>
      }
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(detail.generalCommonInfo?.curriculumSessions).toEqual([])
    expect(detail.generalCommonInfo?.scheduleDetails).toEqual([
      expect.objectContaining({ name: '오리엔테이션' }),
    ])
    expect(
      detail.registration?.overlay?.['generalRegistration.educationCurriculum.unitNameBySession']
    ).toEqual({})
  })

  it('복수 회차 진행 일정 일자 변경은 저장 후 회차 행과 overlay에 남는다', () => {
    const changedFirst = '26년 5월 4일(월) 9:30 ~ 12:20'
    const changedSecond = '26년 5월 11일(월) 13:00 ~ 15:00'
    const overlay: Record<string, unknown> = {
      'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
        1: '1회차 행사',
        2: '2회차 행사',
      },
      'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
        1: changedFirst,
        2: changedSecond,
      },
    }
    const multiScheduleExtras: GeneralRegistrationEditorExtras = {
      ...extras,
      programType: 'schedule',
      sessionRoundType: 'multi',
      scheduleCurriculumDetailCount: 2,
      participantOrganization: false,
    }
    const existing: Program = {
      ...baseProgram(),
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'multi',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
      category: 'individual',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        scheduleDetails: [
          {
            scheduleLabel: '행사 일정 01',
            name: '1회차 행사',
            scheduleDateLabel: '26년 4월 20일(월) 9:30 ~ 12:20',
          },
          {
            scheduleLabel: '행사 일정 02',
            name: '2회차 행사',
            scheduleDateLabel: '26년 4월 27일(월) 13:00 ~ 15:00',
          },
        ],
      },
    }
    const applied = applyGeneralRegistrationOverlayToProgram(existing, overlay, multiScheduleExtras)
    const withType: Program = {
      ...applied,
      generalProgramEducationStructure: multiScheduleExtras.programType,
      generalProgramSessionRound: multiScheduleExtras.sessionRoundType,
      registrationOverlay: overlay,
    }
    const syncedOverlay = resyncGeneralRegistrationOverlayFromProgram(withType, overlay)
    const withOverlay: Program = { ...withType, registrationOverlay: syncedOverlay }
    const values = {
      ...programToGeneralCommonInfoEditValues(withOverlay),
      educationStructure: multiScheduleExtras.programType,
      sessionRound: multiScheduleExtras.sessionRoundType,
    }
    const patch = generalCommonInfoEditValuesToProgramPatch(values, withOverlay)
    const request = mapGeneralProgramToUpdateRequest(existing, {
      ...patch,
      registrationOverlay: syncedOverlay,
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'multi',
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      generalCommonInfo?: {
        scheduleDetails?: Array<{ scheduleLabel?: string; scheduleDateLabel?: string }>
      }
      registration?: { overlay?: Record<string, unknown> }
    }
    // 3e3e1c1c1: 회차 행 라벨은 CMS 형식으로 정규화 후 서버 형식으로 직렬화된다(시각 `9:30` → `09:30`).
    const persistedFirst = '26년 5월 4일(월) 09:30 ~ 12:20'
    expect(detail.generalCommonInfo?.scheduleDetails?.map(row => row.scheduleDateLabel)).toEqual([
      persistedFirst,
      changedSecond,
    ])
    expect(
      detail.registration?.overlay?.[
        'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso'
      ]
    ).toEqual({ 1: persistedFirst, 2: changedSecond })

    // 재조회는 CMS 표시 형식으로 읽는다(같은 일자·시각).
    const reloaded = reload(request)
    expect(reloaded.generalCommonInfo?.scheduleDetails?.map(row => row.scheduleDateLabel)).toEqual([
      '2026.05.04(월) 09:30 ~ 12:20',
      '2026.05.11(월) 13:00 ~ 15:00',
    ])
  })
})
