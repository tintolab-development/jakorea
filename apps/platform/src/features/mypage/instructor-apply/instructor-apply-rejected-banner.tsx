import type { InstructorRoleRequestSummary } from './api/types'
import { useCurrentInstructorRoleRequestDetailQuery } from './api/use-current-instructor-role-request-detail-query'
import { formatInstructorApplyRequestedAtLabel } from './lib/format-instructor-apply-datetime'
import styles from './instructor-apply-rejected-review-view.module.css'
import { PFText } from '@/shared/ui'

export const INSTRUCTOR_APPLY_REJECTED_MESSAGE =
  '강사 신청이 반려되었어요. 반려 사유를 확인하고 내용을 보완해 다시 신청해 주세요.'

export type InstructorApplyRejectedBannerProps = {
  summary: InstructorRoleRequestSummary
}

export function InstructorApplyRejectedBanner({ summary }: InstructorApplyRejectedBannerProps) {
  const detailQuery = useCurrentInstructorRoleRequestDetailQuery({ enabled: true })
  const rejectedReason =
    detailQuery.data?.rejectedReason?.trim() || summary.rejectedReason?.trim() || ''
  const requestedAtLabel = formatInstructorApplyRequestedAtLabel(
    detailQuery.data?.requestedAt ?? summary.requestedAt,
  )
  const rejectedAtLabel = formatInstructorApplyRequestedAtLabel(
    detailQuery.data?.decidedAt ?? summary.decidedAt,
  )

  return (
    <section className={styles.rejectedBanner} aria-label="신청 반려 안내">
      <div className={styles.bannerLead}>
        <PFText as="p" typo="hl-sm" color="error" className={styles.leadMessage}>
          {INSTRUCTOR_APPLY_REJECTED_MESSAGE}
        </PFText>
        {requestedAtLabel || rejectedAtLabel ? (
          <PFText as="p" typo="bd-md-md" className={styles.dateMeta}>
            {[
              requestedAtLabel ? `신청일 ${requestedAtLabel}` : '',
              rejectedAtLabel ? `반려일 ${rejectedAtLabel}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </PFText>
        ) : null}
      </div>
      {rejectedReason ? (
        <div className={styles.reasonCard}>
          <PFText as="p" typo="bd-md-md" className={styles.reasonText}>
            <span className={styles.reasonLabel}>반려 사유</span>
            {rejectedReason}
          </PFText>
        </div>
      ) : null}
    </section>
  )
}
