import type { InstructorApplyLockedBasicInfo } from './map-locked-basic-info'
import { InstructorApplySubmittedForm } from './instructor-apply-submitted-form'
import { useCurrentInstructorRoleRequestDetailQuery } from './api/use-current-instructor-role-request-detail-query'
import type { InstructorRoleRequestSummary } from './api/types'
import { formatInstructorApplyRequestedAtLabel } from './lib/format-instructor-apply-datetime'
import { resolveInstructorApplySubmittedSnapshot } from './lib/resolve-submitted-snapshot'
import styles from './instructor-apply-pending-review-view.module.css'
import { PFLoadingSpinner, PFText } from '@/shared/ui'

const REVIEW_MESSAGE =
  '관리자가 신청서를 검토하고 있어요. 승인 결과는 알림과 이메일로 안내해 드릴게요.'

export type InstructorApplyPendingReviewViewProps = {
  summary: InstructorRoleRequestSummary
  lockedBasic: InstructorApplyLockedBasicInfo
}

export function InstructorApplyPendingReviewView({
  summary,
  lockedBasic,
}: InstructorApplyPendingReviewViewProps) {
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

  if (!snapshot) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        제출된 신청 내용을 표시할 수 없습니다. 관리자 검토가 완료되면 알림으로 안내해 드립니다.
      </PFText>
    )
  }

  const requestedAtLabel = formatInstructorApplyRequestedAtLabel(
    snapshot.requestedAt ?? summary.requestedAt,
  )

  return (
    <div className={styles.root}>
      <section className={styles.reviewBanner} aria-label="승인 대기 안내">
        <PFText as="p" typo="hl-sm" color="primary-500" className={styles.reviewMessage}>
          {REVIEW_MESSAGE}
        </PFText>
        {requestedAtLabel ? (
          <PFText as="p" typo="bd-md-md" className={styles.requestedAt}>
            신청일 {requestedAtLabel}
          </PFText>
        ) : null}
      </section>

      <InstructorApplySubmittedForm snapshot={snapshot} />
    </div>
  )
}
