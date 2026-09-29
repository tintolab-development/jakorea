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
import {
  readGeneralRegistrationOverlayForSave,
  seedGeneralRegistrationOverlayFromProgram,
} from './registration-overlay-sync'

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
})
