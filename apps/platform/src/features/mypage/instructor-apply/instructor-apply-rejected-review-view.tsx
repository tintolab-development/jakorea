import type { InstructorApplyLockedBasicInfo } from './map-locked-basic-info'
import { InstructorApplySubmittedForm } from './instructor-apply-submitted-form'
import { useCurrentInstructorRoleRequestDetailQuery } from './api/use-current-instructor-role-request-detail-query'
import type { InstructorRoleRequestSummary } from './api/types'
import { formatInstructorApplyRequestedAtLabel } from './lib/format-instructor-apply-datetime'
import { resolveInstructorApplySubmittedSnapshot } from './lib/resolve-submitted-snapshot'
import styles from './instructor-apply-rejected-review-view.module.css'
import { PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'

const REJECTED_MESSAGE =
  '강사 신청이 반려되었어요. 반려 사유를 확인하고 내용을 보완해 다시 신청해 주세요.'

export type InstructorApplyRejectedReviewViewProps = {
  summary: InstructorRoleRequestSummary
  lockedBasic: InstructorApplyLockedBasicInfo
  onReapply?: () => void
}

export function InstructorApplyRejectedReviewView({
  summary,
  lockedBasic,
  onReapply,
}: InstructorApplyRejectedReviewViewProps) {
  const detailQuery = useCurrentInstructorRoleRequestDetailQuery({ enabled: true })

  const isDetailLoading = detailQuery.isPending && detailQuery.data === undefined

  if (isDetailLoading) {
    return (
      <div className={styles.loadingState} role="status" aria-busy="true">
        <PFLoadingSpinner centered label="신청 내용을 불러오는 중" />
      </div>
    )
  }

  if (detailQuery.isError) {
    return (
      <PFText as="p" typo="bd-md-rg" color="error">
        신청 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </PFText>
    )
  }

  const snapshot = resolveInstructorApplySubmittedSnapshot({
    detail: detailQuery.data,
    lockedBasic,
    requestedAtFallback: summary.requestedAt,
  })

  const rejectedReason =
    detailQuery.data?.rejectedReason?.trim() || summary.rejectedReason?.trim() || ''
  const requestedAtLabel = formatInstructorApplyRequestedAtLabel(
    snapshot?.requestedAt ?? summary.requestedAt,
  )
  const rejectedAtLabel = formatInstructorApplyRequestedAtLabel(
    detailQuery.data?.decidedAt ?? summary.decidedAt,
  )

  return (
    <div className={styles.root}>
      <section className={styles.rejectedBanner} aria-label="신청 반려 안내">
        <div className={styles.bannerLead}>
          <PFText as="p" typo="hl-sm" color="error" className={styles.leadMessage}>
            {REJECTED_MESSAGE}
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

      {snapshot ? <InstructorApplySubmittedForm snapshot={snapshot} /> : null}

      {onReapply ? (
        <div className={styles.reapplyAction}>
          <PFButton type="button" size="xlarge" width={240} onClick={onReapply}>
            내용 보완 후 재신청
          </PFButton>
        </div>
      ) : null}
    </div>
  )
}
