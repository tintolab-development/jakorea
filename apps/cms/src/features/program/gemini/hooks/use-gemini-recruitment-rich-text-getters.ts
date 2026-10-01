import { useCallback, useRef } from 'react'
import {
  overlayGeminiRecruitmentRichText,
  type GeminiRecruitmentRichTextGetter,
  type GeminiRecruitmentRichTextGetterMap,
  type GeminiRecruitmentRichTextKey,
} from '../lib/recruitment/add-form-options'

export function useGeminiRecruitmentRichTextGetters() {
  const gettersRef = useRef<GeminiRecruitmentRichTextGetterMap>({})

  const registerRichTextGetter = useCallback(
    (key: GeminiRecruitmentRichTextKey, getter: GeminiRecruitmentRichTextGetter | null) => {
      if (getter == null) {
        delete gettersRef.current[key]
        return
      }
      gettersRef.current[key] = getter
    },
    []
  )

  const overlayRichText = useCallback(
    <T extends Record<GeminiRecruitmentRichTextKey, string>>(values: T) =>
      overlayGeminiRecruitmentRichText(gettersRef.current, values),
    []
  )

  return { registerRichTextGetter, overlayRichText }
}
