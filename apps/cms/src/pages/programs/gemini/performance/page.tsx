/**
 * 프로그램 관리 > Gemini 프로그램 > 실적 관리
 */

import { GeminiPerformanceList } from '@/features/program/gemini/ui/performance/list'
import {
  GeminiPerformanceReportAddFullpageModal,
  useGeminiPerformanceReportAddUrl,
} from '@/features/program/gemini/ui/performance/report-add-fullpage-modal'

export function GeminiPerformancePage() {
  const { isAddOpen, closeAdd } = useGeminiPerformanceReportAddUrl()

  return (
    <>
      <GeminiPerformanceList />
      {isAddOpen ? <GeminiPerformanceReportAddFullpageModal open onClose={closeAdd} /> : null}
    </>
  )
}
