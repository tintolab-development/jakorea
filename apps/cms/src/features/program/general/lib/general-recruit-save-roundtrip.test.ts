import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { detailEditValuesToProgramPatch } from '@/features/program/shared/model/program-detail-edit-schema'
import { serializeGeneralProgramServiceDetailJson } from '@/features/program/general/lib/general-program-service-detail-json'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { GENERAL_RECRUIT_OVERLAY_KEYS } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { resyncGeneralRecruitOverlayFromProgram } from '@/features/program/general/lib/general-recruit-overlay-from-program'
import { programToRecruitmentTabEditValues } from '@/features/program/general/lib/general-program-recruitment-edit-seed'

const now = '2026-01-01T00:00:00.000Z'

function baseProgram(): Program {
  return {
    id: 'general-recruit-roundtrip',
    title: '모집 왕복',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    sponsorId: 'sponsor-1',
    description: '컬럼 설명',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    applicationStartDate: '2026-01-10T00:00:00.000Z',
    applicationEndDate: '2026-02-10T00:00:00.000Z',
    targetLevels: ['high'],
    targetLevel: 'high',
    contactPhone: '02-1111-2222',
    contactEmail: 'new@jakorea.org',
    contactName: '새 문의처',
    instructorTargets: ['adult'],
    volunteerTargets: ['대학(원)생'],
    instructorApplicationStartDate: '2026-01-05T00:00:00.000Z',
    instructorApplicationEndDate: '2026-01-20T00:00:00.000Z',
    volunteerApplicationStartDate: '2026-01-06T00:00:00.000Z',
    volunteerApplicationEndDate: '2026-01-21T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    rounds: [],
    createdAt: now,
    updatedAt: now,
    registrationOverlay: {
      [APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.targetLevels]: ['elementary', 'middle', 'high'],
      [GENERAL_RECRUIT_OVERLAY_KEYS.individual.targetLevels]: ['elementary', 'middle', 'high'],
      [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantDescription]: 'overlay leftover 설명',
    },
    generalCommonInfo: {
      participantRecruitmentInfo: {
        programDescription: '중첩 프로그램 설명',
        educationTarget: '고등학교',
        recruitmentPeriodLabel: '2026.01.10 ~ 2026.02.10',
        contactOrganizationName: '새 문의처',
        inquiryTel: '02-1111-2222',
        inquiryEmail: 'new@jakorea.org',
      },
      instructorRecruitmentInfo: {
        recruitmentTarget: '성인',
      },
      volunteerRecruitmentInfo: {
        recruitmentTarget: '대학(원)생',
      },
    },
  }
}

describe('일반 모집 apply → resync overlay → serialize → seed leftover 패배', () => {
  it('폼 targetLevels·기간·문의처·상세설명이 PATCH overlay에 남고 leftover 배열이 이기지 않는다', () => {
    const existing = baseProgram()
    const values = programToRecruitmentTabEditValues(existing, 'participant')
    const patch = detailEditValuesToProgramPatch(
      { ...values, targetLevels: ['high'], description: '중첩 프로그램 설명' },
      existing
    )
    const draft: Program = {
      ...existing,
      ...patch,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const overlay = resyncGeneralRecruitOverlayFromProgram(draft, existing.registrationOverlay)

    expect(overlay[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.targetLevels]).toEqual(['high'])
    expect(overlay[GENERAL_RECRUIT_OVERLAY_KEYS.individual.targetLevels]).toEqual(['high'])
    expect(overlay[GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantDescription]).toBe(
      '중첩 프로그램 설명'
    )
    expect(overlay[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.inquiryContact]).toBe('새 문의처')
    expect(overlay[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.inquiryTel]).toBe('02-1111-2222')

    const serialized = serializeGeneralProgramServiceDetailJson(draft)
    expect(serialized).toBeTruthy()
    const parsed = JSON.parse(serialized!) as {
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(parsed.registration?.overlay?.[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.targetLevels]).toEqual(
      ['high']
    )

    const seeded = programToRecruitmentTabEditValues(
      { ...draft, registrationOverlay: overlay },
      'participant'
    )
    expect(seeded.targetLevels).toEqual(['high'])
    expect(seeded.description).toBe('중첩 프로그램 설명')
  })

  it('강사·봉사자 중첩 라벨이 패치에 들어간다', () => {
    const existing = baseProgram()
    const values = programToRecruitmentTabEditValues(existing, 'instructor')
    const patch = detailEditValuesToProgramPatch(values, existing)
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.recruitmentTarget).toContain('성인')
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.recruitmentPeriodLabel).toBeTruthy()

    const volunteerValues = programToRecruitmentTabEditValues(existing, 'volunteer')
    const volunteerPatch = detailEditValuesToProgramPatch(volunteerValues, existing)
    expect(volunteerPatch.generalCommonInfo?.volunteerRecruitmentInfo?.recruitmentTarget).toBeTruthy()
    expect(
      volunteerPatch.generalCommonInfo?.volunteerRecruitmentInfo?.recruitmentPeriodLabel
    ).toBeTruthy()
  })

  it('공통정보 serialize는 모집 overlay를 중첩에서 다시 그리지 않는다', () => {
    const existing = baseProgram()
    const omitted = serializeGeneralProgramServiceDetailJson(existing, {
      omitRecruitmentWindow: true,
    })
    expect(omitted).toBeTruthy()
    const parsed = JSON.parse(omitted!) as {
      registration?: { overlay?: Record<string, unknown> }
      generalCommonInfo?: { participantRecruitmentInfo?: unknown }
    }
    expect(parsed.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
    expect(
      parsed.registration?.overlay?.[GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantDescription]
    ).toBe('overlay leftover 설명')
  })
})
