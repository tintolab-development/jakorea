import { useLayoutEffect, useMemo } from 'react'
import { useRegistrationWizardValidationHighlight } from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'

/** DetailInfoForm context와 무관하게 `data-wizard-field-key` 라벨 강조 (모집 등 중첩 폼) */
export function RegistrationWizardFieldHighlightDomSync() {
  const { attemptId, incompleteKeys, isFieldIncomplete } = useRegistrationWizardValidationHighlight()

  const keysFingerprint = useMemo(
    () => (attemptId > 0 ? [...incompleteKeys].sort().join('\0') : ''),
    [attemptId, incompleteKeys]
  )

  useLayoutEffect(() => {
    if (attemptId <= 0) {
      for (const el of document.querySelectorAll<HTMLElement>('[data-wizard-field-key]')) {
        el.classList.remove('detail-info-form__field--required-incomplete')
        el.querySelector('.detail-info-form__field-label')?.classList.remove(
          'detail-info-form__field-label--required-incomplete'
        )
      }
      return
    }

    for (const fieldEl of document.querySelectorAll<HTMLElement>('[data-wizard-field-key]')) {
      const raw = fieldEl.getAttribute('data-wizard-field-key') ?? ''
      const keys = raw.split('|').map(k => k.trim()).filter(Boolean)
      const incomplete = keys.some(key => isFieldIncomplete(key))
      fieldEl.classList.toggle('detail-info-form__field--required-incomplete', incomplete)
      const label = fieldEl.querySelector('.detail-info-form__field-label')
      if (label instanceof HTMLElement) {
        label.classList.toggle('detail-info-form__field-label--required-incomplete', incomplete)
      }
    }
  }, [attemptId, isFieldIncomplete, keysFingerprint])

  return null
}
