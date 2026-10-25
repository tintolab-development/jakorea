/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'

const loadFormTemplateVersionDraft = vi.fn()
vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  loadFormTemplateVersionDraft: (...args: unknown[]) => loadFormTemplateVersionDraft(...args),
  loadFormTemplateVersionDraftByVersionId: vi.fn(),
}))

import { applyRegistrationStepTemplateChange } from '@/features/program/shared/lib/step-template-apply'
import {
  clearRegistrationStepTemplateSelections,
  getSelectedOperationalTemplateCode,
  setRegistrationStepTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'
import {
  clearRegistrationWizardFormDraft,
  loadRegistrationWizardFormDraft,
  persistRegistrationWizardFormDraft,
} from '@/features/program/general/lib/registration-wizard-form-draft'
import {
  beginRegistrationWizardVisit,
  endRegistrationWizardVisit,
  isRegistrationWizardVisitDirty,
  trackRegistrationWizardVisitSave,
} from '@/features/program/general/lib/registration-wizard-visit'
import {
  peekRegistrationProgramDraftPayload,
  syncRegistrationProgramDraftSession,
} from '@/features/program/general/lib/registration-wizard-draft-session'
import { createApplicantRecruitFormInstitutionDraft } from '@/features/template/model/applicant-recruit-form-institution-draft'
import { resetApplicantRecruitInstitutionOverlay } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { resetGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { clearOperationalSeedDefaultSuppression } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { resetGeminiRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-overlay-sync'

const PROGRAM_TYPE = 'GENERAL'
const DEFAULT_CODE = 'recruitment-participant-school'
const CUSTOM_CODE = 'recruitment-participant-school-custom-2'
const STEP_KEY = 'recruit-participant-school'

function selectedCode(): string {
  return getSelectedOperationalTemplateCode(PROGRAM_TYPE, STEP_KEY, DEFAULT_CODE)
}

describe('registration wizard visit', () => {
  afterEach(() => {
    endRegistrationWizardVisit(PROGRAM_TYPE)
    clearRegistrationStepTemplateSelections()
    clearRegistrationWizardFormDraft({ programType: PROGRAM_TYPE, templateCode: DEFAULT_CODE })
    clearRegistrationWizardFormDraft({ programType: PROGRAM_TYPE, templateCode: CUSTOM_CODE })
    clearRegistrationWizardFormDraft({
      programType: PROGRAM_TYPE,
      templateCode: 'recruitment-participant-school-custom-3',
    })
    localStorage.removeItem('cms.jakorea.registrationProgramDrafts.v1')
    resetApplicantRecruitInstitutionOverlay()
    resetGeneralRecruitOverlay()
    clearOperationalSeedDefaultSuppression()
    resetGeminiRecruitOverlay()
    vi.clearAllMocks()
  })

  it('방문 중 양식 선택을 바꾸면 dirty로 판별한다', async () => {
    beginRegistrationWizardVisit(PROGRAM_TYPE)
    expect(isRegistrationWizardVisitDirty(PROGRAM_TYPE)).toBe(false)

    setRegistrationStepTemplateSelection(PROGRAM_TYPE, STEP_KEY, CUSTOM_CODE)
    expect(isRegistrationWizardVisitDirty(PROGRAM_TYPE)).toBe(true)

    endRegistrationWizardVisit(PROGRAM_TYPE)
  })

  it('임시저장 없이 닫으면 바꾼 양식 선택과 초안을 연 시점으로 되돌린다', async () => {
    const draft = createApplicantRecruitFormInstitutionDraft()
    await persistRegistrationWizardFormDraft({
      programType: PROGRAM_TYPE,
      templateCode: DEFAULT_CODE,
      draft,
      overlay: { 'recruit.notes': '저장된 안내' },
    })
    beginRegistrationWizardVisit(PROGRAM_TYPE)
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: CUSTOM_CODE,
      savedAt: '2026-10-07T00:00:00.000Z',
      draft,
      overlay: { 'recruit.notes': '복사본 안내' },
    })

    await applyRegistrationStepTemplateChange({
      programType: PROGRAM_TYPE,
      stepKey: STEP_KEY,
      previousCode: DEFAULT_CODE,
      nextCode: CUSTOM_CODE,
      defaultCode: DEFAULT_CODE,
    })
    expect(selectedCode()).toBe(CUSTOM_CODE)

    const resetMemory = vi.fn()
    endRegistrationWizardVisit(PROGRAM_TYPE, resetMemory)

    expect(resetMemory).toHaveBeenCalledOnce()
    expect(selectedCode()).toBe(DEFAULT_CODE)
    expect(
      await loadRegistrationWizardFormDraft({
        programType: PROGRAM_TYPE,
        templateCode: CUSTOM_CODE,
      })
    ).toBeNull()
    expect(
      (
        await loadRegistrationWizardFormDraft({
          programType: PROGRAM_TYPE,
          templateCode: DEFAULT_CODE,
        })
      )?.overlay?.['recruit.notes']
    ).toBe('저장된 안내')
    expect(peekRegistrationProgramDraftPayload(PROGRAM_TYPE)).toBeUndefined()
  })

  it('임시저장한 양식 변경은 닫아도 초안과 선택 메타가 남는다', async () => {
    const draft = createApplicantRecruitFormInstitutionDraft()
    beginRegistrationWizardVisit(PROGRAM_TYPE)
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: CUSTOM_CODE,
      savedAt: '2026-10-07T00:00:00.000Z',
      draft,
      overlay: { 'recruit.notes': '복사본 안내' },
    })
    await applyRegistrationStepTemplateChange({
      programType: PROGRAM_TYPE,
      stepKey: STEP_KEY,
      previousCode: DEFAULT_CODE,
      nextCode: CUSTOM_CODE,
      defaultCode: DEFAULT_CODE,
    })
    await trackRegistrationWizardVisitSave(PROGRAM_TYPE, async () => {
      syncRegistrationProgramDraftSession({
        programType: PROGRAM_TYPE,
        registrationTemplateCode: 'registration-general',
        activeStep: STEP_KEY,
      })
    })

    setRegistrationStepTemplateSelection(
      PROGRAM_TYPE,
      STEP_KEY,
      'recruitment-participant-school-custom-3'
    )
    await persistRegistrationWizardFormDraft({
      programType: PROGRAM_TYPE,
      templateCode: 'recruitment-participant-school-custom-3',
      draft,
      overlay: { 'recruit.notes': '저장 후 변경' },
    })

    endRegistrationWizardVisit(PROGRAM_TYPE)

    expect(selectedCode()).toBe(DEFAULT_CODE)
    expect(peekRegistrationProgramDraftPayload(PROGRAM_TYPE)?.selectedOperationalTemplates).toEqual({
      [STEP_KEY]: CUSTOM_CODE,
    })
    expect(
      (
        await loadRegistrationWizardFormDraft({
          programType: PROGRAM_TYPE,
          templateCode: CUSTOM_CODE,
        })
      )?.overlay?.['recruit.notes']
    ).toBe('복사본 안내')
    expect(
      await loadRegistrationWizardFormDraft({
        programType: PROGRAM_TYPE,
        templateCode: 'recruitment-participant-school-custom-3',
      })
    ).toBeNull()
  })

  it('닫는 중에 임시저장이 끝나면 그 저장을 기준으로 남긴다', async () => {
    const draft = createApplicantRecruitFormInstitutionDraft()
    beginRegistrationWizardVisit(PROGRAM_TYPE)
    let releaseSave: () => void = () => {}
    const gate = new Promise<void>(resolve => {
      releaseSave = resolve
    })
    const resetMemory = vi.fn()
    const saving = trackRegistrationWizardVisitSave(PROGRAM_TYPE, async () => {
      await gate
      setRegistrationStepTemplateSelection(PROGRAM_TYPE, STEP_KEY, CUSTOM_CODE)
      await persistRegistrationWizardFormDraft({
        programType: PROGRAM_TYPE,
        templateCode: CUSTOM_CODE,
        draft,
        overlay: { 'recruit.notes': '저장 완료' },
      })
      syncRegistrationProgramDraftSession({
        programType: PROGRAM_TYPE,
        registrationTemplateCode: 'registration-general',
        activeStep: STEP_KEY,
      })
    })

    endRegistrationWizardVisit(PROGRAM_TYPE, resetMemory)
    expect(resetMemory).not.toHaveBeenCalled()

    releaseSave()
    await saving

    expect(resetMemory).toHaveBeenCalledOnce()
    expect(selectedCode()).toBe(DEFAULT_CODE)
    expect(peekRegistrationProgramDraftPayload(PROGRAM_TYPE)?.selectedOperationalTemplates).toEqual({
      [STEP_KEY]: CUSTOM_CODE,
    })
    expect(
      (
        await loadRegistrationWizardFormDraft({
          programType: PROGRAM_TYPE,
          templateCode: CUSTOM_CODE,
        })
      )?.overlay?.['recruit.notes']
    ).toBe('저장 완료')
  })
})
