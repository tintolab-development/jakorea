import { SIMPLE_DELETE_IRREVERSIBLE_LINE } from '@/shared/constants/simple-delete-confirm'
import { buildBulkDeleteGuideTitle } from '@/shared/ui/delete-guide-messages'

export type PostsDeleteConfirmKind = 'notice' | 'faq' | 'inquiry'
export type PostsDeleteConfirmMode = 'single' | 'bulk'

export type PostsDeleteConfirmCopy = {
  title: string
  line1: string
  line2: string
}

const KIND_CONFIG: Record<
  PostsDeleteConfirmKind,
  { titleLabel: string; singleLine1: string; buildBulkLine1: (count: number) => string }
> = {
  notice: {
    titleLabel: '공지사항',
    singleLine1: '해당 공지사항을 삭제하시겠습니까?',
    buildBulkLine1: n => `선택한 ${n}개의 공지사항을 삭제하시겠습니까?`,
  },
  faq: {
    titleLabel: 'FAQ',
    singleLine1: '해당 FAQ를 삭제하시겠습니까?',
    buildBulkLine1: n => `선택한 ${n}개의 FAQ를 삭제하시겠습니까?`,
  },
  inquiry: {
    titleLabel: '문의',
    singleLine1: '해당 문의를 삭제하시겠습니까?',
    buildBulkLine1: n => `선택한 ${n}개의 문의를 삭제하시겠습니까?`,
  },
}

export function resolvePostsDeleteConfirmCopy(
  kind: PostsDeleteConfirmKind,
  mode: PostsDeleteConfirmMode,
  count?: number
): PostsDeleteConfirmCopy {
  const config = KIND_CONFIG[kind]
  const line2 = SIMPLE_DELETE_IRREVERSIBLE_LINE

  if (mode === 'single') {
    const title =
      kind === 'faq' ? 'FAQ 삭제 안내' : `${config.titleLabel} 삭제 안내`
    return { title, line1: config.singleLine1, line2 }
  }

  const bulkCount = Math.max(0, count ?? 0)
  const title = buildBulkDeleteGuideTitle(config.titleLabel)
  return {
    title,
    line1: config.buildBulkLine1(bulkCount),
    line2,
  }
}
