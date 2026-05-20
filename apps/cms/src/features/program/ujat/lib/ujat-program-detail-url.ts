/**
 * UJAT 프로그램 상세 URL — `/programs/ujat?programId=…&lnb=…&tab=…`
 * - `instAppId`: 신청 기관 상세(목록 행 id). 있으면 `lnb=institution_applications&tab=inst_all`로 정규화.
 * - `edit`: 공통정보·모집 폼 수정 모드.
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

/** 신청 기관 목록 → 기관 상세 (풀페이지 메인) */
export const UJAT_INST_APP_ID_PARAM = 'instAppId'

export { LNB_PARAM as UJAT_DETAIL_LNB_PARAM, TAB_PARAM as UJAT_DETAIL_TAB_PARAM }

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

export function parseUjatInstAppId(searchParams: URLSearchParams): string | null {
  return searchParams.get(UJAT_INST_APP_ID_PARAM)
}

export const UJAT_APPLICANT_ID_PARAM = 'applicantId'

/** UJAT 봉사자 1차 서류 심사 지원자 상세 딥링크 */
export type UjatVolunteerApplicantDetailTab =
  | 'vh1_doc1'
  | 'vh2_doc1'
  | 'vh1_doc_passed'
  | 'vh2_doc_passed'

const UJAT_VOLUNTEER_APPLICANT_DETAIL_TABS: readonly UjatVolunteerApplicantDetailTab[] = [
  'vh1_doc1',
  'vh2_doc1',
  'vh1_doc_passed',
  'vh2_doc_passed',
]

export function isUjatVolunteerApplicantDetailTab(
  tab: string
): tab is UjatVolunteerApplicantDetailTab {
  return (UJAT_VOLUNTEER_APPLICANT_DETAIL_TABS as readonly string[]).includes(tab)
}

export function buildUjatVolunteerApplicantDetailUrl(
  programId: string,
  lnb: 'volunteer_h1' | 'volunteer_h2',
  tab: UjatVolunteerApplicantDetailTab,
  applicantId: string
): string {
  const q = new URLSearchParams({
    programId,
    [LNB_PARAM]: lnb,
    [TAB_PARAM]: tab,
    [UJAT_APPLICANT_ID_PARAM]: applicantId,
  })
  return `/programs/ujat?${q.toString()}`
}
