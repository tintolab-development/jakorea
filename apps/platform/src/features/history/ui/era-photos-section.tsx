import { PFText } from '@/shared/ui'
import patternLeftUrl from '../image/illustration/pattern-era-left.svg'
import patternRightUrl from '../image/illustration/pattern-era-right.svg'
import type { HistoryPageView } from '../model/view'
import { PreservedLines } from './preserved-lines'
import styles from './era-photos-section.module.css'

type EraPhotosSectionProps = {
  eras: HistoryPageView['eras']
}

function yearClass(year: string) {
  if (year === '1920') return styles.y1920
  if (year === '1950') return styles.y1950
  if (year === '1960') return styles.y1960
  if (year === '1980') return styles.y1980
  return undefined
}

export function EraPhotosSection({ eras }: EraPhotosSectionProps) {
  return (
    <section className={styles.section} aria-label="연도별 JA 역사 사진">
      <img
        className={styles.patternLeft}
        src={patternLeftUrl}
        alt=""
        aria-hidden="true"
        width={1225}
        height={1107}
      />
      <img
        className={styles.patternRight}
        src={patternRightUrl}
        alt=""
        aria-hidden="true"
        width={727}
        height={557}
      />

      <div className={styles.list}>
        {eras.map((item, index) => (
          <article
            key={`${item.year}-${index}`}
            className={[styles.item, styles[item.align], yearClass(item.year)].filter(Boolean).join(' ')}
          >
            <p className={styles.year} aria-hidden="true">
              {item.year}
            </p>
            <div className={styles.media}>
              {item.image.url ? (
                <img className={styles.photo} src={item.image.url} alt={item.image.alt} />
              ) : (
                <div className={styles.photo} role="img" aria-label={item.image.alt || undefined} />
              )}
            </div>
            <PFText as="p" typo="bd-lg-rg" color="white" className={styles.caption}>
              <PreservedLines text={item.caption} />
            </PFText>
          </article>
        ))}
      </div>
    </section>
  )
}
