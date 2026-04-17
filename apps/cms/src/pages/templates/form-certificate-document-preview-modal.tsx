import { useEffect, useRef, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { FormCertificatePreview, type FormCertificatePreviewProps } from './form-certificate-preview'
import './form-certificate-document-preview-modal.css'

/** 디자인 스펙 — `form-certificate-preview__bg` 고정 크기와 동일 */
const DESIGN_W = 1208
const DESIGN_H = 1682
/** 96dpi 기준 A4 폭(px) — 기본 스케일 분모 */
const DEFAULT_A4_WIDTH_PX = 794

export interface FormCertificateDocumentPreviewModalProps {
  open: boolean
  onClose: () => void
  /** PDF 캡처용과 동일 — `activeFieldName: null` + `--pdf-export` */
  previewProps: FormCertificatePreviewProps
  title?: string
}

export function FormCertificateDocumentPreviewModal({
  open,
  onClose,
  previewProps,
  title = '문서 미리보기',
}: FormCertificateDocumentPreviewModalProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(DEFAULT_A4_WIDTH_PX / DESIGN_W)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const update = () => {
      const w = el.clientWidth
      if (w <= 0) return
      setScale(w / DESIGN_W)
    }

    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  const scaledH = DESIGN_H * scale
  const scaledW = DESIGN_W * scale

  return (
    <ContentModal open={open} onCancel={onClose} title={title} size="large">
      <div className="form-certificate-document-preview-modal__body">
        <div className="form-certificate-document-preview-modal__scroll">
          <div ref={viewportRef} className="form-certificate-document-preview-modal__viewport">
            <div
              className="form-certificate-document-preview-modal__clip"
              style={{
                width: scaledW,
                height: scaledH,
                overflow: 'hidden',
                margin: '0 auto',
              }}
            >
              <div
                className="form-certificate-document-preview-modal__scale-inner"
                style={{
                  width: DESIGN_W,
                  height: DESIGN_H,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <FormCertificatePreview {...previewProps} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentModal>
  )
}
