import { flushSync } from 'react-dom'
import {
  allocateCertificateSerial,
  CertificateSerialAllocateError,
  logCertificateIssueDownload,
} from '@/features/program/shared/api/certificate-serial-api'
import {
  isIssuedCertificateSerial,
  parseCertificateIssueId,
  type CertificateSerialSubject,
} from '@/features/program/shared/lib/certificate-serial'
import { FORM_CERTIFICATE_SERIAL_TAG_SELECTOR } from '@/pages/templates/form-certificate-preview-utils'
import { waitForCertificatePreviewCaptureReady } from '@/pages/templates/wait-for-certificate-preview-capture-ready'

export function paintIssuedSerialOnCertificatePreview(
  exportRoot: HTMLElement | null,
  serialNumber: string
): void {
  const tag = exportRoot?.querySelector(FORM_CERTIFICATE_SERIAL_TAG_SELECTOR)
  if (tag == null) {
    throw new CertificateSerialAllocateError('고유번호를 PDF에 반영하지 못했습니다.')
  }
  tag.textContent = serialNumber
  if (tag.textContent?.trim() !== serialNumber) {
    throw new CertificateSerialAllocateError('고유번호를 PDF에 반영하지 못했습니다.')
  }
}

export type AllocatedCertificateSerialForPdf = {
  serialNumber: string
  issueId: number
}

/**
 * 다운로드 직전에만 고유번호를 받아 PDF 캡처 DOM에 반영한다.
 * 미리보기 화면에는 넣지 않는다.
 */
export async function applyAllocatedSerialForPdfCapture(args: {
  subject: CertificateSerialSubject
  applySerial: (serialNumber: string) => void
  exportRoot: HTMLElement | null
  getExportRoot?: () => HTMLElement | null
}): Promise<AllocatedCertificateSerialForPdf> {
  const allocated = await allocateCertificateSerial(args.subject)
  const { serialNumber } = allocated
  const issueId = parseCertificateIssueId(allocated.issueId)
  if (!isIssuedCertificateSerial(serialNumber) || issueId == null) {
    throw new CertificateSerialAllocateError('고유번호 응답이 올바르지 않습니다.')
  }
  flushSync(() => {
    args.applySerial(serialNumber)
  })
  const exportRoot = args.getExportRoot?.() ?? args.exportRoot
  paintIssuedSerialOnCertificatePreview(exportRoot, serialNumber)
  await waitForCertificatePreviewCaptureReady(exportRoot)
  return { serialNumber, issueId }
}

/**
 * 고유번호 부여 → PDF 생성 → 다운로드 이력 기록 → 파일 저장.
 * 이력 기록이 실패하면 파일을 저장하지 않는다.
 */
export async function downloadIssuedCertificatePdf(args: {
  subject: CertificateSerialSubject
  applySerial: (serialNumber: string) => void
  exportRoot: HTMLElement | null
  getExportRoot?: () => HTMLElement | null
  downloadPdf: (
    issuedSerialNumber: string,
    beforeSave?: (fileName: string) => Promise<void>
  ) => Promise<void>
}): Promise<void> {
  const allocated = await applyAllocatedSerialForPdfCapture(args)
  await args.downloadPdf(allocated.serialNumber, fileName =>
    logCertificateIssueDownload(allocated.issueId, { fileName })
  )
}
