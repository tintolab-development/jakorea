import { Fragment } from 'react'
import supportCorporateGradientUrl from '@/assets/background_gradient/support-corporate-gradient.png'
import { PFText } from '@/shared/ui'
import {
  HERO_DESCRIPTION_LINES,
  HERO_LABEL,
  HERO_TITLE_LINES,
} from '../lib/constants'
import { HERO_IMAGE_URL } from '../lib/hero-image'
import styles from './hero-section.module.css'

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="corporate-donation-hero-title">
      <div
        className={styles.background}
        style={{ backgroundImage: `url(${supportCorporateGradientUrl})` }}
        aria-hidden="true"
      />

      <div className={styles.content}>
        <div className={styles.media}>
          <div className={styles.imageFrame}>
            <img
              className={styles.image}
              src={HERO_IMAGE_URL}
              alt=""
              width={960}
              height={720}
            />
          </div>
        </div>

        <div className={styles.textArea}>
          <div className={styles.text}>
            <PFText as="span" typo="hl-lg" className={styles.eyebrow}>
              {HERO_LABEL}
            </PFText>

            <PFText
              as="h1"
              id="corporate-donation-hero-title"
              typo="page-title-md"
              color="black"
              className={styles.title}
            >
              <span>
                {HERO_TITLE_LINES.map((line, index) => (
                  <Fragment key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </Fragment>
                ))}
              </span>
            </PFText>

            <PFText as="p" typo="bd-lg-rg" color="neutral-cool-700" className={styles.description}>
              {HERO_DESCRIPTION_LINES.map((line, index) => (
                <Fragment key={line}>
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
