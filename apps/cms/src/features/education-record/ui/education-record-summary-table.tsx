/**
 * 실적 관리 > 합계 탭 미니 테이블 (header 1행 + 값 1행 × 9컬럼)
 * - 순수 div grid. 각 셀 width 170px × height 40px.
 * - `variant === 'mint'`이면 헤더/값 모두 mint 배경 + 흰 텍스트 (radius 6px는 컨테이너에서 처리)
 */

import { SUMMARY_COLUMNS } from '../model/education-record-summary-config'
import type { SummaryRow } from '../model/education-record-types'

export type EducationRecordSummaryTableProps = {
  row: SummaryRow
  /** 'mint' 지정 시 합계 강조 스타일 */
  variant?: 'default' | 'mint'
}

const numberFormatter = new Intl.NumberFormat('ko-KR')

export function EducationRecordSummaryTable({
  row,
  variant = 'default',
}: EducationRecordSummaryTableProps) {
  void variant
  return (
    <div className="er-summary__table" role="table">
      <div className="er-summary__table-header" role="row">
        {SUMMARY_COLUMNS.map(col => (
          <div key={col.key} className="er-summary__th" role="columnheader">
            {`${col.kind} : ${col.label}`}
          </div>
        ))}
      </div>
      <div className="er-summary__table-row" role="row">
        {SUMMARY_COLUMNS.map(col => (
          <div key={col.key} className="er-summary__td" role="cell">
            {numberFormatter.format(row[col.key] ?? 0)}
          </div>
        ))}
      </div>
    </div>
  )
}
