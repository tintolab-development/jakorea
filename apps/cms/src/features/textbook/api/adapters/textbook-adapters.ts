import type {
  TextbookCreateInput,
  TextbookRow,
  TextbookEducationStage,
  TextbookEducationStageKey,
} from '@/features/textbook/model/textbook.types'
import {
  getStageAllLabel,
  getStageOptionLabels,
  normalizeEducationStages,
  normalizeEducationTargetLabel,
  normalizeGradeToken,
  resolveSelectedGradeLabels,
  summarizeEducationStages,
  toEducationStageKey,
} from '@/features/textbook/lib/textbook-education-stages'
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
  return toEducationStageKey(stage ?? '') ?? 'elementary'
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
  if (dto.grades?.length) {
    const normalized = dto.grades.flatMap(raw => {
      const asAll = normalizeGradeToken(stageKey, raw)
      if (asAll === getStageAllLabel(stageKey)) {
        return [...getStageOptionLabels(stageKey)]
      }
      const fromRange = [...resolveSelectedGradeLabels(stageKey, raw)]
      if (fromRange.length > 0) return fromRange
      const single = normalizeGradeToken(stageKey, raw)
      return single && single !== getStageAllLabel(stageKey) ? [single] : []
    })
    return [...new Set(normalized)]
  }

  const optionLabels = [...getStageOptionLabels(stageKey)]
  if (dto.gradeFrom && dto.gradeTo && dto.gradeFrom !== dto.gradeTo) {
    const fromLabel = normalizeGradeToken(stageKey, dto.gradeFrom) ?? dto.gradeFrom
    const toLabel = normalizeGradeToken(stageKey, dto.gradeTo) ?? dto.gradeTo
    const fromIndex = optionLabels.indexOf(fromLabel)
    const toIndex = optionLabels.indexOf(toLabel)
    if (fromIndex >= 0 && toIndex >= 0) {
      const start = Math.min(fromIndex, toIndex)
      const end = Math.max(fromIndex, toIndex)
      return optionLabels.slice(start, end + 1)
    }
    return [...resolveSelectedGradeLabels(stageKey, `${dto.gradeFrom}-${dto.gradeTo}`)]
  }

  if (dto.gradeFrom) {
    const single = normalizeGradeToken(stageKey, dto.gradeFrom)
    if (single === getStageAllLabel(stageKey)) return optionLabels
    if (single) return [single]
    return [...resolveSelectedGradeLabels(stageKey, dto.gradeFrom)]
  }
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

function normalizeSummaryGrade(
  educationTarget: string,
  grade: string
): string {
  const stageKey = toEducationStageKey(educationTarget)
  if (!stageKey || !grade.trim()) return grade
  const selected = resolveSelectedGradeLabels(stageKey, grade)
  if (selected.size === 0) return grade
  const options = getStageOptionLabels(stageKey)
  if (options.length > 0 && selected.size === options.length) {
    return getStageAllLabel(stageKey)
  }
  if (selected.size === 1) return [...selected][0] ?? grade
  const ordered = options.filter(label => selected.has(label))
  if (ordered.length >= 2) {
    return `${ordered[0]?.replace('학년', '')}-${ordered.at(-1)?.replace('학년', '')}`
  }
  return grade
}

export function mapTextbookResponse(dto: TextbookResponse): TextbookRow {
  const rawTarget = dto.educationTarget ?? ''
  const rawGrade = dto.grade ?? ''
  const educationTarget =
    normalizeEducationTargetLabel(rawTarget) ||
    (rawTarget as TextbookEducationTarget | '')
  const educationStages = normalizeEducationStages(
    mapEducationStagesFromDto(dto.educationStages),
    educationTarget || rawTarget,
    rawGrade
  )
  const summary = summarizeEducationStages(educationStages)
  const hasSelection = educationStages.some(
    stage => stage.selected || (stage.grades?.some(grade => grade.selected) ?? false)
  )

  return {
    // BE가 number로 내려줘도 쿼리키·캐시 키가 흔들리지 않게 문자열로 고정
    id: dto.id == null || dto.id === '' ? '' : String(dto.id),
    businessArea: (dto.businessArea ?? '') as TextbookBusinessArea,
    educationTarget: (hasSelection ? summary.educationTarget : educationTarget) as TextbookEducationTarget,
    grade: hasSelection
      ? summary.grade
      : normalizeSummaryGrade(educationTarget || rawTarget, rawGrade),
    textbookName: dto.textbookName ?? '',
    textbookNameEn: dto.textbookNameEn ?? '',
    educationStages,
    useStatus: (dto.useStatus === 'UNUSED' ? 'UNUSED' : 'USED') as TextbookRow['useStatus'],
    registrant: dto.registrant ?? '-',
    registeredAt: dto.registeredAt ?? '',
  }
}

export function mapTextbookListResponse(dto: PageResponseTextbookResponse): TextbookRow[] {
  return (dto.items ?? []).map(mapTextbookResponse)
}

export function mapTextbookMatchResponse(dto: TextbookMatchResponse): TextbookRow {
  const educationTarget =
    normalizeEducationTargetLabel(dto.educationTarget ?? '') ||
    ((dto.educationTarget ?? '') as TextbookEducationTarget)
  return {
    id: dto.id == null || dto.id === '' ? '' : String(dto.id),
    businessArea: (dto.businessArea ?? '') as TextbookBusinessArea,
    educationTarget,
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
