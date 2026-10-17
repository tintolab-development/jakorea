import type { GradeBlock } from '@/shared/api/generated/dashboard/schemas/gradeBlock'
import { normalizeStudentGradeLabelForClassOption } from './student-list-filter-fields'

export type StudentGradeClassSelectOption = {
  label: string
  value: string
  /** 등록 학급의 학년 라벨 — 여러 학년일 때 수정 드롭다운 필터용 */
  gradeLabel?: string
}

/** API `classes[].classNo` → roster `className` (`1`, `1반` 등) */
export function normalizeClassNameFromClassNo(classNo?: string | null): string | null {
  const trimmed = (classNo ?? '').trim()
  if (!trimmed) return null
  if (/^\d+반$/.test(trimmed)) return trimmed
  const match = trimmed.match(/^(\d+)/)
  if (match) {
    const parsed = Number.parseInt(match[1], 10)
    if (Number.isFinite(parsed) && parsed >= 1) return `${parsed}반`
  }
  return trimmed
}

/** Select value·명단 `gradeClass` 표시 — 단일 학년이면 `1반`, 다학년이면 `3학년 1반` */
export function formatGradeClassSelectDisplay(
  gradeLabel: string,
  className: string,
  useShortClassLabel: boolean
): string {
  const classPart = normalizeClassNameFromClassNo(className) ?? className.trim()
  if (!classPart) return gradeLabel.trim() || '-'
  if (useShortClassLabel) return classPart
  const grade = gradeLabel.trim()
  if (!grade) return classPart
  if (classPart.includes(grade)) return classPart
  const normalizedGrade = normalizeStudentGradeLabelForClassOption(grade) || grade
  return `${normalizedGrade} ${classPart}`
}

export function shouldUseShortGradeClassLabelForGrades(gradeLabels: string[]): boolean {
  const unique = new Set(
    gradeLabels.map(label => normalizeStudentGradeLabelForClassOption(label) || label.trim()).filter(Boolean)
  )
  return unique.size <= 1
}

/** 학생 명단·폼에 저장된 `gradeClass` 표시값을 학년·반으로 분리 */
export function parseStudentGradeClassDisplay(
  gradeClass: string,
  fallbackEducationGrade?: string | null
): { gradeLabel: string; classPart: string } {
  const trimmed = gradeClass.trim()
  if (!trimmed) {
    return { gradeLabel: fallbackEducationGrade?.trim() ?? '', classPart: '' }
  }

  const withClassSuffix = trimmed.match(/^(.+?)\s+(\d+반)$/)
  if (withClassSuffix) {
    return { gradeLabel: withClassSuffix[1].trim(), classPart: withClassSuffix[2] }
  }

  if (/^\d+반$/.test(trimmed)) {
    return { gradeLabel: fallbackEducationGrade?.trim() ?? '', classPart: trimmed }
  }

  return { gradeLabel: fallbackEducationGrade?.trim() ?? '', classPart: trimmed }
}

/** 학생 명단·출석 테이블·엑셀 학급 컬럼 — 학년 없이 반(예: 1반)만 표시 */
export function formatStudentGradeClassColumnLabel(gradeClass?: string | null): string {
  const trimmed = (gradeClass ?? '').trim()
  if (!trimmed) return '-'

  const { classPart } = parseStudentGradeClassDisplay(trimmed)
  const normalizedClassPart = classPart.trim()
  if (/^\d+반$/.test(normalizedClassPart)) return normalizedClassPart

  const fromFull = trimmed.match(/(\d+반)$/)
  if (fromFull) return fromFull[1]

  if (/^\d+반$/.test(trimmed)) return trimmed

  return normalizedClassPart || trimmed || '-'
}

/** PUT roster API용 grade / className */
export function parseStudentGradeClassForRosterApi(
  gradeClass: string,
  educationGrade?: string | null
): { grade: string; className: string } {
  const parsed = parseStudentGradeClassDisplay(gradeClass, educationGrade)
  const institutionGrade = educationGrade?.trim() ?? ''
  const grade =
    normalizeStudentGradeLabelForClassOption(parsed.gradeLabel) ||
    institutionGrade ||
    parsed.gradeLabel ||
    '-'
  const className = parsed.classPart.trim() || gradeClass.trim() || '-'
  return { grade, className }
}

function collectRegisteredSections(
  gradeBlocks: GradeBlock[] | null | undefined
): Array<{ gradeLabel: string; className: string }> {
  if (!gradeBlocks?.length) return []

  const sections: Array<{ gradeLabel: string; className: string }> = []
  for (const block of gradeBlocks) {
    const gradeLabel = block.gradeLabel?.trim() ?? ''
    for (const room of block.classes ?? []) {
      const className = normalizeClassNameFromClassNo(room.classNo)
      if (!className) continue
      sections.push({ gradeLabel, className })
    }
  }
  return sections
}

