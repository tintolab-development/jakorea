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

function stripEducationTargetPrefix(educationTarget: string, grade: string): string {
  const raw = grade.trim()
  if (!raw) return ''
  if (raw.startsWith(`${educationTarget}:`)) {
    return raw.slice(educationTarget.length + 1).trim()
  }
  if (raw.startsWith(`${educationTarget} `)) {
    return raw.slice(educationTarget.length + 1).trim()
  }
  return raw
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

  const raw = stripEducationTargetPrefix(educationTarget, grade)
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

  const hasAll = next.includes(allValue)
  const addedAll = hasAll && !previousValues.includes(allValue)
  if (addedAll) return [allValue]

  const withoutAll = next.filter(value => value !== allValue)
  if (hasAll && withoutAll.length === 0) return [allValue]

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
  const raw = value.trim()
  if (!raw) return null

  const sep = raw.indexOf(GRADE_VALUE_SEP)
  if (sep > 0 && sep < raw.length - 1) {
    const target = raw.slice(0, sep)
    const grade = raw.slice(sep + 1).trim()
    if ((TEXTBOOK_EDUCATION_TARGETS as readonly string[]).includes(target) && grade) {
      return { target: target as TextbookEducationTarget, grade }
    }
  }

  const byLength = [...TEXTBOOK_EDUCATION_TARGETS].sort((a, b) => b.length - a.length)
  for (const target of byLength) {
    if (raw.startsWith(`${target} `)) {
      const grade = raw.slice(target.length + 1).trim()
      if (grade) return { target, grade }
    }
  }
  return null
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
  const allowed = new Set(orderedEducationTargets(targets))
  if (decoded && allowed.has(decoded.target)) return decoded

  const fallbackTarget = targets[0]
  if (targets.length === 1 && fallbackTarget && value.trim()) {
    return {
      target: fallbackTarget as TextbookEducationTarget,
      grade: stripEducationTargetPrefix(fallbackTarget, value),
    }
  }
  return null
}

function findTargetTokenIndex(raw: string, target: string): number {
  let from = 0
  while (from <= raw.length) {
    const index = raw.indexOf(target, from)
    if (index < 0) return -1
    const before = index === 0 ? '' : raw[index - 1]
    const after = raw[index + target.length] ?? ''
    const beforeOk = index === 0 || /[\s,]/.test(before)
    const afterOk = after === '' || /[\s,:]/.test(after)
    if (beforeOk && afterOk) return index
    from = index + 1
  }
  return -1
}

function splitGradeSummaryByTargets(
  grade: string,
  targets: readonly TextbookEducationTarget[]
): Map<TextbookEducationTarget, string> {
  const raw = grade.trim()
  const result = new Map<TextbookEducationTarget, string>()
  if (!raw || targets.length === 0) return result

  if (targets.length === 1 && targets[0]) {
    result.set(targets[0], stripEducationTargetPrefix(targets[0], raw))
    return result
  }

  const hits = targets
    .map(target => ({ target, index: findTargetTokenIndex(raw, target) }))
    .filter(hit => hit.index >= 0)
    .sort((a, b) => a.index - b.index)

  if (hits.length === 0) return result

  for (let i = 0; i < hits.length; i += 1) {
    const current = hits[i]
    if (!current) continue
    const start = current.index + current.target.length
    const end = hits[i + 1]?.index ?? raw.length
    const part = raw.slice(start, end).replace(/^[\s,:]+/, '').replace(/[\s,]+$/, '')
    result.set(current.target, part)
  }
  return result
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

function pruneTextbookRegisterGradesForTargets(
  targets: readonly string[] | null | undefined,
  grades: readonly string[] | null | undefined
): string[] {
  const ordered = orderedEducationTargets(targets)
  const grouped = groupGradesByTarget(grades, ordered)
  return ordered.flatMap(target => {
    const list = grouped.get(target) ?? []
    return list.map(grade => encodeTextbookRegisterGradeValue(target, grade))
  })
}

/** 교육 대상 변경 후: 제거된 대상 학년은 버리고, 대학교만 선택 시 학년이 없으면 `전체` 1개. */
export function syncTextbookRegisterGradesAfterTargetsChange(
  nextTargets: readonly string[] | null | undefined,
  previousGrades: readonly string[] | null | undefined
): string[] {
  const ordered = orderedEducationTargets(nextTargets)
  const pruned = pruneTextbookRegisterGradesForTargets(ordered, previousGrades)
  const grouped = groupGradesByTarget(pruned, ordered)
  const extras: string[] = []
  for (const target of ordered) {
    if ((grouped.get(target) ?? []).length > 0) continue
    if (target !== '대학교') continue
    const allValue = registerGradeAllValue(target)
    if (allValue) extras.push(encodeTextbookRegisterGradeValue(target, allValue))
  }
  return [...pruned, ...extras]
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
  if (selected.length === 0) return []
  const raw = grade.trim()
  if (!raw) return []

  const segments = splitGradeSummaryByTargets(raw, selected)
  return selected.flatMap(target => {
    const part = segments.get(target)
    if (!part) return []
    return parseTextbookRegisterGradeValues(target, part).map(value =>
      encodeTextbookRegisterGradeValue(target, value)
    )
  })
}
