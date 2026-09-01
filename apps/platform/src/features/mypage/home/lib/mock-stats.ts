import type { MypageProgramStats } from '../../model/types'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'

/** 강사 마이페이지 mock — 소속·재직 뱃지 */
export const MOCK_MYPAGE_AFFILIATION = 'JA 코리아 초등학교'
export const MOCK_MYPAGE_EMPLOYMENT_LABEL = '재직중'

export const MOCK_MYPAGE_PROGRAM_STATS = {
  applied: 2,
  inProgress: 3,
  completed: 12,
} as const satisfies MypageProgramStats

const EMPTY_MYPAGE_PROGRAM_STATS: MypageProgramStats = {
  applied: 0,
  inProgress: 0,
  completed: 0,
}

export function getMockMypageProgramStats(): MypageProgramStats {
  if (!shouldUsePlatformMockData()) return EMPTY_MYPAGE_PROGRAM_STATS
  return MOCK_MYPAGE_PROGRAM_STATS
}
