import { mapAlimtalkTemplateListResponse } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { alimtalkTemplateParamsFromSearchParams } from '@/features/notifications/api/alimtalk-template-filter-params'
import { fetchNotificationTemplatesRemote } from '@/features/notifications/api/notifications-api-client'
import type { AlimtalkTemplateRow } from '@/features/notifications/model/alimtalk-template/types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertAlimtalkTemplatesRemoteReady(): void {
  if (!isRealApiModuleEnabled('notifications')) {
    throw new Error(
      '알림 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 notifications를 추가해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('알림톡 양식 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseAlimtalkTemplatesRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

export async function getAlimtalkTemplateList(
  searchParams: URLSearchParams
): Promise<AlimtalkTemplateRow[]> {
  assertAlimtalkTemplatesRemoteReady()
  const dto = await fetchNotificationTemplatesRemote(
    alimtalkTemplateParamsFromSearchParams(searchParams)
  )
  return mapAlimtalkTemplateListResponse(dto.items)
}
