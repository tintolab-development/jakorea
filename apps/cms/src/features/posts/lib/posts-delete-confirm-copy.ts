import { SIMPLE_DELETE_IRREVERSIBLE_LINE } from '@/shared/constants/simple-delete-confirm'
import {
  buildBulkDeleteGuideTitle,
  buildDeleteGuideOverflowHeadline,
  truncateForDeleteGuideDisplay,
} from '@/shared/ui/delete-guide-messages'

export type PostsDeleteConfirmKind = 'notice' | 'faq' | 'inquiry'
export type PostsDeleteConfirmMode = 'single' | 'bulk'

export type PostsDeleteConfirmCopy = {
  title: string
  line1: string
  line2: string
}

const KIND_CONFIG: Record<
  PostsDeleteConfirmKind,
  {
    titleLabel: string
    singleLine1: string
    buildBulkLine1: (count: number) => string
    /** `[이름] ` / `[이름] 외 N개` 뒤에 붙는 꼬리 — 예: `공지사항을 삭제하시겠습니까?` */
    targetSuffix: string
  }
> = {
  notice: {
    titleLabel: '공지사항',
    singleLine1: '해당 공지사항을 삭제하시겠습니까?',
    buildBulkLine1: n => `선택한 ${n}개의 공지사항을 삭제하시겠습니까?`,
    targetSuffix: '공지사항을 삭제하시겠습니까?',
  },
  faq: {
    titleLabel: 'FAQ',
    singleLine1: '해당 FAQ를 삭제하시겠습니까?',
    buildBulkLine1: n => `선택한 ${n}개의 FAQ를 삭제하시겠습니까?`,
    targetSuffix: 'FAQ를 삭제하시겠습니까?',
  },
  inquiry: {
    titleLabel: '문의',
    singleLine1: '해당 문의를 삭제하시겠습니까?',
    buildBulkLine1: n => `선택한 ${n}개의 문의를 삭제하시겠습니까?`,
    targetSuffix: '문의를 삭제하시겠습니까?',
  },
}

/**
 * 게시글(공지·FAQ·문의) 삭제 안내 문구.
 * `names`(제목)가 있으면 단건 `[제목] 공지사항을 삭제하시겠습니까?`,
 * 일괄 `[첫 제목] 외 N개의 공지사항을 삭제하시겠습니까?` (N = 선택 수 - 1, 1건이면 단건 문구).
 * 제목을 알 수 없으면 `해당 …` / `선택한 N개의 …` 문구로 돌아간다.
 */
export function resolvePostsDeleteConfirmCopy(
  kind: PostsDeleteConfirmKind,
  mode: PostsDeleteConfirmMode,
  count?: number,
  names?: readonly string[]
): PostsDeleteConfirmCopy {
  const config = KIND_CONFIG[kind]
  const line2 = SIMPLE_DELETE_IRREVERSIBLE_LINE
  const singleTitle = `${config.titleLabel} 삭제 안내`
  const bulkCount = Math.max(0, count ?? 0)
  const isSingle = mode === 'single' || bulkCount <= 1
  const firstName = (names ?? [])
    .map(name => truncateForDeleteGuideDisplay(name))
    .find(name => name !== '')

  if (firstName != null) {
    if (isSingle) {
      return {
        title: singleTitle,
        line1: `**[${firstName}]** ${config.targetSuffix}`,
        line2,
      }
    }
    return {
      title: buildBulkDeleteGuideTitle(config.titleLabel),
      line1: buildDeleteGuideOverflowHeadline(firstName, bulkCount, `의 ${config.targetSuffix}`),
      line2,
    }
  }

  if (mode === 'single') {
    return { title: singleTitle, line1: config.singleLine1, line2 }
  }

  return {
    title: buildBulkDeleteGuideTitle(config.titleLabel),
    line1: config.buildBulkLine1(bulkCount),
    line2,
  }
}
