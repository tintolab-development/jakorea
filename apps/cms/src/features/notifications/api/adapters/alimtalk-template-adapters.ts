import type {
  CategoryTreeResponse,
  NotificationTemplatePreviewResponse,
  NotificationTemplateResponse,
  TreeNodeResponse,
} from '@/shared/api/generated/notifications/schemas'
import {
  ALIMTALK_ROOT_CATEGORY_ID,
  NHN_CLOUD_ALIMTALK_TEMPLATE_CONSOLE_URL,
  type AlimtalkCategory,
  type AlimtalkEmphasisType,
  type AlimtalkItemListEntry,
  type AlimtalkLinkDestinations,
  type AlimtalkTemplateButton,
  type AlimtalkTemplateItem,
  type AlimtalkTemplateQuickLink,
  type AlimtalkTemplateRow,
  type AlimtalkTemplateType,
  type KakaoApprovalStatus,
  type TemplateUsageStatus,
} from '@/features/notifications/model/alimtalk-template/types'

export const ALIMTALK_API_CHANNEL_TYPE = 'ALIMTALK'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown): boolean {
  return value === true
}

function mapKakaoApprovalStatus(raw?: string | null): KakaoApprovalStatus {
  const normalized = (raw ?? '').trim().toUpperCase()
  if (!normalized || normalized === 'UNKNOWN') return 'UNKNOWN'
  if (normalized === 'APPROVED') return 'APPROVED'
  if (normalized === 'REQUESTED' || normalized === 'PENDING' || normalized === 'INSPECTING') {
    return 'REQUESTED'
  }
  if (normalized === 'REJECTED' || normalized === 'FAIL') return 'REJECTED'
  if (normalized === 'REGISTERED') return 'REGISTERED'
  return 'UNKNOWN'
}

function mapTemplateUsageStatus(useYn?: boolean): TemplateUsageStatus {
  if (useYn === false) return 'SUSPENDED'
  return 'NORMAL'
}

export function mapAlimtalkEmphasisType(raw?: string | null): AlimtalkEmphasisType {
  const normalized = (raw ?? '').trim().toUpperCase()
  if (normalized === 'EMPHASIS' || normalized === 'TEXT') return 'TEXT'
  if (normalized === 'IMAGE') return 'IMAGE'
  if (normalized === 'ITEM_LIST' || normalized === 'ITEMLIST') return 'ITEM_LIST'
  return 'NONE'
}

/** UI `TEXT` → BE `EMPHASIS` (발송/동기화 payload용) */
export function toBeAlimtalkEmphasisType(type: AlimtalkEmphasisType): string {
  if (type === 'TEXT') return 'EMPHASIS'
  return type
}

export function mapAlimtalkMessageType(raw?: string | null): AlimtalkTemplateType {
  const normalized = (raw ?? '').trim().toUpperCase()
  if (normalized === 'CHANNEL_ADD' || normalized === 'AD') return 'CHANNEL_ADD'
  if (normalized === 'EXTRA_INFO' || normalized === 'EX') return 'EXTRA_INFO'
  if (normalized === 'COMPLEX' || normalized === 'MI') return 'COMPLEX'
  return 'BASIC'
}

function mapLinkDestinations(raw: unknown): AlimtalkLinkDestinations | undefined {
  const record = asRecord(raw)
  if (!record) return undefined
  const destinations: AlimtalkLinkDestinations = {
    pc: asString(record.pc || record.linkPc || record.urlPc),
    mobile: asString(record.mobile || record.linkMo || record.link || record.urlMobile),
    android: asString(record.android || record.schemeAndroid || record.linkAnd),
    ios: asString(record.ios || record.schemeIos || record.linkIos),
  }
  if (!destinations.pc && !destinations.mobile && !destinations.android && !destinations.ios) {
    return undefined
  }
  return destinations
}

const NHN_BUTTON_TYPE_LABEL: Record<string, string> = {
  WL: '웹 링크',
  AL: '앱 링크',
  DS: '배송 조회',
  BK: '봇 키워드',
  MD: '메시지 전달',
  BC: '상담톡 전환',
  BT: '봇 전환',
  AC: '채널 추가',
  P1: '이미지 보안 전송 플러그인',
  P2: '개인정보 이용 플러그인',
  BF: '비즈니스 폼',
}

