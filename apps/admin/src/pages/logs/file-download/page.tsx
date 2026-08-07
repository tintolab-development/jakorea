/**
 * 파일 다운로드 이력
 */

import { useCallback, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  FileDownloadListFilter,
  FileDownloadLog,
} from '@/entities/file-download-log/model/types'
import { useFileDownloadLogsList } from '@/features/file-download-log/api/hooks'
import { downloadCsv } from '@/features/logs/shared/lib/export-csv'
import { formatLogDateTime } from '@/features/logs/shared/lib/format-datetime'
import { LogResultToolbar } from '@/features/logs/shared/ui/log-result-toolbar'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, CmsDateRangePicker, CmsInput } from '@/shared/ui'

import '@/features/logs/shared/ui/log-list-layout.css'

type PendingFilters = {
  fileName: string
  userName: string
  range: [Dayjs | null, Dayjs | null] | null
}

const EMPTY_PENDING: PendingFilters = {
  fileName: '',
  userName: '',
  range: null,
}

const EMPTY_APPLIED: FileDownloadListFilter = {}

function buildApplied(pending: PendingFilters): FileDownloadListFilter {
  const fileName = pending.fileName.trim()
  const userName = pending.userName.trim()
  const from = pending.range?.[0]?.isValid()
    ? pending.range[0]!.format('YYYY-MM-DD')
    : null
  const to = pending.range?.[1]?.isValid()
    ? pending.range[1]!.format('YYYY-MM-DD')
    : null
  return {
    ...(fileName ? { fileName } : {}),
    ...(userName ? { userName } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }
}

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  fileName: 280,
  userName: 140,
  downloadedAt: 180,
  ip: 140,
} as const

const EMPTY_TEXT = '검색 결과가 없습니다. 필터 조건을 변경해 주세요.'

export function FileDownloadLogPage() {
  const [pending, setPending] = useState<PendingFilters>(EMPTY_PENDING)
  const [applied, setApplied] = useState<FileDownloadListFilter>(EMPTY_APPLIED)

  const listQuery = useFileDownloadLogsList(applied)
  const rows = listQuery.data?.rows ?? []
  const total = listQuery.data?.total ?? 0
  const loading = listQuery.isLoading || listQuery.isFetching

  const handleSearch = useCallback(() => {
    setApplied(buildApplied(pending))
  }, [pending])

  const handleExcel = useCallback(() => {
    downloadCsv({
      filenameBase: '파일_다운로드_이력',
      headers: ['No.', '다운로드 파일명', '사용자명', '다운로드 일시', 'IP'],
      rows: rows.map((row, index) => [
        total - index,
        row.fileName,
        row.userName,
        formatLogDateTime(row.downloadedAt),
        row.ip,
      ]),
    })
  }, [rows, total])

  const columns = useMemo<ColumnsType<FileDownloadLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => total - index,
      },
      {
        title: '다운로드 파일명',
        dataIndex: 'fileName',
        key: 'fileName',
        width: COL.fileName,
        ellipsis: true,
      },
      {
        title: '사용자명',
        dataIndex: 'userName',
        key: 'userName',
        width: COL.userName,
        ellipsis: true,
      },
      {
        title: '다운로드 일시',
        dataIndex: 'downloadedAt',
        key: 'downloadedAt',
        width: COL.downloadedAt,
        render: (v: string) => formatLogDateTime(v),
      },
      {
        title: 'IP',
        dataIndex: 'ip',
        key: 'ip',
        width: COL.ip,
      },
    ],
    [total]
  )

  return (
    <div className="log-list-page">
      <div className="admin-list-card log-list-page__filter-card">
        <div className="admin-filter-area">
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">파일명</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="파일명을 입력하세요"
              value={pending.fileName}
              onChange={e =>
                setPending(prev => ({ ...prev, fileName: e.target.value }))
              }
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">사용자명</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="사용자명을 입력하세요"
              value={pending.userName}
              onChange={e =>
                setPending(prev => ({ ...prev, userName: e.target.value }))
              }
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <span className="admin-filter-area__label">다운로드 일시</span>
            <CmsDateRangePicker
              inputSize="large"
              width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
              value={pending.range}
              onChange={dates =>
                setPending(prev => ({
                  ...prev,
                  range: dates ?? null,
                }))
              }
              placeholder={['시작일', '종료일']}
            />
          </div>
          <div className="admin-filter-area__actions">
            <CmsButton
              className="admin-filter-area__search-button"
              variant="primary"
              size="large"
              type="button"
              width={FILTER_SEARCH_BUTTON_WIDTH_PX}
              onClick={handleSearch}
            >
              조회
            </CmsButton>
          </div>
        </div>
      </div>

      <div className="admin-list-card log-list-page__result-card">
        <LogResultToolbar
          title="파일 다운로드 이력"
          total={total}
          onExcelDownload={handleExcel}
          excelDisabled={rows.length === 0}
        />

        <Table<FileDownloadLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          locale={{ emptyText: EMPTY_TEXT }}
          scroll={{
            x: COL.no + COL.fileName + COL.userName + COL.downloadedAt + COL.ip,
          }}
        />
      </div>
    </div>
  )
}
