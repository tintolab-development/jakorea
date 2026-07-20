import { useAuthStore } from '@/features/auth/model/auth-store'
import { shouldUseLogsRemoteApi } from '@/features/logs/api/admin-logs-service'

/** JWT·모듈 설정이 준비됐을 때만 로그 API 쿼리를 실행합니다. */
export function useLogsRemoteQueryEnabled(baseEnabled = true): boolean {
  useAuthStore(s => s.token)
  return baseEnabled && shouldUseLogsRemoteApi()
}
