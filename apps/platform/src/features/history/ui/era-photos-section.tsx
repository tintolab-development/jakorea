import { PFText } from '@/shared/ui'
import patternLeftUrl from '../image/illustration/pattern-era-left.svg'
import patternRightUrl from '../image/illustration/pattern-era-right.svg'
import { HISTORY_ERA_PHOTOS } from '../lib/mock-data'
import { CopyLines } from './copy-break'
import styles from './era-photos-section.module.css'

export function EraPhotosSection() {
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
        {HISTORY_ERA_PHOTOS.map(item => (
          <article key={item.year} className={`${styles.item} ${styles[item.align]} ${styles[`y${item.year}`]}`}>
            <p className={styles.year} aria-hidden="true">
              {item.year}
            </p>
            <div className={styles.media}>
              <img className={styles.photo} src={item.imageUrl} alt={item.alt} />
            </div>
            <PFText as="p" typo="bd-lg-rg" color="white" className={styles.caption}>
              {item.captionLines ? (
                <CopyLines pc={item.captionLines} mobile={[item.caption]} />
              ) : (
                item.caption
              )}
            </PFText>
          </article>
        ))}
      </div>
    </section>
  )
}
