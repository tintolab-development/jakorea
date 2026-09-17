import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'
import type {
  DetailedProgramRequest,
  DetailedProgramResponse,
  PageResponseDetailedProgramResponse,
} from '@/shared/api/generated/data-management/schemas'

/**
 * 등록 시 businessArea는 `GET /api/admin/textbook-business-areas` 마스터 `name`만 사용.
 * 미선택·공백 폴백은 BE와 동일하게 `경제금융` (GENERAL 등 비마스터 코드 금지).
 */
export const DEFAULT_DETAILED_PROGRAM_BUSINESS_AREA = '경제금융'

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
  businessArea?: string
  nameEn?: string
}): DetailedProgramRequest {
  const nameEn = input.nameEn?.trim()
  const businessArea = input.businessArea?.trim()
  return {
    nameKo: input.name.trim(),
    ...(nameEn ? { nameEn } : {}),
    businessArea: businessArea || DEFAULT_DETAILED_PROGRAM_BUSINESS_AREA,
    useYn: input.active,
  }
}

/** PATCH는 nameKo·useYn만 갱신. nameEn/businessArea는 보내도 BE가 무시한다. */
export function toDetailedProgramPatchRequest(input: {
  name: string
  active: boolean
}): DetailedProgramRequest {
  return {
    nameKo: input.name.trim(),
    useYn: input.active,
  }
}
