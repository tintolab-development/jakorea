import { loadFormTemplateVersionDraft } from '@/features/template/api/admin-form-templates-service'
import { stripWritingTemplateCopySuffix } from '@/features/template/lib/form-template-delete-policy'
import { resetApplicantRecruitInstitutionOverlay } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { resetUjatRecruitInstitutionOverlay } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import { resetUjatRecruitVolunteerOverlay } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { resetUjatApplicationInstitutionOverlay } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import { resetUjatApplicationVolunteerOverlay } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  clearRegistrationWizardFormDraft,
  persistRegistrationWizardFormDraft,
} from '@/features/program/general/lib/registration-wizard-form-draft'
import { createSeedDraftForOperationalCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { setRegistrationStepTemplateSelection } from '@/features/program/shared/lib/step-template-selection'

function resetDedicatedOverlayForCatalogId(catalogId: string): void {
  const base = stripWritingTemplateCopySuffix(catalogId)
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

export async function applyRegistrationStepTemplateChange(args: {
  programType: string
  stepKey: string
  previousCode: string
  nextCode: string
  defaultCode: string
}): Promise<'unchanged' | 'applied'> {
  if (args.nextCode === args.previousCode) return 'unchanged'

  setRegistrationStepTemplateSelection(args.programType, args.stepKey, args.nextCode)
  clearRegistrationWizardFormDraft({
    programType: args.programType,
    templateCode: args.previousCode,
  })
  clearRegistrationWizardFormDraft({
    programType: args.programType,
    templateCode: args.nextCode,
  })
  resetDedicatedOverlayForCatalogId(args.previousCode)
  resetDedicatedOverlayForCatalogId(args.nextCode)

  if (args.nextCode !== args.defaultCode) {
    const saved = await loadFormTemplateVersionDraft(args.nextCode)
    const seed =
      saved?.draft ??
      createSeedDraftForOperationalCatalogId(stripWritingTemplateCopySuffix(args.nextCode))
    if (seed != null) {
      await persistRegistrationWizardFormDraft({
        programType: args.programType,
        templateCode: args.nextCode,
        draft: seed,
      })
    }
  }

  return 'applied'
}
