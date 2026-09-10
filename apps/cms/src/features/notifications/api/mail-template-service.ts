import {
  MAIL_API_CHANNEL_TYPE,
  MAIL_EMAIL_TEMPLATE_LANGUAGE,
  mapMailCategoryTreeResponse,
  mapMailMutationResponseToCategoryTree,
  mapMailNotificationTemplatePreviewToItem,
  mapMailNotificationTemplateToItem,
  type MailCategoryTreeMapped,
} from '@/features/notifications/api/adapters/mail-template-adapters'
import { normalizeNotificationPlaceholderMarkup } from '@/features/notifications/model/shared/notification-placeholder-markup'
import {
  bindEmailAttachmentRemote,
  createCategoryRemote,
  createNotificationTemplateRemote,
  deleteCategoryRemote,
  deleteNotificationTemplateRemote,
  fetchCategoryTreeRemote,
  fetchNotificationTemplatePreviewRemote,
  fetchNotificationTemplateRemote,
  fetchNotificationTemplatesRemote,
  moveCategoryRemote,
  moveTemplateRemote,
  syncNotificationTemplatesRemote,
  syncSenderProfilesRemote,
  unbindEmailAttachmentRemote,
  updateCategoryRemote,
  updateNotificationTemplateRemote,
} from '@/features/notifications/api/notifications-api-client'
import {
  mapSyncResultResponse,
  mailSyncSuccessMessage,
  type AlimtalkSyncOutcome,
} from '@/features/notifications/api/adapters/alimtalk-sync-adapters'
import {
  syncMailTemplateAttachments,
  uploadAndBindMailTemplateAttachments,
} from '@/features/notifications/api/mail-template-attachments'
import { pendingFiltersFromSearchParams } from '@/features/notifications/model/mail-template/filter-url'
import { MAIL_ROOT_CATEGORY_ID, type MailTemplateItem } from '@/features/notifications/model/mail-template/types'
import { validateMailTemplateName } from '@/features/notifications/model/mail-template/template-name'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { NotificationTemplateUpsertRequest } from '@/shared/api/generated/notifications/schemas'

