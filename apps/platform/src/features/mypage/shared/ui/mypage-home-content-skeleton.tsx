import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import loadingStatusStyles from './loading-status.module.css'
import styles from './mypage-home-content-skeleton.module.css'

export function MypageHomeContentSkeleton({
  statusMessage = '마이페이지 정보를 불러오는 중입니다.',
}: {
  statusMessage?: string
}) {
  return (
    <div className={styles.page} aria-busy="true">
      <PFText
        as="p"
        typo="bd-md-rg"
        color="neutral-cool-600"
        className={loadingStatusStyles.loadingStatus}
      >
        {statusMessage}
      </PFText>
      <div className={styles.header} aria-hidden="true">
        <SkeletonBlock className={styles.boneName} />
        <SkeletonBlock className={styles.boneSub} />
      </div>
      <div className={styles.stats}>
        <SkeletonBlock className={styles.statCard} />
        <SkeletonBlock className={styles.statCard} />
        <SkeletonBlock className={styles.statCard} />
      </div>
      <div className={styles.schedule}>
        <SkeletonBlock className={styles.calendar} />
        <div className={styles.eventList}>
          <SkeletonBlock className={styles.eventItem} />
          <SkeletonBlock className={styles.eventItem} />
          <SkeletonBlock className={styles.eventItem} />
        </div>
      </div>
    </div>
  )
}
