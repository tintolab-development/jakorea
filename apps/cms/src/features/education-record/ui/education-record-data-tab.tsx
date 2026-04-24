/**
 * 실적 관리 > 실적 데이터 탭
 * - 필터/탭 네비게이션은 페이지 루트가 소유, 본 탭은 **툴바(제목·건수·엑셀 버튼) + 테이블** 만 렌더
 * - 엑셀 다운로드: antd 컬럼의 `render()` 를 실제로 호출해 UI 와 동일한 값을 기록하는
 *   `exportEducationRecordExcel` 을 사용 (공용 `exportTableToExcel` 은 raw 값만 기록하므로 미사용)
 */

import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import '@/shared/components/list-page/list-page-layout.css'
import './education-record-data-tab.css'

/** 실적 데이터 테이블 가로 스크롤 기준(32개 컬럼 width 합 ≒ 5010 + 여유) */
const EDUCATION_RECORD_TABLE_SCROLL_X = 5100

/** td 행 높이 (education-record-list-page.css 의 td height: 40px 와 동기화) */
const EDUCATION_RECORD_ROW_HEIGHT = 40

/** 세로 스크롤 노출 임계치: 20행 초과 시 tbody 영역에서 스크롤 */
const EDUCATION_RECORD_MAX_VISIBLE_ROWS = 20

/** 세로 스크롤 기준 높이 (tbody 만, 헤더는 sticky 로 고정) */
const EDUCATION_RECORD_TABLE_SCROLL_Y =
  EDUCATION_RECORD_ROW_HEIGHT * EDUCATION_RECORD_MAX_VISIBLE_ROWS

export type EducationRecordDataTabProps = {
  antdColumns: ColumnsType<Program>
  tableData: Program[]
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
        <Table<Program>
          rowKey="id"
          className="cms-data-table cms-data-table--skip-auto-no-col"
          columns={antdColumns}
          dataSource={tableData}
          pagination={false}
          scroll={{
            x: EDUCATION_RECORD_TABLE_SCROLL_X,
            y: EDUCATION_RECORD_TABLE_SCROLL_Y,
          }}
        />
      </div>
    </div>
  )
}
