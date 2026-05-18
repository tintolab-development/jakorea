/**
 * UJAT 프로그램 상세 URL — `/programs/ujat?programId=…&lnb=…&tab=…`
 */

export type UjatDetailLnbKey =
  | 'info'
  | 'institution_applications'
  | 'volunteer_h1'
  | 'volunteer_h2'
  | 'education_progress'
  | 'survey'
  | 'managers'

export const UJAT_DETAIL_LNB_KEYS: readonly UjatDetailLnbKey[] = [
  'info',
  'institution_applications',
  'volunteer_h1',
  'volunteer_h2',
  'education_progress',
  'survey',
  'managers',
] as const

const LNB_PARAM = 'lnb'
const TAB_PARAM = 'tab'

export function buildUjatProgramDetailUrl(
  programId: string,
  lnb: UjatDetailLnbKey = 'info',
  tab: string = 'info'
): string {
  const q = new URLSearchParams({
    programId,
    [LNB_PARAM]: lnb,
    [TAB_PARAM]: tab,
  })
  return `/programs/ujat?${q.toString()}`
}

export function parseUjatDetailLnb(searchParams: URLSearchParams): UjatDetailLnbKey | null {
  const raw = searchParams.get(LNB_PARAM)
  if (raw && (UJAT_DETAIL_LNB_KEYS as readonly string[]).includes(raw)) {
    return raw as UjatDetailLnbKey
  }
  return null
}

/** 레거시 `lnb=volunteer_applications` → `volunteer_h1` | `volunteer_h2` (탭 prefix 기준) */
export function resolveUjatDetailLnbFromSearchParams(
  searchParams: URLSearchParams
): UjatDetailLnbKey | null {
  const raw = searchParams.get(LNB_PARAM)
  if (raw === 'volunteer_applications') {
    const tab = searchParams.get(TAB_PARAM) ?? ''
    return tab.startsWith('vh2_') ? 'volunteer_h2' : 'volunteer_h1'
  }
  return parseUjatDetailLnb(searchParams)
}

export function parseUjatDetailTab(searchParams: URLSearchParams): string | null {
  return searchParams.get(TAB_PARAM)
}
