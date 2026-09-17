/**
 * TODO(temp-mock): 열여라 참깨 — 일반 프로그램 진행현황 화면 확인용 임시 FE mock
 * `VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED=true` 일 때만 활성.
 */

export const GENERAL_PROGRAM_TEMP_MOCK_OPT_IN_ENV =
  'VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED' as const

/** 열여라 참깨 임시 mock — env opt-in 시에만 true */
export function isGeneralProgramTempMockEnabled(): boolean {
  return (
    String(import.meta.env.VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED).trim().toLowerCase() ===
    'true'
  )
}
