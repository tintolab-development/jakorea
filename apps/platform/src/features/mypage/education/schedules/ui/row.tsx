import { useState } from 'react'
import type { EducationScheduleItem } from '../model/types'
import { formatEducationSessionDate } from '../../shared'
import {
  canSubmitEducationAbsenceReason,
  EDUCATION_SCHEDULE_ATTENDANCE_LABEL,
  EDUCATION_SCHEDULE_PROGRESS_LABEL,
  resolveEducationScheduleProgressStatus,
  shouldShowEducationAssignment,
} from '../lib/schedule-rules'
import checkOnSmallUrl from '@/shared/assets/icons/check-mint-small.svg'
import {
  EducationSessionCard,
  EducationSessionCardHeader,
  EducationSessionStatusMark,
} from '../../shared'
import { EducationScheduleAssignmentBlock } from './assignment-block'
import { PFAlertModal, PFButton, PFStateBadge, PFText } from '@/shared/ui'

type EducationScheduleRowProps = {
  item: EducationScheduleItem
}

export function EducationScheduleRow({ item }: EducationScheduleRowProps) {
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const progress = resolveEducationScheduleProgressStatus(item.heldAt)
  const heldLabel = formatEducationSessionDate(item.heldAt)
  const showAssignment = shouldShowEducationAssignment(item)
  const showAbsenceSubmit = canSubmitEducationAbsenceReason(progress, item.attendanceStatus)
  const attendance = item.attendanceStatus

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
              {item.title}
            </PFText>
          }
          aside={
            <>
              {showAbsenceSubmit ? (
                <PFButton
                  type="button"
                  variant="secondary"
                  size="large"
                  onClick={() => setComingSoonOpen(true)}
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
                    attendance === 'excused' && item.absenceReason ? (
                      <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500">
                        {item.absenceReason}
                      </PFText>
                    ) : null
                  }
                />
              ) : null}
            </>
          }
        />

        {showAssignment && item.assignment ? (
          <EducationScheduleAssignmentBlock assignment={item.assignment} />
        ) : null}
      </EducationSessionCard>

      <PFAlertModal
        open={comingSoonOpen}
        title="준비 중"
        onConfirm={() => setComingSoonOpen(false)}
      />
    </>
  )
}
