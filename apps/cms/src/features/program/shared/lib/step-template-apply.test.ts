/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'

const loadFormTemplateVersionDraft = vi.fn()
const loadFormTemplateVersionDraftByVersionId = vi.fn()
vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  loadFormTemplateVersionDraft: (...args: unknown[]) => loadFormTemplateVersionDraft(...args),
  loadFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
    loadFormTemplateVersionDraftByVersionId(...args),
}))

import { applyRegistrationStepTemplateChange } from './step-template-apply'
import {
  clearRegistrationStepTemplateSelections,
  getSelectedOperationalTemplateCode,
} from './step-template-selection'
import { clearRegistrationWizardFormDraft } from '@/features/program/general/lib/registration-wizard-form-draft'
import { createApplicantRecruitFormInstitutionDraft } from '@/features/template/model/applicant-recruit-form-institution-draft'
import {
  getApplicantRecruitInstitutionOverlayRecord,
  patchApplicantRecruitInstitutionOverlay,
  resetApplicantRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { consumeWizardContentResetPending } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'

describe('applyRegistrationStepTemplateChange', () => {
  afterEach(() => {
    clearRegistrationStepTemplateSelections()
    clearRegistrationWizardFormDraft({
      programType: 'GENERAL',
      templateCode: 'recruitment-participant-school-custom-2',
    })
    resetApplicantRecruitInstitutionOverlay()
    resetGeneralRecruitOverlay()
    consumeWizardContentResetPending()
    vi.clearAllMocks()
  })

  it('stores the next code and applies the selected template overlay', async () => {
    const draft = createApplicantRecruitFormInstitutionDraft()
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: 'recruitment-participant-school-custom-2',
      savedAt: '2026-10-07T00:00:00.000Z',
      draft,
      overlay: {
        'recruit.notes': '복사본 안내',
        'recruit.detailInfo.programDescription': '템플릿 프로그램 설명',
      },
    })

    const result = await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'recruit-participant-school',
      previousCode: 'recruitment-participant-school',
      nextCode: 'recruitment-participant-school-custom-2',
      defaultCode: 'recruitment-participant-school',
    })

    expect(result).toBe('applied')
    expect(
      getSelectedOperationalTemplateCode(
        'GENERAL',
        'recruit-participant-school',
        'recruitment-participant-school'
      )
    ).toBe('recruitment-participant-school-custom-2')
    expect(loadFormTemplateVersionDraft).toHaveBeenCalledWith(
      'recruitment-participant-school-custom-2'
    )
    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.notes']).toBe('복사본 안내')
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.programDescription']).toBe(
      '템플릿 프로그램 설명'
    )
  })

  it('replaces previously written values with the loaded template overlay', async () => {
    patchApplicantRecruitInstitutionOverlay({
      'recruit.notes': '이전 모집 안내',
      'recruit.inquiryContact': '홍길동',
    })
    patchGeneralRecruitOverlay({
      'recruit.detailInfo.additionalContentHtml': '<p>이전 상세</p>',
      'recruit.detailInfo.programDescription': '이전 프로그램 설명',
    })
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: 'recruitment-participant-school-custom-2',
      savedAt: '2026-10-07T00:00:00.000Z',
      draft: createApplicantRecruitFormInstitutionDraft(),
      overlay: {
        'recruit.notes': '양식에 저장된 안내',
        'recruit.detailInfo.programDescription': '양식에 저장된 설명',
      },
    })

    await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'recruit-participant-school',
      previousCode: 'recruitment-participant-school',
      nextCode: 'recruitment-participant-school-custom-2',
      defaultCode: 'recruitment-participant-school',
    })

    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.notes']).toBe(
      '양식에 저장된 안내'
    )
    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.inquiryContact']).toBeUndefined()
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.programDescription']).toBe(
      '양식에 저장된 설명'
    )
    expect(
      getGeneralRecruitOverlayRecord()['recruit.detailInfo.additionalContentHtml']
    ).toBeUndefined()
  })

  it('loads by latestVersionId and still applies overlay when draft paragraphs are empty', async () => {
    loadFormTemplateVersionDraftByVersionId.mockResolvedValue({
      version: 1,
      templateId: 'recruitment-participant-school-custom-2',
      savedAt: '2026-10-07T00:00:00.000Z',
      draft: { schemaVersion: 1, formSettings: { titleNumbering: 'none' }, paragraphs: [] },
      overlay: {
        'recruit.notes': '버전에서 온 안내',
        'recruit.detailInfo.programDescription': '버전에서 온 설명',
      },
    })

    await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'recruit-participant-school',
      previousCode: 'recruitment-participant-school',
      nextCode: 'recruitment-participant-school-custom-2',
      defaultCode: 'recruitment-participant-school',
      latestVersionId: 22,
      baseTemplateCode: 'recruitment-participant-school',
    })

    expect(loadFormTemplateVersionDraftByVersionId).toHaveBeenCalledWith(
      'recruitment-participant-school-custom-2',
      22
    )
    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.notes']).toBe('버전에서 온 안내')
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.programDescription']).toBe(
      '버전에서 온 설명'
    )
  })

  it('is a no-op when the same template is selected again', async () => {
    const result = await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'recruit-participant-school',
      previousCode: 'recruitment-participant-school',
      nextCode: 'recruitment-participant-school',
      defaultCode: 'recruitment-participant-school',
    })
    expect(result).toBe('unchanged')
    expect(loadFormTemplateVersionDraft).not.toHaveBeenCalled()
  })
})
