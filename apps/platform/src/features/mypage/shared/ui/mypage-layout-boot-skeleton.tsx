import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import loadingStatusStyles from './loading-status.module.css'
import styles from './mypage-layout-boot-skeleton.module.css'

export function MypageLayoutBootSkeleton({
  statusMessage = '화면을 준비하는 중입니다.',
}: {
  statusMessage?: string
}) {
  return (
    <div className={styles.wrap} aria-busy="true">
      <PFText
        as="p"
        typo="bd-md-rg"
        color="neutral-cool-600"
        className={loadingStatusStyles.loadingStatus}
      >
        {statusMessage}
      </PFText>
      <SkeletonBlock className={styles.bone} />
    </div>
  )
}
