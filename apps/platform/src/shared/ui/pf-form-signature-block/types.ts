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
  /** 날짜·성명 텍스트 우측 정렬 (행정정보 대상자 본인 하단 카드) */
  contentAlign?: 'center' | 'end'
}

export type PFFormSignatureBlockHandle = {
  requestEdit: () => void
}
