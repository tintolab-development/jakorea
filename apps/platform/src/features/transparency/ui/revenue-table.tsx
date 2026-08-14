import { formatKrwAmount } from '../lib/mock-data'
import type { FinanceSummary } from '../model/types'
import styles from './revenue-table.module.css'

type RevenueTableProps = {
  summary: FinanceSummary
  /** 테이블 표시 순서 (slice id) — 미지정 시 slices 순서 */
  order?: readonly string[]
}

export function RevenueTable({ summary, order }: RevenueTableProps) {
  const rows = order
    ? order
        .map(id => summary.slices.find(slice => slice.id === id))
        .filter(slice => slice != null)
    : summary.slices

  return (
    <table className={styles.table}>
      <colgroup>
        <col className={styles.colCategory} />
        <col className={styles.colRatio} />
        <col className={styles.colAmount} />
      </colgroup>
      <thead>
        <tr className={styles.headRow}>
          <th scope="col" className={[styles.headCell, styles.headCategory].join(' ')}>
            구분
          </th>
          <th scope="col" className={[styles.headCell, styles.pcOnly].join(' ')}>
            비율
          </th>
          <th scope="col" className={[styles.headCell, styles.headMetrics].join(' ')}>
            <span className={styles.pcOnlyInline}>금액</span>
            <span className={styles.mobileOnlyInline}>비율 · 금액</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(slice => (
          <tr key={slice.id} className={styles.row}>
            <td className={[styles.cell, styles.categoryCell].join(' ')}>{slice.label}</td>
            <td className={[styles.cell, styles.pcOnly].join(' ')}>{slice.percent}%</td>
            <td className={[styles.cell, styles.metricsCell].join(' ')}>
              <span className={styles.mobilePercent}>{slice.percent}%</span>
              <span className={styles.amountValue}>{formatKrwAmount(slice.amount)}</span>
            </td>
          </tr>
        ))}
        <tr className={styles.totalRow}>
          <td className={[styles.cell, styles.categoryCell].join(' ')}>수익총계</td>
          <td className={[styles.cell, styles.pcOnly].join(' ')}>100.0%</td>
          <td className={[styles.cell, styles.metricsCell].join(' ')}>
            <span className={styles.mobilePercent}>100.0%</span>
            <span className={styles.amountValue}>{formatKrwAmount(summary.totalAmount)}</span>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
