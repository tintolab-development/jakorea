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
  fetchNotificationTemplatesRemote,
  moveCategoryRemote,
  moveTemplateRemote,
  syncNotificationTemplatesRemote,
  syncSenderProfilesRemote,
  updateCategoryRemote,
} from '@/features/notifications/api/notifications-api-client'
import type { AlimtalkTemplateItem, AlimtalkTemplateRow } from '@/features/notifications/model/alimtalk-template/types'
import {
  ALIMTALK_CATEGORY_MOCK,
  ALIMTALK_TEMPLATE_ITEM_MOCK,
} from '@/features/notifications/model/alimtalk-template/mock'
import { pendingFiltersFromSearchParams } from '@/features/notifications/model/alimtalk-template/filter-url'
import { filterAlimtalkTree } from '@/features/notifications/lib/tree'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { ALIMTALK_ROOT_CATEGORY_ID } from '@/features/notifications/model/alimtalk-template/types'

function assertAlimtalkTemplatesRemoteReady(): void {
  if (!isRealApiModuleEnabled('notifications')) {
    throw new Error(
      '알림 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 notifications를 추가해 주세요.'
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

function mockCategoryTree(searchParams: URLSearchParams): AlimtalkCategoryTreeMapped {
  const filters = pendingFiltersFromSearchParams(searchParams)
  const filtered = filterAlimtalkTree(
    ALIMTALK_CATEGORY_MOCK,
    ALIMTALK_TEMPLATE_ITEM_MOCK,
    filters.categoryName,
    filters.templateName
  )
  return { categories: filtered.categories, templates: filtered.templates }
}

export async function getAlimtalkCategoryTree(
  searchParams: URLSearchParams
): Promise<AlimtalkCategoryTreeMapped> {
  if (!shouldUseAlimtalkTemplatesRemoteApi()) {
    return mockCategoryTree(searchParams)
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
  if (!shouldUseAlimtalkTemplatesRemoteApi()) {
    return ALIMTALK_TEMPLATE_ITEM_MOCK.find(item => item.id === templateId) ?? null
  }
  const numericId = Number(templateId)
  if (!Number.isFinite(numericId)) return null
  const dto = await fetchNotificationTemplateRemote(numericId)
  return mapNotificationTemplateToItem(dto)
}

export async function getAlimtalkTemplatePreview(
  templateId: string,
  fallback?: AlimtalkTemplateItem | null
): Promise<AlimtalkTemplateItem | null> {
  if (!shouldUseAlimtalkTemplatesRemoteApi()) {
    return (
      fallback ??
      ALIMTALK_TEMPLATE_ITEM_MOCK.find(item => item.id === templateId) ??
      null
    )
  }
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

/**
 * 발송 「템플릿 선택」— APPROVED만 (트리·send-batch 가드와 동일).
 * PENDING은 목록/상세 approvalStatus로만 확인.
 */
export async function getAlimtalkSendTemplatePicker(): Promise<AlimtalkTemplateItem[]> {
  if (!shouldUseAlimtalkTemplatesRemoteApi()) {
    return ALIMTALK_TEMPLATE_ITEM_MOCK.filter(
      item => (item.approvalStatus ?? 'APPROVED') === 'APPROVED'
    ).map(item => ({
      ...item,
      approvalStatus: item.approvalStatus ?? 'APPROVED',
    }))
  }

  const dto = await fetchNotificationTemplatesRemote({
    channelType: ALIMTALK_API_CHANNEL_TYPE,
    approvalStatus: 'APPROVED',
  })
  const fromList = (dto.items ?? [])
    .map(item => mapNotificationTemplateToItem(item))
    .filter((item): item is AlimtalkTemplateItem => item != null)
    .filter(item => item.approvalStatus === 'APPROVED')
  if (fromList.length > 0) return fromList

  // fallback: 트리(서버가 APPROVED만 내려줌). FE에서 PENDING 재삽입/이중 필터 금지
  const { templates } = await getAlimtalkCategoryTree(new URLSearchParams())
  return templates.filter(
    item => item.approvalStatus == null || item.approvalStatus === 'APPROVED'
  )
}

/** NHN Console 카탈로그 → CMS DB. Body 없음. 성공 후 tree 재조회는 호출측. */
export async function syncAlimtalkTemplatesFromNhn(): Promise<AlimtalkSyncOutcome> {
  assertAlimtalkTemplatesRemoteReady()
  const result = await syncNotificationTemplatesRemote()
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
