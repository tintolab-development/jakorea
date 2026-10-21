import { Link } from 'react-router-dom'
import {
  instructorApplyPath,
  isInstructorRoleRequestRejected,
  useCurrentInstructorRoleRequestQuery,
} from '@/features/mypage'
import chevronRightBlackUrl from '@/shared/assets/icons/chevron-right-black.svg'
import { PFText } from '@/shared/ui'
import { instructorApplyIllustrationUrl } from './lnb-icon-map'
import styles from './instructor-apply-cta.module.css'

export function InstructorApplyCta() {
  const requestQuery = useCurrentInstructorRoleRequestQuery()
  const isRejected = isInstructorRoleRequestRejected(requestQuery.data)
  const reviewTo = instructorApplyPath()
  const reapplyTo = instructorApplyPath({ reapply: true })

  if (isRejected) {
    return (
      <div className={styles.rejectedStack}>
        <Link className={styles.cta} to={reapplyTo}>
          <img
            className={styles.icon}
            src={instructorApplyIllustrationUrl}
            alt=""
            aria-hidden="true"
          />
          <span className={styles.copy}>
            <PFText as="span" typo="bd-lg-sb" color="white" className={styles.title}>
              강사 재신청
            </PFText>
            <PFText as="span" typo="label-md" color="white" className={styles.subtitle}>
              내용을 보완해 다시 신청할 수 있어요.
            </PFText>
          </span>
        </Link>
        <Link
          className={styles.rejectedNotice}
          to={reviewTo}
          aria-label="신청이 반려되었어요. 반려 사유를 확인해 보세요."
        >
          <span className={styles.rejectedNoticeIcon} aria-hidden="true" />
          <span className={styles.rejectedNoticeCopy}>
            <PFText as="span" typo="bd-sm-md" color="error" className={styles.rejectedNoticeLine}>
              신청이 반려되었어요.
            </PFText>
            <PFText as="span" typo="bd-sm-md" color="error" className={styles.rejectedNoticeLine}>
              반려 사유를 확인해 보세요.
            </PFText>
          </span>
          <img
            className={styles.rejectedNoticeChevron}
            src={chevronRightBlackUrl}
            alt=""
            aria-hidden="true"
          />
        </Link>
      </div>
    )
  }

  return (
    <Link className={styles.cta} to={reviewTo}>
      <img className={styles.icon} src={instructorApplyIllustrationUrl} alt="" aria-hidden="true" />
      <span className={styles.copy}>
        <PFText as="span" typo="bd-lg-sb" color="white" className={styles.title}>
          강사 신청
        </PFText>
        <PFText as="span" typo="label-md" color="white" className={styles.subtitle}>
          강사이신가요? 권한을 신청해 주세요.
        </PFText>
      </span>
    </Link>
  )
}
