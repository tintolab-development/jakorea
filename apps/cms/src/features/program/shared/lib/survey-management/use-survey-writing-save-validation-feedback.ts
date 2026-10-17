import { useCallback } from 'react'
import { resolveRegistrationWizardIncompleteParagraphIds } from '@/features/program/shared/lib/registration-wizard-incomplete-map'
import {
  RegistrationWizardValidationHighlightProvider,
  scrollToFirstRegistrationWizardIncompleteParagraph,
  useRegistrationWizardValidationHighlight,
} from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE } from '@/shared/constants/messages'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE } from '@/shared/constants/required-fields-incomplete-alert-message'
import { useCmsAlert } from '@/shared/ui'

export { RegistrationWizardValidationHighlightProvider as SurveyWritingValidationHighlightProvider }

export function useSurveyWritingSaveValidationFeedback() {
  const { showAlert } = useCmsAlert()
  const { reportIncomplete } = useRegistrationWizardValidationHighlight()

  const reportValidationIncomplete = useCallback(
    (keys: readonly string[]) => {
      reportIncomplete(keys)
      scrollToFirstRegistrationWizardIncompleteParagraph(
        resolveRegistrationWizardIncompleteParagraphIds(keys, 'survey')
      )
    },
    [reportIncomplete]
  )

  const showRequiredFieldsAlert = useCallback(() => {
    showAlert({
      title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
      content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
    })
  }, [showAlert])

  const handleDraftValidationFailure = useCallback(
    (result: { incompleteKeys?: readonly string[] }) => {
      if (result.incompleteKeys != null && result.incompleteKeys.length > 0) {
        reportValidationIncomplete(result.incompleteKeys)
      }
      showRequiredFieldsAlert()
    },
    [reportValidationIncomplete, showRequiredFieldsAlert]
  )

  return { handleDraftValidationFailure, reportValidationIncomplete, showRequiredFieldsAlert }
}
