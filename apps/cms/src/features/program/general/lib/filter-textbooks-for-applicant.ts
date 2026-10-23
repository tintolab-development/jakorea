import type { TextbookEducationTarget } from '@/features/textbook/model/textbook-education-targets'
import { TEXTBOOK_EDUCATION_TARGETS } from '@/features/textbook/model/textbook-education-targets'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { listTextbooksFromStore } from '@/features/textbook/api/textbook-service'
import {
  normalizeEducationTargetLabel,
  parseEducationTargetLabels,
  resolveSelectedGradeLabels,
  toEducationStageKey,
} from '@/features/textbook/lib/textbook-education-stages'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  normalizeProgramBusinessAreaValue,
  normalizeTargetLevelValue,
} from '@/features/program/shared/lib/program-detail-info-constants'
import type { Program, TargetLevel } from '@/types/domain'

const TARGET_LEVEL_TO_EDUCATION_TARGET: Partial<Record<TargetLevel, TextbookEducationTarget>> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
  university: '대학교',
}

/** 교재 교육 대상. 성인은 교재 구분에 없다. `중학생`·`middle`·`중학교`는 중학교 */
export function normalizeToTextbookEducationTarget(
  raw: string | null | undefined
): TextbookEducationTarget | null {
  const fromStage = normalizeEducationTargetLabel(raw ?? '')
  if (fromStage) return fromStage
  const level = normalizeTargetLevelValue(raw)
  if (!level) return null
  return TARGET_LEVEL_TO_EDUCATION_TARGET[level] ?? null
}

export function resolveProgramEducationTarget(program: Program): TextbookEducationTarget | null {
  return resolveProgramEducationTargets(program)[0] ?? null
}

/**
 * 프로그램 교육 대상(복수) → 교재 educationTarget.
 * 성인처럼 교재 대상이 없는 값은 건너뛰고, 나머지 대상은 모두 남긴다.
 */
export function resolveProgramEducationTargets(program: Program): TextbookEducationTarget[] {
  const levels =
    program.targetLevels?.length
      ? program.targetLevels
      : program.targetLevel
        ? [program.targetLevel]
        : []
  const targets: TextbookEducationTarget[] = []
  const seen = new Set<TextbookEducationTarget>()
  for (const level of levels) {
    const target = normalizeToTextbookEducationTarget(String(level))
    if (!target || seen.has(target)) continue
    seen.add(target)
    targets.push(target)
  }
  return targets
}

/** 프로그램 교육 대상이 여럿이면 그중 하나라도 교재 대상과 같으면 해당 */
export function textbookMatchesProgramEducationTargets(
  educationTarget: string | null | undefined,
  allowed: readonly TextbookEducationTarget[]
): boolean {
  if (allowed.length === 0) return true
  const targets = parseEducationTargetLabels(educationTarget ?? '')
  if (targets.length > 0) {
    return targets.some(target => allowed.includes(target))
  }
  const normalized = normalizeToTextbookEducationTarget(educationTarget)
  return normalized != null && allowed.includes(normalized)
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

/**
 * 프로그램 사업분야에 해당하고, 신청 학년이 포함되는 사용 중 교재 목록.
 * 프로그램 교육 대상이 있으면 그 범위로 한 번 더 좁힌다(복수 targetLevels 지원).
 * 기관·합반 등 기존 경로용.
 */
export function filterTextbooksForApplicant(
  program: Program,
  educationGrade: string,
  catalog?: TextbookRow[]
): TextbookRow[] {
  const educationTargets = resolveProgramEducationTargets(program)
  const grade = educationGrade.trim()
  if (!grade) return []

  const source = catalog ?? listTextbooksFromStore()
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea)
  const filtered = source.filter(row => {
    if (!catalog && row.useStatus !== 'USED') return false
    if (businessArea && normalizeProgramBusinessAreaValue(row.businessArea) !== businessArea) {
      return false
    }
    if (!textbookMatchesProgramEducationTargets(row.educationTarget, educationTargets)) {
      return false
    }
    return textbookGradeIncludesApplicantGrade(row, grade)
  })

  return dedupeTextbooksByName(filtered).sort((a, b) =>
    a.textbookName.localeCompare(b.textbookName, 'ko')
  )
}

/**
 * 개인 참여자 교재 셀렉 — 사업 분야 + 신청 학년만 (프로그램 educationTarget 필터 없음).
 * API matches가 동일 기준. catalog가 있으면 그 목록을 학년·사업분야로만 재검증.
 */
export function filterTextbooksForIndividualApplicant(
  program: Program,
  educationGrade: string,
  catalog?: TextbookRow[]
): TextbookRow[] {
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea)
  const grade = educationGrade.trim()
  if (!businessArea || !grade) return []

  const source = catalog ?? listTextbooksFromStore()
  const filtered = source.filter(row => {
    if (!catalog && row.useStatus !== 'USED') return false
    if (normalizeProgramBusinessAreaValue(row.businessArea) !== businessArea) return false
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

/** 교재 셀렉트·표시용 — 교육대상 짧은 라벨 (예: 초등) — 기관 등 */
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

/** 개인 참여자 셀렉 라벨 — `교재명` + `educationTarget` (예: JA 경제생활 첫걸음 초등학교) */
export function resolveIndividualTextbookOptionLabel(row: TextbookRow): string {
  const target = row.educationTarget?.trim()
  if (!target) return row.textbookName
  return `${row.textbookName} ${target}`
}
