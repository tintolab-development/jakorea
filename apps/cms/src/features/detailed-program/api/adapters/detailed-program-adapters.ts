import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'
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
