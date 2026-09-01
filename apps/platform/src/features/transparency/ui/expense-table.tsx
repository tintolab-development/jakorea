import { Fragment } from 'react'
import { formatKrwAmount } from '../lib/mock-data'
import type { ExpenseDetailGroup } from '../model/types'
import styles from './expense-table.module.css'

type ExpenseTableProps = {
  groups: readonly ExpenseDetailGroup[]
  totalAmount: number
}

export function ExpenseTable({ groups, totalAmount }: ExpenseTableProps) {
  return (
    <table className={styles.table}>
      <colgroup>
        <col className={styles.colCategory} />
        <col className={styles.colArea} />
        <col className={styles.colRatio} />
        <col className={styles.colAmount} />
      </colgroup>
      <thead>
        <tr className={styles.headRow}>
          <th scope="col" className={[styles.headCell, styles.pcOnly].join(' ')}>
            구분
          </th>
          <th scope="col" className={[styles.headCell, styles.headArea].join(' ')}>
            영역
          </th>
          <th scope="col" className={[styles.headCell, styles.ratioCell, styles.pcOnly].join(' ')}>
            비율
          </th>
          <th
            scope="col"
            className={[styles.headCell, styles.amountCell, styles.headMetrics].join(' ')}
          >
            <span className={styles.pcOnlyInline}>금액</span>
            <span className={styles.mobileOnlyInline}>비율 · 금액</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group, groupIndex) => (
          <Fragment key={group.id}>
            <tr className={styles.groupHeadingRow}>
              <td colSpan={4} className={styles.groupHeadingCell}>
                {group.label}
              </td>
            </tr>
            {group.rows.map((row, rowIndex) => {
              const isFirstRow = rowIndex === 0
              const isGroupStart = groupIndex > 0 && isFirstRow

              return (
                <tr
                  key={row.id}
                  className={[
                    isFirstRow ? styles.groupFirstRow : '',
                    isGroupStart ? styles.groupStartRow : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isFirstRow ? (
                    <th
                      scope="rowgroup"
                      rowSpan={group.rows.length + 1}
                      className={styles.groupCell}
                    >
                      {group.label}
                    </th>
                  ) : null}
                  <td className={[styles.cell, styles.areaCell].join(' ')}>{row.label}</td>
                  <td className={[styles.cell, styles.ratioCell, styles.pcOnly].join(' ')}>
                    {row.percent}%
                  </td>
                  <td className={[styles.cell, styles.amountCell, styles.metricsCell].join(' ')}>
                    <span className={styles.mobilePercent}>{row.percent}%</span>
                    <span className={styles.amountValue}>{formatKrwAmount(row.amount)}</span>
                  </td>
                </tr>
              )
            })}
            <tr className={styles.groupLastRow}>
              <td className={[styles.cell, styles.subtotalCell, styles.areaCell].join(' ')}>
                {group.subtotal.label}
              </td>
              <td
                className={[
                  styles.cell,
                  styles.subtotalCell,
                  styles.ratioCell,
                  styles.pcOnly,
                ].join(' ')}
              >
                {group.subtotal.percent}%
              </td>
              <td
                className={[
                  styles.cell,
                  styles.subtotalCell,
                  styles.amountCell,
                  styles.metricsCell,
                ].join(' ')}
              >
                <span className={styles.mobilePercent}>{group.subtotal.percent}%</span>
                <span className={styles.amountValue}>
                  {formatKrwAmount(group.subtotal.amount)}
                </span>
              </td>
            </tr>
          </Fragment>
        ))}
        <tr className={styles.totalRow}>
          <td className={[styles.cell, styles.totalLabel, styles.pcOnly].join(' ')}>
            지출총계
          </td>
          <td className={[styles.cell, styles.areaCell, styles.totalAreaCell].join(' ')}>
            <span className={styles.mobileOnlyInline}>지출총계</span>
          </td>
          <td className={[styles.cell, styles.ratioCell, styles.pcOnly].join(' ')}>100.0%</td>
          <td className={[styles.cell, styles.amountCell, styles.metricsCell].join(' ')}>
            <span className={styles.mobilePercent}>100.0%</span>
            <span className={styles.amountValue}>{formatKrwAmount(totalAmount)}</span>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
