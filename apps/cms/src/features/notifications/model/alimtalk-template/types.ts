export type KakaoApprovalStatus =
  | 'REGISTERED'
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  /** NHN 공용·상세 미동기화 등 */
  | 'UNKNOWN'

export type TemplateUsageStatus = 'WAITING' | 'NORMAL' | 'SUSPENDED' | 'DORMANT' | 'BLOCKED'

export type AlimtalkTemplateType = 'BASIC' | 'CHANNEL_ADD' | 'EXTRA_INFO' | 'COMPLEX'

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
  EXTRA_INFO: '부가 정보형',
  COMPLEX: '복합형',
}

export const ALIMTALK_CHANNEL_ADD_GUIDE =
  '채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기'

/** NHN Cloud Notification Hub 알림톡 템플릿 콘솔 (기획·시안 링크) */
export const NHN_CLOUD_ALIMTALK_TEMPLATE_CONSOLE_URL =
  'https://console.nhncloud.com/project/eSpBZ77a/notification/notification-hub#template' as const

export function isAlimtalkChannelAddMessageType(type: AlimtalkTemplateType): boolean {
  return type === 'CHANNEL_ADD' || type === 'COMPLEX'
}

/** 부가 정보 항목 노출: 부가 정보형 · 복합형 */
export function isAlimtalkExtraInfoMessageType(type: AlimtalkTemplateType): boolean {
  return type === 'EXTRA_INFO' || type === 'COMPLEX'
}

export type KakaoAlimtalkTabKey = 'template' | 'send-history'

export const ALIMTALK_ROOT_CATEGORY_ID = 'root'

export type AlimtalkCategory = {
  id: string
  name: string
  parentId: string
  /** BE CATEGORY id null(미분류) — 이름 변경·삭제 비활성 */
  isVirtualUnclassified?: boolean
}

export type AlimtalkEmphasisType = 'NONE' | 'TEXT' | 'IMAGE' | 'ITEM_LIST'

export const ALIMTALK_EMPHASIS_TYPE_LABEL: Record<AlimtalkEmphasisType, string> = {
  NONE: '선택 안 함',
  TEXT: '강조 표기형',
  IMAGE: '이미지형',
  ITEM_LIST: '아이템 리스트형',
}

export type AlimtalkItemListEntry = {
  name: string
  content: string
}

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
  emphasisTitle?: string
  emphasisSubtitle?: string
  imageUrl?: string
  imageFileName?: string
  templateHeader?: string
  itemTitle?: string
  itemDescription?: string
  itemImageUrl?: string
  itemImageFileName?: string
  itemList?: AlimtalkItemListEntry[]
  itemSummary?: AlimtalkItemListEntry
  isSecurityTemplate: boolean
  content: string
  extraInfo: string
  ctaLabel: string
  buttons: AlimtalkTemplateButton[]
  quickLinks: AlimtalkTemplateQuickLink[]
  /** BE approvalStatus — 발송 시 APPROVED만 허용 */
  approvalStatus?: KakaoApprovalStatus
  senderKey?: string
  nhnConsoleTemplateUrl?: string
}

export type AlimtalkTemplatePendingFilters = {
  categoryName: string
  templateName: string
}

export type AlimtalkTreeSelection =
  | { kind: 'category'; id: string }
  | { kind: 'template'; id: string }
  | null
