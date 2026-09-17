import type { TemplateWritingUserPreviewSession } from '@/features/template/context/template-writing-preview-context'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import { resolveSurveyWritingDraft } from '@/features/program/shared/lib/survey-management/survey-writing-draft'

export async function buildSurveyPreviewDraft(templateId: string, templateName?: string) {
  return resolveSurveyWritingDraft(templateId, { templateName })
}

export async function buildUjatSurveyWritingPreviewSession(
  templateId: string,
  onEditForm?: () => void
): Promise<TemplateWritingUserPreviewSession | null> {
  const row = findWritingTemplateRowByDefinitionId(templateId)
  if (row == null) return null
  const entry = lookupTemplateRegistry(row.id)
  if (entry == null || !isSurveyRegistryEntry(entry)) return null

  const draft = await resolveSurveyWritingDraft(templateId, { templateName: row.templateName })

  return {
    draft,
    updateParagraph: () => {},
    headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
    editorKind: 'survey',
    ...(onEditForm != null ? { onEditForm } : {}),
  }
}
