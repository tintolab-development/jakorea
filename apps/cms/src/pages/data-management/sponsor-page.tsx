import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import type { MouseEvent } from 'react'
import { Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { mockSponsorManagementListRows } from '@/data/mock/sponsor-management-list'
import type { SponsorSponsorshipStatus } from '@/types/domain'
import { SponsorSponsorshipStatusBadge } from '@/features/sponsor/ui/sponsor-sponsorship-status-badge'
import { sponsorManagementFilterFields } from '@/features/sponsor/model/sponsor-management-filter-fields'
import { sponsorManagementTablePageConfig } from '@/features/sponsor/model/sponsor-management-table.config'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  STATUS_DROPDOWN_CELL_CLASSNAME,
  StatusDropdownCell,
} from '@/shared/components/status-dropdown-cell'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { EMPTY_TABLE_PAGE_CONTEXT } from '@/shared/components/table-system/model/use-table-page'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton } from '@/shared/ui'
import { SponsorDetailFullPageModal } from '@/features/sponsor/ui/sponsor-detail-fullpage-modal'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/ui/program-list.css'

const ORG_LABEL: Record<NonNullable<SponsorManagementRow['organizationKind']>, string> = {
  corporate: '기업',
  foundation: '재단',
  institution: '기관',
}

const SPONSORSHIP_STATUS_OPTIONS = [
  'active',
  'ended',
] as const satisfies readonly SponsorSponsorshipStatus[]

