export type UjatDocumentViewerDocType = 'plan' | 'log'

export type UjatDocumentViewerTarget = {
  docType: UjatDocumentViewerDocType
  volunteerName: string
  regionLabel: string
  institutionName: string
  assignedClass: string
  /** 표시용 제출일 (예: '260403') */
  submittedDateLabel: string
}

/** 파일명 포맷: UJAT 교육계획서_서울_김범수_260403 */
export function buildUjatDocumentFileName(target: UjatDocumentViewerTarget): string {
  const typeLabel = target.docType === 'plan' ? '교육계획서' : '교육일지'
  return `UJAT ${typeLabel}_${target.regionLabel}_${target.volunteerName}_${target.submittedDateLabel}`
}

/** 'submittedDateLabel' 포맷: '26. 01. 05 (월) ~ …' → '260105' */
export function parseSubmittedDate(dateLabel: string | undefined): string {
  if (!dateLabel) return '260101'
  const match = dateLabel.match(/(\d{2})\.\s*(\d{2})\.\s*(\d{2})/)
  if (!match) return '260101'
  return `${match[1]}${match[2]}${match[3]}`
}
