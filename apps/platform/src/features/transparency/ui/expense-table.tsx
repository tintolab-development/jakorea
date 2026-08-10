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
      <thead>
        <tr>
          <th scope="col" className={styles.headCell}>
            구분
          </th>
          <th scope="col" className={styles.headCell}>
            영역
          </th>
          <th scope="col" className={styles.headCell}>
            비율
          </th>
          <th scope="col" className={[styles.headCell, styles.amountCell].join(' ')}>
            금액
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group, groupIndex) => (
          <Fragment key={group.id}>
            {group.rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={
                  groupIndex > 0 && rowIndex === 0 ? styles.groupStartRow : undefined
                }
              >
                {rowIndex === 0 ? (
                  <th
                    scope="rowgroup"
                    rowSpan={group.rows.length + 1}
                    className={styles.groupCell}
                  >
                    {group.label}
                  </th>
                ) : null}
                <td className={styles.cell}>{row.label}</td>
                <td className={styles.cell}>{row.percent}%</td>
                <td className={[styles.cell, styles.amountCell].join(' ')}>
                  {formatKrwAmount(row.amount)}
                </td>
              </tr>
            ))}
            <tr>
              <td className={[styles.cell, styles.subtotalCell].join(' ')}>
                {group.subtotal.label}
              </td>
              <td className={[styles.cell, styles.subtotalCell].join(' ')}>
                {group.subtotal.percent}%
              </td>
              <td
                className={[styles.cell, styles.subtotalCell, styles.amountCell].join(
                  ' '
                )}
              >
                {formatKrwAmount(group.subtotal.amount)}
              </td>
            </tr>
          </Fragment>
        ))}
        <tr className={styles.totalRow}>
          <td className={styles.cell}>지출총계</td>
          <td className={styles.cell} aria-hidden="true" />
          <td className={styles.cell}>100.0%</td>
          <td className={[styles.cell, styles.amountCell].join(' ')}>
            {formatKrwAmount(totalAmount)}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
