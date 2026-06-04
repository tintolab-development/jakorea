import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'

export function resolveGeneralApplicationTemplateName(
  variant: ProgramParticipantApplicationEditorVariant
): string {
  const templateId = getTemplateIdForParticipantApplicationVariant(variant)
  return (
    findWritingTemplateRowByDefinitionId(templateId)?.templateName ??
    resolvePreviewHeaderTitle(lookupTemplateRegistry(templateId), undefined)
  )
}
