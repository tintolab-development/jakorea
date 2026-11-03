/**
 * 채용공고 작성자명 — 등록은 GET /api/admin/me 의 name만 사용.
 * 수정은 기존 공고 authorName 유지. 로그인 이메일 local-part·홍길동 기본값 금지.
 */

export type ResolveCurrentAdminAuthorNameResult =
  | { status: 'ready'; authorName: string }
  | { status: 'loading' }
  | { status: 'unavailable' }

export function resolveCurrentAdminAuthorName(args: {
  mode: 'create' | 'edit'
  existingAuthorName?: string | null
  meName?: string | null
  meQueryEnabled: boolean
  meQueryStatus: 'pending' | 'success' | 'error'
}): ResolveCurrentAdminAuthorNameResult {
  if (args.mode === 'edit') {
    return { status: 'ready', authorName: (args.existingAuthorName ?? '').trim() }
  }
  const authorName = (args.meName ?? '').trim()
  if (authorName) return { status: 'ready', authorName }
  if (!args.meQueryEnabled) return { status: 'unavailable' }
  if (args.meQueryStatus === 'pending') return { status: 'loading' }
  return { status: 'unavailable' }
}
