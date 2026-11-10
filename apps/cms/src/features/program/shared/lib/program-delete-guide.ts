import {
  buildDeleteBlockedBulkLead,
  resolveDeleteBlockedGuideCopy,
} from '@/shared/lib/delete-blocked-guide-copy'

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

/** 단건 409 · 일괄 failures[].code */
export const PROGRAM_HARD_DELETE_BLOCKED_CODE = 'PROGRAM_HARD_DELETE_BLOCKED'

export const PROGRAM_HARD_DELETE_BLOCKED_ALERT_TITLE = '프로그램 삭제 불가 안내'

/** BE `message`와 동일한 기획 문장. message가 비었을 때만 폴백 */
export const PROGRAM_HARD_DELETE_BLOCKED_REASON =
  '교육 예정 신청자 또는 교육 진행 이력이 있는 프로그램은 삭제할 수 없습니다.'

export function buildProgramBulkDeleteBlockedLead(selectedCount: number): string {
  return buildDeleteBlockedBulkLead(selectedCount)
}

export function buildProgramHardDeleteBlockedAlertContent(
  selectedCount: number,
  reason?: string | null
): string {
  const detail = reason?.trim() || PROGRAM_HARD_DELETE_BLOCKED_REASON
  return resolveDeleteBlockedGuideCopy({
    entityLabel: '프로그램',
    reasonLine: detail,
    selectedCount,
  }).description
}

export function resolveProgramHardDeleteBlockedModalCopy(
  selectedCount: number,
  reason?: string | null
): { title: string; description: string } {
  const detail = reason?.trim() || PROGRAM_HARD_DELETE_BLOCKED_REASON
  return resolveDeleteBlockedGuideCopy({
    entityLabel: '프로그램',
    reasonLine: detail,
    selectedCount,
  })
}

export class ProgramHardDeleteBlockedError extends Error {
  readonly successCount: number

  constructor(selectedCount: number, reason?: string | null, successCount = 0) {
    super(buildProgramHardDeleteBlockedAlertContent(selectedCount, reason))
    this.name = 'ProgramHardDeleteBlockedError'
    this.successCount = successCount
  }
}

export function isProgramHardDeleteBlockedError(
  error: unknown
): error is ProgramHardDeleteBlockedError {
  return error instanceof ProgramHardDeleteBlockedError
}

/** 시안: 안내 문구의 프로그램명은 20자까지만 보이고 나머지는 `...`로 줄인다. */
const PROGRAM_DELETE_GUIDE_NAME_MAX_LENGTH = 20

function truncateProgramDeleteGuideName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length <= PROGRAM_DELETE_GUIDE_NAME_MAX_LENGTH) return trimmed
  return `${trimmed.slice(0, PROGRAM_DELETE_GUIDE_NAME_MAX_LENGTH)}...`
}

/**
 * 일반 프로그램 목록 — 프로그램명이 들어간 단건·일괄 삭제 안내 (시안 03-1·03-2).
 * 단건 `[이름] 프로그램을 삭제하시겠습니까?` / 일괄 `[첫 이름] 외 N개의 프로그램을 삭제하시겠습니까?`
 * 이름을 알 수 없으면 기존 문구(`resolveProgramDeleteGuideModalCopy`)로 돌아간다.
 */
export function resolveProgramDeleteGuideModalCopyWithNames(
  selectedCount: number,
  programNames: string[]
): { title: string; lines: string[] } {
  const firstName = programNames.map(name => name.trim()).find(name => name !== '')
  if (firstName == null) return resolveProgramDeleteGuideModalCopy(selectedCount)
  const label = `[${truncateProgramDeleteGuideName(firstName)}]`
  if (selectedCount <= 1) {
    return {
      title: PROGRAM_DELETE_GUIDE_TITLE,
      lines: [`**${label}** 프로그램을 삭제하시겠습니까?`, PROGRAM_DELETE_IRREVERSIBLE_LINE],
    }
  }
  return {
    title: PROGRAM_BULK_DELETE_GUIDE_TITLE,
    lines: [
      `**${label} 외 ${selectedCount - 1}개**의 프로그램을 삭제하시겠습니까?`,
      PROGRAM_DELETE_IRREVERSIBLE_LINE,
    ],
  }
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
