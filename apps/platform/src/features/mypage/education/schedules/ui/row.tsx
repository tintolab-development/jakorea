import type { EducationScheduleItem } from '../model/types'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  canSubmitEducationAbsenceReason,
  EDUCATION_SCHEDULE_ATTENDANCE_LABEL,
  educationScheduleProgressLabel,
  resolveEducationScheduleRowProgressStatus,
  shouldDisplayEducationAbsenceReason,
  shouldShowEducationAssignment,
} from '../lib/schedule-rules'
import {
  resolveEducationScheduleDateLabel,
  resolveEducationScheduleRowDateLabel,
} from '../lib/format'
import {
  educationCurriculumSessionSummaryLabel,
  hasEducationCurriculumSessions,
  visibleEducationCurriculumSessions,
} from '../lib/curriculum-sessions'
import checkOnSmallUrl from '@/shared/assets/icons/check-mint-small.svg'
import {
  EducationSessionCard,
  EducationSessionCardHeader,
  EducationSessionStatusMark,
} from '../../shared'
import { EducationScheduleAssignmentBlock } from './assignment-block'
import { PFButton, PFStateBadge, PFText } from '@/shared/ui'
import styles from './row.module.css'

type EducationScheduleRowProps = {
  item: EducationScheduleItem
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  /** 과제 블록 노출 — 강사 신청은 false */
  showAssignment?: boolean
  onAbsenceReasonSubmit?: (item: EducationScheduleItem) => void
  /** 결석 사유 텍스트 노출 (교육받은 교사 신청 건은 false) */
  showAbsenceReason?: boolean
}

export function EducationScheduleRow({
  item,
  applicationType,
  applicationId,
  showAssignment: assignmentAllowed = true,
  onAbsenceReasonSubmit,
  showAbsenceReason = true,
}: EducationScheduleRowProps) {
  const progress = resolveEducationScheduleRowProgressStatus(item)
  const heldLabel =
    item.operationalDayView === true
      ? resolveEducationScheduleDateLabel(item)
      : resolveEducationScheduleRowDateLabel(item)
  const showAssignment = assignmentAllowed && shouldShowEducationAssignment(item)
  const hasOperationalSchedule = item.scheduleId !== null
  const showAbsenceSubmit =
    onAbsenceReasonSubmit != null &&
    hasOperationalSchedule &&
    canSubmitEducationAbsenceReason(
      progress,
      item.attendanceStatus,
      item.availableActions,
      item.absenceReasonStatus,
    )
  const attendance = hasOperationalSchedule ? item.attendanceStatus : null
  const curriculumSessions = hasEducationCurriculumSessions(item.curriculumSessions)
    ? visibleEducationCurriculumSessions(item.curriculumSessions)
    : []
  const showCurriculumSessions =
    item.operationalDayView !== true && curriculumSessions.length > 0
  const sessionSummary = showCurriculumSessions
    ? educationCurriculumSessionSummaryLabel(curriculumSessions)
    : undefined
  const operationalSubtitle = [item.rowLabel?.trim(), item.durationLabel?.trim()]
    .filter((part): part is string => Boolean(part) && part !== '-')
    .join(' · ')
  const subtitle = showCurriculumSessions
    ? sessionSummary || '전 차시'
    : item.operationalDayView === true
      ? operationalSubtitle || '-'
      : item.rowLabel?.trim() || '-'
  const sessionHeading = subtitle === '-' ? heldLabel : `${heldLabel}, ${subtitle}`
  const absenceReason =
    showAbsenceReason &&
    hasOperationalSchedule &&
    shouldDisplayEducationAbsenceReason(
      item.attendanceStatus,
      item.absenceReasonStatus,
      item.absenceReason,
    )
      ? item.absenceReason?.trim()
      : undefined

  return (
    <>
      <EducationSessionCard className={styles.card}>
        <EducationSessionCardHeader
          mobileStack
          badge={
            <PFStateBadge size="small" tone={progress === 'completed' ? 'success' : 'progress'}>
              {educationScheduleProgressLabel(progress, item.operationalDayView === true)}
            </PFStateBadge>
          }
          date={heldLabel}
          subtitle={
            <>
              <PFText as="span" typo="bd-lg-sb" color="primary-500">
                {subtitle}
              </PFText>
              {item.team ? (
                <span className={styles.teamInfo}>
                  <span className={styles.teamDivider} aria-hidden="true" />
                  <span className={styles.teamField}>
                    <PFText as="span" typo="bd-lg-rg" color="neutral-cool-500">
                      역할
                    </PFText>
                    <PFText as="span" typo="bd-lg-rg" color="black">
                      {item.team.roleLabel}
                    </PFText>
                  </span>
                  {item.team.teamName ? (
                    <>
                      <span className={styles.teamDivider} aria-hidden="true" />
                      <span className={styles.teamField}>
                        <PFText as="span" typo="bd-lg-rg" color="neutral-cool-500">
                          팀명
                        </PFText>
                        <PFText as="span" typo="bd-lg-rg" color="black">
                          {item.team.teamName}
                        </PFText>
                      </span>
                    </>
                  ) : null}
                </span>
              ) : null}
            </>
          }
          aside={
            <span className={styles.aside}>
              {showAbsenceSubmit ? (
                <PFButton
                  type="button"
                  variant="secondary"
                  size="large"
                  className={styles.rowButton}
                  onClick={() => onAbsenceReasonSubmit(item)}
                >
                  결석 사유 제출하기
                </PFButton>
              ) : null}
              {attendance ? (
                <EducationSessionStatusMark
                  tone={
                    attendance === 'present'
                      ? 'success'
                      : attendance === 'late' || attendance === 'absent'
                        ? 'alert'
                        : 'muted'
                  }
                  label={EDUCATION_SCHEDULE_ATTENDANCE_LABEL[attendance]}
                  iconSrc={attendance === 'present' ? checkOnSmallUrl : undefined}
                  extra={
                    absenceReason ? (
                      <PFText as="span" typo="bd-md-rg" color="neutral-cool-500">
                        {absenceReason}
                      </PFText>
                    ) : null
                  }
                />
              ) : absenceReason ? (
                <PFText as="span" typo="bd-md-rg" color="neutral-cool-500">
                  {absenceReason}
                </PFText>
              ) : null}
            </span>
          }
        />

        {showCurriculumSessions ? (
          <ul className={styles.sessions}>
            {curriculumSessions.map(session => {
              const label = session.sessionLabel?.trim()
              const title = session.title?.trim()
              const content = session.content?.trim()
              return (
                <li key={`${session.sessionNo}-${label ?? title ?? ''}`} className={styles.session}>
                  {label || title ? (
                    <PFText as="p" typo="bd-lg-sb" color="black" className={styles.sessionHeading}>
                      {[label, title].filter(Boolean).join(' · ')}
                    </PFText>
                  ) : null}
                  {content ? (
                    <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                      {content}
                    </PFText>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : item.content ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {item.content}
          </PFText>
        ) : null}

        {showAssignment && item.assignment ? (
          <EducationScheduleAssignmentBlock
            assignment={item.assignment}
            scheduleId={item.scheduleId ?? null}
            sessionHeading={sessionHeading}
            applicationType={applicationType}
            applicationId={applicationId}
            availableActions={item.availableActions}
          />
        ) : null}
      </EducationSessionCard>
    </>
  )
}
