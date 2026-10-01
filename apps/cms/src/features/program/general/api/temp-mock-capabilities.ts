/**
 * TODO(temp-mock): 열여라 참깨 — 일반 프로그램 진행현황 화면 확인용 임시 FE mock
 * `VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED=true` 일 때만 활성.
 * 원격 programs API에 없는 FE 전용 programId만 사용한다.
 */

export const GENERAL_PROGRAM_TEMP_MOCK_OPT_IN_ENV =
  'VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED' as const

/** 기관 유형 쇼케이스 — 원격 programs API에 없는 FE 전용 id */
export const TEMP_MOCK_ORG_PROGRAM_ID = 'temp-mock-org-showcase' as const

/** 기관 유형 쇼케이스 — 봉사자 면접 없음 */
export const TEMP_MOCK_ORG_NO_INTERVIEW_PROGRAM_ID = 'temp-mock-org-showcase-no-interview' as const

/** 개인 유형 쇼케이스 — 원격 programs API에 없는 FE 전용 id */
export const TEMP_MOCK_INDIVIDUAL_PROGRAM_ID = 'temp-mock-individual-showcase' as const

/** 개인 유형 쇼케이스 — 참여자·봉사자 면접 없음 */
export const TEMP_MOCK_INDIVIDUAL_NO_INTERVIEW_PROGRAM_ID =
  'temp-mock-individual-showcase-no-interview' as const

const TEMP_MOCK_ORG_PROGRAM_IDS = new Set<string>([
  TEMP_MOCK_ORG_PROGRAM_ID,
  TEMP_MOCK_ORG_NO_INTERVIEW_PROGRAM_ID,
])

const TEMP_MOCK_INDIVIDUAL_PROGRAM_IDS = new Set<string>([
  TEMP_MOCK_INDIVIDUAL_PROGRAM_ID,
  TEMP_MOCK_INDIVIDUAL_NO_INTERVIEW_PROGRAM_ID,
])

const TEMP_MOCK_PROGRAM_IDS = new Set<string>([
  ...TEMP_MOCK_ORG_PROGRAM_IDS,
  ...TEMP_MOCK_INDIVIDUAL_PROGRAM_IDS,
])

/** 열여라 참깨 임시 mock — env opt-in 시에만 true */
export function isGeneralProgramTempMockEnabled(): boolean {
  return (
    String(import.meta.env.VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED).trim().toLowerCase() ===
    'true'
  )
}

export function isGeneralProgramTempMockOrgProgramId(programId?: string | null): boolean {
  if (!programId || !isGeneralProgramTempMockEnabled()) return false
  return TEMP_MOCK_ORG_PROGRAM_IDS.has(programId)
}

export function isGeneralProgramTempMockIndividualProgramId(programId?: string | null): boolean {
  if (!programId || !isGeneralProgramTempMockEnabled()) return false
  return TEMP_MOCK_INDIVIDUAL_PROGRAM_IDS.has(programId)
}

/** env ON + FE 전용 mock 프로그램 id (기관 또는 개인) */
export function isGeneralProgramTempMockProgramId(programId?: string | null): boolean {
  if (!programId || !isGeneralProgramTempMockEnabled()) return false
  return TEMP_MOCK_PROGRAM_IDS.has(programId)
}
