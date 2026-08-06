/**
 * 수입·지출 요약 바
 */

import type {
  FinanceItem,
  FinanceSection,
  FinanceViewKind,
} from '@/entities/income-expense/model/types'
import {
  formatAmount,
  formatRatioDisplay,
  sumAmount,
  sumByCategory,
  sumRatio,
} from '@/features/income-expense/lib/format'

import './summary-bar.css'

type SummaryBarProps = {
  section: FinanceSection
  view: FinanceViewKind
  items: FinanceItem[]
}

export function SummaryBar({ section, view, items }: SummaryBarProps) {
  const isExpenseTable = section === 'expense' && view === 'table'
  const heading = section === 'income' ? '수입총계' : '지출총계'

  if (isExpenseTable) {
    const direct = sumByCategory(items, 'direct')
    const indirect = sumByCategory(items, 'indirect')
    const totalRatio = sumRatio(items)
    const totalAmount = sumAmount(items)

    return (
      <section className="income-expense-summary income-expense-summary--matrix" aria-label="지출 요약">
        <h3 className="income-expense-summary__heading">■ {heading}</h3>
        <div className="income-expense-summary__matrix-wrap">
          <table className="income-expense-summary__matrix">
            <colgroup>
              <col className="income-expense-summary__col--label" />
              <col className="income-expense-summary__col--data" />
              <col className="income-expense-summary__col--data" />
              <col className="income-expense-summary__col--total" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">구분</th>
                <th scope="col">직접사업비 합계</th>
                <th scope="col">직접사업비 이외비용 합계</th>
                <th scope="col" className="income-expense-summary__matrix-total">
                  지출총계
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">총 비율</th>
                <td>{formatRatioDisplay(direct.ratio)}</td>
                <td>{formatRatioDisplay(indirect.ratio)}</td>
                <td className="income-expense-summary__matrix-total">
                  {formatRatioDisplay(totalRatio)}
                </td>
              </tr>
              <tr>
                <th scope="row">총 금액</th>
                <td>{formatAmount(direct.amount)}</td>
                <td>{formatAmount(indirect.amount)}</td>
                <td className="income-expense-summary__matrix-total">
                  {formatAmount(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const totalRatio = sumRatio(items)
  const totalAmount = sumAmount(items)

  return (
    <section className="income-expense-summary" aria-label={`${heading} 요약`}>
      <h3 className="income-expense-summary__heading">■ {heading}</h3>
      <div className="income-expense-summary__simple">
        <div className="income-expense-summary__cell">
          <span className="income-expense-summary__label">총 비율</span>
          <span className="income-expense-summary__value">{formatRatioDisplay(totalRatio)}</span>
        </div>
        <div className="income-expense-summary__cell">
          <span className="income-expense-summary__label">총 금액</span>
          <span className="income-expense-summary__value">{formatAmount(totalAmount)}</span>
        </div>
      </div>
    </section>
  )
}
