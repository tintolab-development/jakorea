import type { TextbookEducationTarget } from '@/features/textbook/model/textbook-education-targets'
import { TEXTBOOK_EDUCATION_TARGETS } from '@/features/textbook/model/textbook-education-targets'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { listTextbooksFromStore } from '@/features/textbook/api/textbook-service'
import type { Program, TargetLevel } from '@/types/domain'

const TARGET_LEVEL_TO_EDUCATION_TARGET: Partial<Record<TargetLevel, TextbookEducationTarget>> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
  university: '대학교',
}

export function resolveProgramEducationTarget(program: Program): TextbookEducationTarget | null {
  if (!program.targetLevel) return null
  return TARGET_LEVEL_TO_EDUCATION_TARGET[program.targetLevel] ?? null
}

function textbookIncludesGrade(textbook: TextbookRow, educationGrade: string): boolean {
  if (textbook.grade === educationGrade || textbook.grade === '전학년') {
    return true
  }

  return textbook.educationStages.some(stage => {
    if (!stage.selected) return false
    return stage.grades?.some(grade => grade.selected && grade.label === educationGrade) ?? false
  })
}

export function dedupeTextbooksByName(textbooks: TextbookRow[]): TextbookRow[] {
  const seen = new Set<string>()
  const result: TextbookRow[] = []
  for (const row of textbooks) {
    const key = row.textbookName.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(row)
  }
  return result
}

/** 프로그램 사업분야·교육 대상·신청 학년에 맞는 사용 중 교재 목록 */
export function filterTextbooksForApplicant(
  program: Program,
  educationGrade: string
): TextbookRow[] {
  const educationTarget = resolveProgramEducationTarget(program)
  const grade = educationGrade.trim()
  if (!grade) return []

  const filtered = listTextbooksFromStore().filter(row => {
    if (row.useStatus !== 'USED') return false
    if (program.businessArea && row.businessArea !== program.businessArea) return false
    if (educationTarget && row.educationTarget !== educationTarget) return false
    return textbookIncludesGrade(row, grade)
  })

  return dedupeTextbooksByName(filtered).sort((a, b) =>
    a.textbookName.localeCompare(b.textbookName, 'ko')
  )
}

const TEXTBOOK_EDUCATION_TARGET_STUDENT_LABELS: Record<TextbookEducationTarget, string> = {
  유아: '유아',
  초등학교: '초등학생',
  중학교: '중학생',
  고등학교: '고등학생',
  대학교: '대학생',
}

/** 교재 셀렉트·표시용 — 교육대상을 학생 라벨(초등학생 등)로 변환 */
export function resolveTextbookEducationTargetStudentLabel(
  target: string | undefined | null
): string {
  if (!target) return ''
  if ((TEXTBOOK_EDUCATION_TARGETS as readonly string[]).includes(target)) {
    return TEXTBOOK_EDUCATION_TARGET_STUDENT_LABELS[target as TextbookEducationTarget]
  }
  return target
}

export function resolveTextbookOptionLabel(row: TextbookRow): string {
  const studentLabel = resolveTextbookEducationTargetStudentLabel(row.educationTarget)
  if (!studentLabel) return row.textbookName
  return `${row.textbookName} (${studentLabel})`
}
