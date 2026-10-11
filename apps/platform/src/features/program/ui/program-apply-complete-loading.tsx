import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import loadingStatusStyles from '@/features/mypage/shared/ui/loading-status.module.css'
import styles from './program-apply-complete-loading.module.css'

export function ProgramApplyCompleteLoading({
  statusMessage = '신청 정보를 불러오는 중입니다.',
}: {
  statusMessage?: string
}) {
  return (
    <section className={styles.page} aria-busy="true">
      <PFText
        as="p"
        typo="bd-md-rg"
        color="neutral-cool-600"
        className={loadingStatusStyles.loadingStatus}
      >
        {statusMessage}
      </PFText>
      <div className={styles.container} aria-hidden="true">
        <SkeletonBlock className={styles.illustration} />
        <SkeletonBlock className={styles.title} />
        <SkeletonBlock className={styles.description} />
        <SkeletonBlock className={styles.button} />
      </div>
    </section>
  )
}
