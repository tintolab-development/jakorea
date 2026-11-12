import { Fragment } from 'react'
import { ANALYTICS_CLICK_METRICS, recordMetric } from '@/features/analytics'
import jaArrowCtaMintUrl from '@/features/home/image/icon/ja-arrow-cta-mint.svg'
import jaArrowCtaLightUrl from '@/shared/assets/icons/ja-arrow-cta-light.svg'
import { platformMediaQueries } from '@/shared/lib'
import { PFText, remoteCopyClassName } from '@/shared/ui'
import { usePublicPersonalDonationCta } from '../api/hooks'
import { CTA_SECTION_EYEBROW, CTA_SECTION_TITLE_LINES } from '../lib/constants'
import { CTA_PHOTO_IMAGE_URL } from '../lib/cta-images'
import styles from './cta-section.module.css'

export function CtaSection() {
  const donation = usePublicPersonalDonationCta()
  const copyClass = remoteCopyClassName(donation.isPending)
  const action = (
    <>
      <PFText as="span" typo="hl-lg" color="white" className={styles.actionLabel}>
        {donation.label}
      </PFText>
      {/* 시안: PC는 연한 민트 화살표, 모바일은 민트 화살표 */}
      <picture className={styles.actionIconPicture}>
        <source media={platformMediaQueries.pcUp} srcSet={jaArrowCtaLightUrl} />
        <img
          className={styles.actionIcon}
          src={jaArrowCtaMintUrl}
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
        />
      </picture>
    </>
  )

  return (
    <section
      className={styles.section}
      aria-labelledby="individual-donation-cta-title"
      aria-busy={donation.isPending || undefined}
    >
      <div className={styles.content}>
        <div className={[styles.textArea, copyClass].join(' ')}>
          <div className={styles.text}>
            <PFText as="p" typo="page-title-sm" color="inherit" className={styles.eyebrow}>
              {CTA_SECTION_EYEBROW}
            </PFText>

            <PFText
              as="h2"
              id="individual-donation-cta-title"
              typo="page-title-sm"
              color="inherit"
              className={styles.title}
            >
              {CTA_SECTION_TITLE_LINES.map((line, index) => (
                <Fragment key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </PFText>
          </div>
          <div className={styles.actionButtonWrap}>
            {donation.href ? (
              <a
                className={styles.actionButton}
                href={donation.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordMetric(ANALYTICS_CLICK_METRICS.donationOutbound)}
              >
                {action}
              </a>
            ) : (
              <button type="button" className={styles.actionButton} disabled>
                {action}
              </button>
            )}
          </div>
        </div>

        <div className={styles.media}>
          <div className={styles.imageFrame}>
            <img
              className={styles.image}
              src={CTA_PHOTO_IMAGE_URL}
              alt=""
              width={960}
              height={640}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
