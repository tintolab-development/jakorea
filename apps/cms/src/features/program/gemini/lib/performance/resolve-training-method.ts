import type { GeminiPerformanceTrainingMethod } from '../../model/performance/types'

/** 연수장소가 `비대면`이면 온라인, 그 외 오프라인 */
export function resolveTrainingMethod(trainingLocation: string): GeminiPerformanceTrainingMethod {
  const normalized = trainingLocation.trim()
  if (normalized === '비대면') return 'ONLINE'
  return 'OFFLINE'
}
