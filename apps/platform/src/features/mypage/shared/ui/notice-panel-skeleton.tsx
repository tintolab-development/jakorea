import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import loadingStatusStyles from './loading-status.module.css'
import styles from './notice-panel-skeleton.module.css'

export function EducationNoticePanelSkeleton({
  statusMessage = '안내사항을 불러오는 중입니다.',
}: {
  statusMessage?: string
}) {
  return (
    <div className={styles.shell} aria-busy="true">
      <PFText
        as="p"
        typo="bd-md-rg"
        color="neutral-cool-600"
        className={loadingStatusStyles.loadingStatus}
      >
        {statusMessage}
      </PFText>
      <SkeletonBlock className={styles.card} />
      <SkeletonBlock className={styles.card} />
      <SkeletonBlock className={styles.fileBlock} />
    </div>
  )
}
