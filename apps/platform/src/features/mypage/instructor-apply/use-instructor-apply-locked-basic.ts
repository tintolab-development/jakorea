import { useMemo } from 'react'
import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getDevMemberProfile } from '@/shared/lib/dev-member-profile'
import {
  getMockInstructorApplyLockedBasic,
  mapPortalProfileToLockedBasicInfo,
  type InstructorApplyLockedBasicInfo,
} from './map-locked-basic-info'

export type InstructorApplyLockedBasicView = {
  isLoading: boolean
  isError: boolean
  lockedBasic: InstructorApplyLockedBasicInfo
}

/** 강사 신청 — 회원가입(포털 프로필) 기본정보 로드 */
export function useInstructorApplyLockedBasic(): InstructorApplyLockedBasicView {
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const isRemoteSession = remote && hasToken

  const profileQuery = usePortalProfileQuery({ enabled: isRemoteSession })
  const devProfile = getDevMemberProfile()

  const lockedBasic = useMemo(() => {
    if (!isRemoteSession) return getMockInstructorApplyLockedBasic(devProfile)
    return mapPortalProfileToLockedBasicInfo(profileQuery.data)
  }, [devProfile, isRemoteSession, profileQuery.data])

  if (!isRemoteSession) {
    return {
      isLoading: false,
      isError: false,
      lockedBasic,
    }
  }

  return {
    isLoading: profileQuery.isPending && !profileQuery.data,
    isError: Boolean(profileQuery.isError && !profileQuery.data),
    lockedBasic,
  }
}
