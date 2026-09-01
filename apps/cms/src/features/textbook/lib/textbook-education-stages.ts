import type { TextbookEducationTarget } from '@/features/textbook/model/textbook-education-targets'
import type {
  TextbookEducationStage,
  TextbookEducationStageKey,
} from '@/features/textbook/model/textbook.types'

const EDUCATION_STAGE_META: Array<{
  key: TextbookEducationStageKey
  label: string
  hasGrades: boolean
}> = [
  { key: 'kindergarten', label: '유아', hasGrades: true },
  { key: 'elementary', label: '초등학교', hasGrades: true },
  { key: 'middle', label: '중학교', hasGrades: true },
  { key: 'high', label: '고등학교', hasGrades: true },
  { key: 'university', label: '대학교', hasGrades: false },
]

const ELEMENTARY_GRADE_LABELS = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'] as const
const MIDDLE_HIGH_GRADE_LABELS = ['1학년', '2학년', '3학년'] as const
const KINDERGARTEN_LABELS = ['유아', '유치원생'] as const

/** API·OpenAPI 예시(ELEMENTARY 등)와 한글 라벨을 stage key로 통일 */
export function toEducationStageKey(target: string): TextbookEducationStageKey | null {
  const raw = target.trim()
  if (!raw) return null

  switch (raw) {
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
      break
  }

  switch (raw.toLowerCase()) {
    case 'kindergarten':
    case 'infant':
    case 'preschool':
      return 'kindergarten'
    case 'elementary':
      return 'elementary'
    case 'middle':
    case 'middle_school':
    case 'middleschool':
      return 'middle'
    case 'high':
    case 'high_school':
    case 'highschool':
      return 'high'
    case 'university':
    case 'college':
      return 'university'
    default:
      return null
  }
}

/** 요약용 교육 대상 — 영문 enum이면 한글 라벨로 */
export function normalizeEducationTargetLabel(target: string): TextbookEducationTarget | '' {
  const key = toEducationStageKey(target)
  return key ? mapStageKeyToEducationTarget(key) : ''
}

export function mapStageKeyToEducationTarget(
  stageKey: TextbookEducationStageKey
): TextbookEducationTarget {
  switch (stageKey) {
    case 'kindergarten':
      return '유아'
    case 'elementary':
      return '초등학교'
    case 'middle':
      return '중학교'
    case 'high':
      return '고등학교'
    case 'university':
      return '대학교'
    default:
      return '초등학교'
  }
}

export function getStageAllLabel(stageKey: TextbookEducationStageKey): string {
  switch (stageKey) {
    case 'elementary':
    case 'middle':
    case 'high':
      return '전학년'
    default:
      return '전체'
  }
}

export function getStageOptionLabels(stageKey: TextbookEducationStageKey): readonly string[] {
  switch (stageKey) {
    case 'kindergarten':
      return KINDERGARTEN_LABELS
    case 'elementary':
      return ELEMENTARY_GRADE_LABELS
    case 'middle':
    case 'high':
      return MIDDLE_HIGH_GRADE_LABELS
    default:
      return []
  }
}

function gradeLabelsForStage(stageKey: TextbookEducationStageKey): readonly string[] {
  return getStageOptionLabels(stageKey)
}

/** API 학년 토큰 → UI 라벨 (`3` / `GRADE_3` / `3학년` / `유아` 등) */
export function normalizeGradeToken(
  stageKey: TextbookEducationStageKey,
  raw: string
): string | null {
  const token = raw.trim()
  if (!token) return null

  const options = gradeLabelsForStage(stageKey)
  if (options.includes(token as (typeof options)[number])) return token

  const upper = token.toUpperCase()
  if (
    token === '전학년' ||
    token === '전체' ||
    upper === 'ALL' ||
    upper === 'FULL' ||
    upper === 'ENTIRE'
  ) {
    return getStageAllLabel(stageKey)
  }

  if (stageKey === 'kindergarten') {
    if (upper === 'INFANT' || upper === 'TODDLER') return '유아'
    if (upper === 'KINDERGARTEN' || upper === 'PRESCHOOL') return '유치원생'
    return null
  }

  const numbered = token.match(/^(?:GRADE[_-]?)?(\d)(?:학년)?$/i)
  if (numbered) {
    const label = `${numbered[1]}학년`
    return options.includes(label as (typeof options)[number]) ? label : null
  }

  return null
}

