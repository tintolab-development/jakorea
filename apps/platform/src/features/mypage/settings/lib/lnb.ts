import type { MypageLnbItem, MypageSettingsLnbItemKey } from '../../model/types'

const SETTINGS_LNB_ITEMS: Omit<MypageLnbItem, 'active'>[] = [
  { key: 'settingsProfile', label: '회원 정보 수정', enabled: true, hideIcon: true },
  { key: 'settingsConsents', label: '약관 및 정책 동의 관리', enabled: true, hideIcon: true },
  { key: 'settingsSocial', label: '소셜 계정 연동 관리', enabled: true, hideIcon: true },
]

type SettingsLnbOptions = {
  /** 만 14세 미만은 소셜 계정 연결 불가 */
  showSocial?: boolean
}

/** 약관 및 정책 동의 관리는 영수증 동의 진입 이후에도 숨기지 않는다. */
export function getSettingsLnbItems(
  activeKey: MypageSettingsLnbItemKey = 'settingsProfile',
  options: SettingsLnbOptions = {},
): MypageLnbItem[] {
  const showSocial = options.showSocial !== false
  return SETTINGS_LNB_ITEMS.filter(item => showSocial || item.key !== 'settingsSocial').map(
    item => ({
      ...item,
      active: item.key === activeKey,
    }),
  )
}
