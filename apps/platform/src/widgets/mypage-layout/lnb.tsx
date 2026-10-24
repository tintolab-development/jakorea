import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import type { MypageLnbItem, MypageLnbItemKey } from '@/features/mypage'
import chevronDownBlackUrl from '@/shared/assets/icons/chevron-down-black.svg'
import { useMediaQuery } from '@/shared/hooks'
import { platformMediaQueries } from '@/shared/lib/breakpoints'
import { PFText } from '@/shared/ui'
import { InstructorApplyCta } from './instructor-apply-cta'
import {
  getLnbIconUrl,
  getLnbMobileTriggerIconUrl,
  isLnbMobileTriggerIllustration,
} from './lnb-icon-map'
import styles from './lnb.module.css'

export type LnbAppearance = 'default' | 'category'

type LnbProps = {
  items: MypageLnbItem[]
  showInstructorApply?: boolean
  /** category: 모바일 필 탭 스타일 (회원정보 설정 등). PC는 default와 동일 */
  appearance?: LnbAppearance
  ariaLabel?: string
  onItemSelect?: (key: MypageLnbItemKey) => void
  dropdownOpen?: boolean
  onDropdownOpenChange?: (open: boolean) => void
}

type LnbMenuItemsProps = {
  items: MypageLnbItem[]
  isCategory: boolean
  menuVariant?: 'default' | 'mobilePanel'
  menuClassName?: string
  itemClassName?: string
  onItemSelect?: (key: MypageLnbItemKey) => void
  onItemClick?: (key: MypageLnbItemKey) => void
}

