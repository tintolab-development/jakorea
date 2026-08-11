import { Link } from 'react-router-dom'
import { INSTRUCTOR_APPLY_PATH } from '@/features/mypage'
import { PFText } from '@/shared/ui'
import { instructorApplyIllustrationUrl } from './lnb-icon-map'
import styles from './instructor-apply-cta.module.css'

export function InstructorApplyCta() {
  return (
    <Link className={styles.cta} to={INSTRUCTOR_APPLY_PATH}>
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
