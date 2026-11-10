import { memo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { mailSendRecipientTypeLabel } from '@/features/notifications/model/mail-send/recipients'
import type { MailSendRecipient } from '@/features/notifications/model/mail-send/types'
import '@/features/notifications/ui/alimtalk-send/recipient-table.css'
import './recipient-table.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { CmsInput } from '@/shared/ui'

const TABLE_MAX_HEIGHT = 400
const TABLE_HEADER_HEIGHT = 54
const TABLE_ROW_HEIGHT = 54
const MAIL_SEND_RECIPIENT_CHECKBOX_WIDTH = 60

type RecipientTableProps = {
  recipients: MailSendRecipient[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  typeColumnTitle?: string
  /** 수신자별 직접 입력 변수. 서버 치환 키는 포함하지 않는다. */
  manualKeysByRecipientId?: Record<string, string[]>
  blockedKeysByRecipientId?: Record<string, string[]>
  onVariableChange?: (recipientId: string, key: string, value: string) => void
}

export const RecipientTable = memo(function RecipientTable({
  recipients,
  selectedIds,
  onSelectedIdsChange,
  typeColumnTitle = '유형',
  manualKeysByRecipientId,
  blockedKeysByRecipientId,
  onVariableChange,
}: RecipientTableProps) {
  const needScroll = recipients.length * TABLE_ROW_HEIGHT + TABLE_HEADER_HEIGHT > TABLE_MAX_HEIGHT

  const showVariableColumn = recipients.some(recipient => {
    const manualCount = manualKeysByRecipientId?.[recipient.id]?.length ?? 0
    const blockedCount = blockedKeysByRecipientId?.[recipient.id]?.length ?? 0
    return manualCount > 0 || blockedCount > 0
  })

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
      title: typeColumnTitle,
      key: 'type',
      align: 'center',
      ellipsis: true,
      render: (_value, record) => mailSendRecipientTypeLabel(record) || '-',
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

  if (showVariableColumn) {
    columns.push({
      title: '변수값',
      key: 'variables',
      width: 280,
      render: (_value, record) => {
        const manualKeys = manualKeysByRecipientId?.[record.id] ?? []
        const blockedKeys = blockedKeysByRecipientId?.[record.id] ?? []
        if (manualKeys.length === 0 && blockedKeys.length === 0) {
          return '자동 입력'
        }
        return (
          <div className="alimtalk-send-recipient-table__variables">
            {blockedKeys.map(key => (
              <p key={key} className="alimtalk-send-recipient-table__variable-blocked">
                {key}: 서버 전용
              </p>
            ))}
            {manualKeys.map(key => (
              <label key={key} className="alimtalk-send-recipient-table__variable">
                <span className="alimtalk-send-recipient-table__variable-label">{key}</span>
                <CmsInput
                  inputSize="small"
                  width="100%"
                  allowClear={false}
                  value={record.variables?.[key] ?? ''}
                  placeholder="변수값을 입력해 주세요"
                  onChange={event => onVariableChange?.(record.id, key, event.target.value)}
                />
              </label>
            ))}
          </div>
        )
      },
    })
  }

  return (
    <CmsDataTable
      className="cms-data-table cms-data-table--skip-auto-no-col mail-send-recipient-table"
      columns={columns}
      dataSource={recipients}
      rowKey="id"
      pagination={false}
      scroll={needScroll ? { y: TABLE_MAX_HEIGHT - TABLE_HEADER_HEIGHT } : undefined}
      rowSelection={{
        selectedRowKeys: selectedIds,
        onChange: keys => onSelectedIdsChange(keys.map(String)),
        // 시안: 체크 60 / No. 80 / 유형·수신자명·이메일 균등 (이 표만 override)
        columnWidth: MAIL_SEND_RECIPIENT_CHECKBOX_WIDTH,
      }}
    />
  )
})
