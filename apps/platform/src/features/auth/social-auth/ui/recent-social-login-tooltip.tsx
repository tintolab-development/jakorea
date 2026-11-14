import { PFText } from '@/shared/ui'
import arrowUrl from '../image/icon/recent-login-tooltip-arrow.svg'
import styles from './recent-social-login-tooltip.module.css'

/** 로그인 화면 — 최근 로그인한 소셜 버튼 아래 안내 (Figma 2465-130). 부모는 position: relative */
export function RecentSocialLoginTooltip() {
  return (
    <span className={styles.tooltip} role="note">
      <img className={styles.arrow} src={arrowUrl} alt="" aria-hidden="true" />
      <span className={styles.bubble}>
        <PFText as="span" typo="bd-sm-md" color="white">
          최근 로그인한 방법이에요
        </PFText>
      </span>
    </span>
  )
}
