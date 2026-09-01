import {
  usePortalMeQuery,
  usePortalProfileQuery,
} from '@/features/auth/sign-in'
import { getAccessToken } from '@/shared/lib/auth-token'
import { getDevMemberProfile } from '@/shared/lib/dev-member-profile'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import {
  MOCK_MYPAGE_AFFILIATION,
  MOCK_MYPAGE_EMPLOYMENT_LABEL,
} from '../home/lib/mock-stats'
import { MOCK_MYPAGE_USER_NAME } from '../lib/constants'
import {
  mapPortalMemberToPlatformProfile,
  resolvePortalDisplayName,
} from '../lib/map-portal-member-profile'
import {
  showMypageAffiliationEmployment,
  resolveAffiliationLabel,
  resolveEmploymentStatusLabel,
} from '../lib/member-profile'
import type { PlatformMemberProfile } from '../model/types'

export type MypageMemberView = {
  /** 실토큰 세션이면 API, 아니면 mock/dev 프로필 */
  isRemoteSession: boolean
  isLoading: boolean
  isError: boolean
  displayName: string
  profile: PlatformMemberProfile
  email?: string
  /** 교사·교사 겸직 강사 — 소속 (학교명 우선) */
  affiliationLabel?: string
  /** 교사·교사 겸직 강사 — 재직 뱃지 */
  employmentStatusLabel?: string
}

/** 마이페이지 헤더·LNB용 현재 회원 뷰 모델 */
export function useMypageMember(): MypageMemberView {
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const isRemoteSession = remote && hasToken

  const meQuery = usePortalMeQuery({ enabled: isRemoteSession })
  const profileQuery = usePortalProfileQuery({ enabled: isRemoteSession })

  if (!isRemoteSession) {
    const profile = getDevMemberProfile()
    const showAffiliationEmployment = showMypageAffiliationEmployment(profile)
    return {
      isRemoteSession: false,
      isLoading: false,
      isError: false,
      displayName: MOCK_MYPAGE_USER_NAME,
      profile,
      affiliationLabel: showAffiliationEmployment ? MOCK_MYPAGE_AFFILIATION : undefined,
      employmentStatusLabel: showAffiliationEmployment ? MOCK_MYPAGE_EMPLOYMENT_LABEL : undefined,
    }
  }

  const isLoading =
    (meQuery.isPending && !meQuery.data) || (profileQuery.isPending && !profileQuery.data)
  const isError = Boolean(meQuery.isError && profileQuery.isError && !meQuery.data && !profileQuery.data)
  const profile = mapPortalMemberToPlatformProfile({
    me: meQuery.data,
    profile: profileQuery.data,
  })

  return {
    isRemoteSession: true,
    isLoading,
    isError,
    displayName: resolvePortalDisplayName({
      me: meQuery.data,
      profile: profileQuery.data,
      fallback: meQuery.data?.email?.split('@')[0] || '회원',
    }),
    profile,
    email: profileQuery.data?.email ?? meQuery.data?.email,
    affiliationLabel: showMypageAffiliationEmployment(profile)
      ? resolveAffiliationLabel({
          schoolName: profileQuery.data?.schoolName,
          affiliationName: profileQuery.data?.affiliationName,
        })
      : undefined,
    employmentStatusLabel: showMypageAffiliationEmployment(profile)
      ? resolveEmploymentStatusLabel(profileQuery.data?.teacherEmploymentStatus)
      : undefined,
  }
}
