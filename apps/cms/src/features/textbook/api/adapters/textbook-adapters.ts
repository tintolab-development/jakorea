import type { TextbookCreateInput, TextbookRow } from '@/features/textbook/model/textbook.types'
import type {
  PageResponseTextbookResponse,
  TextbookRequest,
  TextbookResponse,
} from '@/shared/api/generated/data-management/schemas'
import type { TextbookBusinessArea } from '@/features/textbook/model/textbook-business-areas'
import type { TextbookEducationTarget } from '@/features/textbook/model/textbook-education-targets'

export function mapTextbookResponse(dto: TextbookResponse): TextbookRow {
  return {
    id: dto.id ?? '',
    businessArea: (dto.businessArea ?? '') as TextbookBusinessArea,
    educationTarget: (dto.educationTarget ?? '') as TextbookEducationTarget,
    grade: dto.grade ?? '',
    textbookName: dto.textbookName ?? '',
    textbookNameEn: dto.textbookNameEn ?? '',
    educationStages: (dto.educationStages as TextbookRow['educationStages']) ?? [],
    useStatus: (dto.useStatus === 'UNUSED' ? 'UNUSED' : 'USED') as TextbookRow['useStatus'],
    registrant: dto.registrant ?? '-',
    registeredAt: dto.registeredAt ?? '',
  }
}

export function mapTextbookListResponse(dto: PageResponseTextbookResponse): TextbookRow[] {
  return (dto.items ?? []).map(mapTextbookResponse)
}

export function toTextbookRequest(input: TextbookCreateInput): TextbookRequest {
  return {
    useStatus: input.useStatus,
    textbookName: input.textbookName.trim(),
    textbookNameEn: input.textbookNameEn?.trim(),
    businessArea: input.businessArea,
    educationTarget: input.educationTarget,
    grade: input.grade,
    educationStages: input.educationStages,
  }
}
