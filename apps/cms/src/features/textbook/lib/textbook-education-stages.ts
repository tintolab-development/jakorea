import {
  TEXTBOOK_EDUCATION_TARGETS,
  type TextbookEducationTarget,
} from '@/features/textbook/model/textbook-education-targets'
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

/** 단일·쉼표 구분 교육 대상을 고정 순서 한글 라벨로 */
export function parseEducationTargetLabels(target: string): TextbookEducationTarget[] {
  const raw = target.trim()
  if (!raw) return []
  const asSingle = normalizeEducationTargetLabel(raw)
  if (asSingle) return [asSingle]
  const seen = new Set<TextbookEducationTarget>()
  for (const part of raw.split(/\s*[,、]\s*/)) {
    const label = normalizeEducationTargetLabel(part)
    if (label) seen.add(label)
  }
  return TEXTBOOK_EDUCATION_TARGETS.filter(label => seen.has(label))
}

export function serializeEducationTargetLabels(targets: readonly string[]): string {
  const seen = new Set(targets.map(item => item.trim()).filter(Boolean))
  return TEXTBOOK_EDUCATION_TARGETS.filter(label => seen.has(label)).join(', ')
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

  const parts = raw
    .split(/\s*[,、]\s*/)
    .map(part => part.trim())
    .filter(Boolean)
  if (parts.length > 1) {
    for (const part of parts) {
      const single = normalizeGradeToken(stageKey, part)
      if (single && options.includes(single as (typeof options)[number])) selected.add(single)
    }
    if (selected.size > 0) return selected
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

function selectedStageKeysFromTarget(target: string): Set<TextbookEducationStageKey> {
  const keys = new Set<TextbookEducationStageKey>()
  for (const label of parseEducationTargetLabels(target)) {
    const key = toEducationStageKey(label)
    if (key) keys.add(key)
  }
  if (keys.size === 0) {
    const fallback = toEducationStageKey(target)
    if (fallback) keys.add(fallback)
  }
  return keys
}

/** 교육 대상·학년 요약값으로 5개 stage UI 상태 생성 */
export function buildEducationStages(
  target: string,
  grade: string
): TextbookEducationStage[] {
  const selectedKeys = selectedStageKeysFromTarget(target)

  return EDUCATION_STAGE_META.map(stage => {
    const selected = selectedKeys.has(stage.key)
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

/** 등록 멀티셀렉트 — 대상별 학년으로 5개 stage UI 상태 생성 */
export function buildEducationStagesFromSelections(
  targets: readonly string[],
  gradesByTarget: ReadonlyMap<string, readonly string[]>
): TextbookEducationStage[] {
  const selectedKeys = selectedStageKeysFromTarget(serializeEducationTargetLabels(targets))

  return EDUCATION_STAGE_META.map(stage => {
    const targetLabel = mapStageKeyToEducationTarget(stage.key)
    if (!selectedKeys.has(stage.key)) {
      if (!stage.hasGrades) {
        return { key: stage.key, label: stage.label, selected: false }
      }
      return {
        key: stage.key,
        label: stage.label,
        selected: false,
        grades: gradeLabelsForStage(stage.key).map(label => ({ label, selected: false })),
      }
    }

    const selectedGrades = [...(gradesByTarget.get(targetLabel) ?? [])]
    const allLabel = getStageAllLabel(stage.key)
    const optionLabels = gradeLabelsForStage(stage.key)
    const isAll =
      selectedGrades.includes(allLabel) ||
      (optionLabels.length > 0 && optionLabels.every(label => selectedGrades.includes(label)))

    if (!stage.hasGrades) {
      return { key: stage.key, label: stage.label, selected: true }
    }

    return {
      key: stage.key,
      label: stage.label,
      selected: isAll,
      grades: optionLabels.map(label => ({
        label,
        selected: isAll || selectedGrades.includes(label),
      })),
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

/** 상세 체크 학년 → 목록 대상 학년. 해당 단계 학년이 모두 선택된 때만 전학년 */
export function formatSelectedGradeSummary(
  stageKey: TextbookEducationStageKey,
  selectedGrades: string[]
): string {
  const options = getStageOptionLabels(stageKey)
  const ordered = options.filter(label => selectedGrades.includes(label))
  const labels = ordered.length > 0 ? ordered : selectedGrades.filter(Boolean)
  if (labels.length === 0) return getStageAllLabel(stageKey)
  if (options.length > 0 && labels.length === options.length) return getStageAllLabel(stageKey)
  if (labels.length === 1) return labels[0] ?? getStageAllLabel(stageKey)
  return labels.join(', ')
}

function summarizeStageGrade(stage: TextbookEducationStage): string {
  const selectedGrades =
    stage.grades?.filter(grade => grade.selected).map(grade => grade.label) ?? []

  if (stage.key === 'university') {
    return getStageAllLabel('university')
  }

  if (stage.key === 'kindergarten') {
    const wholeLabel = getStageAllLabel('kindergarten')
    return selectedGrades.length === 1 ? (selectedGrades[0] ?? wholeLabel) : wholeLabel
  }

  return formatSelectedGradeSummary(stage.key, selectedGrades)
}

export function summarizeEducationStages(stages: TextbookEducationStage[]): {
  educationTarget: string
  grade: string
} {
  const selectedStages = EDUCATION_STAGE_META.flatMap(meta => {
    const stage = stages.find(item => item.key === meta.key)
    if (!stage) return []
    if (!(stage.selected || (stage.grades ?? []).some(grade => grade.selected))) return []
    return [stage]
  })

  if (selectedStages.length === 0) {
    return { educationTarget: '초등학교', grade: '전학년' }
  }

  const educationTarget = selectedStages
    .map(stage => mapStageKeyToEducationTarget(stage.key))
    .join(', ')

  const grade = selectedStages
    .map(stage => {
      const label = mapStageKeyToEducationTarget(stage.key)
      const summary = summarizeStageGrade(stage)
      if (selectedStages.length === 1) return summary
      if (summary === label) return summary
      return `${label} ${summary}`
    })
    .join(', ')

  return { educationTarget, grade }
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

/** 한 교육 대상 row의 전체(전학년) 토글 — 다른 stage 선택은 유지 */
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
    if (stage.key !== stageKey) return stage
    if (!nextActive) {
      return clearStageSelection(stage)
    }
    return selectAllGrades(stage)
  })
}

/** 한 교육 대상 row의 개별 학년 토글 — 다른 stage 선택은 유지 */
export function toggleEducationStageGrade(
  stages: TextbookEducationStage[],
  stageKey: TextbookEducationStageKey,
  gradeLabel: string
): TextbookEducationStage[] {
  return stages.map(stage => {
    if (stage.key !== stageKey) return stage

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
