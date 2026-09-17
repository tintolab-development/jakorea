/**
 * TODO(temp-mock): 열여라 참깨 — 일반 프로그램 진행현황 화면 확인용 임시 FE mock
 * `VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED=true` 일 때만 활성.
 * 원격 프로그램 행에 append하지 않고, 아래 FE 전용 programId 한 건만 사용한다.
 */

export const GENERAL_PROGRAM_TEMP_MOCK_OPT_IN_ENV =
  'VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED' as const

/** 기관 유형 쇼케이스 — 원격 programs API에 없는 FE 전용 id */
export const TEMP_MOCK_ORG_PROGRAM_ID = 'temp-mock-org-showcase' as const

/** 열여라 참깨 임시 mock — env opt-in 시에만 true */
export function isGeneralProgramTempMockEnabled(): boolean {
  return (
    String(import.meta.env.VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED).trim().toLowerCase() ===
    'true'
  )
}

/** env ON + FE 전용 기관 프로그램 id */
export function isGeneralProgramTempMockProgramId(programId?: string | null): boolean {
  if (!programId || !isGeneralProgramTempMockEnabled()) return false
  return programId === TEMP_MOCK_ORG_PROGRAM_ID
}
