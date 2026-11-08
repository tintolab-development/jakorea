import type { TemplateWritingUserPreviewSession } from '@/features/template/context/template-writing-preview-context'
import { loadFormTemplateVersionDraftByVersionId } from '@/features/template/api/admin-form-templates-service'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import {
  applySurveyDisplayTitleToDraft,
  resolveSurveyWritingDraft,
} from '@/features/program/shared/lib/survey-management/survey-writing-draft'
import {
  applySurveyTitleCustomPeriodToDraft,
  type SatisfactionFormEditPeriod,
} from '@/features/program/shared/lib/survey-management/satisfaction-form-edit-period'

export async function buildSurveyPreviewDraft(templateId: string, templateName?: string) {
  return resolveSurveyWritingDraft(templateId, { templateName })
}

export async function buildUjatSurveyWritingPreviewSession(args: {
  templateId: string
  title?: string
  versionId?: string
  overwriteTitle?: boolean
  displayPeriod?: SatisfactionFormEditPeriod | null
  onEditForm?: () => void
}): Promise<TemplateWritingUserPreviewSession | null> {
  const row = findWritingTemplateRowByDefinitionId(args.templateId)
  if (row != null) {
    const entry = lookupTemplateRegistry(row.id)
    if (entry == null || !isSurveyRegistryEntry(entry)) return null

    const draft = await resolveSurveyWritingDraft(args.templateId, {
      templateName: args.title?.trim() || row.templateName,
    })

    return {
      draft: applySurveyTitleCustomPeriodToDraft(
        applySurveyDisplayTitleToDraft(draft, args.title, {
          overwrite: args.overwriteTitle === true,
        }),
        args.displayPeriod
      ),
      updateParagraph: () => {},
      headerTitle: args.title?.trim() || resolvePreviewHeaderTitle(entry, row.templateName),
      editorKind: 'survey',
      ...(args.onEditForm != null ? { onEditForm: args.onEditForm } : {}),
    }
  }

  const versionId = Number(args.versionId)
  if (!Number.isFinite(versionId) || versionId <= 0) return null
  const record = await loadFormTemplateVersionDraftByVersionId(
    args.templateId,
    Math.trunc(versionId)
  )
  if (record?.draft == null) return null
  return {
    draft: applySurveyTitleCustomPeriodToDraft(
      applySurveyDisplayTitleToDraft(record.draft, args.title, {
        overwrite: args.overwriteTitle === true,
      }),
      args.displayPeriod
    ),
    updateParagraph: () => {},
    headerTitle: args.title?.trim() || '설문조사',
    editorKind: 'survey',
    ...(args.onEditForm != null ? { onEditForm: args.onEditForm } : {}),
  }
}
