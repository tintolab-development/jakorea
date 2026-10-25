import {
  ALIMTALK_API_CHANNEL_TYPE,
  mapCategoryTreeResponse,
  mapMutationResponseToCategoryTree,
  mapNotificationTemplatePreviewToItem,
  mapNotificationTemplateToItem,
  mapAlimtalkTemplateListResponse,
  type AlimtalkCategoryTreeMapped,
} from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { alimtalkTemplateParamsFromSearchParams } from '@/features/notifications/api/alimtalk-template-filter-params'
import {
  mapSyncResultResponse,
  type AlimtalkSyncOutcome,
} from '@/features/notifications/api/adapters/alimtalk-sync-adapters'
import {
  createCategoryRemote,
  deleteCategoryRemote,
  deleteNotificationTemplateRemote,
  fetchCategoryTreeRemote,
  fetchNotificationTemplatePreviewRemote,
  fetchNotificationTemplateRemote,
  fetchAllNotificationTemplatesRemote,
  fetchNotificationTemplatesRemote,
  moveCategoryRemote,
  moveTemplateRemote,
  syncNotificationTemplatesRemote,
  syncSenderProfilesRemote,
  updateCategoryRemote,
} from '@/features/notifications/api/notifications-api-client'
import type { AlimtalkTemplateItem, AlimtalkTemplateRow } from '@/features/notifications/model/alimtalk-template/types'
import { pendingFiltersFromSearchParams } from '@/features/notifications/model/alimtalk-template/filter-url'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { ALIMTALK_ROOT_CATEGORY_ID } from '@/features/notifications/model/alimtalk-template/types'

