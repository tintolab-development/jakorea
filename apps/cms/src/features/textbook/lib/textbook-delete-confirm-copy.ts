import { buildNamedDeleteGuideHeadline } from '@/features/data-management/lib/named-delete-guide-headline'
import { SIMPLE_DELETE_IRREVERSIBLE_LINE } from '@/shared/constants/simple-delete-confirm'
import { buildBulkDeleteGuideTitle } from '@/shared/ui/delete-guide-messages'

export type TextbookDeleteConfirmCopy = {
  title: string
  line1: string
  line2: string
}

const TEXTBOOK_DELETE_GUIDE_TITLE = '교재 삭제 안내'

/**
 * 교재 단건·일괄 삭제 안내.
 * 단건 `[교재명] 교재를 삭제하시겠습니까?` / 일괄 `[첫 교재명] 외 N개의 교재를 삭제하시겠습니까?`
 * 이름을 알 수 없을 때만 이름 없는 문구로 돌아간다.
 */
export function resolveTextbookDeleteConfirmCopy(
  textbookNames: readonly string[],
  selectedCount: number = textbookNames.length
): TextbookDeleteConfirmCopy {
  const line2 = SIMPLE_DELETE_IRREVERSIBLE_LINE
  const n = Math.max(0, selectedCount)
  const isBulk = n >= 2
  const title = isBulk ? buildBulkDeleteGuideTitle('교재') : TEXTBOOK_DELETE_GUIDE_TITLE
  const named = buildNamedDeleteGuideHeadline({
    entityLabel: '교재',
    names: textbookNames,
    selectedCount: n,
  })
  if (named) return { title, line1: named, line2 }
  return {
    title,
    line1: isBulk ? `**선택한 ${n}개**의 교재를 삭제하시겠습니까?` : '해당 교재를 삭제하시겠습니까?',
    line2,
  }
}
