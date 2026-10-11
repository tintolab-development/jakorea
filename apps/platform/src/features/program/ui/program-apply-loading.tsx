import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import loadingStatusStyles from '@/features/mypage/shared/ui/loading-status.module.css'
import styles from './program-apply-loading.module.css'

export function ProgramApplyLoading({
  statusMessage = '신청 양식을 불러오는 중입니다.',
}: {
  statusMessage?: string
}) {
  return (
    <section className={[styles.shell, styles.page].join(' ')} aria-busy="true">
      <div className={styles.shellInner}>
        <PFText
          as="p"
          typo="bd-md-rg"
          color="neutral-cool-600"
          className={loadingStatusStyles.loadingStatus}
        >
          {statusMessage}
        </PFText>
        <div className={styles.back} aria-hidden="true">
          <SkeletonBlock className={styles.boneBack} />
        </div>
        <SkeletonBlock className={styles.bonePageTitle} />
        <div className={styles.summary}>
          <SkeletonBlock className={styles.boneSummaryTitle} />
          <SkeletonBlock className={styles.boneSummaryMeta} />
        </div>
        <SkeletonBlock className={styles.formBlock} />
        <SkeletonBlock className={[styles.formBlock, styles.formBlockShort].join(' ')} />
        <SkeletonBlock className={styles.actions} />
      </div>
    </section>
  )
}
