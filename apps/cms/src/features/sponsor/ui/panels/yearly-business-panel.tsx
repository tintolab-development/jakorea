import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { saveSponsorYearlyBusinesses } from '@/features/sponsor/api/admin-sponsors-service'
import { mergeYearlyBusinessRows } from '@/features/sponsor/api/adapters/sponsor-adapters'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { useYearlyBusinessesQuery } from '@/features/sponsor/hooks/use-yearly-businesses-query'
import { sumProgramParticipantCount } from '@/features/sponsor/lib/program-participant-count'
import type {
  SponsorProgramHistoryRow,
  SponsorYearlyBusinessRow,
} from '@/features/sponsor/model/sponsor-management.types'
import type { DateValue } from '@/types'
import { CmsButton, CmsInput, CmsNumericInput, ExcelButton } from '@/shared/ui'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { isAwaitingFirstQueryData } from '@/shared/lib/is-awaiting-first-query-data'
import './yearly-business-panel.css'

export interface YearlyBusinessPanelProps {
  sponsorId: string
  sponsorshipStartDate?: DateValue
  programHistories: SponsorProgramHistoryRow[]
  canWrite: boolean
}

function yearlyRowKey(row: SponsorYearlyBusinessRow): string {
  return row.id || `year-${row.year}`
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

function formatPeople(count: number): string {
  return `${count.toLocaleString('ko-KR')}명`
}

function parseNumericField(raw: string): number {
  const parsed = Number(raw.replace(/,/g, ''))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function YearlyBusinessPanel({
  sponsorId,
  sponsorshipStartDate,
  programHistories,
  canWrite,
}: YearlyBusinessPanelProps) {
  const queryClient = useQueryClient()
  const yearlyQuery = useYearlyBusinessesQuery(sponsorId)
  const displayRows = useMemo(
    () => mergeYearlyBusinessRows(yearlyQuery.data ?? [], sponsorshipStartDate),
    [yearlyQuery.data, sponsorshipStartDate]
  )
  const [isEditing, setIsEditing] = useState(false)
  const [draftRows, setDraftRows] = useState<SponsorYearlyBusinessRow[]>(displayRows)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraftRows(displayRows)
    setIsEditing(false)
  }, [displayRows])

  const tableRows = isEditing ? draftRows : displayRows
  const totalDonation = tableRows.reduce((sum, row) => sum + row.donationAmount, 0)
  const totalBeneficiaries = sumProgramParticipantCount(programHistories)

  const updateDraft = useCallback(
    (year: number, patch: Partial<SponsorYearlyBusinessRow>): void => {
      setDraftRows(prev => prev.map(row => (row.year === year ? { ...row, ...patch } : row)))
    },
    []
  )

  const handleToggleEdit = useCallback(async (): Promise<void> => {
    if (!canWrite) return
    if (!isEditing) {
      setDraftRows(displayRows.map(row => ({ ...row })))
      setIsEditing(true)
      return
    }
    setIsSaving(true)
    try {
      await saveSponsorYearlyBusinesses(sponsorId, draftRows)
      const yearlyKey = dataManagementQueryKeys.sponsors.yearlyBusinesses(sponsorId)
      if (draftRows.some(row => !row.id)) {
        await queryClient.invalidateQueries({ queryKey: yearlyKey })
      } else {
        queryClient.setQueryData(yearlyKey, draftRows)
      }
      setIsEditing(false)
    } catch (error) {
      console.debug(
        'sponsor yearly business save failed',
        getDataManagementApiErrorMessage(error, '연도별 후원금 저장에 실패했습니다.')
      )
    } finally {
      setIsSaving(false)
    }
  }, [canWrite, displayRows, draftRows, isEditing, queryClient, sponsorId])

  const columns: ColumnsType<SponsorYearlyBusinessRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_value, _row, index) => tableRows.length - index,
      },
      {
        title: '후원년도',
        dataIndex: 'year',
        key: 'year',
        width: 120,
        align: 'center',
        render: (year: number) => `${year}년`,
      },
      {
        title: '후원금',
        dataIndex: 'donationAmount',
        key: 'donationAmount',
        width: 180,
        align: 'center',
        render: (amount: number, row) =>
          isEditing ? (
            <CmsNumericInput
              mode="integer"
              value={String(row.donationAmount)}
              min={0}
              inputSize="medium"
              width="100%"
              onValueChange={next =>
                updateDraft(row.year, { donationAmount: parseNumericField(next) })
              }
            />
          ) : (
            formatWon(amount)
          ),
      },
      {
        title: '총 수혜자 수',
        dataIndex: 'beneficiaryCount',
        key: 'beneficiaryCount',
        width: 140,
        align: 'center',
        render: (count: number) => formatPeople(count),
      },
      {
        title: '비고',
        dataIndex: 'memo',
        key: 'memo',
        ellipsis: true,
        align: 'center',
        render: (memo: string, row) =>
          isEditing ? (
            <CmsInput
              value={row.memo}
              inputSize="medium"
              width="100%"
              placeholder="비고"
              onChange={event => updateDraft(row.year, { memo: event.target.value })}
            />
          ) : (
            memo?.trim() || '-'
          ),
      },
    ],
    [isEditing, tableRows.length, updateDraft]
  )

  const excelColumns: ColumnsType<SponsorYearlyBusinessRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        render: (_value, _row, index) => tableRows.length - index,
      },
      {
        title: '후원년도',
        dataIndex: 'year',
        render: (year: number) => `${year}년`,
      },
      {
        title: '후원금',
        dataIndex: 'donationAmount',
        render: (amount: number) => formatWon(amount),
      },
      {
        title: '총 수혜자 수',
        dataIndex: 'beneficiaryCount',
        render: (count: number) => formatPeople(count),
      },
      {
        title: '비고',
        dataIndex: 'memo',
        render: (memo: string) => memo?.trim() || '-',
      },
    ],
    [tableRows.length]
  )

  const { exportExcel, isExporting } = useTableExcelExport({
    columns: excelColumns,
    data: tableRows,
    filename: '연도별_후원금',
  })

  return (
    <div className="yearly-business-panel">
      <div className="info-section-wrapper">
        <div>
          <span className="info-section-title">연도별 후원금</span>
          <span className="info-section-desc">{`${tableRows.length.toLocaleString('ko-KR')}건`}</span>
        </div>
        <div className="info-section-buttons--wrapper">
          {canWrite ? (
            <CmsButton
              variant="secondary"
              size="large"
              onClick={() => void handleToggleEdit()}
              disabled={isSaving}
            >
              {isEditing ? '수정 완료' : '후원정보 수정'}
            </CmsButton>
          ) : null}
          <ExcelButton onClick={() => void exportExcel()} loading={isExporting} />
        </div>
      </div>
      <div className="yearly-business-panel__summary">
        <div className="yearly-business-panel__summary-card">
          <span className="yearly-business-panel__summary-label">누적 후원금</span>
          <div>
            <span className="yearly-business-panel__summary-value">
              {totalDonation.toLocaleString('ko-KR')}
            </span>
            <span className="yearly-business-panel__summary-value-unit">원</span>
          </div>
        </div>
        <div className="yearly-business-panel__summary-card">
          <span className="yearly-business-panel__summary-label">누적 수혜자 수</span>
          <div>
            <span className="yearly-business-panel__summary-value">
              {totalBeneficiaries.toLocaleString('ko-KR')}
            </span>
            <span className="yearly-business-panel__summary-value-unit">명</span>
          </div>
        </div>
      </div>
      <Table<SponsorYearlyBusinessRow>
        rowKey={yearlyRowKey}
        className="cms-data-table"
        columns={columns}
        dataSource={tableRows}
        pagination={false}
        loading={isAwaitingFirstQueryData(yearlyQuery)}
      />
    </div>
  )
}