function mapButtons(raw: unknown): AlimtalkTemplateButton[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    const record = asRecord(item) ?? {}
    const typeCode = asString(record.type || record.buttonType).toUpperCase()
    const typeLabel =
      asString(record.typeLabel) ||
      NHN_BUTTON_TYPE_LABEL[typeCode] ||
      typeCode ||
      '버튼'
    const name = asString(record.name || record.buttonName || record.label, typeLabel)
    const isChannel =
      typeLabel.includes('채널') ||
      typeCode === 'AC' ||
      asBoolean(record.channel)
    return {
      typeLabel,
      name,
      variant: isChannel ? 'channel' : 'default',
      pluginId: asString(record.pluginId) || undefined,
      destinations: mapLinkDestinations(record.destinations ?? record),
    }
  })
}

function mapQuickLinks(raw: unknown): AlimtalkTemplateQuickLink[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    const record = asRecord(item) ?? {}
    const typeCode = asString(record.type || record.buttonType).toUpperCase()
    return {
      typeLabel:
        asString(record.typeLabel) || NHN_BUTTON_TYPE_LABEL[typeCode] || typeCode || '바로연결',
      name: asString(record.name || record.label, '바로연결'),
      destinations: mapLinkDestinations(record.destinations ?? record),
      businessFormId: asString(record.businessFormId || record.bizFormId) || undefined,
    }
  })
}

function mapItemList(raw: unknown): AlimtalkItemListEntry[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  return raw.map(item => {
    const record = asRecord(item) ?? {}
    return {
      name: asString(record.name || record.title || record.key),
      content: asString(record.content || record.value || record.description),
    }
  })
}

function mapItemSummary(raw: unknown): AlimtalkItemListEntry | undefined {
  const record = asRecord(raw)
  if (!record) return undefined
  const name = asString(record.name || record.title)
  const content = asString(record.content || record.value)
  if (!name && !content) return undefined
  return { name, content }
}

/**
 * BE/JDBC jsonb 래퍼 대응:
 * `{ "type": "jsonb", "value": "<json-string>", "null": false }`
 * 또는 이미 파싱된 object / JSON string.
 */
export function normalizeAlimtalkMetadata(metadata: unknown): Record<string, unknown> | null {
  if (metadata == null) return null

  if (typeof metadata === 'string') {
    const trimmed = metadata.trim()
    if (!trimmed || trimmed === 'null') return null
    try {
      return normalizeAlimtalkMetadata(JSON.parse(trimmed))
    } catch {
      return null
    }
  }

  const record = asRecord(metadata)
  if (!record) return null

  const type = asString(record.type).toLowerCase()
  if ((type === 'jsonb' || type === 'json') && 'value' in record) {
    if (record.null === true || record.value == null) return null
    return normalizeAlimtalkMetadata(record.value)
  }

  // 이미 buttons/quickReplies 등을 가진 plain object
  return record
}

export function mapAlimtalkMetadataFields(metadata: unknown): Partial<AlimtalkTemplateItem> {
  const record = normalizeAlimtalkMetadata(metadata)
  if (!record) return {}

  const templateItem = asRecord(record.templateItem)
  const highlight = asRecord(record.templateItemHighlight)

  const itemList =
    mapItemList(record.itemList || record.items || record.itemListEntries) ??
    mapItemList(templateItem?.list || templateItem?.itemList)

  return {
    emphasisTitle:
      asString(
        record.emphasisTitle ||
          record.title ||
          record.mainTitle ||
          highlight?.title ||
          highlight?.description
      ) || undefined,
    emphasisSubtitle:
      asString(record.emphasisSubtitle || record.subtitle || record.subTitle) || undefined,
    imageUrl: asString(record.imageUrl || record.image || record.imageLink) || undefined,
    imageFileName: asString(record.imageFileName) || undefined,
    templateHeader: asString(record.templateHeader || record.header) || undefined,
    itemTitle: asString(record.itemTitle || templateItem?.title) || undefined,
    itemDescription: asString(record.itemDescription || templateItem?.description) || undefined,
    itemImageUrl: asString(record.itemImageUrl || templateItem?.imageUrl) || undefined,
    itemImageFileName: asString(record.itemImageFileName) || undefined,
    itemList,
    itemSummary: mapItemSummary(record.itemSummary || templateItem?.summary),
    extraInfo: asString(record.extraInfo || record.additionalContent),
    buttons: mapButtons(record.buttons),
    quickLinks: mapQuickLinks(record.quickReplies || record.quickLinks),
  }
}

