import type { MypageLnbItem } from '@/features/mypage'
import { PFText } from '@/shared/ui'
import { InstructorApplyCta } from './instructor-apply-cta'
import { getLnbIconUrl } from './lnb-icon-map'
import styles from './lnb.module.css'

type LnbProps = {
  items: MypageLnbItem[]
  showInstructorApply?: boolean
}

export function Lnb({ items, showInstructorApply = false }: LnbProps) {
  return (
    <nav className={styles.lnb} aria-label="마이페이지 메뉴">
      <div className={styles.menu}>
        {items.map(item => {
          const itemClassName = [
            styles.item,
            item.active ? styles['item-active'] : undefined,
            item.enabled === false ? styles['item-disabled'] : undefined,
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={item.key}
              className={itemClassName}
              type="button"
              aria-current={item.active ? 'page' : undefined}
              disabled={item.enabled === false}
            >
              <img
                className={styles.icon}
                src={getLnbIconUrl(item.key, Boolean(item.active))}
                alt=""
                aria-hidden="true"
              />
              <PFText
                as="span"
                typo="bd-md-md"
                color={item.active ? 'primary-700' : 'neutral-cool-600'}
                className={item.active ? styles['label-active'] : styles.label}
              >
                {item.label}
              </PFText>
            </button>
          )
        })}
      </div>

      {showInstructorApply ? (
        <div className={styles['cta-wrap']}>
          <InstructorApplyCta />
        </div>
      ) : null}
    </nav>
  )
}
