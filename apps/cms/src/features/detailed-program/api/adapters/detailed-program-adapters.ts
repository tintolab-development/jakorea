import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'
import type {
  DetailedProgramRequest,
  DetailedProgramResponse,
  PageResponseDetailedProgramResponse,
} from '@/shared/api/generated/data-management/schemas'

export function mapDetailedProgramResponse(dto: DetailedProgramResponse): DetailedProgramManagementRow {
  return {
    id: String(dto.id ?? ''),
    name: dto.nameKo?.trim() ?? '',
    active: dto.useYn ?? true,
    createdBy: dto.createdByName?.trim() || (dto.createdByAdminId != null ? String(dto.createdByAdminId) : '-'),
    createdAt: dto.createdAt ?? '',
    inUse: dto.inUse ?? false,
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

/** PATCH는 nameKo·useYn만 갱신. nameEn은 보내도 BE가 무시한다. */
export function toDetailedProgramPatchRequest(input: {
  name: string
  active: boolean
}): DetailedProgramRequest {
  return {
    nameKo: input.name.trim(),
    useYn: input.active,
  }
}
