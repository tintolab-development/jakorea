import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import loadingStatusStyles from './loading-status.module.css'
import styles from './survey-panel-skeleton.module.css'

export function EducationSurveyPanelSkeleton({
  statusMessage = '설문을 불러오는 중입니다.',
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
      <SkeletonBlock className={styles.block} />
      <SkeletonBlock className={[styles.block, styles.blockTall].join(' ')} />
      <SkeletonBlock className={styles.block} />
    </div>
  )
}
