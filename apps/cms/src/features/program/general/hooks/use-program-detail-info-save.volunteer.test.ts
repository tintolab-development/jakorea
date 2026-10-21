import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { GENERAL_RECRUIT_OVERLAY_KEYS } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { resyncGeneralRecruitOverlayFromProgram } from '@/features/program/general/lib/general-recruit-overlay-from-program'
import {
  detailEditValuesToProgramPatch,
  type ProgramDetailEditFormValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { programToRecruitmentTabEditValues } from '@/features/program/general/lib/general-program-recruitment-edit-seed'
import { mergeVolunteerRecruitmentInfoAfterOverlayApply } from '@/features/program/general/hooks/use-program-detail-info-save'

function baseProgram(): Program {
  return {
    id: 'p-volunteer-save',
    title: '봉사자 모집',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_volunteers',
    rounds: [],
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-06-30T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    volunteerTargets: ['elementary'],
    generalCommonInfo: {
      volunteerRecruitmentInfo: {
        recruitmentTarget: '초등학생',
        recruitmentTargetDetail: '기존 상세',
      },
    },
    registrationOverlay: {
      [GENERAL_RECRUIT_OVERLAY_KEYS.volunteer.volunteerTargets]: ['elementary'],
      [GENERAL_RECRUIT_OVERLAY_KEYS.volunteer.volunteerTargetDetail]: '기존 상세',
    },
  }
}

describe('volunteer recruitment detail save merge', () => {
  it('폼 모집 대상이 stale overlay 병합보다 우선한다', () => {
    const program = baseProgram()
    const values = programToRecruitmentTabEditValues(program, 'volunteer') as ProgramDetailEditFormValues
    const patch = detailEditValuesToProgramPatch(
      { ...values, volunteerTargets: ['university', 'adult'], volunteerTargetDetail: '변경 상세' },
      program
    )
    const staleOverlay = {
      [GENERAL_RECRUIT_OVERLAY_KEYS.volunteer.volunteerTargets]: ['elementary'],
      [GENERAL_RECRUIT_OVERLAY_KEYS.volunteer.volunteerTargetDetail]: '옛 overlay',
    }
    const draftWithOverlay = applyGeneralRecruitOverlayToProgram(
      { ...program, ...patch, generalCommonInfo: { ...program.generalCommonInfo, ...patch.generalCommonInfo } },
      staleOverlay,
      { preferOverlay: true }
    )
    const merged = mergeVolunteerRecruitmentInfoAfterOverlayApply(
      draftWithOverlay.generalCommonInfo?.volunteerRecruitmentInfo as Record<string, unknown>,
      patch.generalCommonInfo?.volunteerRecruitmentInfo as Record<string, unknown>
    )
    expect(merged?.recruitmentTarget).toBe('대학(원)생, 성인')
    expect(merged?.recruitmentTargetDetail).toBe('변경 상세')
  })

  it('봉사자 탭 patch는 rounds를 넣지 않는다', () => {
    const program = baseProgram()
    const values = programToRecruitmentTabEditValues(program, 'volunteer') as ProgramDetailEditFormValues
    const patch = detailEditValuesToProgramPatch(
      { ...values, volunteerApplicationEndDate: '2026-10-31T14:59:59.999Z' },
      program,
      { recruitmentAudience: 'volunteer' }
    )
    expect(patch.rounds).toBeUndefined()
    expect(patch.volunteerApplicationEndDate).toBe('2026-10-31T14:59:59.999Z')
  })

  it('resync 후 registration overlay에 폼 volunteerTargets가 반영된다', () => {
    const program = baseProgram()
    const values = programToRecruitmentTabEditValues(program, 'volunteer') as ProgramDetailEditFormValues
    const patch = detailEditValuesToProgramPatch(
      { ...values, volunteerTargets: ['high'], volunteerTargetDetail: '' },
      program
    )
    const draft: Program = {
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const overlay = resyncGeneralRecruitOverlayFromProgram(draft, program.registrationOverlay ?? {})
    expect(overlay[GENERAL_RECRUIT_OVERLAY_KEYS.volunteer.volunteerTargets]).toEqual(['high'])
  })
})
