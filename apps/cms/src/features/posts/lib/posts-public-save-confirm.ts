/**
 * 공지·FAQ 공개 여부 — 신규 작성 기본값 (QA-0338).
 * 신규 작성 기본값은 비공개. 작성 중 글이 실수로 바로 노출되지 않게 한다.
 */

export type PostsVisibility = 'public' | 'private'

export const POSTS_NEW_DEFAULT_VISIBILITY: PostsVisibility = 'private'
