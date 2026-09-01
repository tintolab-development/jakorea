import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { useMypageMember } from '../../hooks/use-mypage-member'
import { MOCK_SETTINGS_GUARDIAN, MOCK_SETTINGS_PROFILE } from '../lib/constants'
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
    return {
      isRemoteSession: false,
      isLoading: false,
      isError: false,
      profile: MOCK_SETTINGS_PROFILE,
      guardian: MOCK_SETTINGS_GUARDIAN,
      view: mapPortalProfileToSettingsView(MOCK_SETTINGS_PROFILE, MOCK_SETTINGS_GUARDIAN),
    }
  }

  const profile = profileQuery.data ?? {}

  return {
    isRemoteSession: true,
    isLoading: member.isLoading || (profileQuery.isPending && !profileQuery.data),
    isError: Boolean(member.isError && profileQuery.isError && !profileQuery.data),
    profile,
    guardian: null,
    view: mapPortalProfileToSettingsView(profile, null),
  }
}
