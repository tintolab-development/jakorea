import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { useMypageMember } from '../../hooks/use-mypage-member'
import { isSchoolTeacherMypageProfile } from '../../lib/member-profile'
import { MOCK_SETTINGS_GUARDIAN, MOCK_SETTINGS_PROFILE, MOCK_TEACHER_SETTINGS_PROFILE } from '../lib/constants'
import {
  mapPortalProfileToSettingsView,
  type SettingsGuardianView,
  type SettingsProfileInput,
  type SettingsViewModel,
} from '../lib/map-view'

export function useSettingsView(): {
  isRemoteSession: boolean
  isLoading: boolean
  isError: boolean
  profile: SettingsProfileInput
  guardian: SettingsGuardianView | null
  view: SettingsViewModel
} {
  const member = useMypageMember()
  const profileQuery = usePortalProfileQuery({ enabled: member.isRemoteSession })

  if (!member.isRemoteSession) {
    const isTeacher = isSchoolTeacherMypageProfile(member.profile)
    const profile = isTeacher ? MOCK_TEACHER_SETTINGS_PROFILE : MOCK_SETTINGS_PROFILE
    const guardian = isTeacher ? null : MOCK_SETTINGS_GUARDIAN
    return {
      isRemoteSession: false,
      isLoading: false,
      isError: false,
      profile,
      guardian,
      view: mapPortalProfileToSettingsView(profile, guardian, {
        variant: isTeacher ? 'teacher' : 'individual',
      }),
    }
  }

  const profile = profileQuery.data ?? {}
  const isTeacher = isSchoolTeacherMypageProfile(member.profile)

  return {
    isRemoteSession: true,
    isLoading: member.isLoading || (profileQuery.isPending && !profileQuery.data),
    isError: Boolean(member.isError && profileQuery.isError && !profileQuery.data),
    profile,
    guardian: null,
    view: mapPortalProfileToSettingsView(profile, null, {
      variant: isTeacher ? 'teacher' : 'individual',
    }),
  }
}
