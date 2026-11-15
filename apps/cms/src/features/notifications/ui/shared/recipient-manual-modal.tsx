import { useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsInput, CmsPhoneInput, useCmsAlert } from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import './recipient-manual-modal.css'

const PICKER_Z_INDEX = 1100
const TABLE_MAX_HEIGHT = 400
/** recipient-manual-modal.css 시안 값(헤더 44·행 56)과 맞춘다 — 넘치면 표 본문만 스크롤 */
const TABLE_HEADER_HEIGHT = 44
const TABLE_ROW_HEIGHT = 56
const CONTACT_PLACEHOLDER = '수신자 정보를 입력해 주세요'

export type RecipientManualEntry = {
  contact: string
  /** 변수값은 발송 화면 「수신자 설정」 표에서 입력한다. 팝업은 받은 값을 그대로 돌려준다. */
  variables?: Record<string, string>
}

type DraftRow =
  | {
      key: string
      mode: 'input'
      contact: string
      originContact?: string
      variables: Record<string, string>
    }
  | { key: string; mode: 'saved'; contact: string; variables: Record<string, string> }

export type RecipientManualModalProps = {
  open: boolean
  contact: 'email' | 'phone'
  values: RecipientManualEntry[]
  normalize: (raw: string) => string
  isValid: (normalized: string) => boolean
  invalidMessage: string
  onClose: () => void
  onConfirm: (values: RecipientManualEntry[]) => void
  zIndex?: number
}

function nextKey() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function identityKey(kind: 'email' | 'phone', value: string): string {
  if (kind === 'email') return value.trim().toLowerCase()
  return value.replace(/\D/g, '')
}

function emptyRow(): DraftRow {
  return { key: nextKey(), mode: 'input', contact: '', variables: {} }
}

function rowsFromValues(values: RecipientManualEntry[]): DraftRow[] {
  const saved: DraftRow[] = values.map(entry => ({
    key: nextKey(),
    mode: 'saved',
    contact: entry.contact,
    variables: { ...(entry.variables ?? {}) },
  }))
  if (saved.length === 0) return [emptyRow()]
  return saved
}