export default function SponsorPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [searchParams, setSearchParams] = useSearchParams()

  const [rows, setRows] = useState<SponsorManagementRow[]>(() =>
    mockSponsorManagementListRows.map(r => ({ ...r }))
  )

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
  } = useTablePage(sponsorManagementTablePageConfig, {
    data: rows,
    searchParams,
    setSearchParams,
    context: EMPTY_TABLE_PAGE_CONTEXT,
  })

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [openSponsorshipDropdownId, setOpenSponsorshipDropdownId] = useState<string | null>(null)

  const sponsorIdFromUrl = searchParams.get('sponsorId') ?? ''
  const sponsorRowForDetail = useMemo(
    () => (sponsorIdFromUrl ? rows.find(r => r.id === sponsorIdFromUrl) ?? null : null),
    [sponsorIdFromUrl, rows]
  )
  const sponsorDetailOpen = Boolean(sponsorIdFromUrl && sponsorRowForDetail)

  useEffect(() => {
    if (sponsorIdFromUrl && sponsorRowForDetail == null) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.delete('sponsorId')
        return next
      })
    }
  }, [sponsorIdFromUrl, sponsorRowForDetail, setSearchParams])

  const closeSponsorDetail = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('sponsorId')
      return next
    })
  }, [setSearchParams])

  const handleDeleteSponsor = useCallback(
    (sponsorId: string) => {
      if (!canWrite) return
      setRows(prev => prev.filter(row => row.id !== sponsorId))
      closeSponsorDetail()
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== sponsorId))
    },
    [canWrite, closeSponsorDetail]
  )

  const updateSponsorshipStatus = useCallback((id: string, next: SponsorSponsorshipStatus) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, sponsorshipStatus: next } : r)))
  }, [])

  const handleBulkDelete = useCallback(() => {
    if (!canWrite) return
    window.alert('준비 중입니다.')
  }, [canWrite])

  const handleRegister = useCallback(() => {
    if (!canWrite) return
    window.alert('준비 중입니다.')
  }, [canWrite])

  const columns: ColumnsType<SponsorManagementRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        render: (_: unknown, __: SponsorManagementRow, index: number) => tableData.length - index,
      },
      {
        title: '구분',
        key: 'organizationKind',
        width: 100,
        align: 'center',
        render: (_: unknown, r: SponsorManagementRow) =>
          ORG_LABEL[r.organizationKind ?? 'corporate'],
      },
      {
        title: '후원사명',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        ellipsis: true,
      },
      {
        title: '주 담당자',
        key: 'mainManager',
        width: TABLE_COLUMN_WIDTHS.name,
        ellipsis: true,
        render: (_: unknown, r: SponsorManagementRow) => r.managers?.[0]?.name ?? '-',
      },
      {
        title: '주 담당자 연락처',
        key: 'mainManagerPhone',
        width: TABLE_COLUMN_WIDTHS.phone,
        ellipsis: true,
        render: (_: unknown, r: SponsorManagementRow) => {
          const raw = r.managers?.[0]?.phone
          if (!raw?.trim()) return '-'
          return MASKING_POLICY.phone(raw)
        },
      },
      {
        title: '프로그램 진행 수',
        dataIndex: 'programCount',
        key: 'programCount',
        width: 130,
        align: 'center',
      },
      {
        title: '후원 상태',
        key: 'sponsorshipStatus',
        width: 150,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (_: unknown, r: SponsorManagementRow) => (
          <StatusDropdownCell<SponsorSponsorshipStatus>
            status={r.sponsorshipStatus ?? 'active'}
            statusOptions={SPONSORSHIP_STATUS_OPTIONS}
            renderBadge={s => <SponsorSponsorshipStatusBadge status={s} variant="table" />}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={
              canWrite
                ? newStatus => {
                    updateSponsorshipStatus(r.id, newStatus)
                    setOpenSponsorshipDropdownId(null)
                  }
                : undefined
            }
            isOpen={openSponsorshipDropdownId === r.id}
            onOpenChange={open => setOpenSponsorshipDropdownId(open ? r.id : null)}
          />
        ),
      },
      {
        title: '후원 시작일',
        dataIndex: 'sponsorshipStartDate',
        key: 'sponsorshipStartDate',
        width: TABLE_COLUMN_WIDTHS.date,
        render: (v: string | undefined) =>
          v ? dayjs(v).format('YYYY.MM.DD') : <Typography.Text type="secondary">-</Typography.Text>,
      },
    ],
    [canWrite, tableData.length, openSponsorshipDropdownId, updateSponsorshipStatus]
  )

  return (
    <div className="sponsor-page">
      <FilterTableLayout
        bordered={false}
        fields={sponsorManagementFilterFields}
        filters={{
          organizationKind: pendingFilters.organizationKind,
          sponsorName: pendingFilters.sponsorName,
          managerName: pendingFilters.managerName,
          sponsorshipStatus: pendingFilters.sponsorshipStatus,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="후원사 목록"
        description={`총 ${displayedCount.toLocaleString()}건`}
        actions={
          <>
            <CmsButton
              variant="delete"
              onClick={handleBulkDelete}
              disabled={!canWrite || selectedRowKeys.length === 0}
            >
              후원사 삭제
            </CmsButton>
            <CmsButton variant="primary" onClick={handleRegister} disabled={!canWrite}>
              후원사 등록
            </CmsButton>
          </>
        }
      >
        <Table<SponsorManagementRow>
          rowKey="id"
          className="cms-data-table"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          onRow={record => ({
            onClick: (e: MouseEvent<HTMLElement>) => {
              const el = e.target as HTMLElement
              if (
                el.closest('.ant-table-selection-column') ||
                el.closest('.status-dropdown-cell__cell-status') ||
                el.closest('.status-dropdown-cell__status-trigger')
              ) {
                return
              }
              setSearchParams(prev => {
                const next = new URLSearchParams(prev)
                next.set('sponsorId', record.id)
                return next
              })
            },
          })}
          rowSelection={
            canWrite
              ? {
                  columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys.map(k => String(k))),
                  preserveSelectedRowKeys: false,
                }
              : undefined
          }
        />
      </FilterTableLayout>

      <SponsorDetailFullPageModal
        open={sponsorDetailOpen}
        onClose={closeSponsorDetail}
        sponsor={sponsorRowForDetail}
        onDeleteSponsor={handleDeleteSponsor}
      />
    </div>
  )
}
