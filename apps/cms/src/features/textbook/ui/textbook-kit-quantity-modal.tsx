import { useEffect, useState } from 'react'
import { CmsButton, CmsNumericInput, ContentModal } from '@/shared/ui'
import './textbook-kit-quantity-modal.css'

const KIT_LEVELS = [
  { key: 'kindergarten', label: '유아', defaultValue: '24' },
  { key: 'elementary', label: '초등', defaultValue: '24' },
  { key: 'middle', label: '중등', defaultValue: '24' },
  { key: 'high', label: '고등', defaultValue: '32' },
  { key: 'university', label: '대학', defaultValue: '32' },
] as const

type KitLevelKey = (typeof KIT_LEVELS)[number]['key']
export type TextbookKitQuantityValues = Record<KitLevelKey, string>

export const DEFAULT_KIT_QUANTITIES: TextbookKitQuantityValues = KIT_LEVELS.reduce(
  (acc, level) => {
    acc[level.key] = level.defaultValue
    return acc
  },
  {} as TextbookKitQuantityValues
)

const createDefaultQuantities = (): TextbookKitQuantityValues => ({ ...DEFAULT_KIT_QUANTITIES })

export interface TextbookKitQuantityModalProps {
  open: boolean
  values?: TextbookKitQuantityValues
  onCancel: () => void
  onConfirm: (values: TextbookKitQuantityValues) => void
}

export function TextbookKitQuantityModal({
  open,
  values,
  onCancel,
  onConfirm,
}: TextbookKitQuantityModalProps) {
  const [quantities, setQuantities] = useState<TextbookKitQuantityValues>(
    () => values ?? createDefaultQuantities()
  )

  useEffect(() => {
    if (open) {
      setQuantities(values ?? createDefaultQuantities())
    }
  }, [open, values])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="키트 수량 관리"
      description="키트 1개에 해당하는 교재 권수를 입력해 주세요."
      width={600}
      className="textbook-kit-quantity-modal"
      wrapClassName="textbook-kit-quantity-modal-wrap"
      footer={
        <div className="textbook-kit-quantity-modal__footer">
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            onClick={() => onConfirm(quantities)}
          >
            확인
          </CmsButton>
        </div>
      }
    >
      <div className="textbook-kit-quantity-modal__table">
        {KIT_LEVELS.map(level => (
          <div className="textbook-kit-quantity-modal__row" key={level.key}>
            <div className="textbook-kit-quantity-modal__th">{level.label}</div>
            <div className="textbook-kit-quantity-modal__td">
              <CmsNumericInput
                className="textbook-kit-quantity-modal__input"
                mode="integer"
                min={0}
                inputSize="medium"
                width={190}
                aria-label={`${level.label} 키트 수량`}
                value={quantities[level.key]}
                onValueChange={nextValue => {
                  setQuantities(prev => ({ ...prev, [level.key]: nextValue }))
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ContentModal>
  )
}
