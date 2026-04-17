/**
 * 실적 관리 > 실적 데이터 탭
 * - 필터/탭 네비게이션은 페이지 루트가 소유, 본 탭은 **툴바(제목·건수·엑셀 버튼) + 테이블** 만 렌더
 * - 엑셀 다운로드: antd 컬럼의 `render()` 를 실제로 호출해 UI 와 동일한 값을 기록하는
 *   `exportEducationRecordExcel` 을 사용 (공용 `exportTableToExcel` 은 raw 값만 기록하므로 미사용)
 */

import { useCallback, useState } from 'react'
import { App, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import { CmsButton } from '@/shared/ui/cms-button'
import { exportEducationRecordExcel } from '@/features/education-record/lib/education-record-export'
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

/** 엑셀 다운로드 버튼 사이즈 (px) */
const EXCEL_BUTTON_WIDTH = 180
const EXCEL_BUTTON_HEIGHT = 44

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
  const { message } = App.useApp()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = useCallback(async () => {
    if (isExporting) return
    if (!tableData || tableData.length === 0) {
      message.warning('다운로드할 데이터가 없습니다.')
      return
    }
    setIsExporting(true)
    const hide = message.loading('엑셀 파일 생성 중입니다…', 0)
    try {
      await exportEducationRecordExcel(antdColumns, tableData, '실적데이터')
      message.success(`엑셀 다운로드 완료 (${tableData.length.toLocaleString()}건)`)
    } catch (error) {
      console.error('[education-record] excel export failed', error)
      message.error('엑셀 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      hide()
      setIsExporting(false)
    }
  }, [antdColumns, isExporting, message, tableData])

  const hasData = tableData.length > 0

  return (
    <div className="er-data-tab">
      <div className="er-data-tab__toolbar">
        <div className="er-data-tab__toolbar-main">
          <div className="er-data-tab__title">교육 실적데이터</div>
          <div className="er-data-tab__description">
            총 {displayedCount.toLocaleString()}건
          </div>
        </div>
        <div className="er-data-tab__toolbar-actions">
          <CmsButton
            variant="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            loading={isExporting}
            disabled={!hasData}
            width={EXCEL_BUTTON_WIDTH}
            style={{ height: EXCEL_BUTTON_HEIGHT }}
          >
            엑셀 다운로드
          </CmsButton>
        </div>
      </div>

      <div className="list-page-layout__table-shell">
        <Table<Program>
          rowKey="id"
          className="cms-data-table"
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
