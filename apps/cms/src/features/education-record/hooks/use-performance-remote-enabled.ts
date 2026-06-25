import { isPerformanceRecordsRemoteEnabled } from '@/features/education-record/api/performance-remote-capabilities'

export function usePerformanceRemoteEnabled(enabled = true): boolean {
  return enabled && isPerformanceRecordsRemoteEnabled()
}
