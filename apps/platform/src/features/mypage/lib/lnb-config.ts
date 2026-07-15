import type { MypageLnbItem, MypageLnbItemKey, PlatformMemberProfile } from '../model/types'

const GENERAL_LNB_ITEMS: Omit<MypageLnbItem, 'active'>[] = [
  { key: 'home', label: '나의 홈', enabled: true },
  { key: 'education', label: '교육현황', enabled: false },
  { key: 'volunteer', label: '봉사현황', enabled: false },
  { key: 'inquiries', label: '문의내역', enabled: false },
]

export function getMypageLnbItems(
  profile: PlatformMemberProfile,
  activeKey: MypageLnbItemKey = 'home'
): MypageLnbItem[] {
  switch (profile) {
    case 'individual':
      return GENERAL_LNB_ITEMS.map(item => ({
        ...item,
        active: item.key === activeKey,
      }))
    case 'school_teacher':
    case 'instructor_only':
    case 'instructor_dual':
      // TODO(mypage): 교사/강사 LNB 메뉴 스펙 확정 후 구현
      return []
  }
}
