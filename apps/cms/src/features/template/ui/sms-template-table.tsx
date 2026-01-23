import { Button, Dropdown, Space, Table, Tag, Typography } from 'antd'
import { LAYOUT_CONSTANTS, TABLE_COLUMN_WIDTHS } from '@/shared/constants'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'
import { MoreOutlined } from '@ant-design/icons'
import type { SmsTemplate, TemplateStatus } from '@/types/template'
import { estimateMessageBytes, getTemplateStatusColor, getTemplateStatusLabel } from '@/data/mock/templates'

const { Text } = Typography

function getMessageType(bytes: number) {
  return bytes <= 90 ? 'SMS(단문)' : 'LMS(장문)'
}

interface SmsTemplateTableProps {
  dataSource: SmsTemplate[]
  onPreview: (row: SmsTemplate) => void
  onEdit?: (row: SmsTemplate) => void
  onCopyOriginal?: (row: SmsTemplate) => void
  onCopyApplied?: (row: SmsTemplate) => void
  onCopyTemplate?: (row: SmsTemplate) => void
  onToggleArchive?: (row: SmsTemplate) => void
  canWrite?: boolean
}

export function SmsTemplateTable({
  dataSource,
  onPreview,
  onEdit,
  onCopyOriginal,
  onCopyApplied,
  onCopyTemplate,
  onToggleArchive,
  canWrite = false,
}: SmsTemplateTableProps) {
  const getRowMenuItems = (row: SmsTemplate): MenuProps['items'] => {
    const baseItems: MenuProps['items'] = [
      {
        key: 'preview',
        label: '미리보기',
        onClick: () => onPreview(row),
      },
      { type: 'divider' },
      {
        key: 'copy-original',
        label: '원문 복사',
        onClick: () => onCopyOriginal?.(row),
      },
      {
        key: 'copy-applied',
        label: '샘플 치환 복사',
        onClick: () => onCopyApplied?.(row),
      },
    ]

    if (canWrite) {
      baseItems.push(
        { type: 'divider' },
        {
          key: 'copy-template',
          label: '템플릿 복사',
          onClick: () => onCopyTemplate?.(row),
        },
        {
          key: 'edit',
          label: '수정',
          onClick: () => onEdit?.(row),
        },
        {
          key: 'toggle-archive',
          label: row.status === 'archived' ? '게시' : '아카이브',
          danger: row.status !== 'archived',
          onClick: () => onToggleArchive?.(row),
        }
      )
    }

    return baseItems
  }

  const columns: ColumnsType<SmsTemplate> = [
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, row) => (
        <Space direction="vertical" size={2}>
          <Text strong>{v}</Text>
          {row.description && <Text type="secondary">{row.description}</Text>}
          <Space size={6} wrap>
            {row.tags.slice(0, 3).map(t => (
              <Tag key={t}>{t}</Tag>
            ))}
            {row.tags.length > 3 && <Tag>+{row.tags.length - 3}</Tag>}
          </Space>
        </Space>
      ),
    },
    {
      title: '문구(미리보기)',
      key: 'text',
      render: (_: unknown, row) => {
        const preview = row.content.text.replace(/\n/g, ' ')
        const bytes = estimateMessageBytes(row.content.text)
        return (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onPreview(row)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onPreview(row)
            }}
            style={{ cursor: 'pointer' }}
          >
            <Space direction="vertical" size={0}>
              <Text ellipsis style={{ maxWidth: 520 }}>
                {preview}
              </Text>
              <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                변수: {row.content.variables.join(', ') || '-'} · {bytes} bytes · {getMessageType(bytes)}
              </Text>
              <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                클릭하여 미리보기
              </Text>
            </Space>
          </div>
        )
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: TABLE_COLUMN_WIDTHS.status,
      render: (s: TemplateStatus) => <Tag color={getTemplateStatusColor(s)}>{getTemplateStatusLabel(s)}</Tag>,
    },
    {
      title: '수정일',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: TABLE_COLUMN_WIDTHS.date,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '작업',
      key: 'action',
      width: TABLE_COLUMN_WIDTHS.action,
      fixed: 'right' as const,
      render: (_: unknown, row) => (
        <div onClick={e => e.stopPropagation()}>
          <Dropdown menu={{ items: getRowMenuItems(row) }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
          </Dropdown>
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      scroll={{ x: 1200 }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: total => `총 ${total}개`,
      }}
    />
  )
}