function LnbMenuItems({
  items,
  isCategory,
  menuVariant = 'default',
  menuClassName,
  itemClassName,
  onItemSelect,
  onItemClick,
}: LnbMenuItemsProps) {
  const isMobilePanel = menuVariant === 'mobilePanel'

  return (
    <div className={menuClassName ?? styles.menu}>
      {items.map(item => {
        const buttonClassName = [
          styles.item,
          itemClassName,
          item.active ? styles.itemActive : undefined,
          item.enabled === false ? styles.itemDisabled : undefined,
        ]
          .filter(Boolean)
          .join(' ')
        const iconUrl =
          item.hideIcon === true ? undefined : getLnbIconUrl(item.key, Boolean(item.active))

        return (
          <div key={item.key} className={styles.itemBlock}>
            <button
              className={buttonClassName}
              type="button"
              aria-current={item.active ? 'page' : undefined}
              disabled={item.enabled === false}
              onClick={() => {
                if (item.enabled === false) return
                onItemClick?.(item.key)
                onItemSelect?.(item.key)
              }}
            >
              {iconUrl ? (
                <img
                  className={isMobilePanel ? styles.mobilePanelIcon : styles.icon}
                  src={iconUrl}
                  alt=""
                  aria-hidden="true"
                />
              ) : null}
              {isMobilePanel ? (
                <span
                  className={[
                    styles.mobilePanelLabel,
                    item.active ? styles.mobilePanelLabelActive : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {item.label}
                </span>
              ) : (
                <PFText
                  as="span"
                  typo="bd-md-md"
                  color={
                    isCategory
                      ? 'inherit'
                      : item.active
                        ? 'primary-700'
                        : 'neutral-cool-600'
                  }
                  className={item.active ? styles.labelActive : styles.label}
                >
                  {item.label}
                </PFText>
              )}
            </button>
            {item.dividerAfter ? (
              <div className={styles.divider} role="separator" aria-hidden="true" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function Lnb({
  items,
  showInstructorApply = false,
  appearance = 'default',
  ariaLabel = '마이페이지 메뉴',
  onItemSelect,
  dropdownOpen = false,
  onDropdownOpenChange,
}: LnbProps) {
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const isBelowPc = useMediaQuery(platformMediaQueries.belowPc)
  const isCategory = appearance === 'category'
  const useMobileDropdown = isBelowPc && !isCategory

  useEffect(() => {
    onDropdownOpenChange?.(false)
  }, [pathname])

  useLayoutEffect(() => {
    const panel = panelRef.current
    const scrim = scrimRef.current
    if (!dropdownOpen || !panel || !scrim) return

    const updateScrimTop = () => {
      scrim.style.top = `${panel.getBoundingClientRect().top}px`
    }

    updateScrimTop()
    window.addEventListener('resize', updateScrimTop)
    return () => window.removeEventListener('resize', updateScrimTop)
  }, [dropdownOpen, items])

  const activeItem = items.find(item => item.active) ?? items[0]
  const lnbClassName = [
    styles.lnb,
    isCategory ? styles.lnbCategory : undefined,
    useMobileDropdown ? styles.lnbMobileDropdown : undefined,
    useMobileDropdown && dropdownOpen ? styles.lnbMobileDropdownOpen : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const handleItemSelect = (key: MypageLnbItemKey) => {
    onDropdownOpenChange?.(false)
    onItemSelect?.(key)
  }

  if (useMobileDropdown && activeItem) {
    const triggerIconUrl =
      activeItem.hideIcon === true
        ? undefined
        : getLnbMobileTriggerIconUrl(activeItem.key, true)
    const triggerIconClassName = isLnbMobileTriggerIllustration(activeItem.key)
      ? [
          styles.mobileTriggerIllustration,
          activeItem.key === 'education' ? styles.mobileTriggerIllustrationEducation : undefined,
        ]
          .filter(Boolean)
          .join(' ')
      : styles.icon
    const dropdownRootClassName = [
      styles.mobileDropdownRoot,
      dropdownOpen ? styles.mobileDropdownRootOpen : undefined,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <nav className={lnbClassName} aria-label={ariaLabel}>
        <div className={dropdownRootClassName}>
          <div
            className={[
              styles.mobileTriggerShell,
              dropdownOpen ? styles.mobileTriggerShellOpen : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <button
              type="button"
              className={styles.mobileTrigger}
              aria-expanded={dropdownOpen}
              aria-controls={panelId}
              onClick={() => onDropdownOpenChange?.(!dropdownOpen)}
            >
              {triggerIconUrl ? (
                <img
                  className={triggerIconClassName}
                  src={triggerIconUrl}
                  alt=""
                  aria-hidden="true"
                />
              ) : null}
              <PFText as="span" typo="hl-lg" color="black" className={styles.mobileTriggerLabel}>
                {activeItem.label}
              </PFText>
              <img
                className={[
                  styles.mobileTriggerChevron,
                  dropdownOpen ? styles.mobileTriggerChevronOpen : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                src={chevronDownBlackUrl}
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>
          {dropdownOpen ? (
            <>
              <div id={panelId} ref={panelRef} className={styles.mobilePanel}>
                <LnbMenuItems
                  items={items}
                  isCategory={false}
                  menuVariant="mobilePanel"
                  menuClassName={styles.mobilePanelMenu}
                  itemClassName={styles.mobilePanelItem}
                  onItemSelect={handleItemSelect}
                />
              </div>
              <button
                ref={scrimRef}
                type="button"
                className={styles.mobileScrim}
                aria-label="메뉴 닫기"
                onClick={() => onDropdownOpenChange?.(false)}
              />
            </>
          ) : null}
        </div>

        {showInstructorApply ? (
          <div className={styles.ctaWrap}>
            <InstructorApplyCta />
          </div>
        ) : null}
      </nav>
    )
  }

  return (
    <nav className={lnbClassName} aria-label={ariaLabel}>
      <LnbMenuItems items={items} isCategory={isCategory} onItemSelect={onItemSelect} />

      {showInstructorApply ? (
        <div className={styles.ctaWrap}>
          <InstructorApplyCta />
        </div>
      ) : null}
    </nav>
  )
}
