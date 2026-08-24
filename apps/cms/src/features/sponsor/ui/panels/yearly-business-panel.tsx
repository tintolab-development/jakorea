import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flex, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { saveSponsorYearlyBusinesses } from '@/features/sponsor/api/admin-sponsors-service'
import { mergeYearlyBusinessRows } from '@/features/sponsor/api/adapters/sponsor-adapters'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { useYearlyBusinessesQuery } from '@/features/sponsor/hooks/use-yearly-businesses-query'
import type { SponsorYearlyBusinessRow } from '@/features/sponsor/model/sponsor-management.types'
import type { DateValue } from '@/types'
import { CmsButton, CmsInput, CmsNumericInput } from '@/shared/ui'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { isAwaitingFirstQueryData } from '@/shared/lib/is-awaiting-first-query-data'

export interface YearlyBusinessPanelProps {
  sponsorId: string
  sponsorshipStartDate?: DateValue
  canWrite: boolean
}

function yearlyRowKey(row: SponsorYearlyBusinessRow): string {
  return row.id || `year-${row.year}`
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

function parseNumericField(raw: string): number {
  const parsed = Number(raw.replace(/,/g, ''))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function YearlyBusinessPanel({
  sponsorId,
  sponsorshipStartDate,
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
  const totalBeneficiaries = tableRows.reduce((sum, row) => sum + row.beneficiaryCount, 0)

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
        title: 'No',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_value, _row, index) => index + 1,
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
              onValueChange={next => updateDraft(row.year, { donationAmount: parseNumericField(next) })}
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
        render: (count: number, row) =>
          isEditing ? (
            <CmsNumericInput
              mode="integer"
              value={String(row.beneficiaryCount)}
              min={0}
              inputSize="medium"
              width="100%"
              onValueChange={next =>
                updateDraft(row.year, { beneficiaryCount: parseNumericField(next) })
              }
            />
          ) : (
            `${count.toLocaleString('ko-KR')}명`
          ),
      },
      {
        title: '비고',
        dataIndex: 'memo',
        key: 'memo',
        ellipsis: true,
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
    [isEditing, updateDraft]
  )

  return (
    <Flex vertical gap="middle">
      <div className="info-section-wrapper">
        <div>
          <span className="info-section-title">연도별 후원금</span>
          <span className="info-section-desc">
            누적 후원금 {formatWon(totalDonation)} · 누적 수혜자 {totalBeneficiaries.toLocaleString('ko-KR')}명
          </span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            variant="primary"
            size="medium"
            onClick={() => void handleToggleEdit()}
            disabled={!canWrite || isSaving}
          >
            {isEditing ? '수정 완료' : '후원정보 수정'}
          </CmsButton>
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
    </Flex>
  )
}
