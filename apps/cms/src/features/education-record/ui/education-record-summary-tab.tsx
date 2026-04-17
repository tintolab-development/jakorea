/**
 * 실적 관리 > 합계 탭
 * - 시안 스펙 래퍼(1586 × 786, gap 32)에 4개 카테고리 카드 + 최종 합계 블록을 배치.
 * - 필터는 페이지 루트에 공통으로 배치되므로 본 컴포넌트는 합계 컨텐츠만 담당.
 */

import { SUMMARY_CATEGORIES } from '../model/education-record-summary-config'
import { SUMMARY_GRAND_TOTAL } from '../model/education-record-summary-mock'
import { EducationRecordSummaryCategory } from './education-record-summary-category'
import { EducationRecordSummaryTable } from './education-record-summary-table'
import './education-record-summary-tab.css'

export function EducationRecordSummaryTab() {
  return (
    <div className="er-summary__wrapper">
      {SUMMARY_CATEGORIES.map(category => (
        <EducationRecordSummaryCategory key={category.key} category={category} />
      ))}

      <section className="er-summary__category" aria-label="전체 합계">
        <div className="er-summary__category-card er-summary__category-card--grand">
          <h3 className="er-summary__category-title">합계</h3>
          <div className="er-summary__sub-row er-summary__sub-row--mint">
            <EducationRecordSummaryTable row={SUMMARY_GRAND_TOTAL} variant="mint" />
          </div>
        </div>
      </section>
    </div>
  )
}
