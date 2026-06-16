import {
  clientFilterTextbooks,
  serializeTextbookFilters,
  textbooksParamsFromFilters,
  type TextbookListFilters,
} from '@/features/textbook/api/textbook-filter-params'
import {
  mapTextbookListResponse,
  mapTextbookResponse,
  toTextbookRequest,
} from '@/features/textbook/api/adapters/textbook-adapters'
import {
  createTextbookRemote,
  deleteTextbookRemote,
  fetchTextbookRemote,
  fetchTextbooksRemote,
  updateTextbookRemote,
} from '@/features/textbook/api/textbooks-api-client'
import type { TextbookCreateInput, TextbookRow } from '@/features/textbook/model/textbook.types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertTextbooksRemoteReady(): void {
  if (!isRealApiModuleEnabled('textbooks')) {
    throw new Error('교재 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 textbooks를 추가해 주세요.')
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('교재 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseTextbooksRemoteApi(): boolean {
  return isRealApiModuleEnabled('textbooks') && hasRemoteAdminJwt()
}

export async function getTextbookList(filters: TextbookListFilters): Promise<TextbookRow[]> {
  assertTextbooksRemoteReady()
  const dto = await fetchTextbooksRemote(textbooksParamsFromFilters(filters))
  const rows = mapTextbookListResponse(dto)
  return clientFilterTextbooks(rows, filters)
}

export function getTextbookListFilterKey(filters: TextbookListFilters): string {
  return serializeTextbookFilters(filters)
}

export async function getTextbookDetail(id: string): Promise<TextbookRow> {
  assertTextbooksRemoteReady()
  const dto = await fetchTextbookRemote(id)
  return mapTextbookResponse(dto)
}

export async function createTextbook(input: TextbookCreateInput): Promise<TextbookRow> {
  assertTextbooksRemoteReady()
  const dto = await createTextbookRemote(toTextbookRequest(input))
  return mapTextbookResponse(dto)
}

export async function updateTextbook(id: string, input: TextbookCreateInput): Promise<TextbookRow> {
  assertTextbooksRemoteReady()
  const dto = await updateTextbookRemote(id, toTextbookRequest(input))
  return mapTextbookResponse(dto)
}

export async function deleteTextbooks(ids: string[]): Promise<void> {
  assertTextbooksRemoteReady()
  for (const id of ids) {
    await deleteTextbookRemote(id)
  }
}
