import { Fragment } from 'react'
import { PFText, remoteCopyClassName } from '@/shared/ui'
import { usePublicTalentSponsorshipView } from '../api/hooks'
import { HERO_LABEL } from '../lib/constants'
import { HERO_BG_URL, HERO_IMAGE_URL } from '../lib/hero-image'
import styles from './hero-section.module.css'

export function HeroSection() {
  const { titleLines, descriptionLines, isPending } = usePublicTalentSponsorshipView()
  const copyClass = remoteCopyClassName(isPending)

  return (
    <section
      className={styles.hero}
      aria-labelledby="talent-donation-hero-title"
      aria-busy={isPending || undefined}
    >
      <div
        className={styles.background}
        style={{ backgroundImage: `url(${HERO_BG_URL})` }}
        aria-hidden="true"
      />

      <div className={styles.content}>
        <div className={styles.textArea}>
          <div className={[styles.text, copyClass].join(' ')}>
            <PFText as="span" typo="hl-lg" className={styles.eyebrow}>
              {HERO_LABEL}
            </PFText>

            <PFText
              as="h1"
              id="talent-donation-hero-title"
              typo="page-title-md"
              color="black"
              className={styles.title}
            >
              {titleLines.map((line, index) => (
                <Fragment key={`${line}-${index}`}>
                  {index > 0 ? <br className={styles.pcOnly} /> : null}
                  {line}
                </Fragment>
              ))}
            </PFText>

            <PFText as="p" typo="bd-lg-rg" color="black" className={styles.description}>
              {descriptionLines.map((line, index) => (
                <Fragment key={`${line}-${index}`}>
                  {index > 0 ? <br className={styles.pcOnly} /> : null}
                  {line}
                </Fragment>
              ))}
            </PFText>
          </div>
        </div>

        <div className={styles.media}>
          <div className={styles.imageFrame}>
            <img
              className={styles.image}
              src={HERO_IMAGE_URL}
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
