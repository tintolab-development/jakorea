import { Checkbox, Input, Radio } from 'antd'
import type { ParagraphBodyInteractionMode } from '@jakorea/form-schema/surface'
import { isFormPreviewReadonlyMode } from '@jakorea/form-schema/surface'
import {
  SHORT_ESSAY_MAX_LENGTH,
  type TableBottomConsent,
  type VerticalTableParagraph,
} from '@jakorea/form-schema/writing-form'
import {
  resolveVerticalTablePreviewLayout,
  type VerticalTablePreviewStage,
} from './vertical-table-preview.js'
import './vertical-table-preview.css'

function VerticalTableCellText({
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
        'form-template-vertical-table__cell-text',
        variant === 'header'
          ? 'form-template-vertical-table__cell-text--header'
          : 'form-template-vertical-table__cell-text--body',
        !filled ? 'form-template-vertical-table__cell-text--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {filled ? value : placeholder}
    </span>
  )
}

const VERTICAL_TABLE_FILE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

function VerticalTableFileCell({
  fileNames,
  disabled,
  onFileNamesChange,
}: {
  fileNames: string[]
  disabled: boolean
  onFileNamesChange?: (next: string[]) => void
}) {
  if (disabled && fileNames.length === 0) {
    return <VerticalTableCellText value="" placeholder="파일을 첨부해 주세요" variant="body" />
  }

  return (
    <div className="form-template-vertical-table__file">
      {disabled ? null : (
        <div className="form-template-vertical-table__file-content">
          <label className="form-template-vertical-table__file-trigger">
            파일 선택
            <input
              className="form-template-vertical-table__file-input"
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              disabled={disabled}
              onChange={event => {
                const selected = Array.from(event.target.files ?? []).map(file => file.name)
                if (selected.length === 0) return
                onFileNamesChange?.([...fileNames, ...selected])
                event.target.value = ''
              }}
            />
          </label>
          <div className="form-template-vertical-table__file-guide">
            {VERTICAL_TABLE_FILE_GUIDE_LINES.map(line => (
              <span key={line} className="form-template-vertical-table__file-guide-line">
                {line}
              </span>
            ))}
          </div>
        </div>
      )}
      {fileNames.length > 0 ? (
        <ul className="form-template-vertical-table__file-list">
          {fileNames.map((name, index) => (
            <li key={`${name}-${index}`} className="form-template-vertical-table__file-item">
              <span>{name}</span>
              {disabled ? null : (
                <button
                  type="button"
                  className="form-template-vertical-table__file-remove"
                  onClick={() =>
                    onFileNamesChange?.(fileNames.filter((_, current) => current !== index))
                  }
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function VerticalTableStageBody({
  stage,
  choiceOptions,
  interactive,
  onCellChange,
  onCompositeTimeChange,
  onMultipleChoiceChange,
  onFileNamesChange,
}: {
  stage: VerticalTablePreviewStage
  choiceOptions: string[]
  interactive: boolean
  onCellChange?: (value: string) => void
  onCompositeTimeChange?: (value: string) => void
  onMultipleChoiceChange?: (values: string[]) => void
  onFileNamesChange?: (names: string[]) => void
}) {
  if (stage.kind === 'file_attachment') {
    return (
      <VerticalTableFileCell
        fileNames={stage.fileNames}
        disabled={!interactive}
        onFileNamesChange={onFileNamesChange}
      />
    )
  }

  if (stage.kind === 'date' || stage.kind === 'time' || stage.kind === 'date_time') {
    const mode =
      stage.kind === 'time'
        ? 'time'
        : stage.kind === 'date'
          ? 'date'
          : (stage.dateTimeMode ?? 'date')
    if (!interactive) {
      const display =
        mode === 'date_time'
          ? [stage.cell, stage.compositeTime].filter(part => part.trim()).join(' ')
          : stage.cell
      return <VerticalTableCellText value={display} placeholder={stage.cellPlaceholder} variant="body" />
    }
    if (mode === 'time') {
      return (
        <input
          className="form-template-vertical-table__dt-native"
          type="time"
          value={stage.cell}
          aria-label={stage.cellPlaceholder}
          onChange={event => onCellChange?.(event.target.value)}
        />
      )
    }
    if (mode === 'date_time') {
      return (
        <div className="form-template-vertical-table__dt">
          <input
            className="form-template-vertical-table__dt-native"
            type="date"
            value={stage.cell}
            aria-label={stage.cellPlaceholder}
            onChange={event => onCellChange?.(event.target.value)}
          />
          <span className="form-template-vertical-table__dt-divider" aria-hidden />
          <input
            className="form-template-vertical-table__dt-native"
            type="time"
            value={stage.compositeTime}
            aria-label={stage.compositeTimeHint}
            onChange={event => onCompositeTimeChange?.(event.target.value)}
          />
        </div>
      )
    }
    return (
      <input
        className="form-template-vertical-table__dt-native"
        type="date"
        value={stage.cell}
        aria-label={stage.cellPlaceholder}
        onChange={event => onCellChange?.(event.target.value)}
      />
    )
  }

  if (stage.kind === 'single_choice') {
    if (!interactive) {
      return <VerticalTableCellText value={stage.cell} placeholder="" variant="body" />
    }
    return (
      <Radio.Group
        className="form-template-vertical-table__choice app-radio-group app-radio-group--large"
        size="large"
        value={stage.cell.trim() !== '' ? stage.cell : undefined}
        onChange={event => onCellChange?.(String(event.target.value))}
      >
        {choiceOptions.map(option => (
          <Radio key={option} value={option}>
            {option}
          </Radio>
        ))}
      </Radio.Group>
    )
  }

  if (stage.kind === 'multiple_choice') {
    if (!interactive) {
      return (
        <VerticalTableCellText value={stage.multipleSelected.join(', ')} placeholder="" variant="body" />
      )
    }
    return (
      <div className="form-template-vertical-table__choice">
        {choiceOptions.map(option => (
          <Checkbox
            key={option}
            checked={stage.multipleSelected.includes(option)}
            onChange={event => {
              const next = new Set(stage.multipleSelected)
              if (event.target.checked) next.add(option)
              else next.delete(option)
              onMultipleChoiceChange?.([...next])
            }}
          >
            {option}
          </Checkbox>
        ))}
      </div>
    )
  }

  if (stage.kind === 'subjective' && interactive) {
    return (
      <Input
        className="form-template-vertical-table__td-input"
        size="large"
        value={stage.cell}
        placeholder={stage.cellPlaceholder}
        maxLength={SHORT_ESSAY_MAX_LENGTH}
        onChange={event => onCellChange?.(event.target.value)}
      />
    )
  }

  return (
    <VerticalTableCellText value={stage.cell} placeholder={interactive ? stage.cellPlaceholder : ''} variant="body" />
  )
}

export type VerticalTablePreviewBodyProps = {
  paragraph: VerticalTableParagraph
  interactionMode: ParagraphBodyInteractionMode
  onBottomConsentChange?: (value: TableBottomConsent) => void
  onCellChange?: (rowIndex: number, stageIndex: number, value: string) => void
  onCompositeTimeChange?: (rowIndex: number, stageIndex: number, value: string) => void
  onMultipleChoiceChange?: (rowIndex: number, stageIndex: number, values: string[]) => void
  onFileNamesChange?: (rowIndex: number, stageIndex: number, fileNames: string[]) => void
}

export function VerticalTablePreviewBody({
  paragraph,
  interactionMode,
  onBottomConsentChange,
  onCellChange,
  onCompositeTimeChange,
  onMultipleChoiceChange,
  onFileNamesChange,
}: VerticalTablePreviewBodyProps) {
  const { paragraph: normalized, choiceOptions, rows } = resolveVerticalTablePreviewLayout(paragraph)
  const readonly = isFormPreviewReadonlyMode(interactionMode)
  const fillEnabled = !readonly && onCellChange != null
  const consentReadonly = readonly || onBottomConsentChange == null

  return (
    <div className="form-template-vertical-table-wrap">
      <div className="form-template-vertical-table" role="grid" aria-readonly={readonly}>
        {rows.map((row, rowIndex) => (
          <div key={`vr-${rowIndex}-sc${row.stageCount}`} className="form-template-vertical-table__row" role="row">
            {row.stages.map((stage, stageIndex) => (
              <div key={`${rowIndex}-s-${stageIndex}`} className="form-template-vertical-table__stage">
                <div className="form-template-vertical-table__th" role="columnheader">
                  <VerticalTableCellText
                    value={stage.header}
                    placeholder={stage.headerPlaceholder}
                    variant="header"
                  />
                </div>
                <div
                  className={[
                    'form-template-vertical-table__td',
                    stage.kind === 'file_attachment' ? 'form-template-vertical-table__td--file' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="gridcell"
                >
                  <VerticalTableStageBody
                    stage={stage}
                    choiceOptions={choiceOptions}
                    interactive={fillEnabled}
                    onCellChange={value => onCellChange?.(rowIndex, stageIndex, value)}
                    onCompositeTimeChange={value =>
                      onCompositeTimeChange?.(rowIndex, stageIndex, value)
                    }
                    onMultipleChoiceChange={values =>
                      onMultipleChoiceChange?.(rowIndex, stageIndex, values)
                    }
                    onFileNamesChange={names => onFileNamesChange?.(rowIndex, stageIndex, names)}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {normalized.showBottomText || normalized.showBottomConsent ? (
        <div className="form-template-vertical-table__bottom">
          {normalized.showBottomText && normalized.bottomText ? (
            <div className="form-template-vertical-table__bottom-static">{normalized.bottomText}</div>
          ) : null}
          {normalized.showBottomConsent ? (
            <Radio.Group
              className="form-template-table-bottom-consent app-radio-group app-radio-group--large"
              size="large"
              value={normalized.bottomConsent ?? undefined}
              style={consentReadonly ? { pointerEvents: 'none' } : undefined}
              onChange={event => onBottomConsentChange?.(event.target.value as TableBottomConsent)}
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
