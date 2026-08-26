/** 공지 `an_vis` / FAQ `af_vis` 목록 키에서 서버 공개 필터를 읽는다. */
export type PostListVisibility = 'public' | 'private' | 'all'

export function visibilityFromListQueryKey(
  queryKey: readonly unknown[],
  visParam: string
): PostListVisibility {
  const last = queryKey[queryKey.length - 1]
  if (typeof last !== 'string' || last === '') return 'all'
  const vis = new URLSearchParams(last).get(visParam)
  if (vis === 'public') return 'public'
  if (vis === 'private') return 'private'
  return 'all'
}

export function statusMatchesListVisibility(
  status: string,
  vis: PostListVisibility
): boolean {
  if (vis === 'all') return true
  if (vis === 'public') return status === 'published'
  return status === 'draft'
}
