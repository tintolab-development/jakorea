import { Link } from 'react-router-dom'
import { INDIVIDUAL_DONATION_PATH } from '@/features/individual-donation'
import { SUPPORT_CORPORATE_PATH } from '@/shared/config/gnb-temporary-paths'
import { PFText } from '@/shared/ui'
import jaArrowCtaMintUrl from '../image/icon/ja-arrow-cta-mint.svg'
import jaArrowCtaTealUrl from '../image/icon/ja-arrow-cta-teal.svg'
import { HOME_PARTNER_LOGO_ROWS, type HomePartnerLogo } from '../lib/mock'
import styles from './partner-marquee-section.module.css'

function LogoChips({ logos, hidden }: { logos: readonly HomePartnerLogo[]; hidden?: boolean }) {
  return (
    <ul className={styles.logoGroup} aria-hidden={hidden || undefined}>
      {logos.map(logo => (
        <li className={styles.logoChip} key={logo.name}>
          {logo.logoUrl ? (
            <img className={styles.logoImage} src={logo.logoUrl} alt={logo.name} />
          ) : (
            <span className={styles.logoText}>{logo.name}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function PartnerMarqueeSection() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Our Partners in Education</p>
        <h2 className={styles.title}>배움에 함께하는 후원 기업들</h2>
      </div>

      <div className={styles.marqueeArea} aria-label="후원 기업 로고">
        {HOME_PARTNER_LOGO_ROWS.map((row, rowIndex) => (
          <div className={styles.marqueeRow} key={rowIndex}>
            <div
              className={[
                styles.marqueeTrack,
                rowIndex % 2 === 1 ? styles.marqueeTrackReverse : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <LogoChips logos={row} />
              <LogoChips logos={row} hidden />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.cta}>
        <div className={styles.ctaInner}>
          <p className={styles.ctaCopy}>
            더 많은 학생들이 배움의 기회를
            <br />
            만날 수 있게 함께해 주세요
          </p>
          <div className={styles.ctaActions}>
            <Link className={styles.ctaPrimaryLink} to={INDIVIDUAL_DONATION_PATH}>
              <PFText as="span" typo="hl-lg" color="white" className={styles.ctaLabel}>
                개인후원 시작하기
              </PFText>
              <img
                className={styles.ctaIcon}
                src={jaArrowCtaMintUrl}
                alt=""
                width={32}
                height={32}
              />
            </Link>
            <Link className={styles.ctaSecondaryLink} to={SUPPORT_CORPORATE_PATH}>
              <PFText as="span" typo="hl-lg" color="primary-500" className={styles.ctaLabel}>
                기업후원 문의하기
              </PFText>
              <img
                className={styles.ctaIcon}
                src={jaArrowCtaTealUrl}
                alt=""
                width={32}
                height={32}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
