import type { ReactNode } from 'react'
import styles from './detail-header-layout.module.css'

export type EducationDetailHeaderLayoutProps = {
  /** 뒤로가기 등 — aside와 상단 정렬할 좌측 선두 */
  leading?: ReactNode
  header: ReactNode
  aside?: ReactNode
  /** aside 세로 정렬 — 'end'면 header 하단에 맞춤(수료증 CTA) */
  asideAlign?: 'start' | 'end'
  /** 강사 카드 + 증명서 버튼을 세로로 쌓을 때. 강사 카드는 상단 정렬을 유지한다 */
  asideStacked?: boolean
}

/**
 * 상세 헤더 좌/우 배치.
 * aside가 있으면 leading(뒤로가기)+header를 좌측에 두고 aside 상단을 leading과 맞춤.
 * aside 없으면 leading → header 세로 스택(기존과 동일).
 */
export function EducationDetailHeaderLayout({
  leading,
  header,
  aside,
  asideAlign = 'start',
  asideStacked = false,
}: EducationDetailHeaderLayoutProps) {
  if (!aside) {
    return (
      <>
        {leading}
        {header}
      </>
    )
  }

  return (
    <div className={asideStacked ? `${styles.row} ${styles.rowStacked}` : styles.row}>
      <div className={styles.leftColumn}>
        {leading}
        {header}
      </div>
      <div
        className={[
          styles.asideSlot,
          asideAlign === 'end' ? styles.asideSlotEnd : '',
          asideStacked ? styles.asideSlotStack : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {aside}
      </div>
    </div>
  )
}
