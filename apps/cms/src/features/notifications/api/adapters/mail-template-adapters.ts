import type {
  CategoryTreeResponse,
  EmailAttachmentItem,
  NotificationTemplatePreviewResponse,
  NotificationTemplateResponse,
  TreeNodeResponse,
} from '@/shared/api/generated/notifications/schemas'
import { requireMutationCategoryTree } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { MAIL_API_CHANNEL_TYPE } from '@/features/notifications/api/adapters/mail-channel'
import {
  MAIL_ROOT_CATEGORY_ID,
  type MailCategory,
  type MailTemplateAttachment,
  type MailTemplateItem,
} from '@/features/notifications/model/mail-template/types'

export { MAIL_API_CHANNEL_TYPE }

export const MAIL_EMAIL_TEMPLATE_LANGUAGE = 'PLAIN_TEXT'

export type MailCategoryTreeMapped = {
  categories: MailCategory[]
  templates: MailTemplateItem[]
}

export function parseMailSenderDisplay(display?: string | null): {
  senderName: string
  senderEmail: string
} {
  const trimmed = (display ?? '').trim()
  if (!trimmed) return { senderName: '', senderEmail: '' }
  const match = /^(.+?)\s*<([^>]+)>$/.exec(trimmed)
  if (match) {
    return { senderName: match[1]!.trim(), senderEmail: match[2]!.trim() }
  }
  if (trimmed.includes('@')) return { senderName: '', senderEmail: trimmed }
  return { senderName: trimmed, senderEmail: '' }
}

