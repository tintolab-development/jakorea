import { useMemo } from 'react'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { useRegistrationWizardValidationHighlight } from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'

export function useRegistrationWizardParagraphBodyOptions<
  T extends RenderFormParagraphBodyOptions | undefined,
>(base: T): T {
  const validation = useRegistrationWizardValidationHighlight()
  return useMemo(() => {
    if (base == null) return base
    return {
      ...base,
      registrationWizardValidation: {
        isFieldIncomplete: validation.isFieldIncomplete,
        isParagraphIncomplete: validation.isParagraphIncomplete,
        isHorizontalTableCellIncomplete: validation.isHorizontalTableCellIncomplete,
      },
    }
  }, [base, validation])
}