function assertMailTemplatesRemoteReady(): void {
  if (!isRealApiModuleEnabled('notifications')) {
    throw new Error(
      '알림 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 notifications를 추가해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('메일 템플릿 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseMailTemplatesRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

/** 카테고리·발신 프로필 NHN 연동 (수동). 알림톡 승인 카탈로그 pull과 문구·목적이 다름. */
export async function syncMailCatalog(): Promise<{
  templates: AlimtalkSyncOutcome
  senderProfiles: AlimtalkSyncOutcome | null
}> {
  assertMailTemplatesRemoteReady()
  const templates = mapSyncResultResponse(
    await syncNotificationTemplatesRemote({ channelType: MAIL_API_CHANNEL_TYPE })
  )
  let senderProfiles: AlimtalkSyncOutcome | null = null
  try {
    senderProfiles = mapSyncResultResponse(
      await syncSenderProfilesRemote({ channelType: MAIL_API_CHANNEL_TYPE })
    )
  } catch {
    // 템플릿/카테고리 sync가 본 목적. 프로필 sync 실패는 tree 갱신을 막지 않음.
  }
  return { templates, senderProfiles }
}

export { mailSyncSuccessMessage }

export async function getMailCategoryTree(
  searchParams: URLSearchParams
): Promise<MailCategoryTreeMapped> {
  if (!shouldUseMailTemplatesRemoteApi()) {
    return { categories: [], templates: [] }
  }

  const filters = pendingFiltersFromSearchParams(searchParams)
  const dto = await fetchCategoryTreeRemote({
    channelType: MAIL_API_CHANNEL_TYPE,
    categoryName: filters.categoryName.trim() || undefined,
    templateName: filters.templateName.trim() || undefined,
  })
  return mapMailCategoryTreeResponse(dto)
}

export async function getMailTemplateDetail(
  templateId: string
): Promise<MailTemplateItem | null> {
  if (!shouldUseMailTemplatesRemoteApi()) return null
  const numericId = Number(templateId)
  if (!Number.isFinite(numericId)) return null
  const dto = await fetchNotificationTemplateRemote(numericId)
  return mapMailNotificationTemplateToItem(dto)
}

export async function getMailTemplatePreview(
  templateId: string,
  fallback?: MailTemplateItem | null
): Promise<MailTemplateItem | null> {
  if (!shouldUseMailTemplatesRemoteApi()) return fallback ?? null
  const numericId = Number(templateId)
  if (!Number.isFinite(numericId)) return fallback ?? null
  const dto = await fetchNotificationTemplatePreviewRemote(numericId)
  return mapMailNotificationTemplatePreviewToItem(dto, fallback)
}

/** 발송 「템플릿 선택」— EMAIL은 APPROVED 필터 없음 */
export async function getMailSendTemplatePicker(): Promise<MailTemplateItem[]> {
  if (!shouldUseMailTemplatesRemoteApi()) return []

  const dto = await fetchNotificationTemplatesRemote({
    channelType: MAIL_API_CHANNEL_TYPE,
  })
  const fromList = (dto.items ?? [])
    .filter(item => (item.channelType ?? MAIL_API_CHANNEL_TYPE).toUpperCase() === MAIL_API_CHANNEL_TYPE)
    .map(item => mapMailNotificationTemplateToItem(item))
    .filter((item): item is MailTemplateItem => item != null)
  if (fromList.length > 0) return fromList

  const { templates } = await getMailCategoryTree(new URLSearchParams())
  return templates
}

function mapOrThrowMutationTree(result: unknown): MailCategoryTreeMapped {
  try {
    return mapMailMutationResponseToCategoryTree(result)
  } catch {
    throw new Error('카테고리 변경 응답에 트리가 없습니다. 새로고침 후 다시 시도해 주세요.')
  }
}

export async function createMailCategory(input: {
  name: string
  parentId: string
}): Promise<MailCategoryTreeMapped> {
  assertMailTemplatesRemoteReady()
  const parentId =
    input.parentId === MAIL_ROOT_CATEGORY_ID || !input.parentId
      ? undefined
      : Number(input.parentId)
  const result = await createCategoryRemote({
    name: input.name.trim(),
    channelType: MAIL_API_CHANNEL_TYPE,
    parentId: parentId != null && Number.isFinite(parentId) ? parentId : undefined,
  })
  return mapOrThrowMutationTree(result)
}

export async function updateMailCategory(input: {
  categoryId: string
  name: string
}): Promise<MailCategoryTreeMapped> {
  assertMailTemplatesRemoteReady()
  const categoryId = Number(input.categoryId)
  if (!Number.isFinite(categoryId)) throw new Error('카테고리 ID가 올바르지 않습니다.')
  const result = await updateCategoryRemote(categoryId, { name: input.name.trim() })
  return mapOrThrowMutationTree(result)
}

export async function deleteMailCategory(categoryId: string): Promise<MailCategoryTreeMapped> {
  assertMailTemplatesRemoteReady()
  const id = Number(categoryId)
  if (!Number.isFinite(id)) throw new Error('카테고리 ID가 올바르지 않습니다.')
  const result = await deleteCategoryRemote(id)
  return mapOrThrowMutationTree(result)
}

function resolveNullableCategoryId(rawId: string): number | null {
  if (!rawId || rawId === MAIL_ROOT_CATEGORY_ID || rawId.startsWith('unclassified-')) {
    return null
  }
  const numericId = Number(rawId)
  return Number.isFinite(numericId) ? numericId : null
}

export async function moveMailCategory(input: {
  categoryId: string
  targetParentId: string
}): Promise<MailCategoryTreeMapped> {
  assertMailTemplatesRemoteReady()
  const categoryId = Number(input.categoryId)
  if (!Number.isFinite(categoryId)) throw new Error('카테고리 ID가 올바르지 않습니다.')
  const result = await moveCategoryRemote({
    categoryId,
    parentId: resolveNullableCategoryId(input.targetParentId),
  })
  return mapOrThrowMutationTree(result)
}

export async function moveMailTemplate(input: {
  templateId: string
  targetCategoryId: string
}): Promise<MailCategoryTreeMapped> {
  assertMailTemplatesRemoteReady()
  const templateId = Number(input.templateId)
  if (!Number.isFinite(templateId)) throw new Error('템플릿 ID가 올바르지 않습니다.')
  const result = await moveTemplateRemote(templateId, {
    categoryId: resolveNullableCategoryId(input.targetCategoryId),
  })
  return mapOrThrowMutationTree(result)
}

export async function deleteMailTemplate(templateId: string): Promise<MailCategoryTreeMapped> {
  assertMailTemplatesRemoteReady()
  const id = Number(templateId)
  if (!Number.isFinite(id)) throw new Error('템플릿 ID가 올바르지 않습니다.')
  const result = await deleteNotificationTemplateRemote(id)
  return mapOrThrowMutationTree(result)
}

function buildMailTemplateUpsertBody(input: {
  templateName: string
  senderName: string
  senderEmail: string
  subject: string
  bodyHtml: string
  categoryId?: string | null
}): NotificationTemplateUpsertRequest {
  const nameError = validateMailTemplateName(input.templateName)
  if (nameError) throw new Error(nameError)
  const categoryId = input.categoryId ? resolveNullableCategoryId(input.categoryId) : null
  // templateCode 생략 — BE가 displayName으로 채움. emailAttachmentIds는 저장 후 bind API 사용.
  return {
    channelType: MAIL_API_CHANNEL_TYPE,
    displayName: input.templateName.trim(),
    senderProfileDisplayName: input.senderName.trim() || undefined,
    providerSenderEmailAddress: input.senderEmail.trim(),
    titleTemplate: normalizeNotificationPlaceholderMarkup(input.subject.trim().slice(0, 1000)),
    contentTemplate: normalizeNotificationPlaceholderMarkup(input.bodyHtml),
    emailTemplateLanguage: MAIL_EMAIL_TEMPLATE_LANGUAGE,
    useYn: true,
    categoryId: categoryId ?? undefined,
  }
}

export async function createMailTemplate(input: {
  templateName: string
  senderName: string
  senderEmail: string
  subject: string
  bodyHtml: string
  categoryId: string
  newFiles?: File[]
}): Promise<{ templateId: string }> {
  assertMailTemplatesRemoteReady()
  const result = await createNotificationTemplateRemote(
    buildMailTemplateUpsertBody({
      ...input,
      categoryId: input.categoryId,
    })
  )
  const templateId = result.templateId
  if (templateId == null || !Number.isFinite(templateId)) {
    throw new Error('템플릿 생성 응답에 ID가 없습니다.')
  }
  if (input.newFiles && input.newFiles.length > 0) {
    await uploadAndBindMailTemplateAttachments(templateId, input.newFiles)
  }
  return { templateId: String(templateId) }
}

export async function updateMailTemplate(input: {
  templateId: string
  templateName: string
  senderName: string
  senderEmail: string
  subject: string
  bodyHtml: string
  categoryId?: string | null
  newFiles?: File[]
  removedAttachmentIds?: number[]
}): Promise<{ templateId: string }> {
  assertMailTemplatesRemoteReady()
  const templateId = Number(input.templateId)
  if (!Number.isFinite(templateId)) throw new Error('템플릿 ID가 올바르지 않습니다.')
  await updateNotificationTemplateRemote(
    templateId,
    buildMailTemplateUpsertBody({
      templateName: input.templateName,
      senderName: input.senderName,
      senderEmail: input.senderEmail,
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      categoryId: input.categoryId,
    })
  )
  await syncMailTemplateAttachments({
    templateId,
    newFiles: input.newFiles ?? [],
    removedAttachmentIds: input.removedAttachmentIds ?? [],
  })
  return { templateId: String(templateId) }
}

export async function bindMailTemplateAttachment(
  templateId: number,
  fileObjectId: number
): Promise<void> {
  assertMailTemplatesRemoteReady()
  await bindEmailAttachmentRemote(templateId, { fileObjectId })
}

export async function unbindMailTemplateAttachment(
  templateId: number,
  attachmentId: number
): Promise<void> {
  assertMailTemplatesRemoteReady()
  await unbindEmailAttachmentRemote(templateId, attachmentId)
}
