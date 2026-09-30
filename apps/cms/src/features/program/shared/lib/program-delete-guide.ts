/** CMS 프로그램 목록 — 단건·일괄 삭제 안내 모달 (시안 SSOT) */

export const PROGRAM_DELETE_GUIDE_TITLE = '프로그램 삭제 안내'

export const PROGRAM_BULK_DELETE_GUIDE_TITLE = '프로그램 일괄 삭제 안내'

export const PROGRAM_DELETE_IRREVERSIBLE_LINE = '삭제된 정보는 되돌릴 수 없습니다.'

const PROGRAM_DELETE_CONFIRM_LINE = '해당 프로그램을 삭제하시겠습니까?'

export function buildProgramSingleDeleteGuideLines(): string[] {
  return [PROGRAM_DELETE_CONFIRM_LINE, PROGRAM_DELETE_IRREVERSIBLE_LINE]
}

export function buildProgramBulkDeleteGuideLines(selectedCount: number): string[] {
  if (selectedCount <= 1) return buildProgramSingleDeleteGuideLines()
  return [
    `선택한 **${selectedCount}**개의 프로그램을 삭제하시겠습니까?`,
    PROGRAM_DELETE_IRREVERSIBLE_LINE,
  ]
}

export function resolveProgramDeleteGuideModalCopy(selectedCount: number): {
  title: string
  lines: string[]
} {
  if (selectedCount <= 1) {
    return {
      title: PROGRAM_DELETE_GUIDE_TITLE,
      lines: buildProgramSingleDeleteGuideLines(),
    }
  }
  return {
    title: PROGRAM_BULK_DELETE_GUIDE_TITLE,
    lines: buildProgramBulkDeleteGuideLines(selectedCount),
  }
}
