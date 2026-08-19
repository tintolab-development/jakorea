import { useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsInput, useCmsAlert } from '@/shared/ui'
import { isMailSendEmail, normalizeMailSendEmail } from '@/features/notifications/model/mail-send/recipients'
import './recipient-manual-modal.css'

const PICKER_Z_INDEX = 1100
const TABLE_MAX_HEIGHT = 400
const TABLE_HEADER_HEIGHT = 54
const TABLE_ROW_HEIGHT = 54

type DraftRow =
  | { key: string; mode: 'input'; email: string; originEmail?: string }
  | { key: string; mode: 'saved'; email: string }

type RecipientManualModalProps = {
  open: boolean
  emails: string[]
  onClose: () => void
  onConfirm: (emails: string[]) => void
  zIndex?: number
}

function nextKey() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function rowsFromEmails(emails: string[]): DraftRow[] {
  const saved: DraftRow[] = emails.map(email => ({
    key: nextKey(),
    mode: 'saved',
    email,
  }))
  return [...saved, { key: nextKey(), mode: 'input', email: '' }]
}

export function RecipientManualModal({
  open,
  emails,
  onClose,
  onConfirm,
  zIndex = PICKER_Z_INDEX,
}: RecipientManualModalProps) {
  const { showAlert } = useCmsAlert()
  const [rows, setRows] = useState<DraftRow[]>(() => rowsFromEmails(emails))

  const savedEmails = useMemo(
    () => rows.filter(row => row.mode === 'saved').map(row => row.email),
    [rows]
  )
  const needScroll = rows.length * TABLE_ROW_HEIGHT + TABLE_HEADER_HEIGHT > TABLE_MAX_HEIGHT

  const handleRegister = (key: string) => {
    const current = rows.find(row => row.key === key)
    if (!current || current.mode !== 'input') return
    const email = normalizeMailSendEmail(current.email)
    if (!isMailSendEmail(email)) {
      showAlert({ title: '안내', content: '올바른 이메일 주소를 입력하세요.' })
      return
    }
    const duplicate = rows.some(
      row => row.key !== key && row.mode === 'saved' && row.email.toLowerCase() === email.toLowerCase()
    )
    if (duplicate) {
      showAlert({ title: '안내', content: '이미 추가된 수신자입니다.' })
      return
    }
    setRows(prev => {
      const without = prev.map(row =>
        row.key === key ? ({ key: row.key, mode: 'saved', email } as DraftRow) : row
      )
      const hasInput = without.some(row => row.mode === 'input')
      return hasInput ? without : [...without, { key: nextKey(), mode: 'input', email: '' }]
    })
  }

  const handleCancelInput = (key: string) => {
    setRows(prev => {
      const current = prev.find(row => row.key === key)
      if (!current || current.mode !== 'input') return prev
      if (current.originEmail) {
        return prev.map(row =>
          row.key === key
            ? ({ key: row.key, mode: 'saved', email: current.originEmail ?? '' } as DraftRow)
            : row
        )
      }
      const remaining = prev.filter(row => row.key !== key)
      if (remaining.some(row => row.mode === 'input')) return remaining
      return [...remaining, { key: nextKey(), mode: 'input', email: '' }]
    })
  }

  const handleEdit = (key: string) => {
    setRows(prev =>
      prev.map(row =>
        row.key === key && row.mode === 'saved'
          ? { key: row.key, mode: 'input', email: row.email, originEmail: row.email }
          : row
      )
    )
  }

  const handleDelete = (key: string) => {
    setRows(prev => {
      const remaining = prev.filter(row => row.key !== key)
      if (remaining.some(row => row.mode === 'input')) return remaining
      return [...remaining, { key: nextKey(), mode: 'input', email: '' }]
    })
  }

  const handleAdd = () => {
    setRows(prev => {
      if (prev.some(row => row.mode === 'input' && !row.originEmail && !row.email.trim())) {
        return prev
      }
      return [...prev, { key: nextKey(), mode: 'input', email: '' }]
    })
  }

  const handleConfirm = () => {
    const pending = rows.find(row => row.mode === 'input' && row.email.trim())
    if (pending && pending.mode === 'input') {
      const email = normalizeMailSendEmail(pending.email)
      if (!isMailSendEmail(email)) {
        showAlert({ title: '안내', content: '올바른 이메일 주소를 입력하세요.' })
        return
      }
      const merged = [...savedEmails]
      if (!merged.some(item => item.toLowerCase() === email.toLowerCase())) merged.push(email)
      onConfirm(merged)
      return
    }
    onConfirm(savedEmails)
  }

  const columns: ColumnsType<DraftRow> = [
    {
      title: '수신자 정보',
      key: 'email',
      align: 'center',
      render: (_, record) =>
        record.mode === 'input' ? (
          <CmsInput
            inputSize="large"
            width="100%"
            allowClear={false}
            placeholder="수신자 정보를 입력하세요"
            value={record.email}
            onChange={event => {
              const value = event.target.value
              setRows(prev =>
                prev.map(row => (row.key === record.key && row.mode === 'input' ? { ...row, email: value } : row))
              )
            }}
            onPressEnter={() => handleRegister(record.key)}
          />
        ) : (
          record.email
        ),
    },
    {
      title: '관리',
      key: 'actions',
      width: 220,
      align: 'center',
      render: (_, record) =>
        record.mode === 'input' ? (
          <div className="mail-send-recipient-manual-modal__row-actions">
            <CmsButton
              type="button"
              variant="cancel"
              size="small"
              width={80}
              onClick={() => handleCancelInput(record.key)}
            >
              취소
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="small"
              width={80}
              onClick={() => handleRegister(record.key)}
            >
              등록
            </CmsButton>
          </div>
        ) : (
          <div className="mail-send-recipient-manual-modal__row-actions">
            <CmsButton
              type="button"
              variant="cancel"
              size="small"
              width={80}
              onClick={() => handleEdit(record.key)}
            >
              수정
            </CmsButton>
            <CmsButton
              type="button"
              variant="delete"
              size="small"
              width={80}
              onClick={() => handleDelete(record.key)}
            >
              삭제
            </CmsButton>
          </div>
        ),
    },
  ]

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="수신자 직접 입력"
      size="compact"
      className="mail-send-recipient-manual-modal"
      titleBodyGap="none"
      zIndex={zIndex}
      footer={
        <>
          <CmsButton variant="cancel" size="large" type="button" onClick={onClose}>
            닫기
          </CmsButton>
          <CmsButton variant="secondary" size="large" type="button" onClick={handleAdd}>
            수신자 추가
          </CmsButton>
          <CmsButton variant="primary" size="large" type="button" onClick={handleConfirm}>
            수신자 설정
          </CmsButton>
        </>
      }
    >
      <Table
        className="cms-data-table cms-data-table--skip-auto-no-col mail-send-recipient-manual-modal__table"
        columns={columns}
        dataSource={rows}
        rowKey="key"
        pagination={false}
        scroll={needScroll ? { y: TABLE_MAX_HEIGHT - TABLE_HEADER_HEIGHT } : undefined}
      />
    </ContentModal>
  )
}
