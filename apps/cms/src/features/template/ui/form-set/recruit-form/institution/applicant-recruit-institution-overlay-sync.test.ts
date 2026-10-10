import { afterEach, describe, expect, it } from 'vitest'
import { getInstitutionApplicationProgramBridge, resetInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  patchApplicantRecruitInstitutionOverlay,
  resetApplicantRecruitInstitutionOverlayStoreForTests,
  setApplicantRecruitInstitutionOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'

afterEach(() => {
  resetInstitutionApplicationProgramBridge()
  resetApplicantRecruitInstitutionOverlayStoreForTests()
})

describe('applicant-recruit-institution overlay → bridge', () => {
  it('preguidanceRequired patch 시 preEducationNoticeRequired를 동기화한다', () => {
    setApplicantRecruitInstitutionOverlayScope('recruitment-participant-school')
    patchApplicantRecruitInstitutionOverlay({
      [APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired]: 'none',
    })
    expect(getInstitutionApplicationProgramBridge().preEducationNoticeRequired).toBe(false)

    patchApplicantRecruitInstitutionOverlay({
      [APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired]: 'need',
    })
    expect(getInstitutionApplicationProgramBridge().preEducationNoticeRequired).toBe(true)
  })
})
