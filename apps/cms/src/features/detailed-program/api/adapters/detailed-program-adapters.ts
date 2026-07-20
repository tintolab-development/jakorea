import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'
import type {
  DetailedProgramRequest,
  DetailedProgramResponse,
  PageResponseDetailedProgramResponse,
} from '@/shared/api/generated/data-management/schemas'

/** UI에 businessArea 필드가 없어 등록·수정 시 기본값으로 사용 */
export const DEFAULT_DETAILED_PROGRAM_BUSINESS_AREA = 'GENERAL'

export function mapDetailedProgramResponse(dto: DetailedProgramResponse): DetailedProgramManagementRow {
  return {
    id: String(dto.id ?? ''),
    name: dto.nameKo?.trim() ?? '',
    active: dto.useYn ?? true,
    createdBy: dto.createdByAdminId != null ? String(dto.createdByAdminId) : '-',
    createdAt: dto.createdAt ?? '',
    inUse: false,
  }
}

export function mapDetailedProgramListResponse(
  dto: PageResponseDetailedProgramResponse
): DetailedProgramManagementRow[] {
  return (dto.items ?? []).map(mapDetailedProgramResponse)
}

export function toDetailedProgramRequest(input: {
  name: string
  active: boolean
  businessArea?: string
  nameEn?: string
}): DetailedProgramRequest {
  return {
    nameKo: input.name.trim(),
    nameEn: input.nameEn?.trim() ?? '',
    businessArea: input.businessArea?.trim() || DEFAULT_DETAILED_PROGRAM_BUSINESS_AREA,
    useYn: input.active,
  }
}
