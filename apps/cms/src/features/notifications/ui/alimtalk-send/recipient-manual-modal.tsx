import { useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  formatKoreanPhoneNumber,
  isValidKoreanPhoneNumber,
} from '@jakorea/domain/shared/korean-phone'
import { ContentModal, CmsButton, CmsInput, CmsPhoneInput, useCmsAlert } from '@/shared/ui'
import { normalizeAlimtalkSendPhone } from '@/features/notifications/model/alimtalk-send/recipients'
import '@/features/notifications/ui/mail-send/recipient-manual-modal.css'
import './recipient-table.css'

const PICKER_Z_INDEX = 1100
const TABLE_MAX_HEIGHT = 400
const TABLE_HEADER_HEIGHT = 54
const TABLE_ROW_HEIGHT = 54
const PHONE_PLACEHOLDER = '수신자 정보를 입력하세요'

type ManualRecipientEntry = {
  phone: string
  variables?: Record<string, string>
}

type DraftRow =
  | {
      key: string
      mode: 'input'
      phone: string
      originPhone?: string
      variables: Record<string, string>
    }
  | { key: string; mode: 'saved'; phone: string; variables: Record<string, string> }

type RecipientManualModalProps = {
  open: boolean
  entries: ManualRecipientEntry[]
  manualVariableKeys?: string[]
  onClose: () => void
  onConfirm: (entries: ManualRecipientEntry[]) => void
  zIndex?: number
}

function nextKey() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function rowsFromEntries(entries: ManualRecipientEntry[]): DraftRow[] {
  const saved: DraftRow[] = entries.map(entry => ({
    key: nextKey(),
    mode: 'saved',
    phone: formatKoreanPhoneNumber(entry.phone),
    variables: { ...(entry.variables ?? {}) },
  }))
  // 최초(등록 번호 없음): 입력 인풋 1개. 기존 번호만 있으면 인풋은 「수신자 추가」로만 생성
  if (saved.length === 0) {
    return [{ key: nextKey(), mode: 'input', phone: '', variables: {} }]
  }
  return saved
}

