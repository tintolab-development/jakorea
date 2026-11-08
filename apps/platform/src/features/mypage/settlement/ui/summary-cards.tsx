import { PFText } from '@/shared/ui'
import { formatMonthExpectedLabel, formatMonthPaidLabel } from '../lib/date-keys'
import { formatWonNumber } from '../lib/format-amount'
import type { SettlementOverviewSummary } from '../model/types'
import styles from './summary-cards.module.css'

type AmountColor = 'black' | 'primary-500'

type SettlementSummaryCardsProps = {
  month: string
  summary: SettlementOverviewSummary
}

export function SettlementSummaryCards({ month, summary }: SettlementSummaryCardsProps) {
  const cards: {
    key: keyof SettlementOverviewSummary
    label: string
    amountColor: AmountColor
  }[] = [
    { key: 'totalPaidAmount', label: '총 정산 완료금', amountColor: 'black' },
    { key: 'monthPaidAmount', label: formatMonthPaidLabel(month), amountColor: 'black' },
    {
      key: 'monthExpectedAmount',
      label: formatMonthExpectedLabel(month),
      amountColor: 'primary-500',
    },
  ]

  return (
    <section className={styles.row} aria-label="정산 금액 요약">
      {cards.map(card => {
        const amount = summary[card.key]
        return (
          <article key={card.key} className={styles.card}>
            <PFText as="h2" typo="bd-md-md" color="black" className={styles.label}>
              {card.label}
            </PFText>
            <p className={styles.amountRow}>
              <PFText
                as="span"
                typo="hd-md"
                color={card.amountColor}
                className={styles.amount}
              >
                {formatWonNumber(amount)}
              </PFText>
              <PFText
                as="span"
                typo="bd-lg-sb"
                color={card.amountColor}
                className={styles.unit}
              >
                원
              </PFText>
            </p>
          </article>
        )
      })}
    </section>
  )
}
