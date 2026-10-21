import {
  serializeTextbookFilters,
  textbooksParamsFromFilters,
  type TextbookListFilters,
} from '@/features/textbook/api/textbook-filter-params'
import {
  mapTextbookMatchResponse,
  mapTextbookResponse,
  toTextbookRequest,
} from '@/features/textbook/api/adapters/textbook-adapters'
import type { DataManagementListPage } from '@/features/data-management/api/data-management-list-page'
import { mapTextbookListPage } from '@/features/textbook/api/map-textbook-list-page'
import {
  createTextbookRemote,
  bulkDeleteTextbooksRemote,
  fetchTextbookMatchesRemote,
  fetchTextbookRemote,
  fetchTextbooksRemote,
  updateTextbookRemote,
} from '@/features/textbook/api/textbooks-api-client'
import {
  buildTextbookMatchesParamsForApplicant,
  buildIndividualTextbookMatchesParams,
  buildParticipatingInstitutionTextbookMatchesParams,
  listMockTextbookCatalogForProgram,
  listMockTextbookCatalogForIndividualApplicant,
  listMockTextbooksByBusinessArea,
} from '@/features/textbook/api/textbook-program-catalog'
import type { TextbookCreateInput, TextbookRow } from '@/features/textbook/model/textbook.types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { MatchesParams } from '@/shared/api/generated/data-management/schemas'
import type { Program } from '@/types/domain'

function assertTextbooksRemoteReady(): void {
  if (!isRealApiModuleEnabled('textbooks')) {
    throw new Error('교재 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.')
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('교재 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseTextbooksRemoteApi(): boolean {
  return isRealApiModuleEnabled('textbooks') && hasRemoteAdminJwt()
}

export async function getTextbookListPage(
  filters: TextbookListFilters,
  page: number
): Promise<DataManagementListPage<TextbookRow>> {
  assertTextbooksRemoteReady()
  const dto = await fetchTextbooksRemote(textbooksParamsFromFilters(filters, page))
  return mapTextbookListPage(dto)
}

export async function getTextbookList(filters: TextbookListFilters): Promise<TextbookRow[]> {
  const page = await getTextbookListPage(filters, 0)
  return page.items
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
  await bulkDeleteTextbooksRemote(ids)
}

export async function getTextbookMatches(params: MatchesParams = {}): Promise<TextbookRow[]> {
  assertTextbooksRemoteReady()
  const dtos = await fetchTextbookMatchesRemote(params)
  return dtos.map(mapTextbookMatchResponse)
}

export async function getParticipatingInstitutionTextbookCatalog(
  program: Program
): Promise<TextbookRow[]> {
  const params = buildParticipatingInstitutionTextbookMatchesParams(program)
  if (shouldUseTextbooksRemoteApi()) {
    return getTextbookMatches(params)
  }
  return listMockTextbooksByBusinessArea(program)
}

export async function getProgramTextbookCatalog(
  program: Program,
  educationGrade?: string
): Promise<TextbookRow[]> {
  const params = buildTextbookMatchesParamsForApplicant(program, educationGrade)
  if (shouldUseTextbooksRemoteApi()) {
    return getTextbookMatches(params)
  }
  return listMockTextbookCatalogForProgram(program, educationGrade)
}

/** 개인 참여자 — `businessArea` + `grade`만으로 matches 조회 */
export async function getIndividualApplicantTextbookCatalog(
  program: Program,
  educationGrade?: string
): Promise<TextbookRow[]> {
  const params = buildIndividualTextbookMatchesParams(program, educationGrade)
  if (!params) return []
  if (shouldUseTextbooksRemoteApi()) {
    return getTextbookMatches(params)
  }
  return listMockTextbookCatalogForIndividualApplicant(program, educationGrade)
}
