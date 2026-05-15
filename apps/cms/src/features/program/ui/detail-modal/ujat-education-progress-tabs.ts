/** UJAT 교육 진행 현황 — URL `tab` 값·LNB 행 정의 */

export const EDU_PROGRESS_CHILD_ROWS = [
  { suffix: 'institutions' as const, label: '참여 기관' },
  { suffix: 'volunteers' as const, label: '참여 봉사자' },
  { suffix: 'region' as const, label: '지역 별 교육 배정' },
  { suffix: 'attendance' as const, label: '출석 관리' },
  { suffix: 'assignments' as const, label: '과제 관리' },
] as const

export type EducationProgressChildSuffix = (typeof EDU_PROGRESS_CHILD_ROWS)[number]['suffix']

export type EducationProgressHalfKey = 'h1' | 'h2'

export function educationProgressTabId(
  half: EducationProgressHalfKey,
  suffix: EducationProgressChildSuffix
): string {
  return `edu_${half}_${suffix}`
}

export const EDU_PROGRESS_SUMMARY_TAB = 'edu_summary'

/** 구 `edu_*` 단일 탭 → 상반기 기준으로 이관 */
export const EDU_PROGRESS_LEGACY_TAB_MAP: Record<string, string> = {
  edu_institutions: 'edu_h1_institutions',
  edu_volunteers: 'edu_h1_volunteers',
  edu_region: 'edu_h1_region',
  edu_attendance: 'edu_h1_attendance',
  edu_assignments: 'edu_h1_assignments',
}

const VALID_EDU_TABS: string[] = (() => {
  const list: string[] = []
  for (const half of ['h1', 'h2'] as const) {
    for (const row of EDU_PROGRESS_CHILD_ROWS) {
      list.push(educationProgressTabId(half, row.suffix))
    }
  }
  list.push(EDU_PROGRESS_SUMMARY_TAB)
  return list
})()

export function isValidEducationProgressTab(tab: string): boolean {
  return VALID_EDU_TABS.includes(tab)
}

export function defaultEducationProgressTabForHalf(half: EducationProgressHalfKey): string {
  return educationProgressTabId(half, 'institutions')
}

export function educationProgressScreenTitle(tab: string): string {
  if (tab === EDU_PROGRESS_SUMMARY_TAB) return '교육 진행 요약'
  const m = tab.match(/^edu_(h[12])_(.+)$/)
  if (!m) return tab
  const halfLabel = m[1] === 'h1' ? '상반기' : '하반기'
  const row = EDU_PROGRESS_CHILD_ROWS.find(r => r.suffix === m[2])
  const label = row?.label ?? m[2]
  return `${halfLabel} — ${label}`
}
