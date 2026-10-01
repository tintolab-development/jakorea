import { createContext, useContext } from 'react'

export type FieldValidationHighlightContextValue = {
  epoch: number
  isFieldIncomplete: (validationKey: string | readonly string[]) => boolean
}

/** CMS 등록 위저드 — `DetailInfoForm.Field`가 직접 구독 (DetailInfoForm prop 누락·stale 방지) */
export const FieldValidationHighlightContext =
  createContext<FieldValidationHighlightContextValue | null>(null)

export function useOptionalFieldValidationHighlight(): FieldValidationHighlightContextValue | null {
  return useContext(FieldValidationHighlightContext)
}
