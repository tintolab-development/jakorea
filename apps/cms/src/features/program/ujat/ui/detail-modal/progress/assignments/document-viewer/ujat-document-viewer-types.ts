export type UjatDocumentViewerDocType = 'plan' | 'log'

export type UjatDocumentViewerTarget = {
  docType: UjatDocumentViewerDocType
  volunteerName: string
  regionLabel: string
  institutionName: string
  assignedClass: string
  /** 표시용 제출일 `YYYY.MM.DD` 또는 `YYYY.MM.DD(요일)`. 미제출이면 빈 값 */
  submittedDateLabel: string
  /** BE form_response id — 있으면 피드백 POST 연동 */
  formResponseId?: number
}

/** `YYYY.MM.DD…` → `YYMMDD`. 날짜가 없으면 null */
export function toUjatDocumentFileDateToken(dateLabel: string | undefined): string | null {
  const match = dateLabel?.match(/(\d{4})\.(\d{2})\.(\d{2})/)
  if (!match) return null
  return `${match[1].slice(2)}${match[2]}${match[3]}`
}

/** 파일명 포맷: UJAT 교육계획서_서울_김범수_260403 (제출일 없으면 생략) */
export function buildUjatDocumentFileName(target: UjatDocumentViewerTarget): string {
  const typeLabel = target.docType === 'plan' ? '교육계획서' : '교육일지'
  const dateToken = toUjatDocumentFileDateToken(target.submittedDateLabel)
  return [`UJAT ${typeLabel}`, target.regionLabel, target.volunteerName, dateToken]
    .filter((part): part is string => Boolean(part?.trim()))
    .join('_')
}
