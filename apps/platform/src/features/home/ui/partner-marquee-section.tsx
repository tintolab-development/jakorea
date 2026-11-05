import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PFText } from '@/shared/ui'
import jaArrowCtaMintUrl from '../image/icon/ja-arrow-cta-mint.svg'
import jaArrowCtaTealUrl from '../image/icon/ja-arrow-cta-teal.svg'
import { useHomeMain } from '../api/use-home-main'
import type { HomeDonationCta } from '../lib/view'
import type { HomePartnerLogo } from '../lib/home-fallback-content'
import { gridCellsFromPartnerRows } from '../lib/split-partner-logo-rows'
import { SkeletonBlock } from './skeleton-block'
import styles from './partner-marquee-section.module.css'

const PARTNER_SKELETON_KEYS = [0, 1, 2, 3] as const
const PARTNER_SKELETON_ROWS = [0, 1] as const

function LogoChips({ logos, hidden }: { logos: readonly HomePartnerLogo[]; hidden?: boolean }) {
  return (
    <ul className={styles.logoGroup} aria-hidden={hidden || undefined}>
      {logos.map((logo, index) => (
        <li className={styles.logoChip} key={`${logo.name}-${index}`}>
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

function DonationCtaLink({
  cta,
  className,
  iconUrl,
  labelColor,
}: {
  cta: HomeDonationCta
  className: string
  iconUrl: string
  labelColor: 'white' | 'primary-500'
}) {
  const body = (
    <>
      <PFText as="span" typo="hl-lg" color={labelColor} className={styles.ctaLabel}>
        {cta.label}
      </PFText>
      <img className={styles.ctaIcon} src={iconUrl} alt="" width={32} height={32} />
    </>
  )

  if (cta.external) {
    return (
      <a className={className} href={cta.href} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    )
  }

  return (
    <Link className={className} to={cta.href}>
      {body}
    </Link>
  )
}

function PartnerHeader() {
  return (
    <div className={styles.header}>
      <p className={styles.eyebrow}>Our Partners in Education</p>
      <h2 className={styles.title}>배움에 함께하는 후원 기업들</h2>
    </div>
  )
}

function PartnerLogoSkeleton() {
  return (
    <>
      <ul className={styles.logoGrid} aria-hidden="true">
        {PARTNER_SKELETON_KEYS.map(key => (
          <li className={styles.logoChip} key={key}>
            <SkeletonBlock className={styles.logoSkeleton} />
          </li>
        ))}
      </ul>
      <div className={styles.marqueeArea} aria-hidden="true">
        {PARTNER_SKELETON_ROWS.map(row => (
          <div className={styles.marqueeRow} key={row}>
            <div className={styles.logoSkeletonRow}>
              {PARTNER_SKELETON_KEYS.map(key => (
                <div className={styles.logoChip} key={key}>
                  <SkeletonBlock className={styles.logoSkeleton} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function PartnerMarqueeSection() {
  const { partnerRows, donationTitle, donationCta1, donationCta2, isPending } = useHomeMain()
  const gridCells = useMemo(() => gridCellsFromPartnerRows(partnerRows), [partnerRows])
  const hasLogos = partnerRows.some(row => row.length > 0)
  const donationTitleLines = donationTitle.split(/\r?\n/).filter(Boolean)
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
    <section className={styles.section} aria-busy={isPending || undefined}>
      {isPending ? (
        <>
          <PartnerHeader />
          <PartnerLogoSkeleton />
        </>
      ) : hasLogos ? (
        <>
          <PartnerHeader />

          <ul className={styles.logoGrid} aria-label="후원 기업 로고">
            {gridCells.map((logo, index) =>
              logo ? (
                <li className={styles.logoChip} key={`${logo.name}-${index}`}>
                  {logo.logoUrl ? (
                    <img className={styles.logoImage} src={logo.logoUrl} alt={logo.name} />
                  ) : (
                    <span className={styles.logoText}>{logo.name}</span>
                  )}
                </li>
              ) : (
                <li className={styles.logoGridEmpty} key={`empty-${index}`} aria-hidden />
              ),
            )}
          </ul>

          <div
            ref={setMarqueeNode}
            className={[styles.marqueeArea, marqueeInView ? styles.marqueePlaying : '']
              .filter(Boolean)
              .join(' ')}
            aria-label="후원 기업 로고"
          >
            {partnerRows.map((row, rowIndex) => (
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
        </>
      ) : null}

      <div className={styles.cta}>
        <div className={styles.ctaInner}>
          <p className={styles.ctaCopy}>
            {donationTitleLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
          <div className={styles.ctaActions}>
            <DonationCtaLink
              cta={donationCta1}
              className={styles.ctaPrimaryLink}
              iconUrl={jaArrowCtaMintUrl}
              labelColor="white"
            />
            <DonationCtaLink
              cta={donationCta2}
              className={styles.ctaSecondaryLink}
              iconUrl={jaArrowCtaTealUrl}
              labelColor="primary-500"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
