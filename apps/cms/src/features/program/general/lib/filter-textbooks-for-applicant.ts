import type { TextbookEducationTarget } from '@/features/textbook/model/textbook-education-targets'
import { TEXTBOOK_EDUCATION_TARGETS } from '@/features/textbook/model/textbook-education-targets'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { listTextbooksFromStore } from '@/features/textbook/api/textbook-service'
import {
  resolveSelectedGradeLabels,
  toEducationStageKey,
} from '@/features/textbook/lib/textbook-education-stages'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'
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

function normalizeApplicantEducationGrade(educationGrade: string): string {
  return formatInstitutionApplicationGradeDisplay(educationGrade.trim())
}

function textbookGradeIncludesApplicantGrade(
  textbook: TextbookRow,
  educationGrade: string
): boolean {
  const grade = normalizeApplicantEducationGrade(educationGrade)
  if (!grade) return false

  const textbookGrade = textbook.grade?.trim()
  if (!textbookGrade) {
    return textbook.educationStages.some(stage => {
      if (!stage.selected) return false
      return stage.grades?.some(item => item.selected && item.label === grade) ?? false
    })
  }

  if (textbookGrade === grade || textbookGrade === '전학년' || textbookGrade === '전체') {
    return true
  }

  if (normalizeApplicantEducationGrade(textbookGrade) === grade) {
    return true
  }

  const stageKey = toEducationStageKey(textbook.educationTarget)
  if (stageKey) {
    return resolveSelectedGradeLabels(stageKey, textbookGrade).has(grade)
  }

  return textbook.educationStages.some(stage => {
    if (!stage.selected) return false
    return stage.grades?.some(item => item.selected && item.label === grade) ?? false
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
  educationGrade: string,
  catalog?: TextbookRow[]
): TextbookRow[] {
  const educationTarget = resolveProgramEducationTarget(program)
  const grade = educationGrade.trim()
  if (!grade) return []

  const source = catalog ?? listTextbooksFromStore()
  const filtered = source.filter(row => {
    if (!catalog && row.useStatus !== 'USED') return false
    if (program.businessArea && row.businessArea !== program.businessArea) return false
    if (educationTarget && row.educationTarget !== educationTarget) return false
    return textbookGradeIncludesApplicantGrade(row, grade)
  })

  return dedupeTextbooksByName(filtered).sort((a, b) =>
    a.textbookName.localeCompare(b.textbookName, 'ko')
  )
}

const TEXTBOOK_EDUCATION_TARGET_SHORT_LABELS: Record<TextbookEducationTarget, string> = {
  유아: '유아',
  초등학교: '초등',
  중학교: '중등',
  고등학교: '고등',
  대학교: '대학',
}

/** 교재 셀렉트·표시용 — 교육대상 짧은 라벨 (예: 초등) */
export function resolveTextbookEducationTargetShortLabel(
  target: string | undefined | null
): string {
  if (!target) return ''
  if ((TEXTBOOK_EDUCATION_TARGETS as readonly string[]).includes(target)) {
    return TEXTBOOK_EDUCATION_TARGET_SHORT_LABELS[target as TextbookEducationTarget]
  }
  return target
}

export function resolveTextbookOptionLabel(row: TextbookRow): string {
  const targetLabel = resolveTextbookEducationTargetShortLabel(row.educationTarget)
  if (!targetLabel) return row.textbookName
  return `${row.textbookName} (${targetLabel})`
}
