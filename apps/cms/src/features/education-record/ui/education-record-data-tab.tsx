/**
 * 실적 관리 > 실적 데이터 탭
 * - 필터/탭 네비게이션은 페이지 루트가 소유, 본 탭은 **툴바(제목·건수·엑셀 버튼) + 테이블** 만 렌더
 * - 엑셀 다운로드: 페이지에 로드된 행을 클라이언트에서 조립하지 않고 공식 BE export를 사용
 * - 세로는 합계 탭과 같이 레이아웃(페이지) 스크롤. 가로는 테이블만 스크롤.
 */

import type { ColumnsType } from 'antd/es/table'
import type { EducationRecordRow } from '@/features/education-record/model/education-record-types'
import '@/shared/components/list-page/list-page-layout.css'
import './education-record-data-tab.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

/** 실적 데이터 테이블 가로 스크롤 기준(33개 컬럼 width 합 + 여유) */
const EDUCATION_RECORD_TABLE_SCROLL_X = 5250

export type EducationRecordDataTabProps = {
  antdColumns: ColumnsType<EducationRecordRow>
  tableData: EducationRecordRow[]
  displayedCount: number
}

export function EducationRecordDataTab({
  antdColumns,
  tableData,
  displayedCount,
}: EducationRecordDataTabProps) {
  return (
    <div className="er-data-tab">
      <div className="er-data-tab__toolbar">
        <div className="er-data-tab__toolbar-main">
          <div className="er-data-tab__title">교육 실적데이터</div>
          <div className="er-data-tab__description">
            총 {displayedCount.toLocaleString()}건
          </div>
        </div>
      </div>

      <div className="list-page-layout__table-shell">
        <CmsDataTable<EducationRecordRow>
          rowKey="id"
          className="cms-data-table cms-data-table--skip-auto-no-col"
          columns={antdColumns}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: EDUCATION_RECORD_TABLE_SCROLL_X }}
        />
      </div>
    </div>
  )
}
