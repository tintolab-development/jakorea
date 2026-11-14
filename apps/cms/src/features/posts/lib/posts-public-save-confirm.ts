/**
 * 공지·FAQ 공개 여부 — 신규 작성 기본값.
 * 시안(QA 2026-11): 신규 등록 팝업은 공개 여부를 미선택으로 연다.
 * 관리자가 직접 고르지 않으면 등록 시 공통 「필수 항목 미입력 안내」를 띄우고 등록하지 않는다.
 */

export type PostsVisibility = 'public' | 'private'

export const POSTS_NEW_DEFAULT_VISIBILITY: PostsVisibility | undefined = undefined