export function RecipientManualModal({
  open,
  contact,
  values,
  normalize,
  isValid,
  invalidMessage,
  onClose,
  onConfirm,
  zIndex = PICKER_Z_INDEX,
}: RecipientManualModalProps) {
  const { showAlert } = useCmsAlert()
  const [rows, setRows] = useState<DraftRow[]>(() => rowsFromValues(values))

  useEffect(() => {
    if (!open) return
    setRows(rowsFromValues(values))
    // 부모가 매 렌더 새 배열을 넘기면 입력 중이 초기화되므로 열릴 때만 시드
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open
  }, [open])

  const savedEntries = useMemo(
    () =>
      rows
        .filter(row => row.mode === 'saved')
        .map(row => ({ contact: row.contact, variables: row.variables })),
    [rows]
  )
  const needScroll = rows.length * TABLE_ROW_HEIGHT + TABLE_HEADER_HEIGHT > TABLE_MAX_HEIGHT

  const handleRegister = (key: string) => {
    const current = rows.find(row => row.key === key)
    if (!current || current.mode !== 'input') return
    const nextContact = normalize(current.contact)
    if (!isValid(nextContact)) {
      showAlert({ title: '안내', content: invalidMessage })
      return
    }
    const nextId = identityKey(contact, nextContact)
    const duplicate = rows.some(
      row => row.key !== key && row.mode === 'saved' && identityKey(contact, row.contact) === nextId
    )
    if (duplicate) {
      showAlert({ title: '안내', content: '이미 추가된 수신자입니다.' })
      return
    }
    setRows(prev =>
      prev.map(row =>
        row.key === key
          ? ({
              key: row.key,
              mode: 'saved',
              contact: nextContact,
              variables: row.variables,
            } as DraftRow)
          : row
      )
    )
  }

  const handleCancelInput = (key: string) => {
    setRows(prev => {
      const current = prev.find(row => row.key === key)
      if (!current || current.mode !== 'input') return prev
      if (current.originContact) {
        return prev.map(row =>
          row.key === key
            ? ({
                key: row.key,
                mode: 'saved',
                contact: current.originContact ?? '',
                variables: current.variables,
              } as DraftRow)
            : row
        )
      }
      const remaining = prev.filter(row => row.key !== key)
      return remaining.length === 0 ? [emptyRow()] : remaining
    })
  }

  const handleEdit = (key: string) => {
    setRows(prev =>
      prev.map(row =>
        row.key === key && row.mode === 'saved'
          ? {
              key: row.key,
              mode: 'input',
              contact: row.contact,
              originContact: row.contact,
              variables: row.variables,
            }
          : row
      )
    )
  }

  const handleDelete = (key: string) => {
    setRows(prev => {
      const remaining = prev.filter(row => row.key !== key)
      return remaining.length === 0 ? [emptyRow()] : remaining
    })
  }

  const handleAdd = () => {
    setRows(prev => [...prev, emptyRow()])
  }

  const handleConfirm = () => {
    // 빈 입력 행은 무시하고, 값이 있는데 [등록]하지 않은 행은 모두 검증해 함께 넘긴다
    // (수신자 추가로 입력 행이 여러 개일 수 있어 첫 행만 넘기면 나머지가 빠진다)
    const pendingRows = rows.filter(row => row.mode === 'input' && row.contact.trim())
    const merged = [...savedEntries]
    for (const pending of pendingRows) {
      const nextContact = normalize(pending.contact)
      if (!isValid(nextContact)) {
        showAlert({ title: '안내', content: invalidMessage })
        return
      }
      const nextId = identityKey(contact, nextContact)
      if (!merged.some(item => identityKey(contact, item.contact) === nextId)) {
        merged.push({ contact: nextContact, variables: pending.variables })
      }
    }
    onConfirm(merged)
  }

  const updateContact = (key: string, value: string) => {
    setRows(prev =>
      prev.map(row => (row.key === key && row.mode === 'input' ? { ...row, contact: value } : row))
    )
  }

  const columns: ColumnsType<DraftRow> = [
    {
      title: (
        <>
          수신자 정보{' '}
          <span className="cms-field__required" aria-hidden>
            *
          </span>
        </>
      ),
      key: 'contact',
      align: 'center',
      render: (_, record) =>
        record.mode === 'input' ? (
          contact === 'phone' ? (
            <CmsPhoneInput
              inputSize="small"
              width="100%"
              allowClear={false}
              placeholder={CONTACT_PLACEHOLDER}
              value={record.contact}
              onChange={event => updateContact(record.key, event.target.value)}
              onPressEnter={() => handleRegister(record.key)}
            />
          ) : (
            <CmsInput
              inputSize="small"
              width="100%"
              allowClear={false}
              placeholder={CONTACT_PLACEHOLDER}
              value={record.contact}
              onChange={event => updateContact(record.key, event.target.value)}
              onPressEnter={() => handleRegister(record.key)}
            />
          )
        ) : (
          record.contact
        ),
    },
    {
      title: '관리',
      key: 'actions',
      width: 200,
      align: 'center',
      render: (_, record) =>
        record.mode === 'input' ? (
          <div className="send-recipient-manual-modal__row-actions">
            <CmsButton
              type="button"
              variant="cancel"
              size="small"
              onClick={() => handleCancelInput(record.key)}
            >
              취소
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="small"
              onClick={() => handleRegister(record.key)}
            >
              등록
            </CmsButton>
          </div>
        ) : (
          <div className="send-recipient-manual-modal__row-actions">
            <CmsButton
              type="button"
              variant="cancel"
              size="small"
              onClick={() => handleEdit(record.key)}
            >
              수정
            </CmsButton>
            <CmsButton
              type="button"
              variant="delete"
              size="small"
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
      className="send-recipient-manual-modal"
      titleBodyGap="none"
      zIndex={zIndex}
      footer={
        <>
          <CmsButton variant="cancel" size="h40" type="button" onClick={onClose}>
            취소
          </CmsButton>
          <CmsButton variant="secondary" size="h40" type="button" onClick={handleAdd}>
            수신자 추가
          </CmsButton>
          <CmsButton variant="primary" size="h40" type="button" onClick={handleConfirm}>
            수신자 설정
          </CmsButton>
        </>
      }
    >
      <CmsDataTable
        className="cms-data-table cms-data-table--skip-auto-no-col send-recipient-manual-modal__table"
        columns={columns}
        dataSource={rows}
        rowKey="key"
        pagination={false}
        scroll={needScroll ? { y: TABLE_MAX_HEIGHT - TABLE_HEADER_HEIGHT } : undefined}
      />
    </ContentModal>
  )
}
