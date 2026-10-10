import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { GENERAL_RECRUIT_OVERLAY_KEYS } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import {
  buildMergedRegistrationOverlayForRecruitSave,
  instructorRecruitOverlayPatchFromDetailEditValues,
  participantRecruitOverlayPatchFromDetailEditValues,
} from '@/features/program/general/lib/detail-operational-save-merge'
import { detailEditValuesToProgramPatch } from '@/features/program/shared/model/program-detail-edit-schema'
import { programToRecruitmentTabEditValues } from '@/features/program/general/lib/general-program-recruitment-edit-seed'
import {
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resyncGeneralRecruitOverlayFromProgram } from '@/features/program/general/lib/general-recruit-overlay-from-program'

beforeEach(() => {
  resetGeneralRecruitOverlayStoreForTests()
})

function baseProgram(): Program {
  return {
    id: 'merge-test',
    title: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    generalParticipantTypes: ['school_institution', 'individual'],
    instructorTargets: ['adult'],
    rounds: [],
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-06-30T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    registrationOverlay: {
      [GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]: ['elementary'],
    },
    generalCommonInfo: {
      instructorRecruitmentInfo: { recruitmentTarget: '성인' },
    },
  }
}

describe('detail-operational-save-merge', () => {
  it('stale active-scope instructor overlay보다 폼 instructorTargets가 merge에 우선한다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', {
      [GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]: ['elementary'],
    })
    replaceGeneralRecruitOverlayForScope('application-instructor', {
      unrelated: 'stale',
    })

    const program = baseProgram()
    const values = programToRecruitmentTabEditValues(program, 'instructor')
    const patch = detailEditValuesToProgramPatch(
      { ...values, instructorTargets: ['adult'] },
      program
    )
    const merged = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: patch,
      values: { ...values, instructorTargets: ['adult'] },
      audience: 'instructor',
    })
    expect(merged[GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]).toEqual(['adult'])
  })

  it('participant form patch가 targetLevels에 반영되고 resync 후 overlay에 남는다', () => {
    const program = baseProgram()
    const values = programToRecruitmentTabEditValues(program, 'participant')
    const patch = detailEditValuesToProgramPatch({ ...values, targetLevels: ['high'] }, program)
    const formPatch = participantRecruitOverlayPatchFromDetailEditValues({
      ...values,
      targetLevels: ['high'],
    })
    expect(formPatch[GENERAL_RECRUIT_OVERLAY_KEYS.individual.targetLevels]).toEqual(['high'])

    const merged = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: patch,
      values: { ...values, targetLevels: ['high'] },
      audience: 'participant',
    })
    const draft: Program = {
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const overlay = resyncGeneralRecruitOverlayFromProgram(draft, merged)
    expect(overlay[GENERAL_RECRUIT_OVERLAY_KEYS.individual.targetLevels]).toEqual(['high'])
  })

  it('instructorRecruitOverlayPatchFromDetailEditValues는 빈 배열을 반영한다', () => {
    const patch = instructorRecruitOverlayPatchFromDetailEditValues({
      instructorTargets: [],
      instructorTargetDetail: '',
    })
    expect(patch[GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]).toEqual([])
  })
})
