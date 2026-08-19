import type { MypageLnbItem, MypageLnbItemKey } from '@/features/mypage'
import { PFText } from '@/shared/ui'
import { InstructorApplyCta } from './instructor-apply-cta'
import { getLnbIconUrl } from './lnb-icon-map'
import styles from './lnb.module.css'

type LnbProps = {
  items: MypageLnbItem[]
  showInstructorApply?: boolean
  ariaLabel?: string
  onItemSelect?: (key: MypageLnbItemKey) => void
}

export function Lnb({
  items,
  showInstructorApply = false,
  ariaLabel = '마이페이지 메뉴',
  onItemSelect,
}: LnbProps) {
  return (
    <nav className={styles.lnb} aria-label={ariaLabel}>
      <div className={styles.menu}>
        {items.map(item => {
          const itemClassName = [
            styles.item,
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
                className={itemClassName}
                type="button"
                aria-current={item.active ? 'page' : undefined}
                disabled={item.enabled === false}
                onClick={() => {
                  if (item.enabled === false) return
                  onItemSelect?.(item.key)
                }}
              >
                {iconUrl ? (
                  <img className={styles.icon} src={iconUrl} alt="" aria-hidden="true" />
                ) : null}
                <PFText
                  as="span"
                  typo="bd-md-md"
                  color={item.active ? 'primary-700' : 'neutral-cool-600'}
                  className={item.active ? styles.labelActive : styles.label}
                >
                  {item.label}
                </PFText>
              </button>
              {item.dividerAfter ? (
                <div className={styles.divider} role="separator" aria-hidden="true" />
              ) : null}
            </div>
          )
        })}
      </div>

      {showInstructorApply ? (
        <div className={styles.ctaWrap}>
          <InstructorApplyCta />
        </div>
      ) : null}
    </nav>
  )
}
