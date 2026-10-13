import { createContext, useContext } from 'react'
import type { FormSignatureValue } from '../pf-form-signature-block/types'

export type PFFormDraftSignatureOpenCreateOptions = {
  /** 본문 「서명하기」에서 만들기 진입 시 — 완료 후 해당 칸에도 적용 */
  applyToSlot?: (profile: FormSignatureValue) => void
}

export type PFFormDraftSignatureContextValue = {
  readOnly: boolean
  hasDraftProfile: boolean
  getDraftProfile: () => FormSignatureValue | null
  cloneProfileForApply: (profile: FormSignatureValue) => FormSignatureValue
  openCreate: (options?: PFFormDraftSignatureOpenCreateOptions) => void
  requestTitleEdit: () => void
}

const PFFormDraftSignatureContext = createContext<PFFormDraftSignatureContextValue | null>(null)

export function usePFFormDraftSignature(): PFFormDraftSignatureContextValue {
  const value = useContext(PFFormDraftSignatureContext)
  if (value == null) {
    throw new Error('usePFFormDraftSignature must be used within PFFormDraftSignatureProvider')
  }
  return value
}

export function usePFFormDraftSignatureOptional(): PFFormDraftSignatureContextValue | null {
  return useContext(PFFormDraftSignatureContext)
}

export { PFFormDraftSignatureContext }
