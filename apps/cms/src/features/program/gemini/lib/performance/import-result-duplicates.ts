import type { GeminiTrainingReportImportResult } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportResult'

/**
 * Preview 결과의 duplicate 행 번호를 업로드 행 인덱스로 변환한다.
 *
 * `rowNumber`는 백엔드 계약상 optional이므로, 누락된 응답은 결과 배열 순서를
 * 보조 기준으로 사용한다. 이 보정이 없으면 duplicate=true인데도 중복 모달을
 * 건너뛰고 append 요청으로 진행할 수 있다.
 */
export function findGeminiDuplicateRowIndexes(
  results: GeminiTrainingReportImportResult[] | undefined,
  totalRows: number
): number[] {
  if (totalRows <= 0) return []

  const indexes = new Set<number>()
  for (const [resultIndex, result] of (results ?? []).entries()) {
    if (result.duplicate !== true) continue

    const rowNumberIndex =
      Number.isInteger(result.rowNumber) && result.rowNumber! >= 1
        ? result.rowNumber! - 1
        : resultIndex
    const index =
      rowNumberIndex >= 0 && rowNumberIndex < totalRows ? rowNumberIndex : resultIndex

    if (index >= 0 && index < totalRows) indexes.add(index)
  }
  return [...indexes].sort((left, right) => left - right)
}
