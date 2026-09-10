import {
  mapSmsCategoryTreeResponse,
  mapSmsMutationResponseToCategoryTree,
  mapSmsNotificationTemplatePreviewToItem,
  mapSmsNotificationTemplateToItem,
  SMS_API_CHANNEL_TYPE,
  type SmsCategoryTreeMapped,
} from '@/features/notifications/api/adapters/sms-template-adapters'
import { normalizeNotificationPlaceholderMarkup } from '@/features/notifications/model/shared/notification-placeholder-markup'
import {
  createCategoryRemote,
  createNotificationTemplateRemote,
  deleteCategoryRemote,
  deleteNotificationTemplateRemote,
  fetchCategoryTreeRemote,
  fetchNotificationTemplatesRemote,
  fetchNotificationTemplatePreviewRemote,
  fetchNotificationTemplateRemote,
  moveCategoryRemote,
  moveTemplateRemote,
  syncNotificationTemplatesRemote,
  syncSenderProfilesRemote,
  updateCategoryRemote,
  updateNotificationTemplateRemote,
} from '@/features/notifications/api/notifications-api-client'
import {
  mapSyncResultResponse,
  smsSyncSuccessMessage,
  type AlimtalkSyncOutcome,
} from '@/features/notifications/api/adapters/alimtalk-sync-adapters'
import { pendingFiltersFromSearchParams } from '@/features/notifications/model/sms-template/filter-url'
import { validateSmsTemplateName } from '@/features/notifications/model/sms-template/template-name'
import { SMS_ROOT_CATEGORY_ID, type SmsTemplateItem } from '@/features/notifications/model/sms-template/types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { NotificationTemplateUpsertRequest } from '@/shared/api/generated/notifications/schemas'

