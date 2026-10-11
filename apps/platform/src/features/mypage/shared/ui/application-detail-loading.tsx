import { EducationDetailBack } from '@/features/mypage/education/applications/ui/detail-back'
import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import loadingStatusStyles from './loading-status.module.css'
import styles from './application-detail-loading.module.css'

type EducationApplicationDetailLoadingProps = {
  onBack: () => void
  backLabel?: string
  statusMessage?: string
}

export function EducationApplicationDetailLoading({
  onBack,
  backLabel = '교육현황',
  statusMessage = '신청 정보를 불러오는 중입니다.',
}: EducationApplicationDetailLoadingProps) {
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
      <EducationDetailBack label={backLabel} onClick={onBack} />
      <div className={styles.loadingHeader}>
        <SkeletonBlock className={styles.boneTitle} />
        <SkeletonBlock className={styles.boneTitleShort} />
        <SkeletonBlock className={styles.boneStatus} />
        <SkeletonBlock className={styles.boneMeta} />
      </div>
      <div className={styles.loadingTabs} aria-hidden="true">
        <SkeletonBlock className={styles.boneTab} />
        <SkeletonBlock className={styles.boneTab} />
      </div>
      <div className={styles.loadingBody}>
        <div className={styles.loadingMain}>
          <SkeletonBlock className={styles.boneSummary} />
          <SkeletonBlock className={styles.boneBlock} />
        </div>
        <div className={styles.loadingAside}>
          <SkeletonBlock className={styles.boneBanner} />
          <SkeletonBlock className={styles.boneApply} />
        </div>
      </div>
    </section>
  )
}