export function mapEmailAttachments(
  items: EmailAttachmentItem[] | undefined
): MailTemplateAttachment[] {
  const result: MailTemplateAttachment[] = []
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

function attachmentSizesFromList(
  attachments: MailTemplateAttachment[]
): Record<string, number> | undefined {
  const sizes: Record<string, number> = {}
  for (const item of attachments) {
    if (item.byteSize != null && Number.isFinite(item.byteSize)) {
      sizes[item.fileName] = item.byteSize
    }
  }
  return Object.keys(sizes).length > 0 ? sizes : undefined
}

function emptyMailTemplateItem(id: string): MailTemplateItem {
  return {
    id,
    name: '-',
    templateName: '-',
    categoryId: MAIL_ROOT_CATEGORY_ID,
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    senderName: '',
    senderEmail: '',
    subject: '',
    bodyHtml: '',
    attachmentFileNames: [],
    attachments: [],
  }
}

export function mapMailNotificationTemplateToItem(
  item: NotificationTemplateResponse | null | undefined
): MailTemplateItem | null {
  if (item?.templateId == null) return null
  const id = String(item.templateId)
  const displayName =
    item.displayName?.trim() || item.titleTemplate?.trim() || item.templateCode?.trim() || '-'
  const senderDisplay = item.senderDisplay?.trim() || undefined
  const parsed = parseMailSenderDisplay(
    senderDisplay ||
      (item.senderProfileDisplayName || item.providerSenderEmailAddress
        ? `${item.senderProfileDisplayName ?? ''} <${item.providerSenderEmailAddress ?? ''}>`
        : '')
  )
  const attachments = mapEmailAttachments(item.attachments)
  const attachmentFileNames =
    attachments.length > 0
      ? attachments.map(row => row.fileName)
      : (item.emailAttachmentIds ?? []).map(String)

  return {
    ...emptyMailTemplateItem(id),
    id,
    name: displayName,
    templateName: displayName,
    categoryId: item.categoryId != null ? String(item.categoryId) : MAIL_ROOT_CATEGORY_ID,
    categoryName: item.categoryName?.trim() || undefined,
    registeredAt: item.createdAt ?? item.updatedAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
    senderName: parsed.senderName || item.senderProfileDisplayName?.trim() || '',
    senderEmail: parsed.senderEmail || item.providerSenderEmailAddress?.trim() || '',
    senderDisplay,
    subject: item.titleTemplate ?? '',
    bodyHtml: item.contentTemplate ?? '',
    attachmentFileNames,
    attachments,
    attachmentSizes: attachmentSizesFromList(attachments),
  }
}

export function mapMailNotificationTemplatePreviewToItem(
  preview: NotificationTemplatePreviewResponse | null | undefined,
  fallback?: MailTemplateItem | null
): MailTemplateItem | null {
  if (preview?.templateId == null && !fallback) return null
  const id = preview?.templateId != null ? String(preview.templateId) : fallback!.id
  const base = fallback ?? emptyMailTemplateItem(id)
  const displayName = preview?.displayName?.trim() || base.templateName || base.name
  const senderDisplay = preview?.senderDisplay?.trim() || base.senderDisplay
  const parsed = parseMailSenderDisplay(
    senderDisplay ||
      (preview?.senderProfileDisplayName || preview?.providerSenderEmailAddress
        ? `${preview?.senderProfileDisplayName ?? ''} <${preview?.providerSenderEmailAddress ?? ''}>`
        : '')
  )
  const attachments =
    preview?.attachments != null ? mapEmailAttachments(preview.attachments) : base.attachments ?? []
  const attachmentFileNames =
    attachments.length > 0 ? attachments.map(row => row.fileName) : base.attachmentFileNames

  return {
    ...base,
    id,
    name: displayName,
    templateName: displayName,
    senderName:
      parsed.senderName ||
      preview?.senderProfileDisplayName?.trim() ||
      base.senderName,
    senderEmail:
      parsed.senderEmail ||
      preview?.providerSenderEmailAddress?.trim() ||
      base.senderEmail,
    senderDisplay,
    subject: preview?.titleTemplate ?? base.subject,
    bodyHtml: preview?.contentTemplate ?? base.bodyHtml,
    attachmentFileNames,
    attachments,
    attachmentSizes: attachmentSizesFromList(attachments) ?? base.attachmentSizes,
  }
}

function walkMailTreeNode(
  node: TreeNodeResponse,
  parentCategoryId: string,
  categories: MailCategory[],
  templates: MailTemplateItem[]
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
      node.categoryId != null
        ? String(node.categoryId)
        : parentCategoryId || MAIL_ROOT_CATEGORY_ID
    const senderDisplay = node.senderDisplay?.trim() || undefined
    const parsed = parseMailSenderDisplay(senderDisplay)
    const attachmentFileNames = (node.attachmentFileNames ?? [])
      .map(name => name.trim())
      .filter(Boolean)
    templates.push({
      ...emptyMailTemplateItem(String(node.id)),
      id: String(node.id),
      name: displayName,
      templateName: displayName,
      categoryId,
      senderName: parsed.senderName,
      senderEmail: parsed.senderEmail,
      senderDisplay,
      attachmentFileNames,
    })
    return
  }

  const categoryId =
    node.id != null ? String(node.id) : `unclassified-${parentCategoryId || 'root'}`
  categories.push({
    id: categoryId,
    name: node.name?.trim() || '미분류',
    parentId: parentCategoryId || MAIL_ROOT_CATEGORY_ID,
    isVirtualUnclassified: node.id == null,
  })

  for (const child of node.children ?? []) {
    walkMailTreeNode(child, categoryId, categories, templates)
  }
}

export function mapMailCategoryTreeResponse(
  response: CategoryTreeResponse | null | undefined
): MailCategoryTreeMapped {
  const categories: MailCategory[] = []
  const templates: MailTemplateItem[] = []

  for (const root of response?.roots ?? []) {
    walkMailTreeNode(root, MAIL_ROOT_CATEGORY_ID, categories, templates)
  }

  return { categories, templates }
}

export function mapMailMutationResponseToCategoryTree(
  payload: unknown
): MailCategoryTreeMapped {
  return mapMailCategoryTreeResponse(requireMutationCategoryTree(payload))
}
