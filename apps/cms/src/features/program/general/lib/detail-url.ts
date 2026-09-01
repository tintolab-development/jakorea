/**
 * 일반 프로그램 상세 URL — `/programs/general?programId=…&lnb=…&tab=…`
 */

export type GeneralDetailLnbKey =
  | 'info'
  | 'institution_applications'
  | 'instructor_applications'
  | 'volunteer_applications'
  | 'progress'
  | 'survey'
  | 'managers'

export const GENERAL_DETAIL_LNB_KEYS: readonly GeneralDetailLnbKey[] = [
  'info',
  'institution_applications',
  'instructor_applications',
  'volunteer_applications',
  'progress',
  'survey',
  'managers',
] as const

const LNB_PARAM = 'lnb'
const TAB_PARAM = 'tab'

export { LNB_PARAM as GENERAL_DETAIL_LNB_PARAM, TAB_PARAM as GENERAL_DETAIL_TAB_PARAM }

export function buildGeneralProgramDetailUrl(
  programId: string,
  lnb: GeneralDetailLnbKey = 'info',
  tab: string = 'info'
): string {
  const q = new URLSearchParams({
    programId,
    [LNB_PARAM]: lnb,
    [TAB_PARAM]: tab,
  })
  return `/programs/general?${q.toString()}`
}

export function parseGeneralDetailLnb(searchParams: URLSearchParams): GeneralDetailLnbKey | null {
  const raw = searchParams.get(LNB_PARAM)
  if (raw && (GENERAL_DETAIL_LNB_KEYS as readonly string[]).includes(raw)) {
    return raw as GeneralDetailLnbKey
  }
  return null
}

export function parseGeneralDetailTab(searchParams: URLSearchParams): string | null {
  return searchParams.get(TAB_PARAM)
}

export function isGeneralProgramListPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  return p === '/programs/general' || p.startsWith('/programs/general/')
}
