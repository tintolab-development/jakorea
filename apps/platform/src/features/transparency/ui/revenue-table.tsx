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
        <tr>
          <th scope="col" className={styles.headCell}>
            구분
          </th>
          <th scope="col" className={styles.headCell}>
            비율
          </th>
          <th scope="col" className={styles.headCell}>
            금액
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(slice => (
          <tr key={slice.id} className={styles.row}>
            <td className={styles.cell}>{slice.label}</td>
            <td className={styles.cell}>{slice.percent}%</td>
            <td className={styles.cell}>{formatKrwAmount(slice.amount)}</td>
          </tr>
        ))}
        <tr className={styles.totalRow}>
          <td className={styles.cell}>수익총계</td>
          <td className={styles.cell}>100.0%</td>
          <td className={styles.cell}>{formatKrwAmount(summary.totalAmount)}</td>
        </tr>
      </tbody>
    </table>
  )
}
