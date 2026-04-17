import { useCallback, useState } from 'react'

/**
 * 양식 풀페이지 — 문서 미리보기(ContentModal) 열림 상태만 담당.
 * 미리보기 데이터는 `useFormCertificatePreviewProps`의 `pdfExport`와 상위에서 결합합니다.
 */
export function useFormCertificateDocumentPreviewModal() {
  const [open, setOpen] = useState(false)

  const openPreview = useCallback(() => {
    setOpen(true)
  }, [])

  const closePreview = useCallback(() => {
    setOpen(false)
  }, [])

  return { open, openPreview, closePreview }
}
