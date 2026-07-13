import type { ReactNode } from 'react'
import type { MypageLnbItem } from '@/features/mypage'
import { Lnb } from './lnb'
import styles from './mypage-layout.module.css'

type MypageLayoutProps = {
  lnbItems: MypageLnbItem[]
  showInstructorApply?: boolean
  children: ReactNode
}

export function MypageLayout({ lnbItems, showInstructorApply = false, children }: MypageLayoutProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.background} aria-hidden="true" />
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Lnb items={lnbItems} showInstructorApply={showInstructorApply} />
        </aside>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
