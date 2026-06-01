/** 복수 회차 — 진행 차시 선택 (1~16차시) */
export const GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS = Array.from(
  { length: 16 },
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