/**
 * 요약 `grade` 문자열에서 선택된 UI 라벨 집합.
 * - `3학년` / `3`
 * - `3-6` / `3~6` / `3학년-6학년` (범위)
 * - `전학년` / `전체` / `ALL` → 해당 stage 전체
 */
export function resolveSelectedGradeLabels(
  stageKey: TextbookEducationStageKey,
  summaryGrade: string
): ReadonlySet<string> {
  const options = gradeLabelsForStage(stageKey)
  const selected = new Set<string>()
  const raw = summaryGrade.trim()
  if (!raw || options.length === 0) return selected

  const asAll = normalizeGradeToken(stageKey, raw)
  if (asAll === getStageAllLabel(stageKey)) {
    options.forEach(label => selected.add(label))
    return selected
  }

  const rangeMatch = raw.match(
    /^(?:GRADE[_-]?)?(\d)(?:학년)?\s*[-~～〜]\s*(?:GRADE[_-]?)?(\d)(?:학년)?$/i
  )
  if (rangeMatch) {
    const from = Number(rangeMatch[1])
    const to = Number(rangeMatch[2])
    const start = Math.min(from, to)
    const end = Math.max(from, to)
    for (let n = start; n <= end; n += 1) {
      const label = `${n}학년`
      if (options.includes(label as (typeof options)[number])) selected.add(label)
    }
    return selected
  }

  const single = normalizeGradeToken(stageKey, raw)
  if (single && options.includes(single as (typeof options)[number])) {
    selected.add(single)
  }
  return selected
}

function isGradeSelectedForStage(
  stageKey: TextbookEducationStageKey,
  summaryGrade: string,
  label: string
): boolean {
  return resolveSelectedGradeLabels(stageKey, summaryGrade).has(label)
}

function buildStageGrades(
  stageKey: TextbookEducationStageKey,
  stageSelected: boolean,
  summaryGrade: string
): TextbookEducationStage['grades'] {
  const labels = gradeLabelsForStage(stageKey)
  if (labels.length === 0) return undefined
  return labels.map(label => ({
    label,
    selected: stageSelected && isGradeSelectedForStage(stageKey, summaryGrade, label),
  }))
}

/** 교육 대상·학년 요약값으로 5개 stage UI 상태 생성 */
export function buildEducationStages(
  target: string,
  grade: string
): TextbookEducationStage[] {
  const selectedStageKey = toEducationStageKey(target)

  return EDUCATION_STAGE_META.map(stage => {
    const selected = stage.key === selectedStageKey
    if (!stage.hasGrades) {
      return {
        key: stage.key,
        label: stage.label,
        selected,
      }
    }

    return {
      key: stage.key,
      label: stage.label,
      selected: selected && (grade === '전학년' || grade === '전체' || gradeLabelsForStage(stage.key).every(
        label => isGradeSelectedForStage(stage.key, grade, label)
      )),
      grades: buildStageGrades(stage.key, selected, grade),
    }
  })
}

function cloneStages(stages: TextbookEducationStage[] | undefined): TextbookEducationStage[] | null {
  if (!stages?.length) return null
  return stages.map(stage => ({
    ...stage,
    grades: stage.grades?.map(grade => ({ ...grade })),
  }))
}

function syncStageSelectedFromGrades(stage: TextbookEducationStage): TextbookEducationStage {
  if (!stage.grades?.length) {
    return stage
  }

  const selectedCount = stage.grades.filter(grade => grade.selected).length
  if (selectedCount === 0) {
    return { ...stage, selected: false }
  }

  const allSelected = stage.grades.every(grade => grade.selected)
  return { ...stage, selected: allSelected }
}

function hasIncomingGradeSelections(stage: TextbookEducationStage): boolean {
  return stage.grades?.some(grade => grade.selected) ?? false
}

function cloneStageGrades(stage: TextbookEducationStage): TextbookEducationStage {
  return {
    ...stage,
    grades: stage.grades?.map(grade => ({ ...grade })),
  }
}

