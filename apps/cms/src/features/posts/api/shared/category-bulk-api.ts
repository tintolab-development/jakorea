import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import type { CategoryManagementDraftChanges } from '@/features/posts/model/category-management-draft'
import { customInstance } from '@/shared/api/orval-mutator'

export type CategoryBatchChangesRequest = {
  creates: Array<{
    clientKey: string
    name: string
    status: 'enabled'
    displayOrder: number | null
  }>
  updates: Array<{
    id: number
    name: string
    status: 'enabled' | 'disabled'
    displayOrder: number | null
    expectedUpdatedAt: string
  }>
  deleteItems: Array<{
    id: number
    expectedUpdatedAt: string
  }>
}

export type CategoryBatchCategoryResponse = {
  id: number
  name: string
  useYn: boolean
  displayOrder: number | null
  createdAt: string | null
  updatedAt: string | null
}

export type CategoryBatchSaveResponse = {
  items: CategoryBatchCategoryResponse[]
  created: Array<{ clientKey: string; category: CategoryBatchCategoryResponse }>
  updatedIds: number[]
  deletedIds: number[]
  revision: string
}

function positiveId(value: string, field: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${field}가 올바르지 않습니다.`)
  }
  return id
}

function requiredVersion(value: string | null, field: string): string {
  if (!value) {
    throw new Error(
      `${field}의 최신 수정 시각을 확인하지 못했습니다. 카테고리 목록을 새로고침한 후 다시 시도해 주세요.`
    )
  }
  return value
}

/** 화면 draft를 BE bulk DTO로 변환한다. 누락된 버전은 임의 생성하지 않는다. */
export function toCategoryBatchChangesRequest(
  changes: CategoryManagementDraftChanges
): CategoryBatchChangesRequest {
  return {
    creates: changes.creates.map(({ clientKey, name, status, displayOrder }) => ({
      clientKey,
      name,
      status,
      displayOrder,
    })),
    updates: changes.updates.map(({ id, name, status, displayOrder, expectedUpdatedAt }) => ({
      id: positiveId(id, '카테고리 ID'),
      name,
      status,
      displayOrder,
      expectedUpdatedAt: requiredVersion(expectedUpdatedAt, '수정 카테고리'),
    })),
    deleteItems: changes.deleteItems.map(({ id, expectedUpdatedAt }) => ({
      id: positiveId(id, '카테고리 ID'),
      expectedUpdatedAt: requiredVersion(expectedUpdatedAt, '삭제 카테고리'),
    })),
  }
}

export async function patchCategoryBatchChanges(
  url: string,
  changes: CategoryManagementDraftChanges
): Promise<CategoryBatchSaveResponse> {
  const body = toCategoryBatchChangesRequest(changes)
  return unwrapApiBody(
    await customInstance<unknown>({
      url,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  ) as CategoryBatchSaveResponse
}
