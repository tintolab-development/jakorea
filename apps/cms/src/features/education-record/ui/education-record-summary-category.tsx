/**
 * 실적 관리 > 합계 탭 카테고리 블록
 * - 외부: 카테고리 타이틀 + 카드 (16px gap)
 * - 카드 내부: 서브행들(32px gap) — 각 행은 [라벨 + 미니 테이블]
 * - 마지막 서브행(`total`)만 mint 강조
 */

import {
  SUB_ROW_LABELS,
  type SummaryCategoryMeta,
} from '../model/education-record-summary-config'
import {
  SUMMARY_EMPTY_ROW,
  SUMMARY_MOCK,
} from '../model/education-record-summary-mock'
import type { SummaryRow, SummarySubRowKey } from '../model/education-record-types'
import { EducationRecordSummaryTable } from './education-record-summary-table'

export type EducationRecordSummaryCategoryProps = {
  category: SummaryCategoryMeta
}

function getRow(
  categoryKey: SummaryCategoryMeta['key'],
  subKey: SummarySubRowKey
): SummaryRow {
  const bucket = SUMMARY_MOCK[categoryKey]
  return bucket?.[subKey] ?? SUMMARY_EMPTY_ROW
}

export function EducationRecordSummaryCategory({
  category,
}: EducationRecordSummaryCategoryProps) {
  return (
    <section className="er-summary__category" aria-label={category.label}>
      <h3 className="er-summary__category-title">{category.label}</h3>

      <div className="er-summary__category-card">
        {category.subRows.map(subKey => {
          const isTotal = subKey === 'total'
          const row = getRow(category.key, subKey)
          const className = `er-summary__sub-row${
            isTotal ? ' er-summary__sub-row--mint' : ''
          }`
          return (
            <div key={subKey} className={className}>
              <span className="er-summary__sub-row-label">
                {SUB_ROW_LABELS[subKey]}
              </span>
              <EducationRecordSummaryTable
                row={row}
                variant={isTotal ? 'mint' : 'default'}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
