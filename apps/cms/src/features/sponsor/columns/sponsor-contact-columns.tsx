import { memo, useCallback } from 'react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import { SponsorContactTypeBadge } from '@/features/sponsor/ui/sponsor-contact-type-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'

const CONTACT_TYPE_OPTIONS = [
  'lead',
  'assistant',
] as const satisfies readonly SponsorContactRow['contactType'][]

export interface BuildContactColumnsParams {
  contacts: SponsorContactRow[]
  canWrite: boolean
  openDropdownId: string | null
  onTypeChange: (rowId: string, type: SponsorContactRow['contactType']) => void
  onDropdownOpenChange: (rowId: string, open: boolean) => void
}

interface SponsorContactTypeCellProps {
  row: SponsorContactRow
  contacts: SponsorContactRow[]
  canWrite: boolean
  openDropdownId: string | null
  onTypeChange: (rowId: string, type: SponsorContactRow['contactType']) => void
  onDropdownOpenChange: (rowId: string, open: boolean) => void
}

const SponsorContactTypeCell = memo(function SponsorContactTypeCell({
  row,
  contacts,
  canWrite,
  openDropdownId,
  onTypeChange,
  onDropdownOpenChange,
}: SponsorContactTypeCellProps) {
  const handleChange = useCallback(
    (nextType: SponsorContactRow['contactType']): void => {
      onTypeChange(row.id, nextType)
    },
    [onTypeChange, row.id]
  )

  const handleOpenChange = useCallback(
    (open: boolean): void => {
      onDropdownOpenChange(row.id, open)
    },
    [onDropdownOpenChange, row.id]
  )

  const renderBadge = useCallback((type: SponsorContactRow['contactType']) => {
    return <SponsorContactTypeBadge type={type} />
  }, [])

  const leadCount = contacts.filter(c => c.contactType === 'lead').length
  const isItemDisabled = useCallback(
    (current: SponsorContactRow['contactType'], option: SponsorContactRow['contactType']): boolean => {
      if (current === option) return true
      if (current === 'lead' && option === 'assistant' && leadCount === 1) return true
      return false
    },
    [leadCount]
  )

  return (
    <StatusDropdownCell<SponsorContactRow['contactType']>
      status={row.contactType}
      statusOptions={CONTACT_TYPE_OPTIONS}
      renderBadge={renderBadge}
      isItemDisabled={isItemDisabled}
      onChange={canWrite ? handleChange : undefined}
      isOpen={openDropdownId === row.id}
      onOpenChange={handleOpenChange}
    />
  )
})

/**
 * 후원사 담당자 테이블의 `ColumnsType` 정의를 생성합니다.
 * 기획 컬럼: 부서 · 직함 · 유형 · 담당자명 · 내선 · 연락처 · 이메일 · 회사 주소 · 비고 · 등록일시
 */
export function buildContactColumns(params: BuildContactColumnsParams): ColumnsType<SponsorContactRow> {
  const { contacts, canWrite, openDropdownId, onTypeChange, onDropdownOpenChange } = params
  const contactCount = contacts.length

  return [
    {
      title: 'No.',
      key: 'no',
      className: CMS_TABLE_NO_COL_CLASS,
      width: TABLE_COLUMN_WIDTHS.index,
      align: 'center',
      render: (_: unknown, __: SponsorContactRow, index: number) => contactCount - index,
    },
    {
      title: '부서',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '직함',
      dataIndex: 'position',
      key: 'position',
      width: 100,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '담당자 유형',
      dataIndex: 'contactType',
      key: 'contactType',
      width: 150,
      align: 'center',
      onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
      render: (_: SponsorContactRow['contactType'], row: SponsorContactRow) => (
        <SponsorContactTypeCell
          row={row}
          contacts={contacts}
          canWrite={canWrite}
          openDropdownId={openDropdownId}
          onTypeChange={onTypeChange}
          onDropdownOpenChange={onDropdownOpenChange}
        />
      ),
    },
    {
      title: '담당자명',
      dataIndex: 'name',
      key: 'name',
      width: TABLE_COLUMN_WIDTHS.name,
      ellipsis: true,
    },
    {
      title: '내선번호',
      dataIndex: 'officePhone',
      key: 'officePhone',
      width: TABLE_COLUMN_WIDTHS.phone,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '연락처',
      dataIndex: 'phone',
      key: 'phone',
      width: TABLE_COLUMN_WIDTHS.phone,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: TABLE_COLUMN_WIDTHS.email,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '회사 주소',
      dataIndex: 'companyAddress',
      key: 'companyAddress',
      width: 180,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '비고',
      dataIndex: 'memo',
      key: 'memo',
      width: 140,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '등록일시',
      dataIndex: 'registeredAt',
      key: 'registeredAt',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('YYYY.MM.DD HH:mm') : '-'),
    },
  ]
}
