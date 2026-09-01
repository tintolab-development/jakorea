import { useState } from 'react'
import type { EducationScheduleItem } from '../model/types'
import { formatEducationScheduleHeldAt } from '../lib/format'
import {
  canSubmitEducationAbsenceReason,
  EDUCATION_SCHEDULE_ATTENDANCE_LABEL,
  EDUCATION_SCHEDULE_PROGRESS_LABEL,
  resolveEducationScheduleProgressStatus,
  shouldShowEducationAssignment,
} from '../lib/schedule-rules'
import checkOnSmallUrl from '@/shared/assets/icons/check-mint-small.svg'
import { EducationScheduleAssignmentBlock } from './assignment-block'
import { PFAlertModal, PFButton, PFStateBadge, PFText } from '@/shared/ui'
import styles from './row.module.css'

type EducationScheduleRowProps = {
  item: EducationScheduleItem
}

export function EducationScheduleRow({ item }: EducationScheduleRowProps) {
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const progress = resolveEducationScheduleProgressStatus(item.heldAt)
  const heldLabel = formatEducationScheduleHeldAt(item.heldAt)
  const showAssignment = shouldShowEducationAssignment(item)
  const showAbsenceSubmit = canSubmitEducationAbsenceReason(progress, item.attendanceStatus)
  const attendance = item.attendanceStatus

  return (
    <>
      <article className={styles.card}>
        <div className={styles.top}>
          <div className={styles.meta}>
            <PFStateBadge size="small" tone={progress === 'completed' ? 'success' : 'progress'}>
              {EDUCATION_SCHEDULE_PROGRESS_LABEL[progress]}
            </PFStateBadge>
            <PFText as="span" typo="hd-sm">
              {heldLabel}
            </PFText>
            <PFText as="span" typo="bd-lg-sb" color="primary-500">
              {item.title}
            </PFText>
          </div>

          <div className={styles.aside}>
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
              <div
                className={[
                  styles.attendance,
                  attendance === 'present' ? styles.attendancePresent : undefined,
                  attendance === 'late' || attendance === 'absent'
                    ? styles.attendanceAlert
                    : undefined,
                  attendance === 'excused' ? styles.attendanceExcused : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {attendance === 'present' ? (
                  <img
                    className={styles.attendanceIcon}
                    src={checkOnSmallUrl}
                    alt=""
                    width={16}
                    height={16}
                    aria-hidden="true"
                  />
                ) : null}
                <PFText as="span" typo="hl-sm" className={styles.attendanceLabel}>
                  {EDUCATION_SCHEDULE_ATTENDANCE_LABEL[attendance]}
                </PFText>
                {attendance === 'excused' && item.absenceReason ? (
                  <PFText
                    as="span"
                    typo="bd-sm-rg"
                    color="neutral-cool-500"
                    className={styles.reason}
                  >
                    {item.absenceReason}
                  </PFText>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {showAssignment && item.assignment ? (
          <EducationScheduleAssignmentBlock assignment={item.assignment} />
        ) : null}
      </article>

      <PFAlertModal
        open={comingSoonOpen}
        title="준비 중"
        onConfirm={() => setComingSoonOpen(false)}
      />
    </>
  )
}
