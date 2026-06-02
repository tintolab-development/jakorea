/** 커리큘럼형 단일 회차 —「강의 진행 차시 추가」최대 개수 */
export const GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT = 16

/** 복수 회차 — 진행 차시 선택 (1~16차시) */
export const GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS = Array.from(
  { length: GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT },
  (_, i) => {
    const k = i + 1
    return { value: String(k), label: `${k}차시` }
  }
)

export function formatGeneralProgramProgressSessionDisplay(value: string | undefined): string {
  const n = (value ?? '').replace(/차시\s*$/, '').trim()
  if (!n) return '-'
  return `${n}차시`
}
