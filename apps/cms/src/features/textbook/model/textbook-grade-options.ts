/**
 * 교재 관리 — 대상 학년 셀렉트 옵션 (필터·등록 공통)
 * @see apps/cms/src/pages/data-management/textbook-page.tsx
 */

import {
  formatSelectedGradeSummary,
  getStageAllLabel,
  getStageOptionLabels,
  resolveSelectedGradeLabels,
  toEducationStageKey,
} from '@/features/textbook/lib/textbook-education-stages'
import {
  TEXTBOOK_EDUCATION_TARGETS,
  type TextbookEducationTarget,
} from '@/features/textbook/model/textbook-education-targets'
import type { TextbookEducationStage } from '@/features/textbook/model/textbook.types'

export type TextbookGradeOption = { label: string; value: string }

/** 유아·대학교 — 해당 단계 전체 */
const STAGE_WHOLE_OPTION: TextbookGradeOption = { label: '전체', value: '전체' }

const GRADE_WHOLE_OPTION: TextbookGradeOption = { label: '전학년', value: '전학년' }

const GRADE_1_TO_3: TextbookGradeOption[] = ['1학년', '2학년', '3학년'].map(g => ({
  label: g,
  value: g,
}))

const GRADE_1_TO_6: TextbookGradeOption[] = [
  '1학년',
  '2학년',
  '3학년',
  '4학년',
  '5학년',
  '6학년',
].map(g => ({ label: g, value: g }))

/**
 * 목록 필터용. 교육 대상별 옵션.
 * 교육 대상 미선택(ALL)일 때는 빈 배열 — 셀렉트 비활성.
 */
export function textbookFilterGradeOptions(educationTarget: string): TextbookGradeOption[] {
  switch (educationTarget) {
    case '유아':
      return [STAGE_WHOLE_OPTION, { label: '유아', value: '유아' }, { label: '유치원생', value: '유치원생' }]
    case '초등학교':
      return [GRADE_WHOLE_OPTION, ...GRADE_1_TO_6]
    case '중학교':
    case '고등학교':
      return [GRADE_WHOLE_OPTION, ...GRADE_1_TO_3]
    case '대학교':
      return [STAGE_WHOLE_OPTION]
    default:
      return []
  }
}

/** 등록·수정용 — 필터와 동일 라벨·값 */
export function textbookRegisterGradeOptions(educationTarget: string): TextbookGradeOption[] {
  if (!educationTarget || educationTarget === 'ALL') return []
  return textbookFilterGradeOptions(educationTarget)
}

function registerGradeAllValue(educationTarget: string): string | undefined {
  return textbookRegisterGradeOptions(educationTarget).find(
    option => option.value === '전체' || option.value === '전학년'
  )?.value
}

/** 목록·상세 요약 `grade` → 등록 멀티셀렉트 값 */
export function parseTextbookRegisterGradeValues(
  educationTarget: string,
  grade: string
): string[] {
  const options = textbookRegisterGradeOptions(educationTarget)
  if (options.length === 0) return []
  const stageKey = toEducationStageKey(educationTarget)
  if (!stageKey) return []

  const raw = grade.trim()
  if (!raw) return []

  const allValue = registerGradeAllValue(educationTarget) ?? getStageAllLabel(stageKey)
  const selected = resolveSelectedGradeLabels(stageKey, raw)
  const optionLabels = getStageOptionLabels(stageKey)
  if (optionLabels.length > 0 && selected.size === optionLabels.length) {
    return [allValue]
  }
  if (selected.size > 0) {
    return optionLabels.filter(label => selected.has(label))
  }

  return options.some(option => option.value === raw) ? [raw] : []
}

/** 전학년/전체는 단독 선택. 개별 학년을 모두 고르면 전학년으로 접는다. */
function asGradeValueList(values: readonly string[] | null | undefined): string[] {
  return Array.isArray(values) ? values.filter(value => typeof value === 'string') : []
}

export function nextTextbookRegisterGradeValues(
  educationTarget: string,
  previous: readonly string[] | null | undefined,
  incoming: readonly string[] | null | undefined
): string[] {
  const options = textbookRegisterGradeOptions(educationTarget)
  const allowed = new Set(options.map(option => option.value))
  const allValue = registerGradeAllValue(educationTarget)
  const individualValues = options
    .filter(option => option.value !== allValue)
    .map(option => option.value)
  const previousValues = asGradeValueList(previous)
  const next = [...new Set(asGradeValueList(incoming).filter(value => allowed.has(value)))]
  if (!allValue) return next

  const addedAll = next.includes(allValue) && !previousValues.includes(allValue)
  if (addedAll) return [allValue]

  const withoutAll = next.filter(value => value !== allValue)
  if (individualValues.length > 0 && withoutAll.length === individualValues.length) {
    return [allValue]
  }
  return withoutAll
}

export function serializeTextbookRegisterGrades(
  educationTarget: string,
  selected: readonly string[] | null | undefined
): string {
  const selectedValues = asGradeValueList(selected)
  const stageKey = toEducationStageKey(educationTarget)
  if (!stageKey) return selectedValues.filter(Boolean).join(', ')
  const allValue = registerGradeAllValue(educationTarget) ?? getStageAllLabel(stageKey)
  if (selectedValues.includes(allValue)) return allValue
  return formatSelectedGradeSummary(stageKey, selectedValues)
}

