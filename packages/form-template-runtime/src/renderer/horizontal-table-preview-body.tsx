import { Input, Radio } from 'antd'
import {
  type HorizontalTableParagraph,
  type IdTypeWithInputParagraph,
  type TableBottomConsent,
  isIdTypeResidentOptionId,
  joinIdTypeResidentInputValue,
  splitIdTypeResidentInputValue,
} from '@jakorea/form-schema/writing-form'
import type { ParagraphBodyInteractionMode } from '@jakorea/form-schema/surface'
import { isFormPreviewReadonlyMode } from '@jakorea/form-schema/surface'
import { resolveHorizontalTablePreviewLayout } from './horizontal-table-preview.js'
import {
  isHorizontalTableEmphasizedBodyCell,
  resolvePaymentPreConsentHorizontalTableWrapClass,
} from './horizontal-table-preview-wrap-class.js'
import './horizontal-table-preview.css'

function HorizontalTableCellText({
  value,
  placeholder,
  variant,
  emphasized = false,
}: {
  value: string
  placeholder: string
  variant: 'header' | 'body'
  emphasized?: boolean
}) {
  const filled = value.trim().length > 0
  return (
    <span
      className={[
        'form-template-horizontal-table__cell-text',
        variant === 'header'
          ? 'form-template-horizontal-table__cell-text--header'
          : 'form-template-horizontal-table__cell-text--body',
        emphasized ? 'form-template-horizontal-table__cell-text--emphasized' : '',
        !filled ? 'form-template-horizontal-table__cell-text--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {filled ? value : placeholder}
    </span>
  )
}

export type HorizontalTablePreviewBodyProps = {
  paragraph: HorizontalTableParagraph
  interactionMode: ParagraphBodyInteractionMode
  onBottomConsentChange?: (value: TableBottomConsent) => void
  onIdTypeWithInputChange?: (next: IdTypeWithInputParagraph) => void
}

export function HorizontalTablePreviewBody({
  paragraph,
  interactionMode,
  onBottomConsentChange,
  onIdTypeWithInputChange,
}: HorizontalTablePreviewBodyProps) {
  const { colCount, headers, bodyRows } = resolveHorizontalTablePreviewLayout(paragraph)
  const isFieldTable = paragraph.tableFlavor === 'field'
  const idType = paragraph.idTypeWithInput
  const consentReadonly =
    isFormPreviewReadonlyMode(interactionMode) || onBottomConsentChange == null
  const preConsentWrapClass = resolvePaymentPreConsentHorizontalTableWrapClass(paragraph.id)

  return (
    <div
      className={['form-template-horizontal-table-wrap', preConsentWrapClass]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="form-template-horizontal-table" role="grid" aria-readonly>
        <div
          className="form-template-horizontal-table__row form-template-horizontal-table__row--header"
          role="row"
        >
          {headers.map((header, index) => (
            <div
              key={`header-${index}`}
              className="form-template-horizontal-table__th"
              role="columnheader"
            >
              <HorizontalTableCellText value={header} placeholder="" variant="header" />
            </div>
          ))}
        </div>

        {bodyRows.map((cells, rowIndex) => (
          <div key={`row-${rowIndex}`} className="form-template-horizontal-table__row" role="row">
            {Array.from({ length: colCount }, (_, colIndex) => {
              const cellValue = cells[colIndex] ?? ''
              return (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={[
                    'form-template-horizontal-table__td',
                    isFieldTable ? 'form-template-horizontal-table__td--field' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="gridcell"
                  data-label={headers[colIndex] ?? ''}
                >
                  <HorizontalTableCellText
                    value={cellValue}
                    placeholder=""
                    variant="body"
                    emphasized={isHorizontalTableEmphasizedBodyCell(paragraph.id, colIndex)}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {paragraph.showBottomText || paragraph.showBottomConsent || idType != null ? (
        <div className="form-template-horizontal-table__bottom">
          {paragraph.showBottomText && paragraph.bottomText ? (
            <div className="form-template-horizontal-table__bottom-static">
              {paragraph.bottomText}
            </div>
          ) : null}
          {paragraph.showBottomConsent ? (
            <Radio.Group
              className="form-template-table-bottom-consent app-radio-group app-radio-group--large"
              size="large"
              value={paragraph.bottomConsent ?? undefined}
              style={consentReadonly ? { pointerEvents: 'none' } : undefined}
              onChange={event => onBottomConsentChange?.(event.target.value as TableBottomConsent)}
            >
              <Radio value="agree">동의</Radio>
              <Radio value="disagree">동의하지 않음</Radio>
            </Radio.Group>
          ) : null}
          {idType != null ? (
            <IdTypeWithInputFill
              paragraph={idType}
              readonly={onIdTypeWithInputChange == null || isFormPreviewReadonlyMode(interactionMode)}
              onChange={onIdTypeWithInputChange}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

const ID_TYPE_INPUT_PLACEHOLDER: Record<string, string> = {
  'agreement-notice-id-resident': '주민등록번호를 입력해 주세요',
  'agreement-notice-id-passport': '여권번호를 입력해 주세요',
  'agreement-notice-id-driver': '운전면허번호를 입력해 주세요',
  'agreement-notice-id-alien': '외국인등록번호를 입력해 주세요',
}

function IdTypeWithInputFill({
  paragraph,
  readonly,
  onChange,
}: {
  paragraph: IdTypeWithInputParagraph
  readonly: boolean
  onChange?: (next: IdTypeWithInputParagraph) => void
}) {
  const options = paragraph.options?.length ? paragraph.options : []
  const selectedId =
    paragraph.selectedOptionId != null && options.some(o => o.id === paragraph.selectedOptionId)
      ? paragraph.selectedOptionId
      : (options[0]?.id ?? null)

  const placeholder =
    selectedId != null
      ? (ID_TYPE_INPUT_PLACEHOLDER[selectedId] ??
        (paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'))
      : paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'
  const isResident = isIdTypeResidentOptionId(selectedId)
  const residentParts = splitIdTypeResidentInputValue(paragraph.inputValue)

  return (
    <div className="form-template-id-type-with-input">
      <Radio.Group
        className="form-template-id-type-with-input__radios app-radio-group app-radio-group--large"
        size="large"
        value={selectedId ?? undefined}
        disabled={readonly}
        onChange={event => {
          const nextId = String(event.target.value)
          onChange?.({
            ...paragraph,
            selectedOptionId: nextId,
            inputPlaceholder:
              ID_TYPE_INPUT_PLACEHOLDER[nextId] ??
              (paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'),
            inputValue: '',
          })
        }}
      >
        {options.map(opt => (
          <Radio key={opt.id} value={opt.id}>
            {opt.label}
          </Radio>
        ))}
      </Radio.Group>
      {isResident ? (
        <div className="form-template-id-type-with-input__resident">
          <Input
            className="form-template-id-type-with-input__resident-input"
            size="large"
            inputMode="numeric"
            maxLength={6}
            value={residentParts.front}
            placeholder="주민등록 앞 6자리"
            disabled={readonly}
            onChange={event =>
              onChange?.({
                ...paragraph,
                inputValue: joinIdTypeResidentInputValue(
                  event.target.value.replace(/\D/g, ''),
                  residentParts.back
                ),
                inputPlaceholder: placeholder,
              })
            }
          />
          <span className="form-template-id-type-with-input__dash" aria-hidden>
            -
          </span>
          <Input
            className="form-template-id-type-with-input__resident-input"
            size="large"
            inputMode="numeric"
            maxLength={7}
            value={residentParts.back}
            placeholder="주민등록 뒤 7자리"
            disabled={readonly}
            onChange={event =>
              onChange?.({
                ...paragraph,
                inputValue: joinIdTypeResidentInputValue(
                  residentParts.front,
                  event.target.value.replace(/\D/g, '')
                ),
                inputPlaceholder: placeholder,
              })
            }
          />
        </div>
      ) : (
        <Input
          className="form-template-id-type-with-input__input"
          size="large"
          value={paragraph.inputValue}
          placeholder={placeholder}
          disabled={readonly}
          onChange={event =>
            onChange?.({
              ...paragraph,
              inputValue: event.target.value,
              inputPlaceholder: placeholder,
            })
          }
        />
      )}
    </div>
  )
}
