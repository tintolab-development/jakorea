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
  peekApplicantRecruitInstitutionOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { DEFAULT_OPERATIONAL_OVERLAY_SCOPE } from '@/features/template/ui/form-set/shared/scoped-overlay-store'
import {
  consumeWizardContentResetPending,
  getRecruitDetailContentResetGeneration,
  peekWizardContentResetPending,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { resetAllOperationalOverlayStoresForTests } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  getGeminiRecruitFormRecord,
  resetGeminiRecruitForm,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-form-rhf'
import {
  clearOperationalSeedDefaultSuppression,
  readOperationalOverlayKvValue,
} from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { createEconomyRecruitFormInstitutionDraft } from '@/features/template/model/economy-recruit-form-institution-draft'
import { createProgramApplicationFormInstitutionDraft } from '@/features/template/model/program-application-form-institution-draft'
import { createProgramApplicationFormTrainedTeachersDraft } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { createRecruitFormInstructorDraft } from '@/features/template/model/recruit-form-instructor-draft'
import { createUjatRecruitFormInstitutionDraft } from '@/features/template/model/ujat-recruit-form-institution-draft'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
  peekGeneralApplicationOverlayRecord,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  getInstitutionApplicationProgramBridge,
  patchInstitutionApplicationProgramBridge,
  resetInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { loadRegistrationWizardFormDraft } from '@/features/program/general/lib/registration-wizard-form-draft'
import { getUjatRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  patchUjatRecruitVolunteerOverlay,
  peekUjatRecruitVolunteerOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'

describe('applyRegistrationStepTemplateChange', () => {
  afterEach(() => {
    clearRegistrationStepTemplateSelections()
    clearRegistrationWizardFormDraft({
      programType: 'GENERAL',
      templateCode: 'recruitment-participant-school-custom-2',
    })
    resetAllOperationalOverlayStoresForTests()
    resetInstitutionApplicationProgramBridge()
    clearOperationalSeedDefaultSuppression()
    for (const templateCode of [
      'application-participant-school-custom-2',
      'recruitment-instructor-custom-2',
      'recruitment-economy-custom-2',
      'application-trained-teachers-custom-2',
      'recruitment-ujat-school-custom-2',
    ]) {
      clearRegistrationWizardFormDraft({ programType: 'GENERAL', templateCode })
      clearRegistrationWizardFormDraft({ programType: 'ECONOMY', templateCode })
      clearRegistrationWizardFormDraft({ programType: 'TRAINED_TEACHERS', templateCode })
      clearRegistrationWizardFormDraft({ programType: 'UJAT', templateCode })
    }
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

  it('persists the selected template draft so hydrate can load it after a wizard template change', async () => {
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

    const generationBefore = getRecruitDetailContentResetGeneration()
    await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'recruit-participant-school',
      previousCode: 'recruitment-participant-school',
      nextCode: 'recruitment-participant-school-custom-2',
      defaultCode: 'recruitment-participant-school',
    })

    const saved = await loadRegistrationWizardFormDraft({
      programType: 'GENERAL',
      templateCode: 'recruitment-participant-school-custom-2',
    })
    expect(saved?.draft?.paragraphs.length).toBeGreaterThan(0)
    expect(saved?.overlay?.['recruit.notes']).toBe('복사본 안내')
    expect(saved?.overlay?.['recruit.detailInfo.programDescription']).toBe(
      '템플릿 프로그램 설명'
    )
    expect(peekWizardContentResetPending()).toBe(true)
    expect(getRecruitDetailContentResetGeneration()).toBe(generationBefore)
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
      22,
      { invalidateCache: false }
    )
    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.notes']).toBe('버전에서 온 안내')
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.programDescription']).toBe(
      '버전에서 온 설명'
    )
  })

  it('applies the selected application draft without clearing 공통정보 연동', async () => {
    patchInstitutionApplicationProgramBridge({
      educationStructure: 'schedule',
      educationScheduleMode: 'date',
      educationScheduleLines: ['2026-04-01'],
    })
    const draft = createProgramApplicationFormInstitutionDraft()
    const customDraft = {
      ...draft,
      paragraphs: [
        ...draft.paragraphs,
        {
          id: 'custom-application-field',
          kind: 'text',
          title: '추가 질문',
          body: '',
        },
      ],
    }
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: 'application-participant-school-custom-2',
      savedAt: '2026-10-07T00:00:00.000Z',
      draft: customDraft,
    })

    await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'application-participant-school',
      previousCode: 'application-participant-school',
      nextCode: 'application-participant-school-custom-2',
      defaultCode: 'application-participant-school',
    })

    expect(
      getSelectedOperationalTemplateCode(
        'GENERAL',
        'application-participant-school',
        'application-participant-school'
      )
    ).toBe('application-participant-school-custom-2')
    const saved = await loadRegistrationWizardFormDraft({
      programType: 'GENERAL',
      templateCode: 'application-participant-school-custom-2',
    })
    expect(saved?.draft.paragraphs.some(paragraph => paragraph.id === 'custom-application-field')).toBe(
      true
    )
    expect(getInstitutionApplicationProgramBridge().educationScheduleLines).toEqual(['2026-04-01'])
  })

  it('keeps institution recruit overlay when the instructor template changes', async () => {
    patchApplicantRecruitInstitutionOverlay({ 'recruit.notes': '기관 안내' })
    patchGeneralRecruitOverlay({
      'recruit.detailInfo.programDescription': '기관 상세',
      'recruit.instructor.inquiryContact': '이전 강사',
    })
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: 'recruitment-instructor-custom-2',
      savedAt: '2026-10-07T00:00:00.000Z',
      draft: createRecruitFormInstructorDraft(),
      overlay: { 'recruit.instructor.inquiryContact': '새 강사' },
    })

    await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'recruit-instructor',
      previousCode: 'recruitment-instructor',
      nextCode: 'recruitment-instructor-custom-2',
      defaultCode: 'recruitment-instructor',
    })

    expect(
      peekApplicantRecruitInstitutionOverlayRecord(DEFAULT_OPERATIONAL_OVERLAY_SCOPE)['recruit.notes']
    ).toBe('기관 안내')
    expect(
      peekGeneralRecruitOverlayRecord(DEFAULT_OPERATIONAL_OVERLAY_SCOPE)[
        'recruit.detailInfo.programDescription'
      ]
    ).toBe('기관 상세')
    expect(getGeneralRecruitOverlayRecord()['recruit.instructor.inquiryContact']).toBe('새 강사')
  })

  it('applies 1사1교 recruit overlay to economyRecruit.detailInfo only', async () => {
    patchGeneralRecruitOverlay({
      'recruit.detailInfo.programDescription': '일반 기관 상세',
      'economyRecruit.detailInfo.programDescription': '이전 1사1교',
    })
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: 'recruitment-economy-custom-2',
      savedAt: '2026-10-07T00:00:00.000Z',
      draft: createEconomyRecruitFormInstitutionDraft(),
      overlay: {
        'recruit.notes': '1사1교 안내',
        'economyRecruit.detailInfo.programDescription': '새 1사1교',
      },
    })

    await applyRegistrationStepTemplateChange({
      programType: 'ECONOMY',
      stepKey: 'recruit-participant-school',
      previousCode: 'recruitment-economy',
      nextCode: 'recruitment-economy-custom-2',
      defaultCode: 'recruitment-economy',
      baseTemplateCode: 'recruitment-economy',
    })

    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.notes']).toBe('1사1교 안내')
    expect(
      peekGeneralRecruitOverlayRecord(DEFAULT_OPERATIONAL_OVERLAY_SCOPE)[
        'recruit.detailInfo.programDescription'
      ]
    ).toBe('일반 기관 상세')
    expect(getGeneralRecruitOverlayRecord()['economyRecruit.detailInfo.programDescription']).toBe(
      '새 1사1교'
    )
  })

  it('applies 연수교사 application draft paragraphs without wiping other application keys', async () => {
    patchGeneralApplicationOverlay({
      'application.institution.memo': '기관 신청 유지',
      'application.trainedTeachers.memo': '이전 연수교사',
    })
    const draft = createProgramApplicationFormTrainedTeachersDraft()
    const customDraft = {
      ...draft,
      paragraphs: [
        ...draft.paragraphs,
        { id: 'trained-teachers-custom-field', kind: 'text', title: '추가 문항', body: '' },
      ],
    }
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: 'application-trained-teachers-custom-2',
      savedAt: '2026-10-07T00:00:00.000Z',
      draft: customDraft,
      overlay: { 'application.trainedTeachers.memo': '새 연수교사' },
    })

    await applyRegistrationStepTemplateChange({
      programType: 'TRAINED_TEACHERS',
      stepKey: 'application-participant-school',
      previousCode: 'application-trained-teachers',
      nextCode: 'application-trained-teachers-custom-2',
      defaultCode: 'application-trained-teachers',
      baseTemplateCode: 'application-trained-teachers',
    })

    const saved = await loadRegistrationWizardFormDraft({
      programType: 'TRAINED_TEACHERS',
      templateCode: 'application-trained-teachers-custom-2',
    })
    expect(
      saved?.draft.paragraphs.some(paragraph => paragraph.id === 'trained-teachers-custom-field')
    ).toBe(true)
    expect(
      peekGeneralApplicationOverlayRecord(DEFAULT_OPERATIONAL_OVERLAY_SCOPE)[
        'application.institution.memo'
      ]
    ).toBe('기관 신청 유지')
    expect(getGeneralApplicationOverlayRecord()['application.trainedTeachers.memo']).toBe(
      '새 연수교사'
    )
  })

  it('keeps UJAT volunteer overlay when the school recruit template changes', async () => {
    patchUjatRecruitVolunteerOverlay({ 'recruit.volunteer.notes': '봉사자 안내' })
    patchGeneralRecruitOverlay({
      'recruitVolunteer.detailInfo.programDescription': '봉사자 상세',
      'ujatRecruit.detailInfo.programDescription': '이전 기관 상세',
    })
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: 'recruitment-ujat-school-custom-2',
      savedAt: '2026-10-07T00:00:00.000Z',
      draft: createUjatRecruitFormInstitutionDraft(),
      overlay: {
        'recruit.notes': 'UJAT 기관 안내',
        'ujatRecruit.detailInfo.programDescription': '새 기관 상세',
      },
    })

    await applyRegistrationStepTemplateChange({
      programType: 'UJAT',
      stepKey: 'recruit-ujat-school',
      previousCode: 'recruitment-ujat-school',
      nextCode: 'recruitment-ujat-school-custom-2',
      defaultCode: 'recruitment-ujat-school',
      baseTemplateCode: 'recruitment-ujat-school',
    })

    expect(
      peekUjatRecruitVolunteerOverlayRecord(DEFAULT_OPERATIONAL_OVERLAY_SCOPE)[
        'recruit.volunteer.notes'
      ]
    ).toBe('봉사자 안내')
    expect(
      peekGeneralRecruitOverlayRecord(DEFAULT_OPERATIONAL_OVERLAY_SCOPE)[
        'recruitVolunteer.detailInfo.programDescription'
      ]
    ).toBe('봉사자 상세')
    expect(getUjatRecruitInstitutionOverlayRecord()['recruit.notes']).toBe('UJAT 기관 안내')
    expect(getGeneralRecruitOverlayRecord()['ujatRecruit.detailInfo.programDescription']).toBe(
      '새 기관 상세'
    )
  })

  it('clears seeded recruit defaults after a template change and leaves other forms alone', async () => {
    expect(
      readOperationalOverlayKvValue(
        'institution-recruit',
        getApplicantRecruitInstitutionOverlayRecord(),
        'recruit.maxAssignableInstructors',
        2
      )
    ).toBe(2)
    expect(
      readOperationalOverlayKvValue(
        'general-recruit',
        getGeneralRecruitOverlayRecord(),
        'recruit.volunteer.interviewRequired',
        'yes'
      )
    ).toBe('yes')
    expect(
      readOperationalOverlayKvValue(
        'gemini-recruit',
        getGeminiRecruitFormRecord(),
        'geminiRecruit.minStudentCount',
        15
      )
    ).toBe(15)

    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 1,
      templateId: 'recruitment-economy-custom-2',
      savedAt: '2026-10-07T00:00:00.000Z',
      draft: createEconomyRecruitFormInstitutionDraft(),
    })

    await applyRegistrationStepTemplateChange({
      programType: 'ECONOMY',
      stepKey: 'recruit-economy',
      previousCode: 'recruitment-economy',
      nextCode: 'recruitment-economy-custom-2',
      defaultCode: 'recruitment-economy',
      baseTemplateCode: 'recruitment-economy',
    })

    expect(
      readOperationalOverlayKvValue(
        'institution-recruit',
        getApplicantRecruitInstitutionOverlayRecord(),
        'recruit.maxAssignableInstructors',
        2
      )
    ).toBeUndefined()
    expect(
      readOperationalOverlayKvValue(
        'institution-recruit',
        getApplicantRecruitInstitutionOverlayRecord(),
        'recruit.maxClassCount',
        4
      )
    ).toBeUndefined()
    expect(
      readOperationalOverlayKvValue(
        'institution-recruit',
        getApplicantRecruitInstitutionOverlayRecord(),
        'recruit.preguidanceRequired',
        'need'
      )
    ).toBe('')
    expect(
      readOperationalOverlayKvValue(
        'general-recruit',
        getGeneralRecruitOverlayRecord(),
        'recruit.volunteer.interviewRequired',
        'yes'
      )
    ).toBe('yes')
    expect(
      readOperationalOverlayKvValue(
        'general-recruit',
        getGeneralRecruitOverlayRecord(),
        'recruit.instructor.recruitTargets',
        ['adult']
      )
    ).toEqual(['adult'])
  })

  it('clears volunteer, instructor, and gemini seed defaults on their own template change', async () => {
    loadFormTemplateVersionDraft.mockResolvedValue(null)

    await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'recruit-volunteer',
      previousCode: 'recruitment-volunteer',
      nextCode: 'recruitment-volunteer-custom-2',
      defaultCode: 'recruitment-volunteer',
      baseTemplateCode: 'recruitment-volunteer',
    })
    expect(
      readOperationalOverlayKvValue(
        'general-recruit',
        getGeneralRecruitOverlayRecord(),
        'recruit.volunteer.interviewRequired',
        'yes'
      )
    ).toBe('')
    expect(
      readOperationalOverlayKvValue(
        'general-recruit',
        getGeneralRecruitOverlayRecord(),
        'recruit.instructor.recruitTargets',
        ['adult']
      )
    ).toEqual(['adult'])

    clearOperationalSeedDefaultSuppression()
    await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'recruit-instructor',
      previousCode: 'recruitment-instructor',
      nextCode: 'recruitment-instructor-custom-2',
      defaultCode: 'recruitment-instructor',
      baseTemplateCode: 'recruitment-instructor',
    })
    expect(
      readOperationalOverlayKvValue(
        'general-recruit',
        getGeneralRecruitOverlayRecord(),
        'recruit.instructor.recruitTargets',
        ['adult']
      )
    ).toEqual([])

    clearOperationalSeedDefaultSuppression()
    resetGeminiRecruitForm()
    await applyRegistrationStepTemplateChange({
      programType: 'GEMINI',
      stepKey: 'recruit-gemini',
      previousCode: 'recruitment-gemini-visiting-training',
      nextCode: 'recruitment-gemini-visiting-training-custom-2',
      defaultCode: 'recruitment-gemini-visiting-training',
      baseTemplateCode: 'recruitment-gemini-visiting-training',
    })
    expect(getGeminiRecruitFormRecord()['geminiRecruit.minStudentCount']).toBeUndefined()
    expect(
      readOperationalOverlayKvValue(
        'gemini-recruit',
        getGeminiRecruitFormRecord(),
        'geminiRecruit.minStudentCount',
        15
      )
    ).toBeUndefined()
    expect(
      readOperationalOverlayKvValue(
        'gemini-recruit',
        getGeminiRecruitFormRecord(),
        'geminiRecruit.educationForm',
        'online'
      )
    ).toBe('')
  })

  it('reloads from remote when the same template is selected again', async () => {
    const draft = createApplicantRecruitFormInstitutionDraft()
    loadFormTemplateVersionDraft.mockResolvedValue({
      version: 2,
      templateId: 'recruitment-participant-school',
      savedAt: '2026-10-09T00:00:00.000Z',
      draft,
      overlay: { 'recruit.notes': '양식 관리에서 수정된 안내' },
    })

    const result = await applyRegistrationStepTemplateChange({
      programType: 'GENERAL',
      stepKey: 'recruit-participant-school',
      previousCode: 'recruitment-participant-school',
      nextCode: 'recruitment-participant-school',
      defaultCode: 'recruitment-participant-school',
    })
    expect(result).toBe('applied')
    expect(loadFormTemplateVersionDraft).toHaveBeenCalledWith('recruitment-participant-school')
    expect(getApplicantRecruitInstitutionOverlayRecord()['recruit.notes']).toBe(
      '양식 관리에서 수정된 안내'
    )
  })
})
