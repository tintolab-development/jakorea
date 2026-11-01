import { useCallback, useEffect, useState } from 'react'
import { CmsButton, CmsInput, CmsRadio, CmsRadioGroup, ContentModal } from '@/shared/ui'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
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
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (!open) return
    setName('')
    setActive(true)
  }, [open])

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) {
      cmsAlertModal.show({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    onSubmit({ name: trimmed, active })
  }, [active, name, onSubmit])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="세부 프로그램명 신규 등록"
      width={600}
      className="detailed-program-add-item-modal"
      wrapClassName="detailed-program-add-item-modal-wrap"
      footer={
        <>
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="large" type="button" onClick={handleSubmit}>
            등록
          </CmsButton>
        </>
      }
      titleBodyGap="none"
    >
      <div className="detailed-program-add-item-modal__form">
        <CmsInput
          label="세부 프로그램명"
          required
          inputSize="large"
          width="100%"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="세부 프로그램명을 입력해 주세요."
          maxLength={200}
        />
        <CmsRadioGroup
          label="사용 여부"
          size="large"
          value={active}
          onChange={e => setActive(coerceRadioBoolean(e.target.value))}
        >
          <CmsRadio value={true}>사용</CmsRadio>
          <CmsRadio value={false}>미사용</CmsRadio>
        </CmsRadioGroup>
      </div>
    </ContentModal>
  )
}
