import {
  buildBulkDeleteGuideTitle,
  buildBulkDomainDeleteMessageLines,
  buildDomainEntityDeleteMessageLines,
} from './delete-guide-messages'

/** 후원사 상세·관리자 담당 프로그램 등 「프로그램 진행 이력」 삭제 안내 공통 도메인 라벨 */
export const PROGRAM_PROGRESS_HISTORY_DOMAIN = '프로그램 진행 이력'

export type ProgramProgressHistoryDeleteGuide = {
  title: string
  lines: string[]
}

/**
 * 선택된 프로그램 제목(원문)으로 `DeleteGuideModal` 제목·본문을 만듭니다.
 * 본문 1줄의 프로그램명은 `buildDomainEntityDeleteMessageLines`에서 18자 말줄임 처리됩니다.
 */
export function buildProgramProgressHistoryDeleteGuide(
  programTitles: string[]
): ProgramProgressHistoryDeleteGuide | null {
  const titles = programTitles.map(t => t.trim()).filter(Boolean)
  if (titles.length === 0) return null

  if (titles.length >= 2) {
    return {
      title: buildBulkDeleteGuideTitle(PROGRAM_PROGRESS_HISTORY_DOMAIN),
      lines: buildBulkDomainDeleteMessageLines(
        titles.length,
        '건의 프로그램 진행 이력',
        '이력',
        PROGRAM_PROGRESS_HISTORY_DOMAIN
      ),
    }
  }

  const singleTitle = titles[0] || '(제목 없음)'
  return {
    title: '프로그램 진행 이력 삭제',
    lines: buildDomainEntityDeleteMessageLines([singleTitle], PROGRAM_PROGRESS_HISTORY_DOMAIN),
  }
}
