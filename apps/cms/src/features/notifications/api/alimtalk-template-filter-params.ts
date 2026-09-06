/**
 * 카카오 알림톡 양식 목록 URL 쿼리 → 백엔드 params 맵
 */

import { ALIMTALK_API_CHANNEL_TYPE } from '@/features/notifications/api/adapters/alimtalk-template-adapters'

export function alimtalkTemplateParamsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {
    channelType: ALIMTALK_API_CHANNEL_TYPE,
  }

  const approvalStatus = searchParams.get('kat_appr')?.trim()
  if (approvalStatus && approvalStatus !== 'ALL') {
    params.kakaoApprovalStatus = approvalStatus
    params.approvalStatus = approvalStatus
  }

  const usageStatus = searchParams.get('kat_usage')?.trim()
  if (usageStatus && usageStatus !== 'ALL') {
    params.templateUsageStatus = usageStatus
  }

  const channelName = searchParams.get('kat_ch')?.trim()
  if (channelName) params.channelName = channelName

  const templateName = searchParams.get('kat_name')?.trim()
  if (templateName) params.templateName = templateName

  const from = searchParams.get('kat_from')?.trim()
  const to = searchParams.get('kat_to')?.trim()
  if (from) params.from = from
  if (to) params.to = to

  return params
}
