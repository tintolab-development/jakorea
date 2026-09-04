import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { alimtalkSendParticipationTypeLabel } from '@/features/notifications/model/alimtalk-send/recipients'
import type { AlimtalkSendRecipient } from '@/features/notifications/model/alimtalk-send/types'
import './recipient-table.css'

const TABLE_MAX_HEIGHT = 400
const TABLE_HEADER_HEIGHT = 54
const TABLE_ROW_HEIGHT = 54

type RecipientTableProps = {
  recipients: AlimtalkSendRecipient[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  /** 대상 프로그램 선택 시 참여 유형, 미선택/전체 시 회원 유형 */
  typeColumnTitle: string
}

export function RecipientTable({
  recipients,
  selectedIds,
  onSelectedIdsChange,
  typeColumnTitle,
}: RecipientTableProps) {
  const needScroll =
    recipients.length * TABLE_ROW_HEIGHT + TABLE_HEADER_HEIGHT > TABLE_MAX_HEIGHT

  const columns: ColumnsType<AlimtalkSendRecipient> = [
    {
      title: 'No.',
      key: 'index',
      width: TABLE_COLUMN_WIDTHS.index,
      align: 'center',
      className: CMS_TABLE_NO_COL_CLASS,
      onHeaderCell: () => ({ className: CMS_TABLE_NO_COL_CLASS }),
      render: (_value, _record, index) => recipients.length - index,
    },
    {
      title: typeColumnTitle,
      dataIndex: 'participationType',
      key: 'participationType',
      width: 140,
      align: 'center',
      render: value => alimtalkSendParticipationTypeLabel(value) || '-',
    },
    {
      title: '수신자명',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: '휴대폰 번호',
      dataIndex: 'phone',
      key: 'phone',
      align: 'center',
      ellipsis: true,
    },
  ]

  return (
    <Table
      className="cms-data-table cms-data-table--skip-auto-no-col alimtalk-send-recipient-table"
      columns={columns}
      dataSource={recipients}
      rowKey="id"
      pagination={false}
      scroll={needScroll ? { y: TABLE_MAX_HEIGHT - TABLE_HEADER_HEIGHT } : undefined}
      rowSelection={{
        selectedRowKeys: selectedIds,
        onChange: keys => onSelectedIdsChange(keys.map(String)),
        columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
      }}
    />
  )
}
