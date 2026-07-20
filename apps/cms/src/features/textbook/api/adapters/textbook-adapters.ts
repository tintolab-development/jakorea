import type { TextbookCreateInput, TextbookRow, TextbookEducationStage, TextbookEducationStageKey } from '@/features/textbook/model/textbook.types'
import { normalizeEducationStages, getStageOptionLabels } from '@/features/textbook/lib/textbook-education-stages'
import type {
  EducationStageDto,
  PageResponseTextbookResponse,
  TextbookMatchResponse,
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
    const selectedGrades = resolveDtoGradeLabels(dto, key)
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

function resolveDtoGradeLabels(
  dto: EducationStageDto,
  stageKey: TextbookEducationStageKey
): string[] {
  if (dto.grades?.length) return dto.grades

  const optionLabels = [...getStageOptionLabels(stageKey)]
  if (dto.gradeFrom && dto.gradeTo && dto.gradeFrom !== dto.gradeTo) {
    const fromIndex = optionLabels.indexOf(dto.gradeFrom)
    const toIndex = optionLabels.indexOf(dto.gradeTo)
    if (fromIndex >= 0 && toIndex >= 0) {
      const start = Math.min(fromIndex, toIndex)
      const end = Math.max(fromIndex, toIndex)
      return optionLabels.slice(start, end + 1)
    }
  }

  if (dto.gradeFrom) return [dto.gradeFrom]
  return []
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
  const educationTarget = (dto.educationTarget ?? '') as TextbookEducationTarget
  const grade = dto.grade ?? ''
  return {
    id: dto.id ?? '',
    businessArea: (dto.businessArea ?? '') as TextbookBusinessArea,
    educationTarget,
    grade,
    textbookName: dto.textbookName ?? '',
    textbookNameEn: dto.textbookNameEn ?? '',
    educationStages: normalizeEducationStages(
      mapEducationStagesFromDto(dto.educationStages),
      educationTarget,
      grade
    ),
    useStatus: (dto.useStatus === 'UNUSED' ? 'UNUSED' : 'USED') as TextbookRow['useStatus'],
    registrant: dto.registrant ?? '-',
    registeredAt: dto.registeredAt ?? '',
  }
}

export function mapTextbookListResponse(dto: PageResponseTextbookResponse): TextbookRow[] {
  return (dto.items ?? []).map(mapTextbookResponse)
}

export function mapTextbookMatchResponse(dto: TextbookMatchResponse): TextbookRow {
  return {
    id: dto.id ?? '',
    businessArea: (dto.businessArea ?? '') as TextbookBusinessArea,
    educationTarget: (dto.educationTarget ?? '') as TextbookEducationTarget,
    grade: dto.grade ?? '',
    textbookName: dto.textbookName ?? '',
    textbookNameEn: dto.textbookNameEn ?? '',
    educationStages: [],
    useStatus: 'USED',
    registrant: '-',
    registeredAt: '',
  }
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
