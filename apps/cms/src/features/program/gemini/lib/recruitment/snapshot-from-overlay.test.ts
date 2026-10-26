import { beforeEach, describe, expect, it } from 'vitest'
import { createGeminiVisitingTrainingRecruitFormDraft } from '@/features/template/model/gemini-visiting-training-recruit-form-draft'
import { resetGeminiRecruitForm } from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-form-rhf'
import { resetGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { setOperationalOverlayScope } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE } from './add-template'
import {
  buildGeminiRecruitmentSnapshotFromOverlay,
  isGeminiRecruitmentInstitutionComplete,
  seedGeminiRecruitmentOverlaysFromSnapshot,
} from './snapshot-from-overlay'
import { createDefaultGeminiRecruitmentAddFormSnapshot } from './add-local-save'

describe('gemini recruitment snapshot from overlay', () => {
  beforeEach(() => {
    resetGeminiRecruitForm()
    resetGeneralRecruitOverlay()
    setOperationalOverlayScope(GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE)
  })

  it('round-trips institution and detail fields through overlay stores', () => {
    const snapshot = {
      ...createDefaultGeminiRecruitmentAddFormSnapshot(),
      title: '찾아가는 연수',
      educationTargetLevels: ['adult'],
      educationTargetDetail: '성인 학습 기관',
      applicationPeriodStart: '2026-10-01T00:00:00.000Z',
      applicationPeriodEnd: '2026-10-10T00:00:00.000Z',
      trainingRequestPeriodStart: '2026-10-11T00:00:00.000Z',
      trainingRequestPeriodEnd: '2026-10-20T00:00:00.000Z',
      inquiryContactName: '담당자',
      inquiryTel: '02-0000-0000',
      inquiryEmail: 'gemini@jakorea.org',
      notesNotApplicable: true,
      programDescription: '프로그램 설명',
      recruitmentGuide: '모집 안내',
    }
    seedGeminiRecruitmentOverlaysFromSnapshot(snapshot, GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE)
    const restored = buildGeminiRecruitmentSnapshotFromOverlay(
      createGeminiVisitingTrainingRecruitFormDraft()
    )
    expect(restored.title).toBe('찾아가는 연수')
    expect(restored.educationTargetLevels).toEqual(['adult'])
    expect(restored.programDescription).toBe('프로그램 설명')
    expect(restored.recruitmentGuide).toBe('모집 안내')
    expect(isGeminiRecruitmentInstitutionComplete(restored)).toBe(true)
  })
})
