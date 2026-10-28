import { Link } from 'react-router-dom'
import {
  instructorApplyPath,
  isInstructorRoleRequestPendingReview,
  isInstructorRoleRequestRejected,
  useCurrentInstructorRoleRequestQuery,
} from '@/features/mypage'
import chevronRightBlackUrl from '@/shared/assets/icons/chevron-right-black.svg'
import { PFText } from '@/shared/ui'
import alertArrowErrorUrl from './image/instructor-apply/alert-arrow-error-16.svg'
import alertErrorUrl from './image/instructor-apply/alert-error-20.svg'
import arrowForwardPrimaryUrl from './image/instructor-apply/arrow-forward-primary-16.svg'
import pendingIllustrationUrl from './image/instructor-apply/illust-lightbulb-pending.png'
import { instructorApplyIllustrationUrl } from './lnb-icon-map'
import styles from './instructor-apply-cta.module.css'

export function InstructorApplyCta() {
  const requestQuery = useCurrentInstructorRoleRequestQuery()
  const isRejected = isInstructorRoleRequestRejected(requestQuery.data)
  const isPendingReview = isInstructorRoleRequestPendingReview(requestQuery.data)
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
          <img
            className={styles.rejectedNoticeIconMobile}
            src={alertErrorUrl}
            alt=""
            aria-hidden="true"
          />
          <span className={styles.rejectedNoticeCopy}>
            <PFText as="span" typo="bd-sm-md" color="error" className={styles.rejectedNoticeLine}>
              신청이 반려되었어요.
            </PFText>{' '}
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
          <img
            className={styles.rejectedNoticeChevronMobile}
            src={alertArrowErrorUrl}
            alt=""
            aria-hidden="true"
          />
        </Link>
      </div>
    )
  }

  const applyCta = (
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

  if (isPendingReview) {
    // 승인 대기: 모바일은 Figma 01-3 · PC는 시안이 없어 모바일 시안을 PC CTA 카드 규격(280)에 맞춰 적용
    return (
      <Link className={styles.pendingCta} to={reviewTo}>
        <img
          className={styles.pendingIcon}
          src={pendingIllustrationUrl}
          alt=""
          aria-hidden="true"
        />
        <span className={styles.pendingCopy}>
          <PFText as="span" typo="bd-lg-sb" color="primary-500" className={styles.title}>
            강사 승인 대기
          </PFText>
          <span className={styles.pendingLinkRow}>
            <PFText as="span" typo="label-md" color="primary-500">
              제출한 신청서 확인하기
            </PFText>
            <img
              className={styles.pendingArrow}
              src={arrowForwardPrimaryUrl}
              alt=""
              aria-hidden="true"
            />
          </span>
        </span>
      </Link>
    )
  }

  return applyCta
}
