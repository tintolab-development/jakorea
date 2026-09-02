import { flushSync } from 'react-dom'
import { allocateCertificateSerial } from '@/features/program/shared/api/certificate-serial-api'
import type { CertificateSerialSubject } from '@/features/program/shared/lib/certificate-serial'
import { waitForCertificatePreviewCaptureReady } from '@/pages/templates/wait-for-certificate-preview-capture-ready'

/**
 * 다운로드 직전에만 고유번호를 받아 PDF 캡처 DOM에 반영한다.
 * 미리보기 화면은 플레이스홀더를 유지한다.
 */
export async function applyAllocatedSerialForPdfCapture(args: {
  subject: CertificateSerialSubject
  applySerial: (serialNumber: string) => void
  exportRoot: HTMLElement | null
}): Promise<string> {
  const { serialNumber } = await allocateCertificateSerial(args.subject)
  flushSync(() => {
    args.applySerial(serialNumber)
  })
  await waitForCertificatePreviewCaptureReady(args.exportRoot)
  return serialNumber
}
