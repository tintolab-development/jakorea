/**
 * 상세 「목록으로」 → 목록 이동 시 채용공고 목록(함께하기) 영역이 바로 보이게 하는 이동 state (QA-0486).
 * 새 이동(push)은 ScrollRestoration이 맨 위(히어로 이미지)로 올리므로, 목록 페이지가 이 표시를 보고 목록 영역으로 스크롤한다.
 */
export const CAREERS_SCROLL_TO_JOBS_STATE = { careersScrollToJobs: true } as const

export function shouldScrollToCareersJobs(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { careersScrollToJobs?: unknown }).careersScrollToJobs === true
  )
}
