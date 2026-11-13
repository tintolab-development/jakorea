import { useCallback, useEffect, useState } from 'react'
import { CmsButton, CmsInput, CmsRadio, CmsRadioGroup, ContentModal } from '@/shared/ui'
import './register-modal.css'

export type UjatEducationRegionRegisterValues = {
  active: boolean
  name: string
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

export function UjatEducationRegionRegisterModal({
  open,
  onCancel,
  onSubmit,
}: {
  open: boolean
  onCancel: () => void
  onSubmit: (values: UjatEducationRegionRegisterValues) => void
}) {
  const [active, setActive] = useState(true)
  const [name, setName] = useState('')

  useEffect(() => {
    if (!open) return
    setActive(true)
    setName('')
  }, [open])

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit({ active, name: trimmed })
  }, [active, name, onSubmit])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="교육 지역 신규 등록"
      width={600}
      className="ujat-education-region-register-modal"
      wrapClassName="ujat-education-region-register-modal-wrap"
      titleBodyGap="none"
      footer={
        <>
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={!name.trim()}
            onClick={handleSubmit}
          >
            등록
          </CmsButton>
        </>
      }
    >
      <div className="ujat-education-region-register-modal__form">
        <CmsInput
          label="교육 지역명"
          required
          inputSize="large"
          width="100%"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="교육 지역명을 입력해 주세요"
          maxLength={100}
        />
        <CmsRadioGroup
          label="사용 여부"
          required
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
