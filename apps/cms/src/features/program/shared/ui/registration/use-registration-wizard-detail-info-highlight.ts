import { useCallback } from 'react'
import { useRegistrationWizardValidationHighlight } from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'

export function useRegistrationWizardDetailInfoFieldIncompleteHighlight():
  | ((validationKey: string | readonly string[]) => boolean)
  | undefined {
  const validation = useRegistrationWizardValidationHighlight()
  return useCallback(
    (validationKey: string | readonly string[]) => {
      if (Array.isArray(validationKey)) {
        return validationKey.some(key => validation.isFieldIncomplete(key))
      }
      return validation.isFieldIncomplete(validationKey)
    },
    [validation]
  )
}
