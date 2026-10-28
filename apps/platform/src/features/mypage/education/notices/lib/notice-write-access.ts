import type { PlatformMemberProfile } from '@/features/mypage/model/types'
import {
  hasTeacherMypageProfile,
  isInstructorMypageProfile,
} from '@/features/mypage/lib/member-profile'
import type { EducationDisplayStatus } from '../../applications/model/types'

const NOTICE_WRITE_DISPLAY_STATUSES = new Set<EducationDisplayStatus>(['in_progress', 'completed'])

/**
 * 안내사항 탭 「안내사항 작성하기」(게시글 작성).
 * 기관 신청 양식의 사전 안내(`preEducationNoticeRequired`)와는 별개 기능이다.
 */
export function canWriteEducationNotice(
  profile: PlatformMemberProfile,
  displayStatus: EducationDisplayStatus,
): boolean {
  if (!hasTeacherMypageProfile(profile) && !isInstructorMypageProfile(profile)) return false
  return NOTICE_WRITE_DISPLAY_STATUSES.has(displayStatus)
}

export function resolveEducationNoticeAuthorDisplayName(
  displayName: string | undefined,
  role: 'teacher' | 'instructor',
): string {
  const suffix = role === 'teacher' ? '담당교사님' : '강사님'
  const name = displayName?.trim()
  return name ? `${name} ${suffix}` : suffix
}
