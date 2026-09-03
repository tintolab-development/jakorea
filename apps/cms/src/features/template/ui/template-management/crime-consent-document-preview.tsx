import { Spin } from 'antd'
import { useEffect, useState } from 'react'
import { isCrimeConsentPdfPreviewSrc } from '@/features/template/lib/agreement-crime-consent-settings'
import {
  CRIME_CONSENT_A4_PREVIEW_WIDTH_PX,
  renderPdfFileToPageObjectUrls,
  renderPdfSrcToPageObjectUrls,
} from '@/features/template/lib/render-pdf-preview-pages'

const A4_PREVIEW_HEIGHT_PX = 1618
const PDF_PREVIEW_FAILED_MESSAGE = 'PDF 미리보기를 불러오지 못했습니다.'

function CrimeConsentPdfPagePreview({
  src,
  file,
  alt,
}: {
  src: string
  file?: File | null
  alt: string
}) {
  const [pageUrls, setPageUrls] = useState<string[]>([])
  const [failed, setFailed] = useState(false)
  const fileKey = file ? `${file.name}:${file.size}:${file.lastModified}` : ''

  useEffect(() => {
    let cancelled = false
    let objectUrls: string[] = []
    setFailed(false)
    setPageUrls([])

    const render = file
      ? renderPdfFileToPageObjectUrls(file)
      : renderPdfSrcToPageObjectUrls(src)

    void render
      .then(urls => {
        objectUrls = urls
        if (cancelled) {
          urls.forEach(url => URL.revokeObjectURL(url))
          return
        }
        setPageUrls(urls)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      objectUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [file, fileKey, src])

  if (failed) {
    return <p className="crime-consent-doc-modal__a4-pdf-status">{PDF_PREVIEW_FAILED_MESSAGE}</p>
  }

  if (pageUrls.length === 0) {
    return (
      <div className="crime-consent-doc-modal__a4-pdf-status" role="status">
        <Spin />
      </div>
    )
  }

  return (
    <div className="crime-consent-doc-modal__a4-pdf-stack">
      {pageUrls.map((pageUrl, index) => (
        <img
          key={pageUrl}
          className="crime-consent-doc-modal__a4-img"
          src={pageUrl}
          alt={pageUrls.length > 1 ? `${alt} ${index + 1}페이지` : alt}
          width={CRIME_CONSENT_A4_PREVIEW_WIDTH_PX}
          height={A4_PREVIEW_HEIGHT_PX}
        />
      ))}
    </div>
  )
}

export function CrimeConsentDocumentPreview({
  src,
  file,
  fileName,
  mimeType,
  alt,
}: {
  src: string
  file?: File | null
  fileName?: string | null
  mimeType?: string | null
  alt: string
}) {
  const isPdf =
    (file != null && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) ||
    isCrimeConsentPdfPreviewSrc(src, fileName ?? file?.name, mimeType ?? file?.type)

  if (isPdf) {
    return <CrimeConsentPdfPagePreview key={fileKeyOf(file, src)} src={src} file={file} alt={alt} />
  }

  return (
    <img
      className="crime-consent-doc-modal__a4-img"
      src={src}
      alt={alt}
      width={CRIME_CONSENT_A4_PREVIEW_WIDTH_PX}
      height={A4_PREVIEW_HEIGHT_PX}
    />
  )
}

function fileKeyOf(file: File | null | undefined, src: string): string {
  if (file) return `${file.name}:${file.size}:${file.lastModified}`
  return src
}
