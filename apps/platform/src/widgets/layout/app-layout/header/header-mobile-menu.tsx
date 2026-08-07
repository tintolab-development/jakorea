import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import chevronDownBlackUrl from '@/shared/assets/icons/chevron-down-black.svg'
import chevronUpBlackUrl from '@/shared/assets/icons/chevron-up-black-32.svg'
import chevronLeftGrayUrl from '@/shared/assets/icons/chevron-left-gray.svg'
import externalLinkIconUrl from '@/shared/assets/icons/arrow-diagonal-black.svg'
import notificationsIconUrl from '../image/icon/notifications.svg'
import {
  getLoggedInActionRoute,
  guestUserActionRoutes,
  navigationGroups,
  type NavigationItemLabel,
  type NavigationSubItem,
} from './header-config'
import styles from './header-mobile-menu.module.css'

type HeaderMobileMenuProps = {
  open: boolean
  onClose: () => void
  isLoggedIn?: boolean
  onLogout?: () => void
}

function MobileChildMenuItem({
  item,
  onNavigate,
}: {
  item: NavigationSubItem
  onNavigate: () => void
}) {
  const itemClassName = [
    styles.childMenuItem,
    'typo-bd-sm-rg',
    !item.href ? styles.childMenuItemDisabled : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <span>{item.label}</span>
      {item.external ? (
        <img
          className={styles.childMenuExternalIcon}
          src={externalLinkIconUrl}
          alt=""
          aria-hidden="true"
        />
      ) : null}
    </>
  )

  if (item.href) {
    if (item.external) {
      return (
        <a
          className={itemClassName}
          href={item.href}
          role="menuitem"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
        >
          {content}
        </a>
      )
    }

    return (
      <Link className={itemClassName} to={item.href} role="menuitem" onClick={onNavigate}>
        {content}
      </Link>
    )
  }

  return (
    <span className={itemClassName} role="menuitem" aria-disabled="true">
      {content}
    </span>
  )
}

export function HeaderMobileMenu({
  open,
  onClose,
  isLoggedIn = false,
  onLogout,
}: HeaderMobileMenuProps) {
  const navigate = useNavigate()
  const [expandedGroup, setExpandedGroup] = useState<NavigationItemLabel | null>(null)

  useEffect(() => {
    if (!open) return

    setExpandedGroup(null)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const overlayClassName = [styles.overlay, styles.overlayOpen].join(' ')

  const handleNavigate = () => {
    onClose()
  }

  return createPortal(
    <div
      className={overlayClassName}
      id="mobile-header-menu"
      role="dialog"
      aria-modal="true"
      aria-label="모바일 메뉴"
    >
      <div className={styles.topBar}>
        <button
          className={styles.topBarButton}
          type="button"
          aria-label="메뉴 닫기"
          onClick={onClose}
        >
          <img className={styles.backIcon} src={chevronLeftGrayUrl} alt="" aria-hidden="true" />
        </button>
        {isLoggedIn ? (
          <button className={styles.topBarButton} type="button" aria-label="알림확인">
            <img
              className={styles.notificationIcon}
              src={notificationsIconUrl}
              alt=""
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className={styles.topBarSpacer} aria-hidden="true" />
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.authCard}>
          <div className={styles.authButtonRow}>
            {isLoggedIn ? (
              <>
                <button
                  className={[styles.authButton, 'typo-bd-sm-rg'].join(' ')}
                  type="button"
                  onClick={() => {
                    const route = getLoggedInActionRoute('마이페이지')
                    if (route) {
                      navigate(route)
                      onClose()
                    }
                  }}
                >
                  마이페이지
                </button>
                <button
                  className={[styles.authButton, 'typo-bd-sm-rg'].join(' ')}
                  type="button"
                  onClick={() => {
                    onLogout?.()
                    onClose()
                  }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  className={[styles.authButton, 'typo-bd-sm-rg'].join(' ')}
                  type="button"
                  onClick={() => {
                    navigate(guestUserActionRoutes['회원가입'])
                    onClose()
                  }}
                >
                  회원가입
                </button>
                <button
                  className={[styles.authButton, 'typo-bd-sm-rg'].join(' ')}
                  type="button"
                  onClick={() => {
                    navigate(guestUserActionRoutes['로그인'])
                    onClose()
                  }}
                >
                  로그인
                </button>
              </>
            )}
          </div>
        </div>

        <nav className={styles.menuList} aria-label="주요 메뉴">
          {navigationGroups.map(group => {
            const isExpanded = expandedGroup === group.label

            return (
              <div className={styles.menuGroup} key={group.label}>
                <button
                  className={[styles.menuTrigger, 'typo-bd-lg-sb'].join(' ')}
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => {
                    setExpandedGroup(current => (current === group.label ? null : group.label))
                  }}
                >
                  <span className={styles.menuTriggerLabel}>{group.label}</span>
                  <img
                    className={styles.menuChevron}
                    src={isExpanded ? chevronUpBlackUrl : chevronDownBlackUrl}
                    alt=""
                    aria-hidden="true"
                  />
                </button>

                {isExpanded ? (
                  <div className={styles.childMenuList} role="group" aria-label={group.label}>
                    {group.children.map(item => (
                      <MobileChildMenuItem
                        item={item}
                        key={item.label}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
      </div>
    </div>,
    document.body
  )
}
