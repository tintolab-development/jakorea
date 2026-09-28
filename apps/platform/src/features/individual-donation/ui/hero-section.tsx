import { Fragment } from 'react'
import supportIndividualGradientUrl from '@/assets/background_gradient/support-individual-gradient.png'
import { PFText, remoteCopyClassName } from '@/shared/ui'
import { usePublicPersonalSponsorshipView } from '../api/hooks'
import { HERO_LABEL } from '../lib/constants'
import styles from './hero-section.module.css'

export function HeroSection() {
  const { titleLines, descriptionLines, heroImageUrl, isPending } =
    usePublicPersonalSponsorshipView()
  const copyClass = remoteCopyClassName(isPending)

  return (
    <section
      className={styles.hero}
      aria-labelledby="individual-donation-hero-title"
      aria-busy={isPending || undefined}
    >
      <div
        className={styles.background}
        style={{ backgroundImage: `url(${supportIndividualGradientUrl})` }}
        aria-hidden="true"
      />

      <div className={styles.content}>
        <div className={styles.media}>
          <div className={styles.imageFrame}>
            {heroImageUrl ? (
              <img
                className={styles.image}
                src={heroImageUrl}
                alt=""
                width={960}
                height={720}
              />
            ) : (
              <div className={styles.imagePlaceholder} aria-hidden="true" />
            )}
          </div>
        </div>
        <div className={styles.textArea}>
          <div className={[styles.text, copyClass].join(' ')}>
            <PFText as="span" typo="hl-lg" className={styles.eyebrow}>
              {HERO_LABEL}
            </PFText>

            <PFText
              as="h1"
              id="individual-donation-hero-title"
              typo="page-title-md"
              color="black"
              className={styles.title}
            >
              {titleLines.map((line, index) => (
                <Fragment key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </PFText>

            <PFText as="p" typo="bd-lg-rg" color="neutral-cool-700" className={styles.description}>
              {descriptionLines.map((line, index) => (
                <Fragment key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </PFText>
          </div>
        </div>
      </div>
    </section>
  )
}
