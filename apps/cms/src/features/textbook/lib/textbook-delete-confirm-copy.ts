import { SIMPLE_DELETE_IRREVERSIBLE_LINE } from '@/shared/constants/simple-delete-confirm'
import { buildBulkDeleteGuideTitle } from '@/shared/ui/delete-guide-messages'

export type TextbookDeleteConfirmMode = 'single' | 'bulk'

export type TextbookDeleteConfirmCopy = {
  title: string
  line1: string
  line2: string
}

export function resolveTextbookDeleteConfirmCopy(
  mode: TextbookDeleteConfirmMode,
  selectedCount?: number
): TextbookDeleteConfirmCopy {
  const line2 = SIMPLE_DELETE_IRREVERSIBLE_LINE

  if (mode === 'single') {
    return {
      title: '교재 삭제 안내',
      line1: '해당 교재를 삭제하시겠습니까?',
      line2,
    }
  }

  const n = Math.max(0, selectedCount ?? 0)
  return {
    title: buildBulkDeleteGuideTitle('교재'),
    line1: `**선택한 ${n}개**의 교재를 삭제하시겠습니까?`,
    line2,
  }
}
