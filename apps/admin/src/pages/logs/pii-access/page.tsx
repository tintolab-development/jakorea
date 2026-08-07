/**
 * 개인정보 조회 이력
 */

import { useCallback, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  PiiAccessListFilter,
  PiiAccessLog,
} from '@/entities/pii-access-log/model/types'
import { usePiiAccessLogsList } from '@/features/pii-access-log/api/hooks'
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
  purpose: string
  accessorName: string
  range: [Dayjs | null, Dayjs | null] | null
}

const EMPTY_PENDING: PendingFilters = {
  purpose: '',
  accessorName: '',
  range: null,
}

const EMPTY_APPLIED: PiiAccessListFilter = {}

function buildApplied(pending: PendingFilters): PiiAccessListFilter {
  const purpose = pending.purpose.trim()
  const accessorName = pending.accessorName.trim()
  const from = pending.range?.[0]?.isValid()
    ? pending.range[0]!.format('YYYY-MM-DD')
    : null
  const to = pending.range?.[1]?.isValid()
    ? pending.range[1]!.format('YYYY-MM-DD')
    : null
  return {
    ...(purpose ? { purpose } : {}),
    ...(accessorName ? { accessorName } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }
}

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  targetName: 120,
  purpose: 260,
  accessorName: 140,
  accessedAt: 180,
  ip: 140,
} as const

const EMPTY_TEXT = '검색 결과가 없습니다. 필터 조건을 변경해 주세요.'

export function PiiAccessLogPage() {
  const [pending, setPending] = useState<PendingFilters>(EMPTY_PENDING)
  const [applied, setApplied] = useState<PiiAccessListFilter>(EMPTY_APPLIED)

  const listQuery = usePiiAccessLogsList(applied)
  const rows = listQuery.data?.rows ?? []
  const total = listQuery.data?.total ?? 0
  const loading = listQuery.isLoading || listQuery.isFetching

  const handleSearch = useCallback(() => {
    setApplied(buildApplied(pending))
  }, [pending])

  const handleExcel = useCallback(() => {
    downloadCsv({
      filenameBase: '개인정보_조회_이력',
      headers: [
        'No.',
        '조회 대상',
        '조회 목적',
        '조회자명',
        '조회 일시',
        'IP',
      ],
      rows: rows.map((row, index) => [
        total - index,
        row.targetName,
        row.purpose,
        row.accessorName,
        formatLogDateTime(row.accessedAt),
        row.ip,
      ]),
    })
  }, [rows, total])

  const columns = useMemo<ColumnsType<PiiAccessLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => total - index,
      },
      {
        title: '조회 대상',
        dataIndex: 'targetName',
        key: 'targetName',
        width: COL.targetName,
        ellipsis: true,
      },
      {
        title: '조회 목적',
        dataIndex: 'purpose',
        key: 'purpose',
        width: COL.purpose,
        ellipsis: true,
      },
      {
        title: '조회자명',
        dataIndex: 'accessorName',
        key: 'accessorName',
        width: COL.accessorName,
        ellipsis: true,
      },
      {
        title: '조회 일시',
        dataIndex: 'accessedAt',
        key: 'accessedAt',
        width: COL.accessedAt,
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
            <span className="admin-filter-area__label">조회 목적</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="조회 목적을 입력하세요"
              value={pending.purpose}
              onChange={e =>
                setPending(prev => ({ ...prev, purpose: e.target.value }))
              }
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">조회자명</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="조회자명을 입력하세요"
              value={pending.accessorName}
              onChange={e =>
                setPending(prev => ({
                  ...prev,
                  accessorName: e.target.value,
                }))
              }
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <span className="admin-filter-area__label">조회 일시</span>
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
          title="개인정보 조회 이력"
          total={total}
          onExcelDownload={handleExcel}
          excelDisabled={rows.length === 0}
        />

        <Table<PiiAccessLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          locale={{ emptyText: EMPTY_TEXT }}
          scroll={{
            x:
              COL.no +
              COL.targetName +
              COL.purpose +
              COL.accessorName +
              COL.accessedAt +
              COL.ip,
          }}
        />
      </div>
    </div>
  )
}
