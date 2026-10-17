import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

/** Platform NICE — `VITE_API_SERVER` 등 백엔드가 있을 때만 실연동 (mock 미사용) */
export function isIdentityVerificationRemoteEnabled(): boolean {
  return isRemoteApiConfigured()
}
