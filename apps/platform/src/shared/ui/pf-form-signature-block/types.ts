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
  /**
   * 회원이 아닌 사람(예: 만 14세 미만 회원의 보호자)이 서명하는 칸.
   * 제목 행 Provider의 회원 전자서명을 불러오지 않고 이 칸에서 새로 만들며, 회원 전자서명으로 저장되지 않는다.
   */
  independentSigner?: boolean
}

export type PFFormSignatureBlockHandle = {
  requestEdit: () => void
}
