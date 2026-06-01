import type { TemplateWritingUserPreviewSession } from '@/features/template/context/template-writing-preview-context'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import { resolveUjatSurveyWritingDraft } from './ujat-survey-writing-draft'

export function buildSurveyPreviewDraft(templateId: string, templateName?: string) {
  return resolveUjatSurveyWritingDraft(templateId, { templateName })
}

export function buildUjatSurveyWritingPreviewSession(
  templateId: string,
  onEditForm: () => void
): TemplateWritingUserPreviewSession | null {
  const row = findWritingTemplateRowByDefinitionId(templateId)
  if (row == null) return null
  const entry = lookupTemplateRegistry(row.id)
  if (entry == null || !isSurveyRegistryEntry(entry)) return null

  return {
    draft: resolveUjatSurveyWritingDraft(templateId, { templateName: row.templateName }),
    updateParagraph: () => {},
    headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
    editorKind: 'survey',
    onEditForm,
  }
}