export function RecipientManualModal({
  open,
  entries,
  manualVariableKeys = [],
  onClose,
  onConfirm,
  zIndex = PICKER_Z_INDEX,
}: RecipientManualModalProps) {
  const { showAlert } = useCmsAlert()
  const [rows, setRows] = useState<DraftRow[]>(() => rowsFromEntries(entries))

  useEffect(() => {
    if (!open) return
    setRows(rowsFromEntries(entries))
  }, [open, entries])

  const savedEntries = useMemo(
    () =>
      rows
        .filter(row => row.mode === 'saved')
        .map(row => ({ phone: row.phone, variables: row.variables })),
    [rows]
  )
  const needScroll = rows.length * TABLE_ROW_HEIGHT + TABLE_HEADER_HEIGHT > TABLE_MAX_HEIGHT

  const handleRegister = (key: string) => {
    const current = rows.find(row => row.key === key)
    if (!current || current.mode !== 'input') return
    const phone = normalizeAlimtalkSendPhone(current.phone)
    if (!isValidKoreanPhoneNumber(phone)) {
      showAlert({ title: '안내', content: '올바른 휴대폰 번호를 입력하세요.' })
      return
    }
    const digits = phone.replace(/\D/g, '')
    const duplicate = rows.some(
      row =>
        row.key !== key &&
        row.mode === 'saved' &&
        row.phone.replace(/\D/g, '') === digits
    )
    if (duplicate) {
      showAlert({ title: '안내', content: '이미 추가된 수신자입니다.' })
      return
    }
    setRows(prev =>
      prev.map(row =>
        row.key === key
          ? ({ key: row.key, mode: 'saved', phone, variables: row.variables } as DraftRow)
          : row
      )
    )
  }

  const handleCancelInput = (key: string) => {
    setRows(prev => {
      const current = prev.find(row => row.key === key)
      if (!current || current.mode !== 'input') return prev
      if (current.originPhone) {
        return prev.map(row =>
          row.key === key
            ? ({
                key: row.key,
                mode: 'saved',
                phone: current.originPhone ?? '',
                variables: current.variables,
              } as DraftRow)
            : row
        )
      }
      const remaining = prev.filter(row => row.key !== key)
      // 행이 모두 사라지면 초기와 같이 입력 인풋 1개 유지
      if (remaining.length === 0) {
        return [{ key: nextKey(), mode: 'input', phone: '', variables: {} }]
      }
      return remaining
    })
  }

  const handleEdit = (key: string) => {
    setRows(prev =>
      prev.map(row =>
        row.key === key && row.mode === 'saved'
          ? {
              key: row.key,
              mode: 'input',
              phone: row.phone,
              originPhone: row.phone,
              variables: row.variables,
            }
          : row
      )
    )
  }

  const handleDelete = (key: string) => {
    setRows(prev => {
      const remaining = prev.filter(row => row.key !== key)
      if (remaining.length === 0) {
        return [{ key: nextKey(), mode: 'input', phone: '', variables: {} }]
      }
      return remaining
    })
  }

  /** 수신자 추가 → 새 입력 인풋 행 추가 (등록 후에는 인풋이 없으므로 여기서만 생성) */
  const handleAdd = () => {
    setRows(prev => [...prev, { key: nextKey(), mode: 'input', phone: '', variables: {} }])
  }

  const handleConfirm = () => {
    const pending = rows.find(row => row.mode === 'input' && row.phone.trim())
    if (pending && pending.mode === 'input') {
      const phone = normalizeAlimtalkSendPhone(pending.phone)
      if (!isValidKoreanPhoneNumber(phone)) {
        showAlert({ title: '안내', content: '올바른 휴대폰 번호를 입력하세요.' })
        return
      }
      const merged = [...savedEntries]
      const digits = phone.replace(/\D/g, '')
      if (!merged.some(item => item.phone.replace(/\D/g, '') === digits)) {
        merged.push({ phone, variables: pending.variables })
      }
      onConfirm(merged)
      return
    }
    onConfirm(savedEntries)
  }

  const updateVariable = (key: string, variableKey: string, value: string) => {
    setRows(prev =>
      prev.map(row =>
        row.key === key
          ? { ...row, variables: { ...row.variables, [variableKey]: value } }
          : row
      )
    )
  }

  const columns: ColumnsType<DraftRow> = [
    {
      title: '수신자 정보',
      key: 'phone',
      align: 'center',
      render: (_, record) =>
        record.mode === 'input' ? (
          <CmsPhoneInput
            inputSize="large"
            width="100%"
            allowClear={false}
            placeholder={PHONE_PLACEHOLDER}
            value={record.phone}
            onChange={event => {
              const value = event.target.value
              setRows(prev =>
                prev.map(row =>
                  row.key === record.key && row.mode === 'input' ? { ...row, phone: value } : row
                )
              )
            }}
            onPressEnter={() => handleRegister(record.key)}
          />
        ) : (
          record.phone
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

  if (manualVariableKeys.length > 0) {
    columns.splice(1, 0, {
      title: '변수값',
      key: 'variables',
      width: 280,
      render: (_, record) => (
        <div className="alimtalk-send-recipient-table__variables">
          {manualVariableKeys.map(variableKey => (
            <label key={variableKey} className="alimtalk-send-recipient-table__variable">
              <span className="alimtalk-send-recipient-table__variable-label">{variableKey}</span>
              <CmsInput
                inputSize="small"
                width="100%"
                allowClear={false}
                value={record.variables[variableKey] ?? ''}
                placeholder="변수값을 입력하세요"
                onChange={event => updateVariable(record.key, variableKey, event.target.value)}
              />
            </label>
          ))}
        </div>
      ),
    })
  }

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="수신자 직접 입력"
      size={manualVariableKeys.length > 0 ? 'default' : 'compact'}
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
      <CmsDataTable
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
