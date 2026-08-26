/**
 * 실적 관리 > 합계 탭
 * - remote: GET /api/admin/performance/summary
 * - mock: 목록 행 클라이언트 집계
 */

import { Alert, Spin } from 'antd'
import type { SummaryTabView } from '@/features/education-record/api/adapters/performance-summary-adapters'
import { SUMMARY_CATEGORIES } from '@/features/education-record/model/education-record-summary-config'
import { SUMMARY_EMPTY_ROW } from '@/features/education-record/model/education-record-summary-mock'
import { EducationRecordSummaryCategory } from './education-record-summary-category'
import { EducationRecordSummaryTable } from './education-record-summary-table'
import './education-record-summary-tab.css'

export type EducationRecordSummaryTabProps = {
  view: SummaryTabView | undefined
  loading?: boolean
  error?: boolean
  errorMessage?: string
}

export function EducationRecordSummaryTab({
  view,
  loading = false,
  error = false,
  errorMessage,
}: EducationRecordSummaryTabProps) {
  if (loading && !view) {
    return (
      <div className="er-summary__wrapper er-summary__wrapper--state">
        <Spin />
      </div>
    )
  }

  if (error && !view) {
    return (
      <div className="er-summary__wrapper er-summary__wrapper--state">
        <Alert
          type="error"
          showIcon
          message={errorMessage ?? '합계를 불러오지 못했습니다.'}
        />
      </div>
    )
  }

  const data = view ?? {
    byCategory: {
      economyFinance: {},
      careerEmployment: {},
      entrepreneurship: {},
      digitalLiteracy: {},
    },
    grandTotal: SUMMARY_EMPTY_ROW,
  }

  return (
    <div className="er-summary__wrapper">
      {SUMMARY_CATEGORIES.map(category => (
        <EducationRecordSummaryCategory key={category.key} category={category} view={data} />
      ))}

      <section className="er-summary__category" aria-label="전체 합계">
        <div className="er-summary__category-card er-summary__category-card--grand">
          <h3 className="er-summary__category-title">합계</h3>
          <div className="er-summary__sub-row er-summary__sub-row--mint">
            <EducationRecordSummaryTable row={data.grandTotal} variant="mint" />
          </div>
        </div>
      </section>
    </div>
  )
}
