import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import styles from './list-skeleton.module.css'

const ROW_KEYS = ['a', 'b', 'c', 'd'] as const

/** 프로그램 목록 카드와 같은 자리(썸네일·제목·배지·모집기간)를 채우는 로딩 표시. */
export function ProgramListSkeleton() {
  return (
    <div className={styles.list} aria-busy="true">
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.status}>
        프로그램을 불러오는 중
      </PFText>
      {ROW_KEYS.map(key => (
        <div key={key} className={styles.row} aria-hidden="true">
          <SkeletonBlock className={styles.thumb} />
          <div className={styles.content}>
            <div className={styles.top}>
              <SkeletonBlock className={styles.category} />
              <SkeletonBlock className={styles.title} />
              <SkeletonBlock className={styles.period} />
            </div>
            <div className={styles.bottom}>
              <div className={styles.badges}>
                <SkeletonBlock className={styles.badge} />
                <SkeletonBlock className={styles.badgeWide} />
                <SkeletonBlock className={styles.badge} />
              </div>
              <SkeletonBlock className={styles.recruitment} />
            </div>
          </div>
          <div className={styles.aside}>
            <div className={styles.asideText}>
              <SkeletonBlock className={styles.asideLabel} />
              <SkeletonBlock className={styles.asideDate} />
            </div>
            <SkeletonBlock className={styles.arrow} />
          </div>
        </div>
      ))}
    </div>
  )
}
