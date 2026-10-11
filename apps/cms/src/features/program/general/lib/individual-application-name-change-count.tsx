import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import type { GeneralIndividualApplicantDetail } from '@/features/program/general/model/individual-applicant'

/** BE `Application.applicationNameChangeCount` */
export function readApplicationNameChangeCount(application: unknown): number {
  if (application == null || typeof application !== 'object') return 0
  const count = (application as { applicationNameChangeCount?: number }).applicationNameChangeCount
  if (count == null) return 0
  return typeof count === 'number' && Number.isFinite(count) && count > 0 ? count : 0
}

export function renderIndividualApplicantNameWithHistoryBadges(params: {
  applicantName: string
  detail?: GeneralIndividualApplicantDetail
  badgeClassName?: string
}): ReactNode {
  const { applicantName, detail, badgeClassName } = params
  const nameChangeCount = detail?.applicationNameChangeCount ?? 0
  const scheduleChangeCancelCount = detail?.scheduleChangeCancelCount ?? 0
  const badges: ReactNode[] = []

  if (nameChangeCount > 0) {
    badges.push(
      <ScheduleChangeHistoryBadge
        key="name-change"
        count={nameChangeCount}
        labelVariant="name"
        className={badgeClassName}
      />
    )
  }

  if (scheduleChangeCancelCount > 0) {
    badges.push(
      <ScheduleChangeHistoryBadge
        key="schedule-change-cancel"
        count={scheduleChangeCancelCount}
        labelVariant="schedule"
        className={badgeClassName}
      />
    )
  }

  if (badges.length === 0) return applicantName

  return (
    <>
      {applicantName}
      {badges}
    </>
  )
}
