export type ElectronicSignatureMode = 'draw' | 'create'

export type ElectronicSignatureResult = {
  mode: ElectronicSignatureMode
  dataUrl: string
  displayName?: string
  fontStyleCode?: string
}

export type PFElectronicSignatureModalProps = {
  open: boolean
  onClose: () => void
  onSign: (result: ElectronicSignatureResult) => void
  /** 초기 탭. 기본 draw */
  initialMode?: ElectronicSignatureMode
  /** 모달 헤더. 기본 `전자서명하기` (DS) */
  title?: string
}

export type PFElectronicSignatureEditConfirmProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}
