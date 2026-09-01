import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import {
  mailSendParticipationTypeLabel,
} from '@/features/notifications/model/mail-send/recipients'
import type { MailSendRecipient } from '@/features/notifications/model/mail-send/types'
import './recipient-table.css'

const TABLE_MAX_HEIGHT = 400
const TABLE_HEADER_HEIGHT = 54
const TABLE_ROW_HEIGHT = 54

type RecipientTableProps = {
  recipients: MailSendRecipient[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
}

export function RecipientTable({
  recipients,
  selectedIds,
  onSelectedIdsChange,
}: RecipientTableProps) {
  const needScroll =
    recipients.length * TABLE_ROW_HEIGHT + TABLE_HEADER_HEIGHT > TABLE_MAX_HEIGHT

  const columns: ColumnsType<MailSendRecipient> = [
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
      title: '참여 유형',
      dataIndex: 'participationType',
      key: 'participationType',
      width: 140,
      align: 'center',
      render: value => mailSendParticipationTypeLabel(value) || '-',
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
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      align: 'center',
      ellipsis: true,
    },
  ]

  return (
    <Table
      className="cms-data-table cms-data-table--skip-auto-no-col mail-send-recipient-table"
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
