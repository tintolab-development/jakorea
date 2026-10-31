import type { EducationScheduleItem } from '../model/types'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  canSubmitEducationAbsenceReason,
  EDUCATION_SCHEDULE_ATTENDANCE_LABEL,
  EDUCATION_SCHEDULE_PROGRESS_LABEL,
  resolveEducationScheduleProgressStatus,
  shouldShowEducationAssignment,
} from '../lib/schedule-rules'
import { resolveEducationScheduleDateLabel } from '../lib/format'
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
  const progress = resolveEducationScheduleProgressStatus(item.heldAt)
  const heldLabel = resolveEducationScheduleDateLabel(item)
  const showAssignment = assignmentAllowed && shouldShowEducationAssignment(item)
  const hasOperationalSchedule = item.scheduleId !== null
  const showAbsenceSubmit =
    onAbsenceReasonSubmit != null &&
    hasOperationalSchedule &&
    canSubmitEducationAbsenceReason(progress, item.attendanceStatus, item.availableActions)
  const attendance = hasOperationalSchedule ? item.attendanceStatus : null
  const subtitle = item.rowLabel?.trim() || '-'
  const sessionHeading = subtitle === '-' ? heldLabel : `${heldLabel}, ${subtitle}`
  const absenceReason =
    showAbsenceReason && hasOperationalSchedule ? item.absenceReason?.trim() : undefined

  return (
    <>
      <EducationSessionCard className={styles.card}>
        <EducationSessionCardHeader
          mobileStack
          badge={
            <PFStateBadge size="small" tone={progress === 'completed' ? 'success' : 'progress'}>
              {EDUCATION_SCHEDULE_PROGRESS_LABEL[progress]}
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
                  <span className={styles.teamDivider} aria-hidden="true" />
                  <span className={styles.teamField}>
                    <PFText as="span" typo="bd-lg-rg" color="neutral-cool-500">
                      팀명
                    </PFText>
                    <PFText as="span" typo="bd-lg-rg" color="black">
                      {item.team.teamName}
                    </PFText>
                  </span>
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

        {item.content ? (
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
          />
        ) : null}
      </EducationSessionCard>
    </>
  )
}
