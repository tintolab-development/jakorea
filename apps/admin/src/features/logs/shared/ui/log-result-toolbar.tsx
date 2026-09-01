/**
 * 로그 목록 상단 툴바 — 제목 + 총 N건 + 엑셀 다운로드
 */

import { ExcelButton } from '@/shared/ui'

import './log-list-layout.css'

type Props = {
  title: string
  total: number
  onExcelDownload: () => void
  excelLoading?: boolean
  excelDisabled?: boolean
}

export function LogResultToolbar({
  title,
  total,
  onExcelDownload,
  excelLoading,
  excelDisabled,
}: Props) {
  return (
    <div className="admin-list-toolbar log-result-toolbar">
      <div className="table-header-title--wrapper">
        <span className="table-title">{title}</span>
        <span className="table-description">
          총 {total.toLocaleString('ko-KR')}건
        </span>
      </div>
      <div className="table-header-actions--wrapper">
        <ExcelButton
          loading={excelLoading}
          disabled={excelDisabled}
          onClick={onExcelDownload}
        />
      </div>
    </div>
  )
}
