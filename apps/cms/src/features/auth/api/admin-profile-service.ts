/**
 * 관리자 본인 프로필(연락처·이메일) 수정
 *
 * OpenAPI v9 기준 본인 프로필 PATCH/PUT 엔드포인트는 없음.
 * - 관련: POST /api/admin/auth/password/change (비밀번호만)
 * - 준비 시 이 파일에 remote fetcher 추가 후 `isRemoteAdminProfileApiAvailable()` 활성화
 */

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export type UpdateMyProfileInput = {
  phone?: string
  email: string
}

export class AdminProfileApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AdminProfileApiError'
    this.code = code
  }
}

/** 백엔드 본인 프로필 수정 API 공개 시 true로 전환 */
export function isRemoteAdminProfileApiAvailable(): boolean {
  return false
}

export function shouldAttemptRemoteProfileUpdate(): boolean {
  return (
    isRemoteAdminProfileApiAvailable() &&
    isRealApiModuleEnabled('adminAuth') &&
    hasRemoteAdminJwt()
  )
}

export async function updateMyProfile(input: UpdateMyProfileInput): Promise<UpdateMyProfileInput> {
  if (shouldAttemptRemoteProfileUpdate()) {
    throw new AdminProfileApiError(
      'NOT_IMPLEMENTED',
      '프로필 수정 API가 아직 연동되지 않았습니다.'
    )
  }

  await new Promise(resolve => setTimeout(resolve, 150))
  return {
    phone: input.phone?.trim() || undefined,
    email: input.email.trim(),
  }
}
