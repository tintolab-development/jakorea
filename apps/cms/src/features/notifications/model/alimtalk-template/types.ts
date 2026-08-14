export type KakaoApprovalStatus = 'REGISTERED' | 'REQUESTED' | 'APPROVED' | 'REJECTED'

export type TemplateUsageStatus = 'WAITING' | 'NORMAL' | 'SUSPENDED' | 'DORMANT' | 'BLOCKED'

export type AlimtalkTemplateType = 'BASIC'

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

export type KakaoAlimtalkTabKey = 'template' | 'send-history'

export const ALIMTALK_ROOT_CATEGORY_ID = 'root'

export type AlimtalkCategory = {
  id: string
  name: string
  parentId: string
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
  emphasisType: 'NONE'
  content: string
  ctaLabel: string
}

export type AlimtalkTemplatePendingFilters = {
  categoryName: string
  templateName: string
}

export type AlimtalkTreeSelection =
  | { kind: 'category'; id: string }
  | { kind: 'template'; id: string }
  | null