/**
 * 기관 신청 `gradeBlocks[].classes[]` 기준 등록 학급 Select 옵션.
 * `classCount`만 있고 `classes`가 비어 있으면 옵션을 만들지 않는다.
 */
export function buildRegisteredGradeClassSelectOptions(
  gradeBlocks: GradeBlock[] | null | undefined,
  educationGrade?: string | null
): StudentGradeClassSelectOption[] {
  const sections = collectRegisteredSections(gradeBlocks)
  if (sections.length === 0) return []

  const institutionGrade = normalizeStudentGradeLabelForClassOption(educationGrade)
  const useShortClassLabel = shouldUseShortGradeClassLabelForGrades(
    sections.map(section => section.gradeLabel)
  )

  const unique = new Map<string, StudentGradeClassSelectOption>()
  for (const section of sections) {
    const value = formatGradeClassSelectDisplay(
      section.gradeLabel,
      section.className,
      useShortClassLabel
    )
    if (!unique.has(value)) {
      unique.set(value, {
        label: value,
        value,
        gradeLabel:
          normalizeStudentGradeLabelForClassOption(section.gradeLabel) ||
          section.gradeLabel.trim() ||
          institutionGrade ||
          undefined,
      })
    }
  }

  return Array.from(unique.values()).sort((a, b) => a.value.localeCompare(b.value, 'ko'))
}

export function withLegacyStudentGradeClassOption(
  options: StudentGradeClassSelectOption[],
  currentValue?: string | null
): StudentGradeClassSelectOption[] {
  const value = currentValue?.trim()
  if (!value) return options
  if (options.some(option => option.value === value)) return options
  return [{ label: `${value} (기존)`, value }, ...options]
}

/** 정보 수정 행 — 해당 학생 학년에 맞는 등록 학급만 (여러 학년일 때) */
export function buildStudentEditGradeClassOptions(input: {
  registeredOptions: StudentGradeClassSelectOption[]
  studentGradeClass: string
  educationGrade?: string | null
  rosterFallbackOptions?: Array<{ label: string; value: string }>
}): StudentGradeClassSelectOption[] {
  const base: StudentGradeClassSelectOption[] =
    input.registeredOptions.length > 0
      ? input.registeredOptions
      : (input.rosterFallbackOptions ?? []).map(option => ({
          label: option.label,
          value: option.value,
        }))

  const parsed = parseStudentGradeClassDisplay(
    input.studentGradeClass,
    input.educationGrade
  )
  const studentGrade =
    normalizeStudentGradeLabelForClassOption(parsed.gradeLabel) ||
    normalizeStudentGradeLabelForClassOption(input.educationGrade)

  const gradeLabelsInBase = new Set(
    base.map(option => option.gradeLabel).filter((grade): grade is string => Boolean(grade?.trim()))
  )
  const multiGrade =
    gradeLabelsInBase.size > 1 ||
    base.some(option => {
      const fromValue = parseStudentGradeClassDisplay(option.value, input.educationGrade).gradeLabel
      const normalized = normalizeStudentGradeLabelForClassOption(fromValue)
      return normalized && studentGrade && normalized !== studentGrade
    })

  let filtered = base
  if (multiGrade && studentGrade) {
    filtered = base.filter(option => {
      if (option.value === input.studentGradeClass.trim()) return true
      if (option.gradeLabel && normalizeStudentGradeLabelForClassOption(option.gradeLabel) === studentGrade) {
        return true
      }
      const parsedOption = parseStudentGradeClassDisplay(option.value, input.educationGrade)
      return (
        normalizeStudentGradeLabelForClassOption(parsedOption.gradeLabel) === studentGrade
      )
    })
  }

  return withLegacyStudentGradeClassOption(filtered, input.studentGradeClass)
}

/** 학생 추가 — 기관 등록 학급 전체 (명단 fallback은 등록 데이터 없을 때만) */
export function buildStudentAddGradeClassOptions(input: {
  registeredOptions: StudentGradeClassSelectOption[]
  rosterFallbackOptions?: Array<{ label: string; value: string }>
}): StudentGradeClassSelectOption[] {
  if (input.registeredOptions.length > 0) return input.registeredOptions
  return (input.rosterFallbackOptions ?? []).map(option => ({
    label: option.label,
    value: option.value,
  }))
}
