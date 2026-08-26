import type { ElectronicSignatureMode } from '../pf-electronic-signature-modal'

/** Platform 양식 — 저장·표시용 전자서명 값 */
export type FormSignatureValue = {
  dataUrl: string
  signedAt: string
  displayName?: string
  fontStyleCode?: string
  mode?: ElectronicSignatureMode
}

export type PFFormSignatureBlockProps = {
  signerName: string
  signature?: string | FormSignatureValue | null
  onSignatureChange: (value: FormSignatureValue) => void
  className?: string
}
