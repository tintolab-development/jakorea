import {
  loadFormTemplateVersionDraft,
  loadFormTemplateVersionDraftByVersionId,
} from '@/features/template/api/admin-form-templates-service'
import {
  getFormTemplateVersionCacheEntry,
  upsertFormTemplateVersionCacheEntry,
} from '@/features/template/api/form-template-version-cache'
import { stripWritingTemplateCopySuffix } from '@/features/template/lib/form-template-delete-policy'
import {
  beginRecruitDetailContentReset,
  commitRecruitDetailContentReset,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  clearRegistrationWizardFormDraft,
  persistRegistrationWizardFormDraft,
} from '@/features/program/general/lib/registration-wizard-form-draft'
import {
  applyOperationalOverlayForCatalogId,
  createSeedDraftForOperationalCatalogId,
  resetOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { setRegistrationStepTemplateSelection } from '@/features/program/shared/lib/step-template-selection'

function resolveSeedCatalogId(templateCode: string): string {
  const cached = getFormTemplateVersionCacheEntry(templateCode)?.baseTemplateCode?.trim()
  if (cached != null && cached !== '') return cached
  return stripWritingTemplateCopySuffix(templateCode)
}

async function loadSelectedTemplateDraft(args: {
  templateCode: string
  latestVersionId?: number
  /** 동일 템플릿 재선택 시 React Query 캐시를 무시하고 최신 본문을 받는다 */
  forceRefresh?: boolean
}): Promise<Awaited<ReturnType<typeof loadFormTemplateVersionDraft>>> {
  if (args.latestVersionId != null) {
    try {
      const byVersion = await loadFormTemplateVersionDraftByVersionId(
        args.templateCode,
        args.latestVersionId,
        { invalidateCache: args.forceRefresh === true }
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
  const isSameTemplateReselect = args.nextCode === args.previousCode

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
  resetOperationalOverlayForCatalogId(args.previousCode)
  resetOperationalOverlayForCatalogId(args.nextCode)

  const saved = await loadSelectedTemplateDraft({
    templateCode: args.nextCode,
    latestVersionId:
      args.latestVersionId ?? cached?.latestVersionId ?? cached?.templateVersionId,
    forceRefresh: isSameTemplateReselect,
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
