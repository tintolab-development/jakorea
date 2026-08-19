import type { ReactNode } from 'react'
import type { MypageLnbItem, MypageLnbItemKey } from '@/features/mypage'
import { Lnb } from './lnb'
import styles from './mypage-layout.module.css'

type MypageLayoutProps = {
  lnbItems: MypageLnbItem[]
  showInstructorApply?: boolean
  /** home: 나의 홈 상단 여백 / subpage: 제목 아래 LNB·본문 정렬 */
  variant?: 'home' | 'subpage'
  /** LNB 열 상단 — 백 링크 등. 내용 영역을 넘지 않음 */
  sidebarLeading?: ReactNode
  /** 내용 열 상단 — 페이지 제목 등. LNB 영역을 넘지 않음 */
  contentHeading?: ReactNode
  lnbAriaLabel?: string
  onLnbItemSelect?: (key: MypageLnbItemKey) => void
  children: ReactNode
}

export function MypageLayout({
  lnbItems,
  showInstructorApply = false,
  variant = 'home',
  sidebarLeading,
  contentHeading,
  lnbAriaLabel,
  onLnbItemSelect,
  children,
}: MypageLayoutProps) {
  const shellClassName = [
    styles.shell,
    variant === 'subpage' ? styles.shellSubpage : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClassName}>
      {variant === 'home' ? <div className={styles.pageBackground} aria-hidden="true" /> : null}
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          {sidebarLeading ? <div className={styles.sidebarLeading}>{sidebarLeading}</div> : null}
          <Lnb
            items={lnbItems}
            showInstructorApply={showInstructorApply}
            ariaLabel={lnbAriaLabel}
            onItemSelect={onLnbItemSelect}
          />
        </aside>
        <div className={styles.content}>
          {contentHeading ? (
            <div className={styles.contentHeading}>{contentHeading}</div>
          ) : null}
          <div className={styles.contentInner}>{children}</div>
        </div>
      </div>
    </div>
  )
}
