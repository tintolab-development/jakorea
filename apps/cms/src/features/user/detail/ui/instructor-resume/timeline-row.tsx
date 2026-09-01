/**
 * 강사 이력서 — 학력/경력/JA/자격/수상 공통 타임라인 행
 * [날짜/기간] · [주요(굵게)] · [|] · [부가(비고·발급처)]
 */

import type { ReactNode } from 'react'
import { ProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import './resume.css'

export const INSTRUCTOR_RESUME_EMPTY_DISPLAY = '-'

export type InstructorResumeTimelineDateLayout = 'range' | 'compact'

export type InstructorResumeTimelineRowProps = {
  dateLabel: string
  /** 연도만(자격/수상) vs 기간(경력/JA/학력) — 좌측 min-width 분기 */
  dateLayout?: InstructorResumeTimelineDateLayout
  primary?: string
  secondary?: string
  /** primary·secondary 없을 때 대체 (학력: schoolType만 있는 경우) */
  fallbackLabel?: string
}

/** primary·secondary 모두 있을 때만 구분선 표시 */
export function shouldShowInstructorResumeTimelineDivider(
  primary?: string,
  secondary?: string
): boolean {
  return Boolean(primary?.trim() && secondary?.trim())
}

export function resolveInstructorResumeTimelineRightLabel(
  primary?: string,
  secondary?: string,
  fallbackLabel?: string
): 'content' | 'fallback' | 'empty' {
  if (primary?.trim() || secondary?.trim()) return 'content'
  if (fallbackLabel?.trim()) return 'fallback'
  return 'empty'
}

function InstructorResumeEmptyCardBody() {
  return <p className="instructor-resume-empty">{INSTRUCTOR_RESUME_EMPTY_DISPLAY}</p>
}

export function InstructorResumeTimelineRow({
  dateLabel,
  dateLayout = 'range',
  primary,
  secondary,
  fallbackLabel,
}: InstructorResumeTimelineRowProps) {
  const primaryText = primary?.trim()
  const secondaryText = secondary?.trim()
  const hasPrimary = Boolean(primaryText)
  const hasSecondary = Boolean(secondaryText)
  const showDivider = shouldShowInstructorResumeTimelineDivider(primary, secondary)
  const rightMode = resolveInstructorResumeTimelineRightLabel(primary, secondary, fallbackLabel)

  const leftClass = [
    'instructor-resume-row-left',
    dateLayout === 'compact' ? 'instructor-resume-row-left--single-year' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="instructor-resume-row instructor-resume-row--timeline">
      <span className={leftClass}>{dateLabel}</span>
      <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
        {rightMode === 'content' ? (
          <>
            {hasPrimary ? (
              <span className="instructor-resume-emphasis">{primaryText}</span>
            ) : null}
            {showDivider ? <ProgramDetailTdDivider /> : null}
            {hasSecondary ? <span className="instructor-resume-role">{secondaryText}</span> : null}
          </>
        ) : rightMode === 'fallback' ? (
          fallbackLabel?.trim()
        ) : (
          INSTRUCTOR_RESUME_EMPTY_DISPLAY
        )}
      </span>
    </div>
  )
}

export function InstructorResumeListCard<T>({
  items,
  renderRow,
}: {
  items: readonly T[]
  renderRow: (item: T, index: number) => ReactNode
}) {
  return (
    <div className="instructor-resume-card">
      {items.length > 0 ? items.map((item, idx) => renderRow(item, idx)) : <InstructorResumeEmptyCardBody />}
    </div>
  )
}
