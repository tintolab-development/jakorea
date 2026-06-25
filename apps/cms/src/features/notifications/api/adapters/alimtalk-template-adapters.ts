import type { NotificationTemplateResponse } from '@/shared/api/generated/notifications/schemas'
import type {
  AlimtalkTemplateRow,
  KakaoApprovalStatus,
  TemplateUsageStatus,
} from '@/features/notifications/model/alimtalk-template/types'

function mapKakaoApprovalStatus(item: NotificationTemplateResponse): KakaoApprovalStatus {
  if (item.providerTemplateCode?.trim()) return 'APPROVED'
  return 'REGISTERED'
}

function mapTemplateUsageStatus(useYn?: boolean): TemplateUsageStatus {
  if (useYn === false) return 'SUSPENDED'
  return 'NORMAL'
}

function mapAlimtalkTemplateRow(
  item: NotificationTemplateResponse,
  displayNo: number
): AlimtalkTemplateRow | null {
  if (item.templateId == null) return null

  const content = item.contentTemplate ?? ''

  return {
    id: String(item.templateId),
    displayNo,
    kakaoApprovalStatus: mapKakaoApprovalStatus(item),
    templateUsageStatus: mapTemplateUsageStatus(item.useYn),
    channelName: item.channelType === 'KAKAO' ? 'JA KOREA' : (item.channelType ?? '-'),
    templateType: 'BASIC',
    templateName: item.titleTemplate?.trim() || item.templateCode?.trim() || '-',
    templateContent: content,
    characterCount: content.length,
    registeredAt: item.createdAt ?? item.updatedAt ?? new Date().toISOString(),
  }
}

export function mapAlimtalkTemplateListResponse(
  items: NotificationTemplateResponse[] | undefined
): AlimtalkTemplateRow[] {
  const sorted = [...(items ?? [])].sort((a, b) => {
    const aTime = Date.parse(a.createdAt ?? a.updatedAt ?? '') || 0
    const bTime = Date.parse(b.createdAt ?? b.updatedAt ?? '') || 0
    return bTime - aTime
  })

  return sorted
    .map((item, index) => mapAlimtalkTemplateRow(item, sorted.length - index))
    .filter((row): row is AlimtalkTemplateRow => row != null)
}
