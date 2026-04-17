import { createPortal } from 'react-dom'
import { Spin } from 'antd'
import './form-certificate-pdf-export-overlay.css'

const OVERLAY_ROOT_ID = 'form-certificate-pdf-export-overlay-root'

export interface FormCertificatePdfExportOverlayProps {
  visible: boolean
}

/**
 * 클라이언트 PDF(html2canvas) 생성 중 — 풀스크린 반투명 레이어 + 스피너
 */
export function FormCertificatePdfExportOverlay({ visible }: FormCertificatePdfExportOverlayProps) {
  if (!visible || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="form-certificate-pdf-export-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="PDF 생성 중"
      id={OVERLAY_ROOT_ID}
    >
      <div className="form-certificate-pdf-export-overlay__panel">
        <Spin size="large" />
        <p className="form-certificate-pdf-export-overlay__text">PDF 생성 중…</p>
      </div>
    </div>,
    document.body
  )
}
