/**
 * 교재 사업 분야 마스터 — OpenAPI `/api/admin/textbook-business-areas`
 */

import {
  createTextbookBusinessAreaRemote,
  deleteTextbookBusinessAreaRemote,
  fetchTextbookBusinessAreasRemote,
  updateTextbookBusinessAreaRemote,
} from '@/features/textbook/api/business-areas-api-client'
import { shouldUseTextbooksRemoteApi } from '@/features/textbook/api/admin-textbooks-service'
import { TEXTBOOK_BUSINESS_AREAS } from '@/features/textbook/model/textbook-business-areas'
import type { TextbookBusinessAreaRow } from '@/features/textbook/model/business-area.types'
import type { TextbookBusinessAreaResponse } from '@/shared/api/generated/data-management/schemas'

export function mapTextbookBusinessAreaResponse(
  dto: TextbookBusinessAreaResponse
): TextbookBusinessAreaRow | null {
  const id = dto.id?.trim()
  const name = dto.name?.trim()
  if (!id || !name) return null
  return {
    id,
    name,
    textbookCount: dto.textbookCount ?? 0,
    deletable: dto.deletable ?? (dto.textbookCount ?? 0) === 0,
  }
}

function seedFallbackRows(): TextbookBusinessAreaRow[] {
  return TEXTBOOK_BUSINESS_AREAS.map((name, index) => ({
    id: `tba-seed-${index + 1}`,
    name,
    textbookCount: 0,
    deletable: true,
  }))
}

export function shouldUseTextbookBusinessAreasRemoteApi(): boolean {
  return shouldUseTextbooksRemoteApi()
}

export async function listTextbookBusinessAreas(): Promise<TextbookBusinessAreaRow[]> {
  if (!shouldUseTextbookBusinessAreasRemoteApi()) {
    return seedFallbackRows()
  }
  const items = await fetchTextbookBusinessAreasRemote()
  return items
    .map(mapTextbookBusinessAreaResponse)
    .filter((row): row is TextbookBusinessAreaRow => row != null)
}

export async function createTextbookBusinessArea(name: string): Promise<TextbookBusinessAreaRow> {
  if (!shouldUseTextbookBusinessAreasRemoteApi()) {
    throw new Error('사업 분야 API가 활성화되지 않았습니다.')
  }
  const dto = await createTextbookBusinessAreaRemote(name)
  const row = mapTextbookBusinessAreaResponse(dto)
  if (!row) throw new Error('사업 분야 등록 응답이 올바르지 않습니다.')
  return row
}

export async function updateTextbookBusinessArea(
  id: string,
  name: string
): Promise<TextbookBusinessAreaRow> {
  if (!shouldUseTextbookBusinessAreasRemoteApi()) {
    throw new Error('사업 분야 API가 활성화되지 않았습니다.')
  }
  const dto = await updateTextbookBusinessAreaRemote(id, name)
  const row = mapTextbookBusinessAreaResponse(dto)
  if (!row) throw new Error('사업 분야 수정 응답이 올바르지 않습니다.')
  return row
}

export async function deleteTextbookBusinessArea(id: string): Promise<void> {
  if (!shouldUseTextbookBusinessAreasRemoteApi()) {
    throw new Error('사업 분야 API가 활성화되지 않았습니다.')
  }
  await deleteTextbookBusinessAreaRemote(id)
}

export function toBusinessAreaSelectOptions(rows: readonly TextbookBusinessAreaRow[]) {
  return rows.map(row => ({ label: row.name, value: row.name }))
}
