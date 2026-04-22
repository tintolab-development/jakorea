import {
  buildBulkDeleteGuideTitle,
  buildBulkDomainDeleteMessageLines,
  buildDomainEntityDeleteMessageLines,
} from './delete-guide-messages'

/** 후원사 상세·관리자 담당 프로그램 등 「프로그램 진행 이력」 삭제 안내 공통 도메인 라벨 */
export const PROGRAM_PROGRESS_HISTORY_DOMAIN = '프로그램 진행 이력'

const PROGRAM_ENROLLMENT_HISTORY_DOMAIN = '프로그램 수강 이력'

/** `progress`: 진행 이력(후원사·관리자 담당 등) / `enrollment`: 회원 상세 프로그램 수강 이력 테이블 */
export type ProgramProgressHistoryDeleteDomain = 'progress' | 'enrollment'

export type ProgramProgressHistoryDeleteGuide = {
  title: string
  lines: string[]
}

function domainLabelFor(kind: ProgramProgressHistoryDeleteDomain): string {
  return kind === 'enrollment' ? PROGRAM_ENROLLMENT_HISTORY_DOMAIN : PROGRAM_PROGRESS_HISTORY_DOMAIN
}

/**
 * 선택된 프로그램 제목(원문)으로 `DeleteGuideModal` 제목·본문을 만듭니다.
 * 본문 1줄의 프로그램명은 `buildDomainEntityDeleteMessageLines`에서 18자 말줄임 처리됩니다.
 *
 * @param domainKind - `enrollment`: 회원 상세 등 **프로그램 수강 이력** 테이블. 그 외는 `progress`(기본).
 */
export function buildProgramProgressHistoryDeleteGuide(
  programTitles: string[],
  domainKind: ProgramProgressHistoryDeleteDomain = 'progress'
): ProgramProgressHistoryDeleteGuide | null {
  const titles = programTitles.map(t => t.trim()).filter(Boolean)
  if (titles.length === 0) return null

  const domainLabel = domainLabelFor(domainKind)
  const counterNounPhrase =
    domainKind === 'enrollment' ? '건의 프로그램 수강 이력' : '건의 프로그램 진행 이력'

  if (titles.length >= 2) {
    return {
      title: buildBulkDeleteGuideTitle(domainLabel),
      lines: buildBulkDomainDeleteMessageLines(
        titles.length,
        counterNounPhrase,
        '이력',
        domainLabel
      ),
    }
  }

  const singleTitle = titles[0] || '(제목 없음)'
  return {
    title: `${domainLabel} 삭제`,
    lines: buildDomainEntityDeleteMessageLines([singleTitle], domainLabel),
  }
}
