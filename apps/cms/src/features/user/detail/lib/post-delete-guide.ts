/** 게시글 삭제 안내(일반 기관형 참여 기관 상세 시안 19) — 대상 글 앞부분 표시 */
import type { ProgramPost } from '@/types/domain'

const POST_DELETE_PREVIEW_MAX_LENGTH = 30

/** 삭제 안내용 본문 앞부분 — 태그·마크다운 기호·대괄호를 걷어낸 한 줄 */
export function buildPostDeletePreviewText(content: string | undefined | null): string {
  const plain = (content ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[[\]*_`#>~|]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= POST_DELETE_PREVIEW_MAX_LENGTH) return plain
  return `${plain.slice(0, POST_DELETE_PREVIEW_MAX_LENGTH)}...`
}

export function buildPostDeleteGuideLines(
  post: Pick<ProgramPost, 'content' | 'title'> | null,
  fallbackLines: string[]
): string[] {
  const preview = buildPostDeletePreviewText(post?.content || post?.title)
  if (!preview) return fallbackLines
  return [`[${preview}] 게시글을 삭제하시겠습니까?`, '삭제된 정보는 되돌릴 수 없습니다.']
}
