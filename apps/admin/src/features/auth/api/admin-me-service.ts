import { getJAKoreaHomepageAdminAPIMeSubset } from '@/shared/api/generated/me/me-api'
import type { AdminProfile } from '@/shared/api/generated/me/schemas/adminProfile'

/**
 * `/api/admin/me`는 운영·로컬 프록시 모두 CMS(JABACK)로 간다(`getApiBaseUrlForPath`, vite proxy).
 * JABACK `AdminMeResponse`는 권한을 `permissionCodes`, 계정 id를 `adminAccountId`로 준다.
 * 생성 타입(`AdminProfile`, 홈페이지 BE 형식)은 `permissions`·`adminId`라서 두 형식을 여기서 맞춘다.
 * 맞추지 않으면 권한이 비어 보여 Master 외 관리자의 홈페이지 편집·개인정보·로그 접근이 모두 막힌다.
 */
type AdminMeWireResponse = AdminProfile & {
  permissionCodes?: string[] | null
  adminAccountId?: number | null
}

export function normalizeAdminMeProfile(raw: AdminMeWireResponse | null | undefined): AdminProfile {
  const source = raw ?? {}
  const { permissionCodes, adminAccountId, ...profile } = source
  return {
    ...profile,
    adminId: profile.adminId ?? adminAccountId ?? undefined,
    permissions: profile.permissions ?? permissionCodes ?? [],
  }
}

export async function fetchAdminMeProfile(): Promise<AdminProfile> {
  const raw = (await getJAKoreaHomepageAdminAPIMeSubset().me()) as AdminMeWireResponse
  return normalizeAdminMeProfile(raw)
}
