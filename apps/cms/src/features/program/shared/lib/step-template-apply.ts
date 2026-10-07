import {
  loadFormTemplateVersionDraft,
  loadFormTemplateVersionDraftByVersionId,
} from '@/features/template/api/admin-form-templates-service'
import {
  getFormTemplateVersionCacheEntry,
  upsertFormTemplateVersionCacheEntry,
} from '@/features/template/api/form-template-version-cache'
import { stripWritingTemplateCopySuffix } from '@/features/template/lib/form-template-delete-policy'
import { resetInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { resetApplicantRecruitInstitutionOverlay } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  beginRecruitDetailContentReset,
  commitRecruitDetailContentReset,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { resetGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resetGeneralApplicationOverlay } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { resetGeminiRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-overlay-sync'
import { resetUjatRecruitInstitutionOverlay } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import { resetUjatRecruitVolunteerOverlay } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { resetUjatApplicationInstitutionOverlay } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import { resetUjatApplicationVolunteerOverlay } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  clearRegistrationWizardFormDraft,
  persistRegistrationWizardFormDraft,
} from '@/features/program/general/lib/registration-wizard-form-draft'
import {
  applyOperationalOverlayForCatalogId,
  createSeedDraftForOperationalCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { setRegistrationStepTemplateSelection } from '@/features/program/shared/lib/step-template-selection'

function resolveSeedCatalogId(templateCode: string): string {
  const cached = getFormTemplateVersionCacheEntry(templateCode)?.baseTemplateCode?.trim()
  if (cached != null && cached !== '') return cached
  return stripWritingTemplateCopySuffix(templateCode)
}

function resetDedicatedOverlayForCatalogId(catalogId: string): void {
  const base = resolveSeedCatalogId(catalogId)
  if (
    base === 'recruitment-participant-school' ||
    base === 'recruitment-economy' ||
    base === 'recruitment-trained-teachers'
  ) {
    resetApplicantRecruitInstitutionOverlay()
    return
  }
  if (base === 'recruitment-ujat-school') {
    resetUjatRecruitInstitutionOverlay()
    return
  }
  if (base === 'recruitment-ujat-volunteer') {
    resetUjatRecruitVolunteerOverlay()
    return
  }
  if (base === 'application-ujat-school') {
    resetUjatApplicationInstitutionOverlay()
    return
  }
  if (base === 'application-ujat-volunteer') {
    resetUjatApplicationVolunteerOverlay()
  }
}

async function loadSelectedTemplateDraft(args: {
  templateCode: string
  latestVersionId?: number
}): Promise<Awaited<ReturnType<typeof loadFormTemplateVersionDraft>>> {
  if (args.latestVersionId != null) {
    try {
      const byVersion = await loadFormTemplateVersionDraftByVersionId(
        args.templateCode,
        args.latestVersionId
      )
      if (byVersion != null) return byVersion
    } catch {
      /* code 경로로 재시도 */
    }
  }
  return loadFormTemplateVersionDraft(args.templateCode)
}

function resolveLoadedDraft(
  saved: Awaited<ReturnType<typeof loadFormTemplateVersionDraft>>,
  templateCode: string
) {
  if (saved?.draft != null && saved.draft.paragraphs.length > 0) return saved.draft
  return createSeedDraftForOperationalCatalogId(resolveSeedCatalogId(templateCode))
}

export async function applyRegistrationStepTemplateChange(args: {
  programType: string
  stepKey: string
  previousCode: string
  nextCode: string
  defaultCode: string
  latestVersionId?: number
  baseTemplateCode?: string
  apiTemplateId?: number
}): Promise<'unchanged' | 'applied'> {
  if (args.nextCode === args.previousCode) return 'unchanged'

  const cached = getFormTemplateVersionCacheEntry(args.nextCode)
  if (args.baseTemplateCode != null || args.latestVersionId != null || args.apiTemplateId != null) {
    upsertFormTemplateVersionCacheEntry({
      templateCode: args.nextCode,
      templateId: args.apiTemplateId ?? cached?.templateId ?? 0,
      latestVersionId: args.latestVersionId ?? cached?.latestVersionId,
      baseTemplateCode: args.baseTemplateCode ?? cached?.baseTemplateCode,
    })
  }

  setRegistrationStepTemplateSelection(args.programType, args.stepKey, args.nextCode)
  clearRegistrationWizardFormDraft({
    programType: args.programType,
    templateCode: args.previousCode,
  })
  clearRegistrationWizardFormDraft({
    programType: args.programType,
    templateCode: args.nextCode,
  })
  beginRecruitDetailContentReset()
  resetDedicatedOverlayForCatalogId(args.previousCode)
  resetDedicatedOverlayForCatalogId(args.nextCode)
  resetApplicantRecruitInstitutionOverlay()
  resetGeneralRecruitOverlay()
  resetGeneralApplicationOverlay()
  resetGeminiRecruitOverlay()
  resetUjatRecruitInstitutionOverlay()
  resetUjatRecruitVolunteerOverlay()
  resetUjatApplicationInstitutionOverlay()
  resetUjatApplicationVolunteerOverlay()
  resetInstitutionApplicationProgramBridge()

  const saved = await loadSelectedTemplateDraft({
    templateCode: args.nextCode,
    latestVersionId:
      args.latestVersionId ?? cached?.latestVersionId ?? cached?.templateVersionId,
  })
  const seed = resolveLoadedDraft(saved, args.nextCode)
  if (seed != null) {
    await persistRegistrationWizardFormDraft({
      programType: args.programType,
      templateCode: args.nextCode,
      draft: seed,
      overlay: saved?.overlay,
      editorState: saved?.editorState,
      settingsJson: saved?.settingsJson,
    })
    applyOperationalOverlayForCatalogId(args.nextCode, saved?.overlay)
  }
  commitRecruitDetailContentReset()

  return 'applied'
}
