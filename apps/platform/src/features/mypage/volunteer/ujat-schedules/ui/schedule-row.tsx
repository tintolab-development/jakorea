import type { EducationScheduleItem } from '@/features/mypage/education/schedules/model/types'
import {
  EDUCATION_SCHEDULE_ATTENDANCE_LABEL,
  EDUCATION_SCHEDULE_PROGRESS_LABEL,
  resolveEducationScheduleProgressStatus,
} from '@/features/mypage/education/schedules/lib/schedule-rules'
import { resolveEducationScheduleDateLabel } from '@/features/mypage/education/schedules/lib/format'
import checkOnSmallUrl from '@/shared/assets/icons/check-mint-small.svg'
import {
  EducationSessionCard,
  EducationSessionCardHeader,
  EducationSessionStatusMark,
} from '@/features/mypage/education/shared'
import { PFButton, PFStateBadge, PFText } from '@/shared/ui'
import { formatUjatAssignmentStatusLabel } from '../lib/history'
import styles from './schedule-row.module.css'

type UjatVolunteerScheduleRowProps = {
  item: EducationScheduleItem
  canViewAttendance: boolean
  onViewAttendance?: (item: EducationScheduleItem) => void
}

export function UjatVolunteerScheduleRow({
  item,
  canViewAttendance,
  onViewAttendance,
}: UjatVolunteerScheduleRowProps) {
  const progress = resolveEducationScheduleProgressStatus(item.heldAt)
  const heldLabel = resolveEducationScheduleDateLabel(item)
  const attendance = item.scheduleId === null ? null : item.attendanceStatus
  const classOrLocation = [item.classLabel, item.locationName].filter(Boolean).join(' · ')
  const assignmentLabel = formatUjatAssignmentStatusLabel(item.assignmentStatus ?? item.scheduleStatus)
  const absenceReason = item.absenceReason?.trim()

  return (
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
            {item.title}
          </PFText>
        }
        aside={
          <>
            {canViewAttendance && onViewAttendance ? (
              <PFButton
                type="button"
                variant="secondary"
                size="large"
                onClick={() => onViewAttendance(item)}
              >
                출결 상세 보기
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
      {classOrLocation || assignmentLabel !== '-' ? (
        <div className={styles.meta}>
          {classOrLocation ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {classOrLocation}
            </PFText>
          ) : null}
          {assignmentLabel !== '-' ? (
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500">
              {assignmentLabel}
            </PFText>
          ) : null}
        </div>
      ) : null}
    </EducationSessionCard>
  )
}