/** API·폼 입력 stage를 5개 stage UI 상태로 정규화 */
export function normalizeEducationStages(
  stages: TextbookEducationStage[] | undefined,
  fallbackTarget: string,
  fallbackGrade: string
): TextbookEducationStage[] {
  const base = buildEducationStages(fallbackTarget, fallbackGrade)
  const incoming = cloneStages(stages)
  if (!incoming) return base

  const incomingMap = new Map(incoming.map(stage => [stage.key, stage]))
  return base.map(stage => {
    const matched = incomingMap.get(stage.key)
    if (!matched) return stage

    if (stage.key === 'university') {
      return { ...stage, selected: stage.selected || Boolean(matched.selected) }
    }

    if (!hasIncomingGradeSelections(matched)) {
      if (matched.selected || stage.selected) {
        return cloneStageGrades(stage)
      }
      return stage
    }

    const optionLabels = gradeLabelsForStage(stage.key)
    const matchedByLabel = new Map(
      (matched.grades ?? []).flatMap(item => {
        const normalized = normalizeGradeToken(stage.key, item.label)
        return normalized ? ([[normalized, item.selected]] as const) : []
      })
    )
    const merged = {
      ...stage,
      selected: Boolean(matched.selected),
      grades: optionLabels.map(label => ({
        label,
        selected: Boolean(matchedByLabel.get(label)),
      })),
    }
    const synced = syncStageSelectedFromGrades(merged)
    // DTO 학년 라벨이 UI와 안 맞으면 fallback(educationTarget/grade) 선택 유지
    if (
      !(synced.selected || (synced.grades?.some(grade => grade.selected) ?? false)) &&
      (matched.selected || stage.selected)
    ) {
      return cloneStageGrades(stage)
    }
    return synced
  })
}

export function summarizeEducationStages(stages: TextbookEducationStage[]): {
  educationTarget: TextbookEducationTarget
  grade: string
} {
  const selectedStage =
    stages.find(stage => stage.selected || (stage.grades ?? []).some(grade => grade.selected)) ??
    null

  if (!selectedStage) {
    return { educationTarget: '초등학교', grade: '전학년' }
  }

  const selectedGrades =
    selectedStage.grades?.filter(grade => grade.selected).map(grade => grade.label) ?? []

  if (selectedStage.key === 'university') {
    return { educationTarget: '대학교', grade: '전학년' }
  }

  if (selectedStage.key === 'kindergarten') {
    return {
      educationTarget: '유아',
      grade:
        selectedGrades.length === 1 ? selectedGrades[0] : '전학년',
    }
  }

  const grade =
    selectedGrades.length === 1 && selectedStage.selected === false
      ? selectedGrades[0]
      : selectedStage.selected || selectedGrades.length >= 2
        ? '전학년'
        : selectedGrades[0] ?? '전학년'

  return {
    educationTarget: mapStageKeyToEducationTarget(selectedStage.key),
    grade,
  }
}

function clearStageSelection(stage: TextbookEducationStage): TextbookEducationStage {
  return {
    ...stage,
    selected: false,
    grades: stage.grades?.map(grade => ({ ...grade, selected: false })),
  }
}

function selectAllGrades(stage: TextbookEducationStage): TextbookEducationStage {
  if (!stage.grades?.length) {
    return { ...stage, selected: true }
  }
  return {
    ...stage,
    selected: true,
    grades: stage.grades.map(grade => ({ ...grade, selected: true })),
  }
}

/** 한 교육 대상 row의 전체(전학년) 토글 — 다른 stage는 해제 */
export function toggleEducationStageAll(
  stages: TextbookEducationStage[],
  stageKey: TextbookEducationStageKey
): TextbookEducationStage[] {
  const current = stages.find(stage => stage.key === stageKey)
  if (!current) return stages

  const nextActive = !(
    current.selected ||
    (current.grades ?? []).some(grade => grade.selected)
  )

  return stages.map(stage => {
    if (stage.key !== stageKey) {
      return clearStageSelection(stage)
    }
    if (!nextActive) {
      return clearStageSelection(stage)
    }
    return selectAllGrades(stage)
  })
}

/** 한 교육 대상 row의 개별 학년 토글 — 다른 stage는 해제 */
export function toggleEducationStageGrade(
  stages: TextbookEducationStage[],
  stageKey: TextbookEducationStageKey,
  gradeLabel: string
): TextbookEducationStage[] {
  return stages.map(stage => {
    if (stage.key !== stageKey) {
      return clearStageSelection(stage)
    }

    const nextGrades = stage.grades?.map(grade =>
      grade.label === gradeLabel ? { ...grade, selected: !grade.selected } : grade
    )
    const merged = {
      ...stage,
      grades: nextGrades,
    }
    return syncStageSelectedFromGrades(merged)
  })
}

export function isEducationStageGradeSelected(
  stage: TextbookEducationStage,
  label: string
): boolean {
  return stage.grades?.find(grade => grade.label === label)?.selected ?? false
}

/** 전체(전학년) 체크박스 표시 */
export function isEducationStageMasterChecked(stage: TextbookEducationStage): boolean {
  return stage.selected
}
