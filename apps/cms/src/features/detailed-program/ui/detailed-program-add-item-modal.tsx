import { useCallback, useEffect, useState } from 'react'
import { useTextbookBusinessAreaSelectOptions } from '@/features/textbook/hooks/use-business-areas-query'
import { CmsButton, CmsInput, CmsRadio, CmsRadioGroup, CmsSelect, ContentModal } from '@/shared/ui'
import './detailed-program-add-item-modal.css'

export type DetailedProgramAddItemValues = {
  name: string
  active: boolean
  businessArea: string
}

export interface DetailedProgramAddItemModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (values: DetailedProgramAddItemValues) => void
  /** API `TEXTBOOK_BUSINESS_AREA_NOT_FOUND` 등 businessArea 필드 에러 */
  businessAreaError?: string | null
  onBusinessAreaChange?: () => void
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
  businessAreaError = null,
  onBusinessAreaChange,
}: DetailedProgramAddItemModalProps) {
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)
  const [businessArea, setBusinessArea] = useState('')
  const { options: businessAreaOptions } = useTextbookBusinessAreaSelectOptions(open)

  useEffect(() => {
    if (!open) return
    setName('')
    setActive(true)
    setBusinessArea('')
  }, [open])

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim()
    const area = businessArea.trim()
    if (!trimmed || !area) {
      return
    }
    onSubmit({ name: trimmed, active, businessArea: area })
  }, [active, businessArea, name, onSubmit])

  const nameLabel = (
    <>
      세부 프로그램명
      <span className="detailed-program-add-item-modal__required" aria-hidden>
        *
      </span>
    </>
  )

  const businessAreaLabel = (
    <>
      사업 분야
      <span className="detailed-program-add-item-modal__required" aria-hidden>
        *
      </span>
    </>
  )

  const canSubmit = Boolean(name.trim() && businessArea.trim())

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
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            등록
          </CmsButton>
        </>
      }
      titleBodyGap="none"
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
        <div>
          <span className="detailed-program-add-item-modal__label">{businessAreaLabel}</span>
          <CmsSelect
            inputSize="large"
            placeholder="사업 분야를 선택해 주세요."
            value={businessArea || undefined}
            status={businessAreaError ? 'error' : undefined}
            onChange={value => {
              setBusinessArea(String(value ?? ''))
              onBusinessAreaChange?.()
            }}
            options={businessAreaOptions}
            style={{ width: '100%' }}
            aria-invalid={Boolean(businessAreaError)}
          />
          {businessAreaError ? (
            <p className="detailed-program-add-item-modal__field-error" role="alert">
              {businessAreaError}
            </p>
          ) : null}
        </div>
      </div>
    </ContentModal>
  )
}
