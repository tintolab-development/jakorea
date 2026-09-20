import { PFText } from '@/shared/ui'
import { HISTORY_THRIVE_CARDS } from '../lib/mock-data'
import { CopyLines } from './copy-break'
import styles from './thrive-section.module.css'

export function ThriveSection() {
  return (
    <section className={styles.section} aria-labelledby="history-thrive-title">
      <div className={styles.header}>
        <h2 id="history-thrive-title" className={styles.title}>
          <span className={styles.accent}>Thrive:</span>
          <span className={styles.titleRest}>2050년을 향한 JA의 발걸음</span>
        </h2>
        <PFText as="p" typo="bd-lg-rg" color="black" className={styles.lead}>
          <CopyLines
            pc={[
              '기술이 빠르게 발전함에 따라 교육과 일의 방식이 달라지고 있습니다.',
              'JA Worldwide는 2026-2028 글로벌 전략 Thrive를 기반으로 더 많은 청소년에게 교육의 기회를 제공하고,',
              '디지털 기술을 적극적으로 활용하며, 파트너십을 통해 더 큰 임팩트를 만들어 갈 예정입니다',
            ]}
            mobile={[
              '기술이 빠르게 발전함에 따라 교육과 일의 방식이 달라지고 있습니다.',
              'JA Worldwide는 2026-2028 글로벌 전략 Thrive를 기반으로 더 많은 청소년에게 교육의 기회를 제공하고,',
              '디지털 기술을 적극적으로 활용하며, 파트너십을 통해 더 큰 임팩트를 만들어 갈 예정입니다',
            ]}
          />
        </PFText>
      </div>

      <ul className={styles.cards}>
        {HISTORY_THRIVE_CARDS.map(card => (
          <li key={card.id} className={`${styles.card} ${styles[card.id]}`}>
            <img
              className={styles.decoration}
              src={card.decorationUrl}
              alt=""
              aria-hidden="true"
            />
            <div className={styles.cardCopy}>
              <h3 className={styles.cardTitle}>{card.titleLines.join(' ')}</h3>
              <PFText as="p" typo="hl-lg" color="white" className={styles.cardBody}>
                {card.descriptionPcLines && card.descriptionMobileLines ? (
                  <CopyLines pc={card.descriptionPcLines} mobile={card.descriptionMobileLines} />
                ) : (
                  card.description
                )}
              </PFText>
            </div>
          </li>
        ))}
      </ul>

      <PFText as="p" typo="hl-lg" color="neutral-cool-500" className={styles.footnote}>
        <CopyLines
          pc={[
            'JA는 2050년까지 청소년에게 연간 1억 건의 학습 경험을 제공하고, 측정 가능한 형태의 변화를 창출해 번영하는 공동체를 만드는 것을 장기 목표로 삼아 오늘도',
            '전 세계 100여 개 국가에서 청소년을 교육하고 있습니다.',
          ]}
          mobile={[
            'JA는 2050년까지 청소년에게 연간 1억 건의 학습 경험을',
            '제공하고, 측정 가능한 형태의 변화를 창출해',
            '번영하는 공동체를 만드는 것을 장기 목표로 삼아 오늘도',
            '전 세계 100여 개 국가에서 청소년을 교육하고 있습니다.',
          ]}
        />
      </PFText>
    </section>
  )
}
