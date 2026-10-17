import styles from './instructor-apply-pending-title.module.css'
import { PFText } from '@/shared/ui'

export function InstructorApplyPendingTitle() {
  return (
    <header className={styles.titleRow}>
      <PFText as="span" typo="hd-lg" color="black">
        강사 신청
      </PFText>
      <span className={styles.titleDivider} aria-hidden />
      <PFText as="span" typo="hd-lg" color="primary-500">
        승인 대기 중
      </PFText>
    </header>
  )
}
