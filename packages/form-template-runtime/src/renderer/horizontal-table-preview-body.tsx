import { Radio } from 'antd'
import type { HorizontalTableParagraph } from '@jakorea/form-schema/writing-form'
import type { ParagraphBodyInteractionMode } from '@jakorea/form-schema/surface'
import { isFormPreviewReadonlyMode } from '@jakorea/form-schema/surface'
import { resolveHorizontalTablePreviewLayout } from './horizontal-table-preview.js'
import { resolvePaymentPreConsentHorizontalTableWrapClass } from './horizontal-table-preview-wrap-class.js'
import './horizontal-table-preview.css'

function HorizontalTableCellText({
  value,
  placeholder,
  variant,
}: {
  value: string
  placeholder: string
  variant: 'header' | 'body'
}) {
  const filled = value.trim().length > 0
  return (
    <span
      className={[
        'form-template-horizontal-table__cell-text',
        variant === 'header'
          ? 'form-template-horizontal-table__cell-text--header'
          : 'form-template-horizontal-table__cell-text--body',
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
}

export function HorizontalTablePreviewBody({
  paragraph,
  interactionMode,
}: HorizontalTablePreviewBodyProps) {
  const { colCount, headers, bodyRows } = resolveHorizontalTablePreviewLayout(paragraph)
  const isFieldTable = paragraph.tableFlavor === 'field'
  const consentReadonly = isFormPreviewReadonlyMode(interactionMode)
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
                >
                  <HorizontalTableCellText value={cellValue} placeholder="" variant="body" />
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {paragraph.showBottomText || paragraph.showBottomConsent ? (
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
              value={paragraph.bottomConsent ?? 'agree'}
              style={consentReadonly ? { pointerEvents: 'none' } : undefined}
            >
              <Radio value="agree">동의</Radio>
              <Radio value="disagree">동의하지 않음</Radio>
            </Radio.Group>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
