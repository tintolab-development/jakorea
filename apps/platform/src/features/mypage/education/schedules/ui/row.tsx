import type { EducationScheduleItem } from '../model/types'
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

type EducationScheduleRowProps = {
  item: EducationScheduleItem
  onAbsenceReasonSubmit?: (item: EducationScheduleItem) => void
}

export function EducationScheduleRow({ item, onAbsenceReasonSubmit }: EducationScheduleRowProps) {
  const progress = resolveEducationScheduleProgressStatus(item.heldAt)
  const heldLabel = resolveEducationScheduleDateLabel(item)
  const showAssignment = shouldShowEducationAssignment(item)
  const hasOperationalSchedule = item.scheduleId !== null
  const showAbsenceSubmit =
    hasOperationalSchedule && canSubmitEducationAbsenceReason(progress, item.attendanceStatus)
  const attendance = hasOperationalSchedule ? item.attendanceStatus : null
  const rowLabel = item.sessionLabel?.trim() || item.scheduleLabel?.trim()
  const subtitle = rowLabel && rowLabel !== item.title ? `${rowLabel} ${item.title}` : item.title
  const absenceReason = hasOperationalSchedule ? item.absenceReason?.trim() : undefined

  return (
    <>
      <EducationSessionCard>
        <EducationSessionCardHeader
          badge={
            <PFStateBadge size="small" tone={progress === 'completed' ? 'success' : 'progress'}>
              {EDUCATION_SCHEDULE_PROGRESS_LABEL[progress]}
            </PFStateBadge>
          }
          date={heldLabel}
          subtitle={
            <PFText as="span" typo="bd-lg-sb" color="primary-500">
              {subtitle}
            </PFText>
          }
          aside={
            <>
              {showAbsenceSubmit ? (
                <PFButton
                  type="button"
                  variant="secondary"
                  size="large"
                  onClick={() => onAbsenceReasonSubmit?.(item)}
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
                      <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500">
                        {absenceReason}
                      </PFText>
                    ) : null
                  }
                />
              ) : absenceReason ? (
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500">
                  {absenceReason}
                </PFText>
              ) : null}
            </>
          }
        />

        {item.content ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {item.content}
          </PFText>
        ) : null}

        {showAssignment && item.assignment ? (
          <EducationScheduleAssignmentBlock assignment={item.assignment} />
        ) : null}
      </EducationSessionCard>
    </>
  )
}
