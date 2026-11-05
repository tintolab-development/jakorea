import { useEffect, useMemo, useState } from 'react'
import { type HomePartnerLogo } from '@/features/home'
import { gridCellsFromPartnerRows } from '@/features/home/lib/split-partner-logo-rows'
import homePartnerStyles from '@/features/home/ui/partner-marquee-section.module.css'
import { PFText } from '@/shared/ui'
import { usePublicCorporatePartnerRows } from '../api/hooks'
import { PARTNER_SECTION_TITLE } from '../lib/constants'
import styles from './partner-section.module.css'

function LogoChips({ logos, hidden }: { logos: readonly HomePartnerLogo[]; hidden?: boolean }) {
  return (
    <ul className={homePartnerStyles.logoGroup} aria-hidden={hidden || undefined}>
      {logos.map((logo, index) => (
        <li className={homePartnerStyles.logoChip} key={`${logo.name}-${index}`}>
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
  const { rows: partnerRows } = usePublicCorporatePartnerRows()
  const gridCells = useMemo(() => gridCellsFromPartnerRows(partnerRows), [partnerRows])
  const [marqueeNode, setMarqueeNode] = useState<HTMLDivElement | null>(null)
  const [marqueeInView, setMarqueeInView] = useState(false)

  useEffect(() => {
    if (!marqueeNode) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setMarqueeInView(entry?.isIntersecting ?? false)
      },
      { threshold: 0, rootMargin: '120px 0px' },
    )
    observer.observe(marqueeNode)
    return () => observer.disconnect()
  }, [marqueeNode])

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
          {gridCells.map((logo, index) =>
            logo ? (
              <li className={homePartnerStyles.logoChip} key={`${logo.name}-${index}`}>
                {logo.logoUrl ? (
                  <img className={homePartnerStyles.logoImage} src={logo.logoUrl} alt={logo.name} />
                ) : (
                  <span className={homePartnerStyles.logoText}>{logo.name}</span>
                )}
              </li>
            ) : (
              <li className={homePartnerStyles.logoGridEmpty} key={`empty-${index}`} aria-hidden />
            ),
          )}
        </ul>

        <div
          ref={setMarqueeNode}
          className={[
            homePartnerStyles.marqueeArea,
            marqueeInView ? homePartnerStyles.marqueePlaying : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label="함께해준 기업 로고"
        >
          {partnerRows.map((row, rowIndex) => (
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
