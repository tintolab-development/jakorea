import type { Dayjs } from 'dayjs'

export type KakaoApprovalStatus = 'REGISTERED' | 'REQUESTED' | 'APPROVED' | 'REJECTED'

export type TemplateUsageStatus = 'WAITING' | 'NORMAL' | 'SUSPENDED' | 'DORMANT' | 'BLOCKED'

export type AlimtalkTemplateType = 'BASIC'

export type AlimtalkTemplateRow = {
  id: string
  displayNo: number
  kakaoApprovalStatus: KakaoApprovalStatus
  templateUsageStatus: TemplateUsageStatus
  channelName: string
  templateType: AlimtalkTemplateType
  templateName: string
  templateContent: string
  characterCount: number
  registeredAt: string
}

export type AlimtalkTemplatePendingFilters = {
  kakaoApprovalStatus: KakaoApprovalStatus | 'ALL'
  templateUsageStatus: TemplateUsageStatus | 'ALL'
  channelName: string
  templateName: string
  dateRange: [Dayjs | null, Dayjs | null] | null
}

export type AlimtalkTemplateTableContext = Record<string, never>

export type KakaoAlimtalkTabKey = 'alimtalk-template' | 'brand-template' | 'scheduled' | 'results'
