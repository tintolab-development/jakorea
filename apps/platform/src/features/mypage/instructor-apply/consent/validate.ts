import type { InstructorApplyConsentKey } from './catalog'
import {
  hasMemberConsentIncompleteRequiredFields,
  isCrimeConsentTemplate,
  resolveInstructorApplyConsentTemplate,
} from '@jakorea/form-schema/consent'
import type { SchemaConsentWriteState } from './schema-draft-persist'

export function isCrimeConsentKey(consentKey: InstructorApplyConsentKey): boolean {
  const { templateId } = resolveInstructorApplyConsentTemplate(consentKey)
  return isCrimeConsentTemplate(templateId)
}

/** @deprecated schema draft + `@jakorea/form-schema/consent` validator 사용 */
export function isSchemaConsentWriteIncomplete(
  consentKey: InstructorApplyConsentKey,
  state: SchemaConsentWriteState
): boolean {
  const { templateId } = resolveInstructorApplyConsentTemplate(consentKey)
  if (isCrimeConsentTemplate(templateId)) {
    return state.crimeDocumentUploaded !== true
  }
  return hasMemberConsentIncompleteRequiredFields(state.draft, {
    templateId,
    paymentStatementBasicInfo: state.paymentBasicInfo,
  })
}
