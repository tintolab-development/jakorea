export type KakaoApprovalStatus = 'REGISTERED' | 'REQUESTED' | 'APPROVED' | 'REJECTED'

export type TemplateUsageStatus = 'WAITING' | 'NORMAL' | 'SUSPENDED' | 'DORMANT' | 'BLOCKED'

export type AlimtalkTemplateType = 'BASIC' | 'CHANNEL_ADD' | 'COMPLEX'

/** 알림 템플릿 원격 목록 매핑용 (카테고리 트리 화면과 별도) */
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

export const ALIMTALK_MESSAGE_TYPE_LABEL: Record<AlimtalkTemplateType, string> = {
  BASIC: '기본형',
  CHANNEL_ADD: '채널 추가형',
  COMPLEX: '복합형',
}

export const ALIMTALK_CHANNEL_ADD_GUIDE =
  '채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기'

export function isAlimtalkChannelAddMessageType(type: AlimtalkTemplateType): boolean {
  return type === 'CHANNEL_ADD' || type === 'COMPLEX'
}

export type KakaoAlimtalkTabKey = 'template' | 'send-history'

export const ALIMTALK_ROOT_CATEGORY_ID = 'root'

export type AlimtalkCategory = {
  id: string
  name: string
  parentId: string
}

export type AlimtalkEmphasisType = 'NONE'

export type AlimtalkLinkDestinations = {
  pc?: string
  mobile?: string
  android?: string
  ios?: string
}

export type AlimtalkTemplateButton = {
  typeLabel: string
  name: string
  variant: 'channel' | 'default'
  pluginId?: string
  destinations?: AlimtalkLinkDestinations
}

export type AlimtalkTemplateQuickLink = {
  typeLabel: string
  name: string
  destinations?: AlimtalkLinkDestinations
  businessFormId?: string
}

export type AlimtalkTemplateItem = {
  id: string
  name: string
  templateName: string
  categoryId: string
  registeredAt: string
  updatedAt: string
  senderProfile: string
  messageType: AlimtalkTemplateType
  emphasisType: AlimtalkEmphasisType
  isSecurityTemplate: boolean
  content: string
  extraInfo: string
  ctaLabel: string
  buttons: AlimtalkTemplateButton[]
  quickLinks: AlimtalkTemplateQuickLink[]
}

export type AlimtalkTemplatePendingFilters = {
  categoryName: string
  templateName: string
}

export type AlimtalkTreeSelection =
  | { kind: 'category'; id: string }
  | { kind: 'template'; id: string }
  | null
