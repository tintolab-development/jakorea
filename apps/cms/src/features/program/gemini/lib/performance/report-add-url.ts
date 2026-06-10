/** Gemini 실적 관리 — 연수 보고서 등록 풀페이지 */
export const GEMINI_PERFORMANCE_REPORT_ADD_PARAM = 'performanceReportAdd'
export const GEMINI_PERFORMANCE_REPORT_ADD_ACTIVE = '1'

export function isGeminiPerformanceReportAddOpen(raw: string | null): boolean {
  return raw === GEMINI_PERFORMANCE_REPORT_ADD_ACTIVE
}
