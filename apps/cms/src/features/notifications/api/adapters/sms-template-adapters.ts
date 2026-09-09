import type {
  CategoryTreeResponse,
  EmailAttachmentItem,
  NotificationTemplatePreviewResponse,
  NotificationTemplateResponse,
  TreeNodeResponse,
} from '@/shared/api/generated/notifications/schemas'
import { requireMutationCategoryTree } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { SMS_API_CHANNEL_TYPE, type SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'
import {
  SMS_ROOT_CATEGORY_ID,
  type SmsCategory,
  type SmsTemplateAttachment,
  type SmsTemplateItem,
} from '@/features/notifications/model/sms-template/types'

export { SMS_API_CHANNEL_TYPE }

export type SmsCategoryTreeMapped = {
  categories: SmsCategory[]
  templates: SmsTemplateItem[]
}

function resolvePreviewSmsMessageType(
  preview: NotificationTemplatePreviewResponse | null | undefined,
  fallback?: SmsTemplateItem | null
): SmsMessageType {
  const raw = readRecordString(preview, ['smsMessageType', 'messageType'])
  if (!raw) return fallback?.messageType ?? 'SMS'
  return mapSmsMessageType(raw)
}

function mapSmsMessageType(raw?: string | null): SmsMessageType {
  const normalized = (raw ?? '').trim().toUpperCase()
  if (normalized === 'MMS') return 'MMS'
  if (normalized === 'LMS') return 'LMS'
  return 'SMS'
}

function mapSmsAttachments(
  items: EmailAttachmentItem[] | undefined
): SmsTemplateAttachment[] {
  const result: SmsTemplateAttachment[] = []
  for (const item of items ?? []) {
    if (item.attachmentId == null) continue
    result.push({
      attachmentId: item.attachmentId,
      fileObjectId: item.fileObjectId,
      fileName: item.fileName?.trim() || `첨부파일-${item.attachmentId}`,
      byteSize: item.byteSize,
      downloadHint: item.downloadHint,
    })
  }
  return result
}

function emptySmsTemplateItem(id: string): SmsTemplateItem {
  return {
    id,
    name: '-',
    templateName: '-',
    categoryId: SMS_ROOT_CATEGORY_ID,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    senderPhone: '',
    messageType: 'SMS',
    subject: '',
    bodyText: '',
    attachmentFileNames: [],
    attachments: [],
  }
}

function readRecordString(
  value:
    | NotificationTemplateResponse
    | NotificationTemplatePreviewResponse
    | TreeNodeResponse
    | null
    | undefined,
  keys: string[]
): string {
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  for (const key of keys) {
    const item = record[key]
    if (typeof item === 'string' && item.trim()) return item.trim()
  }
  return ''
}

export function mapSmsNotificationTemplateToItem(
  item: NotificationTemplateResponse | null | undefined
): SmsTemplateItem | null {
  if (item?.templateId == null) return null
  const id = String(item.templateId)
  const displayName =
    item.displayName?.trim() || item.templateCode?.trim() || item.titleTemplate?.trim() || '-'
  const attachments = mapSmsAttachments(item.attachments)
  const attachmentFileNames =
    attachments.length > 0
      ? attachments.map(row => row.fileName)
      : (item.emailAttachmentIds ?? []).map(String)

  return {
    ...emptySmsTemplateItem(id),
    id,
    name: displayName,
    templateName: displayName,
    categoryId: item.categoryId != null ? String(item.categoryId) : SMS_ROOT_CATEGORY_ID,
    categoryName: item.categoryName?.trim() || undefined,
    registeredAt: item.createdAt ?? item.updatedAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
    senderPhone:
      item.providerSenderPhoneNumber?.trim() ||
      readRecordString(item, ['senderPhone', 'senderNumber']),
    messageType: mapSmsMessageType(item.smsMessageType),
    subject: item.titleTemplate ?? '',
    bodyText: item.contentTemplate ?? '',
    attachmentFileNames,
    attachments,
  }
}

export function mapSmsNotificationTemplatePreviewToItem(
  preview: NotificationTemplatePreviewResponse | null | undefined,
  fallback?: SmsTemplateItem | null
): SmsTemplateItem | null {
  if (preview?.templateId == null && !fallback) return null
  const id = preview?.templateId != null ? String(preview.templateId) : fallback!.id
  const base = fallback ?? emptySmsTemplateItem(id)
  const displayName = preview?.displayName?.trim() || base.templateName || base.name
  const attachments =
    preview?.attachments != null ? mapSmsAttachments(preview.attachments) : base.attachments ?? []
  const attachmentFileNames =
    attachments.length > 0 ? attachments.map(row => row.fileName) : base.attachmentFileNames

  return {
    ...base,
    id,
    name: displayName,
    templateName: displayName,
    senderPhone:
      readRecordString(preview, ['providerSenderPhoneNumber', 'senderPhone', 'senderNumber']) ||
      base.senderPhone,
    messageType: resolvePreviewSmsMessageType(preview, fallback),
    subject: preview?.titleTemplate ?? base.subject,
    bodyText: preview?.contentTemplate ?? base.bodyText,
    attachmentFileNames,
    attachments,
  }
}

function walkSmsTreeNode(
  node: TreeNodeResponse,
  parentCategoryId: string,
  categories: SmsCategory[],
  templates: SmsTemplateItem[]
): void {
  const nodeType = (node.nodeType ?? '').trim().toUpperCase()
  const childCount = node.children?.length ?? 0
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
      node.categoryId != null ? String(node.categoryId) : parentCategoryId || SMS_ROOT_CATEGORY_ID
    templates.push({
      ...emptySmsTemplateItem(String(node.id)),
      id: String(node.id),
      name: displayName,
      templateName: displayName,
      categoryId,
      senderPhone: readRecordString(node, [
        'providerSenderPhoneNumber',
        'senderPhone',
        'senderNumber',
      ]),
      messageType: mapSmsMessageType(readRecordString(node, ['smsMessageType', 'messageType'])),
      attachmentFileNames: (node.attachmentFileNames ?? [])
        .map(name => name.trim())
        .filter(Boolean),
    })
    return
  }

  const categoryId =
    node.id != null ? String(node.id) : `unclassified-${parentCategoryId || 'root'}`
  categories.push({
    id: categoryId,
    name: node.name?.trim() || '미분류',
    parentId: parentCategoryId || SMS_ROOT_CATEGORY_ID,
    isVirtualUnclassified: node.id == null,
  })

  for (const child of node.children ?? []) {
    walkSmsTreeNode(child, categoryId, categories, templates)
  }
}

export function mapSmsCategoryTreeResponse(
  response: CategoryTreeResponse | null | undefined
): SmsCategoryTreeMapped {
  const categories: SmsCategory[] = []
  const templates: SmsTemplateItem[] = []

  for (const root of response?.roots ?? []) {
    walkSmsTreeNode(root, SMS_ROOT_CATEGORY_ID, categories, templates)
  }

  const categoryIds = new Set(categories.map(category => category.id))
  categoryIds.add(SMS_ROOT_CATEGORY_ID)
  for (const template of templates) {
    if (!categoryIds.has(template.categoryId)) {
      template.categoryId = SMS_ROOT_CATEGORY_ID
    }
  }

  return { categories, templates }
}

export function mapSmsMutationResponseToCategoryTree(payload: unknown): SmsCategoryTreeMapped {
  return mapSmsCategoryTreeResponse(requireMutationCategoryTree(payload))
}
