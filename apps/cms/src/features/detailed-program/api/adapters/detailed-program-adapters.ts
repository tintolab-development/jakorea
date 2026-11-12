import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'
import type { DataManagementListPage } from '@/features/data-management/api/data-management-list-page'
import { DETAILED_PROGRAM_API_PAGE_SIZE } from '@/features/detailed-program/api/detailed-program-filter-params'
import type {
  DetailedProgramRequest,
  DetailedProgramResponse,
  DetailedProgramUpdateRequest,
  PageResponseDetailedProgramResponse,
} from '@/shared/api/generated/data-management/schemas'

/** OpenAPI v9 스키마에 아직 없을 수 있는 version. 없으면 undefined, 1로 채우지 않는다. */
export function readDetailedProgramVersion(dto: unknown): number | undefined {
  if (!dto || typeof dto !== 'object') return undefined
  const version = (dto as { version?: unknown }).version
  if (typeof version !== 'number' || !Number.isFinite(version)) return undefined
  return version
}

export function mapDetailedProgramResponse(dto: DetailedProgramResponse): DetailedProgramManagementRow {
  return {
    id: String(dto.id ?? ''),
    name: dto.nameKo?.trim() ?? '',
    active: dto.useYn ?? true,
    createdBy: dto.createdByName?.trim() || (dto.createdByAdminId != null ? String(dto.createdByAdminId) : '-'),
    createdAt: dto.createdAt ?? '',
    inUse: dto.inUse ?? false,
    version: readDetailedProgramVersion(dto),
  }
}

function readFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * 목록 1페이지 → 교재·후원사와 같은 데이터 관리 공통 페이지 형태 (QA-0363).
 * 전 페이지를 모으지 않고, 화면은 스크롤로 다음 페이지를 이어 받는다.
 */
export function mapDetailedProgramListPage(
  dto: PageResponseDetailedProgramResponse
): DataManagementListPage<DetailedProgramManagementRow> {
  const items = mapDetailedProgramListResponse(dto)
  const page = readFiniteNumber(dto.page, 0)
  const size = readFiniteNumber(dto.size, DETAILED_PROGRAM_API_PAGE_SIZE)
  const totalElements = readFiniteNumber(dto.totalElements, items.length)
  const totalPages = readFiniteNumber(
    dto.totalPages,
    size > 0 ? Math.ceil(totalElements / size) : 0
  )
  return { items, page, size, totalElements, totalPages, hasNext: page + 1 < totalPages }
}

export function mapDetailedProgramListResponse(
  dto: PageResponseDetailedProgramResponse
): DetailedProgramManagementRow[] {
  const items =
    dto.items ??
    (dto as PageResponseDetailedProgramResponse & { content?: DetailedProgramResponse[] }).content ??
    []
  return items.map(mapDetailedProgramResponse)
}

export function toDetailedProgramRequest(input: {
  name: string
  active: boolean
  nameEn?: string
}): DetailedProgramRequest {
  const nameEn = input.nameEn?.trim()
  return {
    nameKo: input.name.trim(),
    ...(nameEn ? { nameEn } : {}),
    useYn: input.active,
  }
}

/** PATCH는 nameKo·useYn·version. nameEn은 보내도 BE가 무시한다. */
export function toDetailedProgramPatchRequest(input: {
  name: string
  active: boolean
  version: number
}): DetailedProgramUpdateRequest {
  return {
    nameKo: input.name.trim(),
    useYn: input.active,
    version: input.version,
  }
}
