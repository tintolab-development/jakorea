import { useEffect, useState, type ReactNode } from 'react'
import type { MypageLnbItem, MypageLnbItemKey } from '@/features/mypage'
import { useMediaQuery } from '@/shared/hooks'
import { platformMediaQueries } from '@/shared/lib/breakpoints'
import { Lnb, type LnbAppearance } from './lnb'
import styles from './mypage-layout.module.css'

type MypageLayoutProps = {
  lnbItems: MypageLnbItem[]
  showInstructorApply?: boolean
  /** home: 나의 홈 상단 여백 / subpage: 제목 아래 LNB·본문 정렬 */
  variant?: 'home' | 'subpage'
  /**
   * 모바일에서 contentHeading → LNB → 본문 순으로 스택.
   * PC는 좌 LNB | 우(heading+본문) 유지.
   */
  mobileStack?: 'default' | 'headingFirst'
  /** LNB 열 상단 — 백 링크 등. 내용 영역을 넘지 않음 */
  sidebarLeading?: ReactNode
  /** 내용 열 상단 — 페이지 제목 등. LNB 영역을 넘지 않음 */
  contentHeading?: ReactNode
  lnbAppearance?: LnbAppearance
  lnbAriaLabel?: string
  onLnbItemSelect?: (key: MypageLnbItemKey) => void
  children: ReactNode
}

export function MypageLayout({
  lnbItems,
  showInstructorApply = false,
  variant = 'home',
  mobileStack = 'default',
  sidebarLeading,
  contentHeading,
  lnbAppearance,
  lnbAriaLabel,
  onLnbItemSelect,
  children,
}: MypageLayoutProps) {
  const isBelowPc = useMediaQuery(platformMediaQueries.belowPc)
  const useMobileLnbDropdown = isBelowPc && lnbAppearance !== 'category'
  const [mobileLnbOpen, setMobileLnbOpen] = useState(false)

  useEffect(() => {
    if (!useMobileLnbDropdown) {
      setMobileLnbOpen(false)
    }
  }, [useMobileLnbDropdown])

  useEffect(() => {
    if (!mobileLnbOpen) return

    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileLnbOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileLnbOpen])

  const shellClassName = [
    styles.shell,
    variant === 'subpage' ? styles.shellSubpage : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const layoutClassName = [
    styles.layout,
    mobileStack === 'headingFirst' ? styles.layoutHeadingFirst : undefined,
    mobileLnbOpen ? styles.layoutMenuOpen : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const handleDropdownOpenChange = (open: boolean) => {
    if (!useMobileLnbDropdown) return
    setMobileLnbOpen(open)
  }

  return (
    <div className={shellClassName}>
      {variant === 'home' ? <div className={styles.pageBackground} aria-hidden="true" /> : null}
      <div className={layoutClassName}>
        <aside
          className={[styles.sidebar, sidebarLeading ? styles.sidebarWithLeading : undefined]
            .filter(Boolean)
            .join(' ')}
        >
          {sidebarLeading ? <div className={styles.sidebarLeading}>{sidebarLeading}</div> : null}
          <Lnb
            items={lnbItems}
            showInstructorApply={showInstructorApply}
            appearance={lnbAppearance}
            ariaLabel={lnbAriaLabel}
            onItemSelect={onLnbItemSelect}
            dropdownOpen={useMobileLnbDropdown ? mobileLnbOpen : false}
            onDropdownOpenChange={handleDropdownOpenChange}
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