const GRADE_VALUE_SEP = ':'

export function encodeTextbookRegisterGradeValue(target: string, grade: string): string {
  return `${target}${GRADE_VALUE_SEP}${grade}`
}

export function decodeTextbookRegisterGradeValue(
  value: string
): { target: TextbookEducationTarget; grade: string } | null {
  const sep = value.indexOf(GRADE_VALUE_SEP)
  if (sep <= 0 || sep === value.length - 1) return null
  const target = value.slice(0, sep)
  const grade = value.slice(sep + 1)
  if (!(TEXTBOOK_EDUCATION_TARGETS as readonly string[]).includes(target)) return null
  return { target: target as TextbookEducationTarget, grade }
}

function orderedEducationTargets(targets: readonly string[] | null | undefined): TextbookEducationTarget[] {
  const selected = new Set((targets ?? []).filter(Boolean))
  return TEXTBOOK_EDUCATION_TARGETS.filter(target => selected.has(target))
}

function decodeGradeValueForTargets(
  value: string,
  targets: readonly string[]
): { target: TextbookEducationTarget; grade: string } | null {
  const decoded = decodeTextbookRegisterGradeValue(value)
  if (decoded) return decoded
  const fallbackTarget = targets[0]
  if (targets.length === 1 && fallbackTarget && value) {
    return { target: fallbackTarget as TextbookEducationTarget, grade: value }
  }
  return null
}

function groupGradesByTarget(
  values: readonly string[] | null | undefined,
  targets: readonly string[]
): Map<TextbookEducationTarget, string[]> {
  const grouped = new Map<TextbookEducationTarget, string[]>()
  for (const value of asGradeValueList(values)) {
    const decoded = decodeGradeValueForTargets(value, targets)
    if (!decoded) continue
    const current = grouped.get(decoded.target) ?? []
    current.push(decoded.grade)
    grouped.set(decoded.target, current)
  }
  return grouped
}

/** 선택된 교육 대상들의 학년 옵션. 대상이 둘 이상이면 라벨에 대상을 붙인다. */
export function textbookRegisterGradeOptionsForTargets(
  targets: readonly string[] | null | undefined
): TextbookGradeOption[] {
  const selected = orderedEducationTargets(targets)
  if (selected.length === 0) return []
  const prefixLabels = selected.length > 1
  return selected.flatMap(target =>
    textbookRegisterGradeOptions(target).map(option => ({
      value: encodeTextbookRegisterGradeValue(target, option.value),
      label: prefixLabels ? `${target} ${option.label}` : option.label,
    }))
  )
}

export function nextTextbookRegisterGradeValuesForTargets(
  targets: readonly string[] | null | undefined,
  previous: readonly string[] | null | undefined,
  incoming: readonly string[] | null | undefined
): string[] {
  const selected = orderedEducationTargets(targets)
  const previousByTarget = groupGradesByTarget(previous, selected)
  const incomingByTarget = groupGradesByTarget(incoming, selected)
  return selected.flatMap(target =>
    nextTextbookRegisterGradeValues(
      target,
      previousByTarget.get(target) ?? [],
      incomingByTarget.get(target) ?? []
    ).map(grade => encodeTextbookRegisterGradeValue(target, grade))
  )
}

export function gradesByTargetFromRegisterValues(
  targets: readonly string[] | null | undefined,
  selected: readonly string[] | null | undefined
): Map<string, string[]> {
  const ordered = orderedEducationTargets(targets)
  const grouped = groupGradesByTarget(selected, ordered)
  const result = new Map<string, string[]>()
  for (const target of ordered) {
    result.set(target, grouped.get(target) ?? [])
  }
  return result
}

export function parseTextbookRegisterGradeValuesFromStages(
  stages: readonly TextbookEducationStage[] | null | undefined
): { targets: TextbookEducationTarget[]; grades: string[] } {
  const targets: TextbookEducationTarget[] = []
  const grades: string[] = []
  for (const target of TEXTBOOK_EDUCATION_TARGETS) {
    const key = toEducationStageKey(target)
    if (!key) continue
    const stage = (stages ?? []).find(item => item.key === key)
    if (!stage) continue
    const selectedLabels =
      stage.grades?.filter(grade => grade.selected).map(grade => grade.label) ?? []
    if (!(stage.selected || selectedLabels.length > 0)) continue
    targets.push(target)
    const summary = stage.selected
      ? (registerGradeAllValue(target) ?? getStageAllLabel(key))
      : selectedLabels.join(', ')
    for (const grade of parseTextbookRegisterGradeValues(target, summary)) {
      grades.push(encodeTextbookRegisterGradeValue(target, grade))
    }
  }
  return { targets, grades }
}

export function parseTextbookRegisterGradeValuesForTargets(
  targets: readonly string[] | null | undefined,
  grade: string
): string[] {
  const selected = orderedEducationTargets(targets)
  const target = selected[0]
  if (selected.length !== 1 || !target) return []
  return parseTextbookRegisterGradeValues(target, grade).map(value =>
    encodeTextbookRegisterGradeValue(target, value)
  )
}
