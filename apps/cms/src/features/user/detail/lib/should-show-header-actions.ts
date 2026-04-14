import type { TabState } from '@/features/user/detail/lib/user-detail-fullpage-helpers'

/**
 * 회원 상세 풀페이지 — 메인 상단 `기본정보` 제목 + 액션 버튼 영역 노출 여부
 * - 정산 현황: 숨김
 * - 프로그램 참여 이력 및 하위(수강·봉사·강의 등): 숨김
 */
export function shouldShowHeaderActions(ctx: { tabState: TabState }): boolean {
  const { tabState } = ctx
  if (tabState.lnb === 'payment-status' || tabState.lnb === 'history') {
    return false
  }
  return true
}
