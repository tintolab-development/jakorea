import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resolveGeneralProgramParticipantRecruitmentDisplay } from './participant-recruitment-display'
import { resolveGeneralProgramInstructorRecruitmentDisplay } from './instructor-recruitment-display'
import { resolveGeneralProgramVolunteerRecruitmentDisplay } from './volunteer-recruitment-display'
import {
  applyGeneralRecruitOverlayToProgram,
  GENERAL_RECRUIT_OVERLAY_KEYS,
  resolveGeneralRecruitDetailDisplayProgram,
} from './general-recruit-overlay-to-program'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'

function commonOnlyProgram(): Program {
  return {
    id: 'general-common-only',
    title: '공통만 있는 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '공통정보 프로그램 설명',
    recruitmentGuide: '공통 모집 안내',
    learningSupportContent: '공통 학습 지원',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    applicationStartDate: '2026-01-01T00:00:00.000Z',
    applicationEndDate: '2026-01-31T00:00:00.000Z',
    targetLevels: ['elementary'],
    targetLevel: 'elementary',
    district: '공통 교육대상 상세',
    contactPhone: '02-0000-0000',
    contactEmail: 'common@jakorea.org',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
  } as Program
}

describe('모집 정보 display — 공통정보 폴백 금지', () => {
  it('공통 Program 필드만 있으면 대상·기간·문의처는 -', () => {
    const program = commonOnlyProgram()
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)

    expect(display.targetLabel).toBe('-')
    expect(display.targetDetailLabel).toBe('-')
    expect(display.recruitmentPeriodLabel).toBe('-')
    expect(display.contactOrganizationName).toBe('-')
    expect(display.contactPhone).toBe('-')
    expect(display.contactEmail).toBe('-')
  })

  it('모집 overlay 병합 후에는 RecruitmentInfo 값을 표시', () => {
    const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
    const merged = applyGeneralRecruitOverlayToProgram(
      commonOnlyProgram(),
      {
        [inst.targetLevels]: ['high'],
        [inst.targetLevelDetail]: '모집 양식 상세',
        [inst.recruitRangeSeal]: {
          start: '2025-12-08T00:00:00+09:00',
          end: '2026-01-16T00:00:00+09:00',
        },
        [inst.inquiryContact]: '모집 문의처',
        [inst.inquiryTel]: '02-6085-6028',
        [inst.inquiryEmail]: 'recruit@jakorea.org',
        [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantDescription]: '모집 양식 설명',
      },
      { preferOverlay: true }
    )

    const display = resolveGeneralProgramParticipantRecruitmentDisplay(merged)
    expect(display.targetLabel).toBe('고등학교')
    expect(display.targetDetailLabel).toBe('모집 양식 상세')
    expect(display.recruitmentPeriodLabel).toContain('2025')
    expect(display.contactOrganizationName).toBe('모집 문의처')
    expect(display.contactPhone).toBe('02-6085-6028')
    expect(display.contactEmail).toBe('recruit@jakorea.org')

    const detail = resolveGeneralRecruitDetailDisplayProgram(merged, 'participant')
    expect(detail.description).toBe('모집 양식 설명')
    expect(detail.learningSupportContent).toBeUndefined()
  })

  it('강사·봉사자도 공통 폴백 없이 -', () => {
    const program = commonOnlyProgram()
    expect(resolveGeneralProgramInstructorRecruitmentDisplay(program).instructorTargetLabel).toBe(
      '-'
    )
    expect(resolveGeneralProgramInstructorRecruitmentDisplay(program).recruitmentPeriodLabel).toBe(
      '-'
    )
    expect(resolveGeneralProgramVolunteerRecruitmentDisplay(program).volunteerTargetLabel).toBe('-')
    expect(resolveGeneralProgramVolunteerRecruitmentDisplay(program).recruitmentPeriodLabel).toBe(
      '-'
    )
  })
})