function assertSmsTemplatesRemoteReady(): void {
  if (!isRealApiModuleEnabled('notifications')) {
    throw new Error(
      '알림 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 notifications를 추가해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('문자 템플릿 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseSmsTemplatesRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

/** SMS 카탈로그 NHN live pull + 발신번호 harvest (메일/알림톡과 동일 패턴). */
export async function syncSmsCatalog(): Promise<{
  templates: AlimtalkSyncOutcome
  senderProfiles: AlimtalkSyncOutcome | null
}> {
  assertSmsTemplatesRemoteReady()
  const templates = mapSyncResultResponse(
    await syncNotificationTemplatesRemote({ channelType: SMS_API_CHANNEL_TYPE })
  )
  let senderProfiles: AlimtalkSyncOutcome | null = null
  try {
    senderProfiles = mapSyncResultResponse(
      await syncSenderProfilesRemote({ channelType: SMS_API_CHANNEL_TYPE })
    )
  } catch {
    // 템플릿/카테고리 sync가 본 목적. 프로필 sync 실패는 tree 갱신을 막지 않음.
  }
  return { templates, senderProfiles }
}

export { smsSyncSuccessMessage }

export async function getSmsCategoryTree(
  searchParams: URLSearchParams
): Promise<SmsCategoryTreeMapped> {
  if (!shouldUseSmsTemplatesRemoteApi()) {
    return { categories: [], templates: [] }
  }

  const filters = pendingFiltersFromSearchParams(searchParams)
  const dto = await fetchCategoryTreeRemote({
    channelType: SMS_API_CHANNEL_TYPE,
    categoryName: filters.categoryName.trim() || undefined,
    templateName: filters.templateName.trim() || undefined,
  })
  return mapSmsCategoryTreeResponse(dto)
}

export async function getSmsTemplateDetail(
  templateId: string
): Promise<SmsTemplateItem | null> {
  if (!shouldUseSmsTemplatesRemoteApi()) return null
  const numericId = Number(templateId)
  if (!Number.isFinite(numericId)) return null
  const dto = await fetchNotificationTemplateRemote(numericId)
  return mapSmsNotificationTemplateToItem(dto)
}

export async function getSmsTemplatePreview(
  templateId: string,
  fallback?: SmsTemplateItem | null
): Promise<SmsTemplateItem | null> {
  if (!shouldUseSmsTemplatesRemoteApi()) return fallback ?? null
  const numericId = Number(templateId)
  if (!Number.isFinite(numericId)) return fallback ?? null
  const dto = await fetchNotificationTemplatePreviewRemote(numericId)
  return mapSmsNotificationTemplatePreviewToItem(dto, fallback)
}

export async function getSmsSendTemplatePicker(): Promise<SmsTemplateItem[]> {
  if (!shouldUseSmsTemplatesRemoteApi()) return []

  const dto = await fetchNotificationTemplatesRemote({
    channelType: SMS_API_CHANNEL_TYPE,
  })
  const fromList = (dto.items ?? [])
    .filter(item => (item.channelType ?? SMS_API_CHANNEL_TYPE).toUpperCase() === SMS_API_CHANNEL_TYPE)
    .map(item => mapSmsNotificationTemplateToItem(item))
    .filter((item): item is SmsTemplateItem => item != null)

  const dedupe = (items: SmsTemplateItem[]) => {
    const seen = new Set<string>()
    const next: SmsTemplateItem[] = []
    for (const item of items) {
      if (!item.id || seen.has(item.id)) continue
      seen.add(item.id)
      next.push(item)
    }
    return next
  }

  if (fromList.length > 0) return dedupe(fromList)

  const { templates } = await getSmsCategoryTree(new URLSearchParams())
  return dedupe(templates)
}

function mapOrThrowMutationTree(result: unknown): SmsCategoryTreeMapped {
  try {
    return mapSmsMutationResponseToCategoryTree(result)
  } catch {
    throw new Error('카테고리 변경 응답에 트리가 없습니다. 새로고침 후 다시 시도해 주세요.')
  }
}

export async function createSmsCategory(input: {
  name: string
  parentId: string
}): Promise<SmsCategoryTreeMapped> {
  assertSmsTemplatesRemoteReady()
  const parentId =
    input.parentId === SMS_ROOT_CATEGORY_ID || !input.parentId
      ? undefined
      : Number(input.parentId)
  const result = await createCategoryRemote({
    name: input.name.trim(),
    channelType: SMS_API_CHANNEL_TYPE,
    parentId: parentId != null && Number.isFinite(parentId) ? parentId : undefined,
  })
  return mapOrThrowMutationTree(result)
}

export async function updateSmsCategory(input: {
  categoryId: string
  name: string
}): Promise<SmsCategoryTreeMapped> {
  assertSmsTemplatesRemoteReady()
  const categoryId = Number(input.categoryId)
  if (!Number.isFinite(categoryId)) throw new Error('카테고리 ID가 올바르지 않습니다.')
  const result = await updateCategoryRemote(categoryId, { name: input.name.trim() })
  return mapOrThrowMutationTree(result)
}

export async function deleteSmsCategory(categoryId: string): Promise<SmsCategoryTreeMapped> {
  assertSmsTemplatesRemoteReady()
  const id = Number(categoryId)
  if (!Number.isFinite(id)) throw new Error('카테고리 ID가 올바르지 않습니다.')
  const result = await deleteCategoryRemote(id)
  return mapOrThrowMutationTree(result)
}

function resolveNullableCategoryId(rawId: string): number | null {
  if (!rawId || rawId === SMS_ROOT_CATEGORY_ID || rawId.startsWith('unclassified-')) {
    return null
  }
  const numericId = Number(rawId)
  return Number.isFinite(numericId) ? numericId : null
}

export async function moveSmsCategory(input: {
  categoryId: string
  targetParentId: string
}): Promise<SmsCategoryTreeMapped> {
  assertSmsTemplatesRemoteReady()
  const categoryId = Number(input.categoryId)
  if (!Number.isFinite(categoryId)) throw new Error('카테고리 ID가 올바르지 않습니다.')
  const result = await moveCategoryRemote({
    categoryId,
    parentId: resolveNullableCategoryId(input.targetParentId),
  })
  return mapOrThrowMutationTree(result)
}

export async function moveSmsTemplate(input: {
  templateId: string
  targetCategoryId: string
}): Promise<SmsCategoryTreeMapped> {
  assertSmsTemplatesRemoteReady()
  const templateId = Number(input.templateId)
  if (!Number.isFinite(templateId)) throw new Error('템플릿 ID가 올바르지 않습니다.')
  const result = await moveTemplateRemote(templateId, {
    categoryId: resolveNullableCategoryId(input.targetCategoryId),
  })
  return mapOrThrowMutationTree(result)
}

export async function deleteSmsTemplate(templateId: string): Promise<SmsCategoryTreeMapped> {
  assertSmsTemplatesRemoteReady()
  const id = Number(templateId)
  if (!Number.isFinite(id)) throw new Error('템플릿 ID가 올바르지 않습니다.')
  const result = await deleteNotificationTemplateRemote(id)
  return mapOrThrowMutationTree(result)
}

function buildSmsTemplateUpsertBody(input: {
  templateName: string
  senderPhone: string
  messageType: string
  subject: string
  bodyText: string
  categoryId?: string | null
}): NotificationTemplateUpsertRequest {
  const nameError = validateSmsTemplateName(input.templateName)
  if (nameError) throw new Error(nameError)
  const categoryId = input.categoryId ? resolveNullableCategoryId(input.categoryId) : null
  const messageType = input.messageType.trim().toUpperCase()
  return {
    channelType: SMS_API_CHANNEL_TYPE,
    displayName: input.templateName.trim(),
    providerSenderPhoneNumber: input.senderPhone.trim(),
    smsMessageType: messageType,
    titleTemplate:
      messageType === 'SMS'
        ? ''
        : normalizeNotificationPlaceholderMarkup(input.subject.trim().slice(0, 1000)),
    contentTemplate: normalizeNotificationPlaceholderMarkup(input.bodyText),
    useYn: true,
    categoryId: categoryId ?? undefined,
  }
}

export async function createSmsTemplate(input: {
  templateName: string
  senderPhone: string
  messageType: string
  subject: string
  bodyText: string
  categoryId: string
  newFiles?: File[]
}): Promise<{ templateId: string }> {
  assertSmsTemplatesRemoteReady()
  const result = await createNotificationTemplateRemote(
    buildSmsTemplateUpsertBody({
      ...input,
      categoryId: input.categoryId,
    })
  )
  const templateId = result.templateId
  if (templateId == null || !Number.isFinite(templateId)) {
    throw new Error('템플릿 생성 응답에 ID가 없습니다.')
  }
  return { templateId: String(templateId) }
}

export async function updateSmsTemplate(input: {
  templateId: string
  templateName: string
  senderPhone: string
  messageType: string
  subject: string
  bodyText: string
  categoryId?: string | null
  newFiles?: File[]
}): Promise<{ templateId: string }> {
  assertSmsTemplatesRemoteReady()
  const templateId = Number(input.templateId)
  if (!Number.isFinite(templateId)) throw new Error('템플릿 ID가 올바르지 않습니다.')
  await updateNotificationTemplateRemote(
    templateId,
    buildSmsTemplateUpsertBody({
      templateName: input.templateName,
      senderPhone: input.senderPhone,
      messageType: input.messageType,
      subject: input.subject,
      bodyText: input.bodyText,
      categoryId: input.categoryId,
    })
  )
  return { templateId: String(templateId) }
}
