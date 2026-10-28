import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { queryClient } from '@/shared/lib/query-client'

/** 증명서 발급 시 개인정보 조회 이력 `accessPurpose` */
export const CERTIFICATE_ISSUE_PRIVACY_ACCESS_PURPOSE = '증명서 발급'

export function invalidatePrivacyAccessLogsAfterCertificateIssue(): void {
  void queryClient.invalidateQueries({ queryKey: logsQueryKeys.privacyAccessAll() })
}
