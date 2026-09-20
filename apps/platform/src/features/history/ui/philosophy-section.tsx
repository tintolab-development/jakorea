import { PFText } from '@/shared/ui'
import { HISTORY_PHILOSOPHY_CARDS } from '../lib/mock-data'
import { CopyLines } from './copy-break'
import styles from './philosophy-section.module.css'

export function PhilosophySection() {
  return (
    <section className={styles.section} aria-labelledby="history-philosophy-title">
      <div className={styles.header}>
        <div className={styles.headings}>
          <PFText as="p" typo="hl-sm" color="primary-500" className={styles.eyebrow}>
            LEARNING BY DOING
          </PFText>
          <PFText as="h2" id="history-philosophy-title" typo="page-title-md" color="black" className={styles.title}>
            ‘나는 할 수 있다’는
            <br />
            믿음을 키우는 교육
          </PFText>
        </div>
        <PFText as="p" typo="bd-lg-rg" color="black" className={styles.lead}>
          <CopyLines
            pc={[
              'JA가 추구하는 변화의 중심에는 자기효능감(Self-efficacy)이 있습니다.',
              '자기효능감은 새로운 문제를 만났을 때, 스스로 해낼 수 있다고 믿고 실제 행동으로 옮기는 힘입니다.',
              '정답을 알려주는 대신 청소년이 직접 시도하고 실패에서 배우며 더 나은 방법을 찾을 수 있도록 돕습니다.',
            ]}
            mobile={[
              'JA가 추구하는 변화의 중심에는 자기효능감(Self-efficacy)이 있습니다.',
              '자기효능감은 새로운 문제를 만났을 때, 스스로 해낼 수 있다고 믿고 실제 행동으로 옮기는 힘입니다.',
              '정답을 알려주는 대신 청소년이 직접 시도하고 실패에서 배우며 더 나은 방법을 찾을 수 있도록 돕습니다.',
            ]}
          />
        </PFText>
      </div>

      <ul className={styles.cards}>
        {HISTORY_PHILOSOPHY_CARDS.map(card => (
          <li
            key={card.id}
            className={`${styles.card} ${card.id === 'role-model' ? styles.roleModel : styles[card.id]}`}
          >
            <img className={styles.photo} src={card.imageUrl} alt={card.alt} />
            <div className={styles.overlay} aria-hidden="true" />
            <div className={styles.cardCopy}>
              <PFText as="h3" typo="hl-lg" color="white" className={styles.cardTitle}>
                {card.title}
              </PFText>
              <PFText as="p" typo="bd-lg-rg" color="white" className={styles.cardBody}>
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
    </section>
  )
}
