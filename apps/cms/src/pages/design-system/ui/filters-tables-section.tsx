import { useCallback, useMemo, useState, type Key } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { ApprovalStatusBadge, type ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { CrossTable } from '@/shared/ui/cross-table'
import { DsDemo, DsSection } from './section'

type DemoRow = {
  id: string
  name: string
  region: string
  status: ApprovalStatusKey
  createdAt: string
}

const ALL_ROWS: DemoRow[] = [
  { id: '1', name: '서울 강남 프로그램', region: '서울', status: 'approved', createdAt: '2026-03-01' },
  { id: '2', name: '부산 해운대 프로그램', region: '부산', status: 'pending', createdAt: '2026-04-15' },
  { id: '3', name: '대구 중구 프로그램', region: '대구', status: 'rejected', createdAt: '2026-05-20' },
  { id: '4', name: '인천 연수 프로그램', region: '인천', status: 'cancelled', createdAt: '2026-06-10' },
]

const STATUS_OPTIONS: ApprovalStatusKey[] = ['pending', 'approved', 'rejected', 'cancelled']

const FLUID_COLUMNS: ColumnsType<DemoRow> = [
  {
    title: '프로그램명',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
  },
  {
    title: '지역',
    dataIndex: 'region',
    key: 'region',
    width: 120,
  },
  {
    title: '상태',
    dataIndex: 'status',
    key: 'status',
    width: 140,
    render: (status: ApprovalStatusKey) => <ApprovalStatusBadge status={status} />,
  },
]

function isInPeriod(dateStr: string, period: [Dayjs | null, Dayjs | null] | null | undefined) {
  if (period == null || (period[0] == null && period[1] == null)) return true
  const t = new Date(dateStr).getTime()
  const start = period[0]?.startOf('day').valueOf()
  const end = period[1]?.endOf('day').valueOf()
  if (start != null && t < start) return false
  if (end != null && t > end) return false
  return true
}

export function FiltersTablesSection() {
  const [draftFilters, setDraftFilters] = useState<Record<string, unknown>>({
    keyword: '',
    status: undefined,
    period: null,
  })
  const [appliedFilters, setAppliedFilters] = useState(draftFilters)
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([])
  const [openStatusId, setOpenStatusId] = useState<string | null>(null)
  const [rows, setRows] = useState(ALL_ROWS)

  const filteredRows = useMemo(() => {
    const keyword = String(appliedFilters.keyword ?? '').trim().toLowerCase()
    const status = appliedFilters.status as string | undefined
    const period = appliedFilters.period as [Dayjs | null, Dayjs | null] | null | undefined
    return rows.filter(row => {
      if (keyword && !row.name.toLowerCase().includes(keyword)) return false
      if (status && status !== 'all' && row.status !== status) return false
      if (!isInPeriod(row.createdAt, period)) return false
      return true
    })
  }, [appliedFilters, rows])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setDraftFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...draftFilters })
  }, [draftFilters])

  const columns: ColumnsType<DemoRow> = useMemo(
    () => [
      {
        title: '프로그램명',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
      },
      {
        title: '지역',
        dataIndex: 'region',
        key: 'region',
        width: 100,
      },
      {
        title: '등록일',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
      },
      {
        title: '결재 현황',
        dataIndex: 'status',
        key: 'status',
        width: 160,
        className: STATUS_DROPDOWN_CELL_CLASSNAME,
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApprovalStatusKey, record) => (
          <StatusDropdownCell
            status={status}
            statusOptions={STATUS_OPTIONS}
            renderBadge={s => <ApprovalStatusBadge status={s} />}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={next => {
              setRows(prev => prev.map(r => (r.id === record.id ? { ...r, status: next } : r)))
            }}
            isOpen={openStatusId === record.id}
            onOpenChange={open => setOpenStatusId(open ? record.id : null)}
          />
        ),
      },
    ],
    [openStatusId]
  )

  return (
    <DsSection
      id="filters-tables"
      title="Filters & Tables"
      description="목록 페이지 표준 스택: FilterTableLayout → TableFilterGroup → Ant Table + cms-data-table."
    >
      <p className="ds-note">
        필터 컨트롤 기본 폭 240×44, 조회 버튼 160×44. UnifiedFilterCard는 사용하지 않습니다.
        검색·셀렉트는 조회 클릭 시 반영(커밋)됩니다.
      </p>

      <DsDemo label="FilterTableLayout + cms-data-table + StatusDropdownCell" className="ds-demo--table">
        <FilterTableLayout
          title="디자인 시스템 데모 목록"
          description={`총 ${filteredRows.length}건`}
          filters={draftFilters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onExcelDownload={() => {
            cmsAlertModal.show({
              title: '엑셀 다운로드',
              content: `데모 목록 ${filteredRows.length}건을 다운로드하는 흐름입니다.`,
            })
          }}
          fields={[
            {
              key: 'keyword',
              type: 'search',
              label: '검색',
              placeholder: '프로그램명',
            },
            {
              key: 'status',
              type: 'select',
              label: '결재 현황',
              placeholder: '전체',
              options: [
                { label: '전체', value: 'all' },
                { label: '대기', value: 'pending' },
                { label: '승인', value: 'approved' },
                { label: '반려', value: 'rejected' },
                { label: '취소', value: 'cancelled' },
              ],
            },
            {
              key: 'period',
              type: 'dateRange',
              label: '등록 기간',
            },
          ]}
        >
          <Table<DemoRow>
            className="cms-data-table"
            rowKey="id"
            columns={columns}
            dataSource={filteredRows}
            pagination={false}
            size="middle"
            rowSelection={{
              selectedRowKeys: selectedKeys,
              onChange: setSelectedKeys,
            }}
          />
        </FilterTableLayout>
      </DsDemo>

      <DsDemo label="CrossTable — 행·열 교차 정보" className="ds-demo--table">
        <CrossTable
          corner="구분"
          columnHeaders={['1회차', '2회차', '3회차']}
          rows={[
            { rowHeader: '교육 일자', cells: ['7월 21일', '7월 28일', '8월 4일'] },
            { rowHeader: '교육 시간', cells: ['10:00–12:00', '10:00–12:00', '10:00–12:00'] },
            { rowHeader: '참여 인원', cells: ['24명', '23명', '24명'] },
          ]}
          aria-label="프로그램 회차별 정보"
        />
      </DsDemo>

      <DsDemo label="가로형 목록 표 — 기본 / 상세·모달 fluid" className="ds-demo--table">
        <p className="ds-note" style={{ marginTop: 0 }}>
          헤더 행과 다수 데이터 행은 Ant <code>Table</code> + <code>cms-data-table</code>을
          사용합니다. 상세·모달처럼 콘텐츠 폭에 맞춰야 할 때만{' '}
          <code>cms-data-table--fluid</code>를 추가합니다.
        </p>
        <div className="ds-table-comparison">
          <div>
            <p className="ds-demo__label">기본 목록 — 고정 폭·ellipsis</p>
            <Table<DemoRow>
              className="cms-data-table"
              rowKey="id"
              columns={FLUID_COLUMNS}
              dataSource={ALL_ROWS.slice(0, 3)}
              pagination={false}
              size="middle"
            />
          </div>
          <div>
            <p className="ds-demo__label">상세·모달 — fluid / empty</p>
            <Table<DemoRow>
              className="cms-data-table cms-data-table--fluid"
              rowKey="id"
              columns={FLUID_COLUMNS}
              dataSource={[]}
              locale={{ emptyText: '데이터가 없습니다.' }}
              pagination={false}
              size="middle"
            />
          </div>
        </div>
      </DsDemo>

      <p className="ds-note">
        <strong>Not catalogued</strong> — CMS 전용 Pagination 래퍼는 없습니다. 목록 화면은 Ant
        Table의 pagination 설정을 사용하므로 raw antd Pagination을 별도 컴포넌트처럼 카탈로그하지
        않습니다. 키-값 정보는 <code>DetailInfoForm</code>, 행·열 교차 데이터만{' '}
        <code>CrossTable</code>을 사용합니다.
      </p>
    </DsSection>
  )
}
