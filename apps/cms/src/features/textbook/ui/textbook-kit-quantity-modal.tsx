import { useEffect, useState } from 'react'
import { Alert, Spin } from 'antd'
import { CmsButton, CmsNumericInput, ContentModal } from '@/shared/ui'
import {
  isValidKitQuantityInput,
  KIT_QUANTITY_INVALID_CHAR_MESSAGE,
  KIT_QUANTITY_MAX,
  KIT_QUANTITY_MAX_DIGITS,
  KIT_QUANTITY_MIN,
  KIT_QUANTITY_RANGE_MESSAGE,
  KIT_QUANTITY_TOO_LONG_MESSAGE,
} from '@/features/textbook/lib/kit-quantity'
import './textbook-kit-quantity-modal.css'

/** 시안: 라벨 · 필수(*) · 기본값 24/24/24/32/32 (서버 저장값이 없을 때만 기본값) */
const KIT_LEVELS = [
  { key: 'kindergarten', label: '유아', defaultValue: '24' },
  { key: 'elementary', label: '초등학교', defaultValue: '24' },
  { key: 'middle', label: '중학교', defaultValue: '24' },
  { key: 'high', label: '고등학교', defaultValue: '32' },
  { key: 'university', label: '대학교', defaultValue: '32' },
] as const

type KitLevelKey = (typeof KIT_LEVELS)[number]['key']
export type TextbookKitQuantityValues = Record<KitLevelKey, string>

export const DEFAULT_KIT_QUANTITIES: TextbookKitQuantityValues = KIT_LEVELS.reduce((acc, level) => {
  acc[level.key] = level.defaultValue
  return acc
}, {} as TextbookKitQuantityValues)

export const EMPTY_KIT_QUANTITIES: TextbookKitQuantityValues = {
  kindergarten: '',
  elementary: '',
  middle: '',
  high: '',
  university: '',
}

/** 서버 저장값이 있는 칸은 그대로, 빈 칸만 기본값으로 채운다 */
export function withKitQuantityDefaults(
  values: TextbookKitQuantityValues | undefined
): TextbookKitQuantityValues {
  return KIT_LEVELS.reduce((acc, level) => {
    const raw = values?.[level.key] ?? ''
    acc[level.key] = raw.trim() ? raw : level.defaultValue
    return acc
  }, {} as TextbookKitQuantityValues)
}

function isValidKitQuantity(value: string): boolean {
  return isValidKitQuantityInput(value)
}

export interface TextbookKitQuantityModalProps {
  open: boolean
  values?: TextbookKitQuantityValues
  loading?: boolean
  loadError?: string | null
  onCancel: () => void
  onConfirm: (values: TextbookKitQuantityValues) => void
}

export function TextbookKitQuantityModal({
  open,
  values,
  loading = false,
  loadError = null,
  onCancel,
  onConfirm,
}: TextbookKitQuantityModalProps) {
  const [quantities, setQuantities] = useState<TextbookKitQuantityValues>(() =>
    withKitQuantityDefaults(values)
  )
  /** 열 때는 오류를 보이지 않고 [설정] 클릭 시에만 범위 검증 결과를 보인다 */
  const [showValidation, setShowValidation] = useState(false)
  /** QA-0111: 거부된 입력(문자·부호·소수점·자릿수 초과) 안내 — 값은 바꾸지 않는다 */
  const [rejectedInput, setRejectedInput] = useState<
    Partial<Record<KitLevelKey, 'invalid-char' | 'too-long'>>
  >({})

  useEffect(() => {
    if (open) {
      setQuantities(withKitQuantityDefaults(values))
      setRejectedInput({})
      setShowValidation(false)
    }
  }, [open, values])

  const isUnavailable = loading || Boolean(loadError)
  const hasInvalidQuantity = KIT_LEVELS.some(level => !isValidKitQuantity(quantities[level.key]))

  const handleConfirm = () => {
    if (isUnavailable) return
    if (hasInvalidQuantity) {
      setShowValidation(true)
      return
    }
    onConfirm(quantities)
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="키트 수량 관리"
      description={`키트 1개에 해당하는 교재 권수를 입력해 주세요.
수량 변경 시 기존 프로그램에는 반영되지 않으며, **신규 프로그램부터 적용**됩니다.`}
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
            disabled={isUnavailable}
            onClick={handleConfirm} >
            설정
          </CmsButton>
        </div>
      }
    >
      {loading ? (
        <div className="textbook-kit-quantity-modal__loading">
          <Spin size="small" /> 키트 수량을 불러오는 중입니다.
        </div>
      ) : null}
      {loadError ? <Alert type="error" showIcon message={loadError} /> : null}
      <div className="textbook-kit-quantity-modal__table">
        {KIT_LEVELS.map(level => (
          <div className="textbook-kit-quantity-modal__row" key={level.key}>
            <div className="textbook-kit-quantity-modal__th">
              {level.label}
              <span className="textbook-kit-quantity-modal__required" aria-hidden>
                *
              </span>
            </div>
            <div className="textbook-kit-quantity-modal__td">
              <CmsNumericInput
                className="textbook-kit-quantity-modal__input"
                mode="integer"
                inputSize="medium"
                width={'100%'}
                aria-label={`${level.label} 키트 수량`}
                aria-required
                value={quantities[level.key]}
                min={KIT_QUANTITY_MIN}
                max={KIT_QUANTITY_MAX}
                maxDigits={KIT_QUANTITY_MAX_DIGITS}
                rejectInvalidInput
                normalizeOnBlur={false}
                error={
                  Boolean(rejectedInput[level.key]) ||
                  (showValidation && !isValidKitQuantity(quantities[level.key]))
                }
                message={
                  rejectedInput[level.key] === 'invalid-char'
                    ? KIT_QUANTITY_INVALID_CHAR_MESSAGE
                    : rejectedInput[level.key] === 'too-long'
                      ? KIT_QUANTITY_TOO_LONG_MESSAGE
                      : showValidation && !isValidKitQuantity(quantities[level.key])
                        ? KIT_QUANTITY_RANGE_MESSAGE
                        : undefined
                }
                onInvalidInput={reason => {
                  setRejectedInput(prev => ({ ...prev, [level.key]: reason }))
                }}
                onValueChange={nextValue => {
                  setRejectedInput(prev => ({ ...prev, [level.key]: undefined }))
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
