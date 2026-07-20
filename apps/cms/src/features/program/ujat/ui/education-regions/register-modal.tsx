import { useCallback, useEffect, useState } from 'react'
import { CmsButton, CmsInput, CmsRadio, CmsRadioGroup, ContentModal } from '@/shared/ui'

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
      title="UJAT 교육 지역 신규 등록"
      width={600}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            disabled={!name.trim()}
            onClick={handleSubmit}
          >
            등록
          </CmsButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>사용 여부</div>
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
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            교육 지역명 <span style={{ color: 'var(--color-red, #c32f4a)' }}>*</span>
          </div>
          <CmsInput
            inputSize="medium"
            width="100%"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="교육 지역명을 입력해 주세요"
            maxLength={100}
          />
        </div>
      </div>
    </ContentModal>
  )
}
