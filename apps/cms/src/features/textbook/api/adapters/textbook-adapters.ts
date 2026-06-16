import type { TextbookCreateInput, TextbookRow, TextbookEducationStage, TextbookEducationStageKey } from '@/features/textbook/model/textbook.types'
import type {
  EducationStageDto,
  PageResponseTextbookResponse,
  TextbookRequest,
  TextbookResponse,
} from '@/shared/api/generated/data-management/schemas'
import type { TextbookBusinessArea } from '@/features/textbook/model/textbook-business-areas'
import type { TextbookEducationTarget } from '@/features/textbook/model/textbook-education-targets'

const STAGE_KEY_LABELS: Record<TextbookEducationStageKey, string> = {
  kindergarten: '유아',
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
  university: '대학교',
}

function parseStageKey(stage: string | undefined): TextbookEducationStageKey {
  if (
    stage === 'kindergarten' ||
    stage === 'elementary' ||
    stage === 'middle' ||
    stage === 'high' ||
    stage === 'university'
  ) {
    return stage
  }
  switch (stage) {
    case '유아':
      return 'kindergarten'
    case '초등학교':
      return 'elementary'
    case '중학교':
      return 'middle'
    case '고등학교':
      return 'high'
    case '대학교':
      return 'university'
    default:
      return 'elementary'
  }
}

function mapEducationStagesFromDto(dtos?: EducationStageDto[]): TextbookEducationStage[] {
  if (!dtos?.length) return []
  return dtos.map(dto => {
    const key = parseStageKey(dto.stage)
    const selectedGrades = dto.grades ?? []
    return {
      key,
      label: STAGE_KEY_LABELS[key] ?? dto.stage ?? key,
      selected: true,
      grades:
        selectedGrades.length > 0
          ? selectedGrades.map(label => ({ label, selected: true }))
          : undefined,
    }
  })
}

function toEducationStageDtos(stages?: TextbookEducationStage[]): EducationStageDto[] | undefined {
  if (!stages?.length) return undefined
  const active = stages.filter(
    stage => stage.selected || (stage.grades?.some(grade => grade.selected) ?? false)
  )
  if (!active.length) return undefined
  return active.map(stage => ({
    stage: stage.key,
    gradeFrom: stage.grades?.find(g => g.selected)?.label,
    gradeTo: stage.grades?.filter(g => g.selected).at(-1)?.label,
    grades: stage.grades?.filter(g => g.selected).map(g => g.label),
  }))
}

export function mapTextbookResponse(dto: TextbookResponse): TextbookRow {
  return {
    id: dto.id ?? '',
    businessArea: (dto.businessArea ?? '') as TextbookBusinessArea,
    educationTarget: (dto.educationTarget ?? '') as TextbookEducationTarget,
    grade: dto.grade ?? '',
    textbookName: dto.textbookName ?? '',
    textbookNameEn: dto.textbookNameEn ?? '',
    educationStages: mapEducationStagesFromDto(dto.educationStages),
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
    educationStages: toEducationStageDtos(input.educationStages),
  }
}
