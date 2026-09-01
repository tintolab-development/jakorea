import type { MypageLnbItem, MypageLnbItemKey, PlatformMemberProfile } from '../model/types'

const GENERAL_LNB_ITEMS: Omit<MypageLnbItem, 'active'>[] = [
  { key: 'home', label: '나의 홈', enabled: true },
  { key: 'education', label: '교육현황', enabled: true },
  { key: 'volunteer', label: '봉사현황', enabled: false },
  { key: 'inquiries', label: '문의내역', enabled: true },
]

/** 강사회원 LNB — 교사(school_teacher) 스펙과 분리 */
const INSTRUCTOR_LNB_ITEMS: Omit<MypageLnbItem, 'active'>[] = [
  { key: 'home', label: '나의 홈', enabled: true },
  { key: 'lectures', label: '강의현황', enabled: false },
  { key: 'settlement', label: '정산현황', enabled: false, dividerAfter: true },
  { key: 'education', label: '교육현황', enabled: true },
  { key: 'volunteer', label: '봉사현황', enabled: false },
  { key: 'inquiries', label: '문의내역', enabled: true },
]

function withActive(
  items: Omit<MypageLnbItem, 'active'>[],
  activeKey: MypageLnbItemKey,
): MypageLnbItem[] {
  return items.map(item => ({
    ...item,
    active: item.key === activeKey,
  }))
}

export function getMypageLnbItems(
  profile: PlatformMemberProfile,
  activeKey: MypageLnbItemKey = 'home',
): MypageLnbItem[] {
  switch (profile) {
    case 'individual':
      return withActive(GENERAL_LNB_ITEMS, activeKey)
    case 'instructor_only':
    case 'instructor_dual':
      return withActive(INSTRUCTOR_LNB_ITEMS, activeKey)
    case 'school_teacher':
      return withActive(GENERAL_LNB_ITEMS, activeKey)
  }
}
