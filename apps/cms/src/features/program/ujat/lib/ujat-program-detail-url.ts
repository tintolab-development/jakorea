/**
 * UJAT 프로그램 상세 URL — `/programs/ujat?programId=…&lnb=…&tab=…`
 * - `instAppId`: 신청 기관 상세(목록 행 id). `tab=inst_schedule_confirm`이면 해당 탭 유지, 아니면 `inst_all`.
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

/** 교육 진행 > 참여 기관 목록 → 기관 상세 */
export const UJAT_EDU_INST_ID_PARAM = 'eduInstId'
export const UJAT_EDU_INST_TAB_PARAM = 'eduInstTab'

/** 교육 진행 > 참여 봉사자 — 관리자 대리 신청서 작성(회원 선택 후) */
export const UJAT_VOL_ADD_MEMBER_ID_PARAM = 'volAddMemberId'

export function isUjatEducationProgressVolunteersTab(tab: string): boolean {
  return /^edu_h[12]_volunteers$/.test(tab)
}

export type UjatEducationProgressInstitutionDetailTab = 'application' | 'assignment' | 'posts'

const UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TABS: readonly UjatEducationProgressInstitutionDetailTab[] =
  ['application', 'assignment', 'posts']

export function isUjatEducationProgressInstitutionDetailTab(
  tab: string
): tab is UjatEducationProgressInstitutionDetailTab {
  return (UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TABS as readonly string[]).includes(tab)
}

export function parseUjatEduInstTab(
  searchParams: URLSearchParams
): UjatEducationProgressInstitutionDetailTab {
  const raw = searchParams.get(UJAT_EDU_INST_TAB_PARAM)
  if (raw && isUjatEducationProgressInstitutionDetailTab(raw)) return raw
  return 'application'
}

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

/** UJAT 봉사자 지원자 상세 딥링크 */
export type UjatVolunteerApplicantDetailTab =
  | 'vh1_doc1'
  | 'vh2_doc1'
  | 'vh1_doc_passed'
  | 'vh2_doc_passed'
  | 'vh1_interview2'
  | 'vh2_interview2'

const UJAT_VOLUNTEER_APPLICANT_DETAIL_TABS: readonly UjatVolunteerApplicantDetailTab[] = [
  'vh1_doc1',
  'vh2_doc1',
  'vh1_doc_passed',
  'vh2_doc_passed',
  'vh1_interview2',
  'vh2_interview2',
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
