import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { alimtalkSendRecipientTypeLabel } from '@/features/notifications/model/alimtalk-send/recipients'
import type { AlimtalkSendRecipient } from '@/features/notifications/model/alimtalk-send/types'
import './recipient-table.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { CmsInput } from '@/shared/ui'

const TABLE_MAX_HEIGHT = 400
const TABLE_HEADER_HEIGHT = 54
const TABLE_ROW_HEIGHT = 54
/** 시안(알림톡 발송 2. 수신자 설정) 체크박스 열 60 — 이 표 전용 */
const CHECKBOX_COLUMN_WIDTH = 60

type RecipientTableProps = {
  recipients: AlimtalkSendRecipient[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  /** 대상 프로그램 선택 시 참여 유형, 미선택/전체 시 회원 유형 */
  typeColumnTitle: string
  /** 수신자별 직접 입력 변수. 서버 치환 키는 포함하지 않는다. */
  manualKeysByRecipientId?: Record<string, string[]>
  blockedKeysByRecipientId?: Record<string, string[]>
  onVariableChange?: (recipientId: string, key: string, value: string) => void
}

export function RecipientTable({
  recipients,
  selectedIds,
  onSelectedIdsChange,
  typeColumnTitle,
  manualKeysByRecipientId,
  blockedKeysByRecipientId,
  onVariableChange,
}: RecipientTableProps) {
  const needScroll = recipients.length * TABLE_ROW_HEIGHT + TABLE_HEADER_HEIGHT > TABLE_MAX_HEIGHT

  /** 수신자별 직접 입력·서버 전용 변수 키 합집합 — 시안대로 변수마다 열 하나 (첫 등장 순서) */
  const variableKeys = useMemo(() => {
    const keys: string[] = []
    const seen = new Set<string>()
    for (const recipient of recipients) {
      for (const key of [
        ...(manualKeysByRecipientId?.[recipient.id] ?? []),
        ...(blockedKeysByRecipientId?.[recipient.id] ?? []),
      ]) {
        if (seen.has(key)) continue
        seen.add(key)
        keys.push(key)
      }
    }
    return keys
  }, [blockedKeysByRecipientId, manualKeysByRecipientId, recipients])

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
      key: 'type',
      align: 'center',
      render: (_value, record) => alimtalkSendRecipientTypeLabel(record) || '-',
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

  for (const variableKey of variableKeys) {
    columns.push({
      title: variableKey,
      key: `variable:${variableKey}`,
      align: 'center',
      className: 'alimtalk-send-recipient-table__variable-cell',
      render: (_value, record) => {
        if (blockedKeysByRecipientId?.[record.id]?.includes(variableKey)) {
          return <span className="alimtalk-send-recipient-table__variable-blocked">서버 전용</span>
        }
        if (!manualKeysByRecipientId?.[record.id]?.includes(variableKey)) {
          return '자동 입력'
        }
        return (
          <CmsInput
            inputSize="small"
            width="100%"
            allowClear={false}
            aria-label={variableKey}
            value={record.variables?.[variableKey] ?? ''}
            placeholder="변수값을 입력해 주세요"
            onChange={event => onVariableChange?.(record.id, variableKey, event.target.value)}
          />
        )
      },
    })
  }

  return (
    <CmsDataTable
      className="cms-data-table cms-data-table--skip-auto-no-col alimtalk-send-recipient-table"
      columns={columns}
      dataSource={recipients}
      rowKey="id"
      pagination={false}
      // 시안에 수신자 0명 빈 상태 그림이 없다 — 헤더만 보인다
      emptyText={null}
      scroll={needScroll ? { y: TABLE_MAX_HEIGHT - TABLE_HEADER_HEIGHT } : undefined}
      rowSelection={{
        selectedRowKeys: selectedIds,
        onChange: keys => onSelectedIdsChange(keys.map(String)),
        columnWidth: CHECKBOX_COLUMN_WIDTH,
      }}
    />
  )
}