function assertAlimtalkTemplatesRemoteReady(): void {
  if (!isRealApiModuleEnabled('notifications')) {
    throw new Error(
      '알림 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('알림톡 양식 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseAlimtalkTemplatesRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

export async function getAlimtalkTemplateList(
  searchParams: URLSearchParams
): Promise<AlimtalkTemplateRow[]> {
  assertAlimtalkTemplatesRemoteReady()
  const dto = await fetchNotificationTemplatesRemote(
    alimtalkTemplateParamsFromSearchParams(searchParams)
  )
  return mapAlimtalkTemplateListResponse(dto.items)
}

export async function getAlimtalkCategoryTree(
  searchParams: URLSearchParams
): Promise<AlimtalkCategoryTreeMapped> {
  if (!shouldUseAlimtalkTemplatesRemoteApi()) {
    return { categories: [], templates: [] }
  }

  const filters = pendingFiltersFromSearchParams(searchParams)
  const dto = await fetchCategoryTreeRemote({
    channelType: ALIMTALK_API_CHANNEL_TYPE,
    categoryName: filters.categoryName.trim() || undefined,
    templateName: filters.templateName.trim() || undefined,
  })
  return mapCategoryTreeResponse(dto)
}

export async function getAlimtalkTemplateDetail(
  templateId: string
): Promise<AlimtalkTemplateItem | null> {
  if (!shouldUseAlimtalkTemplatesRemoteApi()) return null
  const numericId = Number(templateId)
  if (!Number.isFinite(numericId)) return null
  const dto = await fetchNotificationTemplateRemote(numericId)
  return mapNotificationTemplateToItem(dto)
}

export async function getAlimtalkTemplatePreview(
  templateId: string,
  fallback?: AlimtalkTemplateItem | null
): Promise<AlimtalkTemplateItem | null> {
  if (!shouldUseAlimtalkTemplatesRemoteApi()) return fallback ?? null
  const numericId = Number(templateId)
  if (!Number.isFinite(numericId)) return fallback ?? null
  const dto = await fetchNotificationTemplatePreviewRemote(numericId)
  return mapNotificationTemplatePreviewToItem(dto, fallback)
}

function mapOrThrowMutationTree(result: unknown): AlimtalkCategoryTreeMapped {
  try {
    return mapMutationResponseToCategoryTree(result)
  } catch {
    throw new Error('카테고리 변경 응답에 트리가 없습니다. 새로고침 후 다시 시도해 주세요.')
  }
}

export async function createAlimtalkCategory(input: {
  name: string
  parentId: string
}): Promise<AlimtalkCategoryTreeMapped> {
  assertAlimtalkTemplatesRemoteReady()
  const parentId =
    input.parentId === ALIMTALK_ROOT_CATEGORY_ID || !input.parentId
      ? undefined
      : Number(input.parentId)
  const result = await createCategoryRemote({
    name: input.name.trim(),
    channelType: ALIMTALK_API_CHANNEL_TYPE,
    parentId: parentId != null && Number.isFinite(parentId) ? parentId : undefined,
  })
  return mapOrThrowMutationTree(result)
}

export async function updateAlimtalkCategory(input: {
  categoryId: string
  name: string
}): Promise<AlimtalkCategoryTreeMapped> {
  assertAlimtalkTemplatesRemoteReady()
  const categoryId = Number(input.categoryId)
  if (!Number.isFinite(categoryId)) throw new Error('카테고리 ID가 올바르지 않습니다.')
  const result = await updateCategoryRemote(categoryId, { name: input.name.trim() })
  return mapOrThrowMutationTree(result)
}

export async function deleteAlimtalkCategory(
  categoryId: string
): Promise<AlimtalkCategoryTreeMapped> {
  assertAlimtalkTemplatesRemoteReady()
  const id = Number(categoryId)
  if (!Number.isFinite(id)) throw new Error('카테고리 ID가 올바르지 않습니다.')
  const result = await deleteCategoryRemote(id)
  return mapOrThrowMutationTree(result)
}

function resolveNullableCategoryId(rawId: string): number | null {
  if (!rawId || rawId === ALIMTALK_ROOT_CATEGORY_ID || rawId.startsWith('unclassified-')) {
    return null
  }
  const numericId = Number(rawId)
  return Number.isFinite(numericId) ? numericId : null
}

export async function moveAlimtalkCategory(input: {
  categoryId: string
  targetParentId: string
}): Promise<AlimtalkCategoryTreeMapped> {
  assertAlimtalkTemplatesRemoteReady()
  const categoryId = Number(input.categoryId)
  if (!Number.isFinite(categoryId)) throw new Error('카테고리 ID가 올바르지 않습니다.')
  const result = await moveCategoryRemote({
    categoryId,
    parentId: resolveNullableCategoryId(input.targetParentId),
  })
  return mapOrThrowMutationTree(result)
}

export async function moveAlimtalkTemplate(input: {
  templateId: string
  targetCategoryId: string
}): Promise<AlimtalkCategoryTreeMapped> {
  assertAlimtalkTemplatesRemoteReady()
  const templateId = Number(input.templateId)
  if (!Number.isFinite(templateId)) throw new Error('템플릿 ID가 올바르지 않습니다.')
  const result = await moveTemplateRemote(templateId, {
    categoryId: resolveNullableCategoryId(input.targetCategoryId),
  })
  return mapOrThrowMutationTree(result)
}

export async function deleteAlimtalkTemplate(
  templateId: string
): Promise<AlimtalkCategoryTreeMapped> {
  assertAlimtalkTemplatesRemoteReady()
  const id = Number(templateId)
  if (!Number.isFinite(id)) throw new Error('템플릿 ID가 올바르지 않습니다.')
  const result = await deleteNotificationTemplateRemote(id)
  return mapOrThrowMutationTree(result)
}

export const ALIMTALK_NO_APPROVED_TEMPLATE_MESSAGE =
  '카카오 승인이 확인된 알림톡 템플릿이 없습니다. 템플릿 승인 상태를 동기화한 뒤 다시 불러오세요.'

/**
 * 승인 상태가 APPROVED인 템플릿만 발송 후보로 남긴다.
 * null·UNKNOWN은 승인 완료로 보지 않는다.
 */
export function selectApprovedAlimtalkSendTemplates<T extends { approvalStatus?: string | null }>(
  templates: readonly T[]
): T[] {
  return templates.filter(item => item.approvalStatus === 'APPROVED')
}

/**
 * 발송 「템플릿 선택」— APPROVED만 (트리·send-batch 가드와 동일).
 * PENDING은 목록/상세 approvalStatus로만 확인.
 */
export async function getAlimtalkSendTemplatePicker(): Promise<AlimtalkTemplateItem[]> {
  if (!shouldUseAlimtalkTemplatesRemoteApi()) return []

  const templateItems = await fetchAllNotificationTemplatesRemote({
    channelType: ALIMTALK_API_CHANNEL_TYPE,
    approvalStatus: 'APPROVED',
  })
  const fromList = selectApprovedAlimtalkSendTemplates(
    templateItems
      .filter(
        item => (item.channelType ?? ALIMTALK_API_CHANNEL_TYPE).toUpperCase() === ALIMTALK_API_CHANNEL_TYPE
      )
      .map(item => mapNotificationTemplateToItem(item))
      .filter((item): item is AlimtalkTemplateItem => item != null)
  )
  if (fromList.length > 0) return fromList

  // 목록이 비었을 때만 트리. 상태가 없으면 승인으로 간주하지 않는다.
  const { templates } = await getAlimtalkCategoryTree(new URLSearchParams())
  return selectApprovedAlimtalkSendTemplates(templates)
}

/** NHN Console 카탈로그 → CMS DB. Body 없음. 성공 후 tree 재조회는 호출측. */
export async function syncAlimtalkTemplatesFromNhn(): Promise<AlimtalkSyncOutcome> {
  assertAlimtalkTemplatesRemoteReady()
  const result = await syncNotificationTemplatesRemote({
    channelType: ALIMTALK_API_CHANNEL_TYPE,
  })
  return mapSyncResultResponse(result)
}

/** 발신 프로필 NHN pull (선택). */
export async function syncAlimtalkSenderProfilesFromNhn(): Promise<AlimtalkSyncOutcome> {
  assertAlimtalkTemplatesRemoteReady()
  const result = await syncSenderProfilesRemote({ channelType: ALIMTALK_API_CHANNEL_TYPE })
  return mapSyncResultResponse(result)
}

export async function syncAlimtalkCatalogFromNhn(): Promise<{
  templates: AlimtalkSyncOutcome
  senderProfiles: AlimtalkSyncOutcome | null
}> {
  assertAlimtalkTemplatesRemoteReady()
  const templates = await syncAlimtalkTemplatesFromNhn()
  let senderProfiles: AlimtalkSyncOutcome | null = null
  try {
    senderProfiles = await syncAlimtalkSenderProfilesFromNhn()
  } catch {
    // 템플릿 sync가 본 목적이고, 프로필 sync 실패는 tree 갱신을 막지 않음
  }
  return { templates, senderProfiles }
}
