import type { MypageLnbItem, MypageSettingsLnbItemKey } from '../../model/types'

const SETTINGS_LNB_ITEMS: Omit<MypageLnbItem, 'active'>[] = [
  { key: 'settingsProfile', label: '회원정보 수정', enabled: true, hideIcon: true },
  { key: 'settingsConsents', label: '약관 및 정책 동의 관리', enabled: true, hideIcon: true },
]

export function getSettingsLnbItems(
  activeKey: MypageSettingsLnbItemKey = 'settingsProfile',
): MypageLnbItem[] {
  return SETTINGS_LNB_ITEMS.map(item => ({
    ...item,
    active: item.key === activeKey,
  }))
}
