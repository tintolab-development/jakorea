import { useMemo } from 'react'
import {
  getFormInputsWidth,
  type FormInputsWidthOptions,
} from '@/shared/lib/form-inputs-width'

export type { FormInputsWidthOptions }

/**
 * `DetailInfoForm` 한 Field 안 다중 인풋 + `InputsSeparator` 행용 `width` 문자열 (메모).
 * @see getFormInputsWidth
 */
export function useFormInputsWidth(options: FormInputsWidthOptions): string {
  return useMemo(
    () => getFormInputsWidth(options),
    [options.inputCount, options.separatorCount, options.separatorWidthPx]
  )
}
