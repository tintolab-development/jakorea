import { Fragment } from 'react'
import jaArrowCtaMintUrl from '@/features/home/image/icon/ja-arrow-cta-mint.svg'
import { PFText } from '@/shared/ui'
import {
  CTA_SECTION_BUTTON_LABEL,
  CTA_SECTION_EYEBROW,
  CTA_SECTION_TITLE_LINES,
} from '../lib/constants'
import { CTA_PHOTO_IMAGE_URL } from '../lib/cta-images'
import styles from './cta-section.module.css'

export function CtaSection() {
  return (
    <section className={styles.section} aria-labelledby="individual-donation-cta-title">
      <div className={styles.content}>
        <div className={styles.textArea}>
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
            {/* TODO: 성장 후원하기 경로·기능 연결 */}
            <button type="button" className={styles.actionButton}>
              <PFText as="span" typo="hl-lg" color="white" className={styles.actionLabel}>
                {CTA_SECTION_BUTTON_LABEL}
              </PFText>
              <img
                className={styles.actionIcon}
                src={jaArrowCtaMintUrl}
                alt=""
                aria-hidden="true"
                width={32}
                height={32}
              />
            </button>
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
