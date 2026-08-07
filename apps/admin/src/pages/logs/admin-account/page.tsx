/**
 * 관리자 계정 처리 이력
 */

import { useCallback, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ADMIN_ACCOUNT_ACTION_LABELS,
  ADMIN_ACCOUNT_ACTION_TYPES,
  type AdminAccountActionType,
  type AdminAccountListFilter,
  type AdminAccountLog,
} from '@/entities/admin-account-log/model/types'
import { useAdminAccountLogsList } from '@/features/admin-account-log/api/hooks'
import { downloadCsv } from '@/features/logs/shared/lib/export-csv'
import { formatLogDateTime } from '@/features/logs/shared/lib/format-datetime'
import { LogResultToolbar } from '@/features/logs/shared/ui/log-result-toolbar'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import {
  CmsButton,
  CmsDateRangePicker,
  CmsInput,
  CmsSelect,
} from '@/shared/ui'

import '@/features/logs/shared/ui/log-list-layout.css'

type PendingFilters = {
  name: string
  loginId: string
  actionType: AdminAccountActionType | ''
  range: [Dayjs | null, Dayjs | null] | null
}

const EMPTY_PENDING: PendingFilters = {
  name: '',
  loginId: '',
  actionType: '',
  range: null,
}

const EMPTY_APPLIED: AdminAccountListFilter = {}

function buildApplied(pending: PendingFilters): AdminAccountListFilter {
  const name = pending.name.trim()
  const loginId = pending.loginId.trim()
  const from = pending.range?.[0]?.isValid()
    ? pending.range[0]!.format('YYYY-MM-DD')
    : null
  const to = pending.range?.[1]?.isValid()
    ? pending.range[1]!.format('YYYY-MM-DD')
    : null
  return {
    ...(name ? { name } : {}),
    ...(loginId ? { loginId } : {}),
    ...(pending.actionType ? { actionType: pending.actionType } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }
}

const ACTION_OPTIONS = ADMIN_ACCOUNT_ACTION_TYPES.map(value => ({
  value,
  label: ADMIN_ACCOUNT_ACTION_LABELS[value],
}))

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  name: 120,
  loginId: 220,
  action: 140,
  processedAt: 180,
  ip: 140,
} as const

const EMPTY_TEXT = '검색 결과가 없습니다. 필터 조건을 변경해 주세요.'

export function AdminAccountLogPage() {
  const [pending, setPending] = useState<PendingFilters>(EMPTY_PENDING)
  const [applied, setApplied] = useState<AdminAccountListFilter>(EMPTY_APPLIED)

  const listQuery = useAdminAccountLogsList(applied)
  const rows = listQuery.data?.rows ?? []
  const total = listQuery.data?.total ?? 0
  const loading = listQuery.isLoading || listQuery.isFetching

  const handleSearch = useCallback(() => {
    setApplied(buildApplied(pending))
  }, [pending])

  const handleExcel = useCallback(() => {
    downloadCsv({
      filenameBase: '관리자_계정_처리_이력',
      headers: ['No.', '관리자명', '아이디', '내역', '처리일시', 'IP'],
      rows: rows.map((row, index) => [
        total - index,
        row.name,
        row.loginId,
        ADMIN_ACCOUNT_ACTION_LABELS[row.actionType],
        formatLogDateTime(row.processedAt),
        row.ip,
      ]),
    })
  }, [rows, total])

  const columns = useMemo<ColumnsType<AdminAccountLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => total - index,
      },
      {
        title: '관리자명',
        dataIndex: 'name',
        key: 'name',
        width: COL.name,
        ellipsis: true,
      },
      {
        title: '아이디',
        dataIndex: 'loginId',
        key: 'loginId',
        width: COL.loginId,
        ellipsis: true,
      },
      {
        title: '내역',
        dataIndex: 'actionType',
        key: 'actionType',
        width: COL.action,
        render: (v: AdminAccountActionType) => ADMIN_ACCOUNT_ACTION_LABELS[v],
      },
      {
        title: '처리일시',
        dataIndex: 'processedAt',
        key: 'processedAt',
        width: COL.processedAt,
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
            <span className="admin-filter-area__label">관리자명</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="관리자명을 입력하세요"
              value={pending.name}
              onChange={e =>
                setPending(prev => ({ ...prev, name: e.target.value }))
              }
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">아이디</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="아이디를 입력하세요"
              value={pending.loginId}
              onChange={e =>
                setPending(prev => ({ ...prev, loginId: e.target.value }))
              }
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">내역</span>
            <CmsSelect
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              withAllOption
              value={pending.actionType}
              onChange={value =>
                setPending(prev => ({
                  ...prev,
                  actionType: (value as AdminAccountActionType | '') ?? '',
                }))
              }
              options={ACTION_OPTIONS}
              placeholder="전체"
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <span className="admin-filter-area__label">처리일시</span>
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
          title="관리자 계정 처리 이력"
          total={total}
          onExcelDownload={handleExcel}
          excelDisabled={rows.length === 0}
        />

        <Table<AdminAccountLog>
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
              COL.name +
              COL.loginId +
              COL.action +
              COL.processedAt +
              COL.ip,
          }}
        />
      </div>
    </div>
  )
}
