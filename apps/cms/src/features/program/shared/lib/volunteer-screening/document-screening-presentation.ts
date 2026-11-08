/** 일반·UJAT의 동일한 1차 서류심사 UI축. API application/final/interview raw축은 여기서 정규화하지 않는다. */
export type DocumentScreeningStatus = 'pass' | 'fail' | 'pending'
export const DOCUMENT_SCREENING_STATUS_LABELS: Record<DocumentScreeningStatus, string> = {
  pending: '신청 및 대기 중', fail: '서류 불합격', pass: '서류 합격',
}
const DOCUMENT_SCREENING_TEXT_ACCENT: Record<DocumentScreeningStatus, string> = {
  pending: 'var(--Status-green-main, #1e8c29)',
  pass: 'var(--Netural-black, #3d3d3d)',
  fail: 'var(--Status-red-main, #c32f4a)',
}
export function getDocumentScreeningTextPresentation(status: DocumentScreeningStatus) {
  return { label: DOCUMENT_SCREENING_STATUS_LABELS[status], accentColor: DOCUMENT_SCREENING_TEXT_ACCENT[status] }
}
