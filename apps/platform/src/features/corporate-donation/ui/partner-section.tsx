import { useMemo } from 'react'
import { HOME_PARTNER_LOGO_ROWS, type HomePartnerLogo } from '@/features/home'
import homePartnerStyles from '@/features/home/ui/partner-marquee-section.module.css'
import { PFText } from '@/shared/ui'
import { PARTNER_SECTION_TITLE } from '../lib/constants'
import styles from './partner-section.module.css'

function LogoChips({ logos, hidden }: { logos: readonly HomePartnerLogo[]; hidden?: boolean }) {
  return (
    <ul className={homePartnerStyles.logoGroup} aria-hidden={hidden || undefined}>
      {logos.map(logo => (
        <li className={homePartnerStyles.logoChip} key={logo.name}>
          {logo.logoUrl ? (
            <img className={homePartnerStyles.logoImage} src={logo.logoUrl} alt={logo.name} />
          ) : (
            <span className={homePartnerStyles.logoText}>{logo.name}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function PartnerSection() {
  const flatLogos = useMemo(
    () => HOME_PARTNER_LOGO_ROWS.flatMap(row => [...row]),
    [],
  )

  return (
    <section className={styles.section} aria-labelledby="corporate-donation-partner-title">
      <PFText
        as="h2"
        id="corporate-donation-partner-title"
        typo="page-title-sm"
        color="black"
        className={styles.title}
      >
        {PARTNER_SECTION_TITLE}
      </PFText>

      <div className={styles.visual}>
        <ul className={homePartnerStyles.logoGrid} aria-label="함께해준 기업 로고">
          {flatLogos.map(logo => (
            <li className={homePartnerStyles.logoChip} key={logo.name}>
              {logo.logoUrl ? (
                <img className={homePartnerStyles.logoImage} src={logo.logoUrl} alt={logo.name} />
              ) : (
                <span className={homePartnerStyles.logoText}>{logo.name}</span>
              )}
            </li>
          ))}
        </ul>

        <div className={homePartnerStyles.marqueeArea} aria-label="함께해준 기업 로고">
          {HOME_PARTNER_LOGO_ROWS.map((row, rowIndex) => (
            <div className={homePartnerStyles.marqueeRow} key={rowIndex}>
              <div
                className={[
                  homePartnerStyles.marqueeTrack,
                  rowIndex % 2 === 1 ? homePartnerStyles.marqueeTrackReverse : '',
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
      </div>
    </section>
  )
}
