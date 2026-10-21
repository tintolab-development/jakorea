import type { InstructorApplyLockedBasicInfo } from './map-locked-basic-info'
import { InstructorApplySubmittedForm } from './instructor-apply-submitted-form'
import { InstructorApplyRejectedBanner } from './instructor-apply-rejected-banner'
import { useCurrentInstructorRoleRequestDetailQuery } from './api/use-current-instructor-role-request-detail-query'
import type { InstructorRoleRequestSummary } from './api/types'
import { resolveInstructorApplySubmittedSnapshot } from './lib/resolve-submitted-snapshot'
import styles from './instructor-apply-rejected-review-view.module.css'
import { PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'

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

  return (
    <div className={styles.root}>
      <InstructorApplyRejectedBanner summary={summary} />

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
