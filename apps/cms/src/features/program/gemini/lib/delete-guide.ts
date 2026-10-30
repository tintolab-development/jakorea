import { resolveDeleteBlockedGuideCopy } from '@/shared/lib/delete-blocked-guide-copy'

/** Gemini 찾아가는 연수·실적 — 텍스트 삭제 안내 (공통 프로그램 삭제 문구와 분리) */

export const GEMINI_DELETE_IRREVERSIBLE_LINE = '삭제된 정보는 되돌릴 수 없습니다.'

export type GeminiDeleteNoun = '공고' | '연수' | '실적'

const DELETE_OBJECT_PARTICLE: Record<GeminiDeleteNoun, '을' | '를'> = {
  공고: '를',
  연수: '를',
  실적: '을',
}

export function buildGeminiDeleteGuideLines(noun: GeminiDeleteNoun, selectedCount: number): string[] {
  const particle = DELETE_OBJECT_PARTICLE[noun]
  const subject =
    selectedCount <= 1 ? `해당 ${noun}` : `선택한 **${selectedCount}**개의 ${noun}`
  return [`${subject}${particle} 삭제하시겠습니까?`, GEMINI_DELETE_IRREVERSIBLE_LINE]
}

export function resolveGeminiDeleteGuideModalCopy(
  noun: GeminiDeleteNoun,
  selectedCount: number
): { title: string; lines: string[] } {
  return {
    title: `${noun} 삭제 안내`,
    lines: buildGeminiDeleteGuideLines(noun, selectedCount),
  }
}

export type GeminiDeleteBlockedKind = '공고' | '연수'

const DELETE_BLOCKED_BODY: Record<GeminiDeleteBlockedKind, string> = {
  공고: '신청 기관 또는 교육 진행 이력이 있는 공고는 삭제할 수 없습니다.',
  연수: '신청 강사 또는 교육 진행 이력이 있는 연수는 삭제할 수 없습니다.',
}

export function geminiRecruitmentDeleteBlocked(row: {
  isDraft?: boolean
  organizationApplicationCount?: number
  approvedOrganizationApplicationCount?: number
}): boolean {
  if (row.isDraft) return false
  return (row.organizationApplicationCount ?? 0) > 0 || (row.approvedOrganizationApplicationCount ?? 0) > 0
}

/** 강사가 매핑되면 신청 강사·교육 진행 이력이 있는 연수로 본다 */
export function geminiApprovedTrainingDeleteBlocked(row: { instructorAssigned: boolean }): boolean {
  return row.instructorAssigned
}

export function resolveGeminiDeleteBlockedAlert(
  kind: GeminiDeleteBlockedKind,
  selectedCount: number
): { title: string; content: string } {
  const copy = resolveDeleteBlockedGuideCopy({
    entityLabel: kind,
    reasonLine: DELETE_BLOCKED_BODY[kind],
    selectedCount,
  })
  return { title: copy.title, content: copy.description }
}

export function resolveGeminiDeleteBlockedModalCopy(
  kind: GeminiDeleteBlockedKind,
  selectedCount: number
): { title: string; description: string } {
  const copy = resolveDeleteBlockedGuideCopy({
    entityLabel: kind,
    reasonLine: DELETE_BLOCKED_BODY[kind],
    selectedCount,
  })
  return { title: copy.title, description: copy.description }
}
