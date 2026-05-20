/** UJAT 기관 신청 목록 LNB — URL `tab` 값·자식 메뉴 라벨 */

export const UJAT_INSTITUTION_APP_CHILD_ROWS = [
  { tab: 'inst_all', label: '신청 기관' },
  { tab: 'inst_schedule_assign', label: '신청 기관 임시 배정' },
  { tab: 'inst_schedule_confirm', label: '임시 배정 기관 확인' },
] as const

export type UjatInstitutionAppTab = (typeof UJAT_INSTITUTION_APP_CHILD_ROWS)[number]['tab']

export const UJAT_INSTITUTION_APP_TABS: readonly UjatInstitutionAppTab[] =
  UJAT_INSTITUTION_APP_CHILD_ROWS.map(row => row.tab)

export function isValidUjatInstitutionAppTab(tab: string): tab is UjatInstitutionAppTab {
  return (UJAT_INSTITUTION_APP_TABS as readonly string[]).includes(tab)
}

export function institutionAppScreenTitle(tab: string): string {
  const row = UJAT_INSTITUTION_APP_CHILD_ROWS.find(r => r.tab === tab)
  return row?.label ?? tab
}