function emptyTemplateItem(id: string): AlimtalkTemplateItem {
  return {
    id,
    name: '-',
    templateName: '-',
    categoryId: ALIMTALK_ROOT_CATEGORY_ID,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    senderProfile: '-',
    messageType: 'BASIC',
    emphasisType: 'NONE',
    isSecurityTemplate: false,
    content: '',
    extraInfo: '',
    ctaLabel: '',
    buttons: [],
    quickLinks: [],
  }
}

export function mapNotificationTemplateToItem(
  item: NotificationTemplateResponse | null | undefined
): AlimtalkTemplateItem | null {
  if (item?.templateId == null) return null
  const id = String(item.templateId)
  const meta = mapAlimtalkMetadataFields(item.alimtalkMetadata)
  const displayName =
    item.displayName?.trim() || item.titleTemplate?.trim() || item.templateCode?.trim() || '-'

  return {
    ...emptyTemplateItem(id),
    ...meta,
    id,
    name: displayName,
    templateName: displayName,
    categoryId:
      item.categoryId != null ? String(item.categoryId) : ALIMTALK_ROOT_CATEGORY_ID,
    registeredAt: item.createdAt ?? item.updatedAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
    senderProfile: item.senderProfileDisplayName?.trim() || item.providerSenderKey || '-',
    messageType: mapAlimtalkMessageType(item.alimtalkMessageType),
    emphasisType: mapAlimtalkEmphasisType(item.alimtalkEmphasisType),
    isSecurityTemplate: item.alimtalkSecurityYn === true,
    content: item.contentTemplate ?? '',
    extraInfo: meta.extraInfo ?? '',
    buttons: meta.buttons ?? [],
    quickLinks: meta.quickLinks ?? [],
    approvalStatus: mapKakaoApprovalStatus(item.approvalStatus),
    senderKey: item.providerSenderKey,
    nhnConsoleTemplateUrl: undefined,
  }
}

export function mapNotificationTemplatePreviewToItem(
  preview: NotificationTemplatePreviewResponse | null | undefined,
  fallback?: AlimtalkTemplateItem | null
): AlimtalkTemplateItem | null {
  if (preview?.templateId == null && !fallback) return null
  const id = preview?.templateId != null ? String(preview.templateId) : fallback!.id
  const base = fallback ?? emptyTemplateItem(id)
  const meta = mapAlimtalkMetadataFields(preview?.alimtalkMetadata)
  const displayName =
    preview?.displayName?.trim() || base.templateName || base.name

  return {
    ...base,
    ...meta,
    id,
    name: displayName,
    templateName: displayName,
    senderProfile: preview?.senderProfileDisplayName?.trim() || base.senderProfile,
    messageType: preview?.alimtalkMessageType
      ? mapAlimtalkMessageType(preview.alimtalkMessageType)
      : base.messageType,
    emphasisType: preview?.alimtalkEmphasisType
      ? mapAlimtalkEmphasisType(preview.alimtalkEmphasisType)
      : base.emphasisType,
    isSecurityTemplate:
      preview?.alimtalkSecurityYn != null
        ? preview.alimtalkSecurityYn === true
        : base.isSecurityTemplate,
    content: preview?.contentTemplate ?? base.content,
    extraInfo: meta.extraInfo ?? base.extraInfo,
    buttons: meta.buttons ?? base.buttons,
    quickLinks: meta.quickLinks ?? base.quickLinks,
    nhnConsoleTemplateUrl:
      preview?.nhnConsoleTemplateUrl?.trim() ||
      base.nhnConsoleTemplateUrl ||
      NHN_CLOUD_ALIMTALK_TEMPLATE_CONSOLE_URL,
  }
}

