import { useCallback, useState } from 'react'
import { App } from 'antd'
import { CmsButton, CmsInput, CmsRadio, CmsRadioGroup, ContentModal } from '@/shared/ui'
import './detailed-program-add-item-modal.css'

export type DetailedProgramAddItemValues = {
  name: string
  active: boolean
}

export interface DetailedProgramAddItemModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (values: DetailedProgramAddItemValues) => void
}

function coerceRadioBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return Boolean(raw)
}

export function DetailedProgramAddItemModal({
  open,
  onCancel,
  onSubmit,
}: DetailedProgramAddItemModalProps) {
  const { message } = App.useApp()
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) {
      message.error('세부 프로그램명을 입력해 주세요.')
      return
    }
    onSubmit({ name: trimmed, active })
  }, [active, message, name, onSubmit])

  const nameLabel = (
    <>
      세부 프로그램명
      <span className="detailed-program-add-item-modal__required" aria-hidden>
        *
      </span>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="항목 추가"
      width={520}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="medium" type="button" disabled={!name} onClick={handleSubmit}>
            등록
          </CmsButton>
        </>
      }
    >
      <div className="detailed-program-add-item-modal__form">
        <div>
          <span className="detailed-program-add-item-modal__label">사용 여부</span>
          <CmsRadioGroup
            size="medium"
            value={active}
            onChange={e => setActive(coerceRadioBoolean(e.target.value))}
          >
            <CmsRadio size="medium" value={true}>
              사용
            </CmsRadio>
            <CmsRadio size="medium" value={false}>
              미사용
            </CmsRadio>
          </CmsRadioGroup>
        </div>
        <div>
          <CmsInput
            label={nameLabel}
            inputSize="large"
            width="100%"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="세부 프로그램명을 입력해 주세요."
            maxLength={200}
          />
        </div>
      </div>
    </ContentModal>
  )
}
