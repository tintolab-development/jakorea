/**
 * 클라이언트 다운로드 → POST /api/admin/logs/file-access/client 여부.
 *
 * 이력 화면(`GET .../file-access`)과 같은 조건: logs 실 API + 관리자 JWT.
 * 인증서 PDF는 이 경로를 쓰지 않고 `download-logs`만 사용한다.
 *
 * @see apps/cms/docs/api/client-file-access-log-backend-handoff.md
 */

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function shouldRecordFileAccessRemotely(): boolean {
  return isRealApiModuleEnabled('logs') && hasRemoteAdminJwt()
}