function mapAlimtalkTemplateRow(
  item: NotificationTemplateResponse,
  displayNo: number
): AlimtalkTemplateRow | null {
  if (item.templateId == null) return null
  const content = item.contentTemplate ?? ''
  const name =
    item.displayName?.trim() || item.titleTemplate?.trim() || item.templateCode?.trim() || '-'

  return {
    id: String(item.templateId),
    displayNo,
    kakaoApprovalStatus: mapKakaoApprovalStatus(item.approvalStatus),
    templateUsageStatus: mapTemplateUsageStatus(item.useYn),
    channelName: item.senderProfileDisplayName?.trim() || item.channelType || '-',
    templateType: mapAlimtalkMessageType(item.alimtalkMessageType),
    templateName: name,
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

export type AlimtalkCategoryTreeMapped = {
  categories: AlimtalkCategory[]
  templates: AlimtalkTemplateItem[]
}

function walkTreeNode(
  node: TreeNodeResponse,
  parentCategoryId: string,
  categories: AlimtalkCategory[],
  templates: AlimtalkTemplateItem[]
): void {
  const nodeType = (node.nodeType ?? '').trim().toUpperCase()
  const childCount = node.children?.length ?? 0
  // nodeType 누락 시 children 유무로 구분 — categoryId만으로 TEMPLATE 판정하면
  // 부모 카테고리(parent categoryId)가 템플릿으로 잘못 분류되어 subtree가 사라짐
  const isCategory =
    nodeType === 'CATEGORY' ||
    (nodeType !== 'TEMPLATE' && (childCount > 0 || (node.categoryId == null && nodeType === '')))
  const isTemplate =
    nodeType === 'TEMPLATE' ||
    (!isCategory && node.id != null && (node.displayName != null || node.categoryId != null))

  if (isTemplate && !isCategory) {
    if (node.id == null) return
    const displayName = node.displayName?.trim() || node.name?.trim() || '-'
    const categoryId =
      node.categoryId != null
        ? String(node.categoryId)
        : parentCategoryId || ALIMTALK_ROOT_CATEGORY_ID
    templates.push({
      ...emptyTemplateItem(String(node.id)),
      id: String(node.id),
      name: displayName,
      templateName: displayName,
      categoryId,
    })
    return
  }

  // CATEGORY (including unclassified with null id)
  const categoryId =
    node.id != null ? String(node.id) : `unclassified-${parentCategoryId || 'root'}`
  categories.push({
    id: categoryId,
    name: node.name?.trim() || '미분류',
    parentId: parentCategoryId || ALIMTALK_ROOT_CATEGORY_ID,
    isVirtualUnclassified: node.id == null,
  })

  for (const child of node.children ?? []) {
    walkTreeNode(child, categoryId, categories, templates)
  }
}

export function mapCategoryTreeResponse(
  response: CategoryTreeResponse | null | undefined
): AlimtalkCategoryTreeMapped {
  const categories: AlimtalkCategory[] = []
  const templates: AlimtalkTemplateItem[] = []

  for (const root of response?.roots ?? []) {
    walkTreeNode(root, ALIMTALK_ROOT_CATEGORY_ID, categories, templates)
  }

  return { categories, templates }
}

/**
 * mutation 성공 payload에서 tree 추출.
 * unwrap 전후 모두: `payload.tree` 또는 `payload.data.tree`
 */
export function requireMutationCategoryTree(
  payload: unknown
): CategoryTreeResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('MISSING_TREE')
  }
  const record = payload as Record<string, unknown>
  const direct = record.tree
  if (direct && typeof direct === 'object') {
    return direct as CategoryTreeResponse
  }
  const nested = record.data
  if (nested && typeof nested === 'object') {
    const tree = (nested as Record<string, unknown>).tree
    if (tree && typeof tree === 'object') {
      return tree as CategoryTreeResponse
    }
  }
  throw new Error('MISSING_TREE')
}

export function mapMutationResponseToCategoryTree(
  payload: unknown
): AlimtalkCategoryTreeMapped {
  return mapCategoryTreeResponse(requireMutationCategoryTree(payload))
}

export function resolveNhnConsoleUrl(template: AlimtalkTemplateItem | null | undefined): string {
  return (
    template?.nhnConsoleTemplateUrl?.trim() || NHN_CLOUD_ALIMTALK_TEMPLATE_CONSOLE_URL
  )
}

export function isAlimtalkTemplateApproved(
  template: Pick<AlimtalkTemplateItem, 'approvalStatus'> | null | undefined
): boolean {
  return template?.approvalStatus === 'APPROVED'
}
