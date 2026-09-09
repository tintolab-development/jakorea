import { memo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { smsSendRecipientTypeLabel } from '@/features/notifications/model/sms-send/recipients'
import type { SmsSendRecipient } from '@/features/notifications/model/sms-send/types'
import '@/features/notifications/ui/alimtalk-send/recipient-table.css'

const TABLE_MAX_HEIGHT = 400
const TABLE_HEADER_HEIGHT = 54
const TABLE_ROW_HEIGHT = 54

type RecipientTableProps = {
  recipients: SmsSendRecipient[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  typeColumnTitle: string
}

export const RecipientTable = memo(function RecipientTable({
  recipients,
  selectedIds,
  onSelectedIdsChange,
  typeColumnTitle,
}: RecipientTableProps) {
  const needScroll =
    recipients.length * TABLE_ROW_HEIGHT + TABLE_HEADER_HEIGHT > TABLE_MAX_HEIGHT

  const columns: ColumnsType<SmsSendRecipient> = [
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
      key: 'type',
      width: 140,
      align: 'center',
      render: (_value, record) => smsSendRecipientTypeLabel(record) || '-',
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
})
