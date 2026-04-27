import { useEffect, useState } from 'react'
import { DatePicker, Form, message, TimePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import type {
  HorizontalTableColumnField,
  HorizontalTableFieldColumnKind,
  HorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  HORIZONTAL_TABLE_MIN_COLUMN_COUNT,
  defaultFieldForColumnKind,
  horizontalTableRemoveColumn,
  horizontalTableRemoveRow,
  horizontalTableUpdateColumnField,
  normalizeHorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorHorizontalTableBodyRowDeleteIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-body-row-delete-icon'
import { FormEditorHorizontalTableOptionAddIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-option-add-icon'
import { FormEditorHorizontalTableHintXIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-hint-x-icon'
import { FormEditorHorizontalTableHeaderDeleteIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-header-delete-icon'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'

/** 우측 패널·캔버스와 동일 — `placeholder`가 비어 있을 때만 모드별 기본 */
function dateTimeFieldPlaceholder(
  field: Extract<HorizontalTableColumnField, { kind: 'dateTime' }>
): string {
  const t = field.placeholder?.trim() ?? ''
  if (t.length > 0) return field.placeholder
  if (field.dateTimeMode === 'date') return '날짜를 선택해 주세요'
  if (field.dateTimeMode === 'time') return '시간을 선택해 주세요'
  return '날짜·시간을 선택해 주세요'
}

const horizontalTableCustomFieldPickerStyles = {
  popup: { root: { minWidth: 300 } },
} as const

/** 날짜+시간: 캘린더+시간 열이 함께 보이도록 팝업 폭 확보 */
const horizontalTableDateTimePickerStyles = {
  popup: { root: { minWidth: 560 } },
} as const

const horizontalTableDateTimeShowTime = {
  format: 'HH:mm',
  minuteStep: 5,
} as const

function horizontalTableBodyFieldsPickerContainer(): HTMLElement {
  return document.body
}

/** 커스텀 필드 — 날짜/시간 유형에 맞는 피커 UI(미리보기, 초안과 무관한 로컬 값) */
function DateTimeColumnPickerPreview({
  field,
}: {
  field: Extract<HorizontalTableColumnField, { kind: 'dateTime' }>
}) {
  const [value, setValue] = useState<Dayjs | null>(null)
  const ph = dateTimeFieldPlaceholder(field)

  useEffect(() => {
    setValue(null)
  }, [field.dateTimeMode])

  const common = {
    needConfirm: false as const,
    styles: horizontalTableCustomFieldPickerStyles,
    getPopupContainer: horizontalTableBodyFieldsPickerContainer,
    value,
    onChange: setValue,
    placeholder: ph,
  }

  if (field.dateTimeMode === 'time') {
    return (
      <TimePicker
        {...common}
        rootClassName="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--picker"
        className="form-editor-horizontal-table__field-time"
        format="HH:mm"
        minuteStep={5}
      />
    )
  }
  if (field.dateTimeMode === 'date') {
    return (
      <DatePicker
        {...common}
        rootClassName="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--picker"
        className="form-editor-horizontal-table__field-date"
        format="YYYY-MM-DD"
      />
    )
  }
  return (
    <DatePicker
      {...common}
      styles={horizontalTableDateTimePickerStyles}
      showTime={horizontalTableDateTimeShowTime}
      rootClassName="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--picker"
      className="form-editor-horizontal-table__field-datetime"
      format="YYYY-MM-DD HH:mm"
    />
  )
}

const TEXT_TYPE_OPTIONS = [{ value: 'text', label: '텍스트형' }]

const FIELD_TYPE_OPTIONS: { value: HorizontalTableFieldColumnKind; label: string }[] = [
  { value: 'subjective', label: '주관식형' },
  { value: 'dropdown', label: '드롭다운형' },
  { value: 'dateTime', label: '날짜/시간형' },
  { value: 'single', label: '단일선택형' },
  { value: 'multiple', label: '다중선택형' },
]

const OPTION_LIST_MIN_DEFAULT = 1

function OptionListEditor({
  values,
  onChange,
  addLabel = '항목 추가',
  addButtonIcon = true,
  maxOptions,
  minOptions = OPTION_LIST_MIN_DEFAULT,
}: {
  values: string[]
  onChange: (next: string[]) => void
  addLabel?: string
  /** `false`이면 라벨의 `+`만 사용(예: `+ 항목 추가`) */
  addButtonIcon?: boolean
  /** 지정 시 `항목 추가`로 늘릴 수 있는 옵션 개수 상한(단일·다중 선택) */
  maxOptions?: number
  /** 행 삭제로 유지할 최소 항목 수 */
  minOptions?: number
}) {
  const atMax = maxOptions != null && values.length >= maxOptions
  const canRemoveRow = values.length > minOptions
  const add = () => {
    if (atMax) {
      message.warning(`선택지는 최대 ${maxOptions}개까지 추가할 수 있습니다.`)
      return
    }
    onChange([...values, ''])
  }
  const remove = (i: number) => {
    if (!canRemoveRow) {
      message.warning(`항목은 최소 ${minOptions}개 이상 유지해야 합니다.`)
      return
    }
    onChange(values.filter((_, j) => j !== i))
  }
  return (
    <ul className="form-editor-horizontal-table-body-fields__option-list">
      {values.map((v, oi) => (
        <li key={oi} className="form-editor-horizontal-table-body-fields__option-row">
          <div className="form-editor-horizontal-table-body-fields__option-type-row">
            <div className="form-editor-horizontal-table-body-fields__option-input-wrap">
              <span className="form-editor-horizontal-table-body-fields__option-index" aria-hidden>
                {oi + 1}.
              </span>
              <CmsInput
                className="form-editor-horizontal-table-body-fields__option-cms-input"
                width="100%"
                inputSize="large"
                value={v}
                onChange={e => {
                  const next = [...values]
                  next[oi] = e.target.value
                  onChange(next)
                }}
                placeholder="옵션"
              />
            </div>
            <button
              type="button"
              className="form-editor-horizontal-table-body-fields__cell-clear"
              disabled={!canRemoveRow}
              aria-label={`${oi + 1}번 항목 삭제`}
              onClick={e => {
                e.stopPropagation()
                remove(oi)
              }}
            >
              <FormEditorHorizontalTableHeaderDeleteIcon />
            </button>
          </div>
        </li>
      ))}
      <li>
        <CmsButton
          type="button"
          variant="secondary"
          size="medium"
          className="form-editor-horizontal-table-body-fields__option-add"
          icon={addButtonIcon ? <FormEditorHorizontalTableOptionAddIcon /> : undefined}
          disabled={atMax}
          onClick={add}
        >
          {addLabel}
        </CmsButton>
      </li>
    </ul>
  )
}

function TextModeBodyFieldItem({
  cell,
  colIdx,
  rowIndex,
  paragraphId,
  updateParagraph,
  removeColumn,
  colCount,
}: {
  cell: string
  colIdx: number
  rowIndex: number
  paragraphId: string
  updateParagraph: FormUpdateParagraph
  removeColumn: (i: number) => void
  colCount: number
}) {
  return (
    <li key={`body-${rowIndex}-${colIdx}`} className="form-editor-horizontal-table-body-fields__item">
      <div className="form-editor-horizontal-table-body-fields__cell-title">
        {colIdx + 1}-{rowIndex + 1}. 항목
      </div>
      <div className="form-editor-horizontal-table-body-fields__type-row">
        <div className="form-editor-horizontal-table-body-fields__select-wrap">
          <CmsSelect
            className="form-editor-horizontal-table-body-fields__cms-select"
            inputSize="large"
            width="100%"
            value="text"
            options={TEXT_TYPE_OPTIONS}
            disabled
            withAllOption={false}
          />
        </div>
        {colCount > HORIZONTAL_TABLE_MIN_COLUMN_COUNT ? (
          <button
            type="button"
            className="form-editor-horizontal-table-body-fields__cell-clear"
            aria-label={`${colIdx + 1}열 삭제`}
            onClick={e => {
              e.stopPropagation()
              removeColumn(colIdx)
            }}
          >
            <FormEditorHorizontalTableHeaderDeleteIcon />
          </button>
        ) : null}
      </div>
      <Form.Item
        className="form-editor-horizontal-table-body-fields__content-form-item"
        label="작성 내용"
      >
        <CmsInput
          width="100%"
          inputSize="large"
          className="form-editor-horizontal-table-body-fields__content-input"
          value={cell}
          onChange={e => {
            const v = e.target.value
            updateParagraph(paragraphId, cur => {
              if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
              const nextRows = cur.dataRows.map(r => [...r])
              const row = [...(nextRows[rowIndex] ?? [])]
              while (row.length <= colIdx) row.push('')
              row[colIdx] = v
              nextRows[rowIndex] = row
              return { ...cur, dataRows: nextRows }
            })
          }}
          placeholder={HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER}
        />
      </Form.Item>
    </li>
  )
}

function FieldModeConfigBlock({
  field,
  colIdx,
  rowIndex,
  paragraphId,
  updateParagraph,
  removeColumn,
  colCount,
}: {
  field: HorizontalTableColumnField
  colIdx: number
  rowIndex: number
  paragraphId: string
  updateParagraph: FormUpdateParagraph
  removeColumn: (i: number) => void
  colCount: number
}) {
  const setColumnField = (next: HorizontalTableColumnField) => {
    updateParagraph(paragraphId, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
      return horizontalTableUpdateColumnField(cur, colIdx, next)
    })
  }

  return (
    <li key={`body-field-${rowIndex}-${colIdx}`} className="form-editor-horizontal-table-body-fields__item">
      <div className="form-editor-horizontal-table-body-fields__cell-title">
        {colIdx + 1}-{rowIndex + 1}. 항목
      </div>
      <div className="form-editor-horizontal-table-body-fields__type-row">
        <div className="form-editor-horizontal-table-body-fields__select-wrap">
          <CmsSelect
            className="form-editor-horizontal-table-body-fields__cms-select"
            inputSize="large"
            width="100%"
            value={field.kind}
            options={FIELD_TYPE_OPTIONS}
            onChange={v => {
              setColumnField(
                defaultFieldForColumnKind(v as HorizontalTableFieldColumnKind)
              )
            }}
            withAllOption={false}
          />
        </div>
        {colCount > HORIZONTAL_TABLE_MIN_COLUMN_COUNT ? (
          <button
            type="button"
            className="form-editor-horizontal-table-body-fields__cell-clear"
            aria-label={`${colIdx + 1}열 삭제`}
            onClick={e => {
              e.stopPropagation()
              removeColumn(colIdx)
            }}
          >
            <FormEditorHorizontalTableHeaderDeleteIcon />
          </button>
        ) : null}
      </div>

      {field.kind === 'subjective' ? (
        <Form.Item className="form-editor-horizontal-table-body-fields__content-form-item" label="입력창 안내 텍스트">
          <CmsInput
            width="100%"
            inputSize="large"
            value={field.placeholder}
            onChange={e => setColumnField({ kind: 'subjective', placeholder: e.target.value })}
            placeholder={HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER}
          />
        </Form.Item>
      ) : null}

      {field.kind === 'dropdown' ? (
        <>
          <Form.Item className="form-editor-horizontal-table-body-fields__content-form-item" label="입력창 안내 텍스트">
            <CmsInput
              width="100%"
              inputSize="large"
              value={field.placeholder}
              onChange={e => setColumnField({ ...field, placeholder: e.target.value })}
              placeholder={HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER}
            />
          </Form.Item>
          <Form.Item className="form-editor-horizontal-table-body-fields__content-form-item" label="드롭다운 옵션">
            <OptionListEditor
              values={field.options}
              onChange={options => setColumnField({ ...field, options })}
              addLabel="+ 항목 추가"
              addButtonIcon={false}
            />
          </Form.Item>
        </>
      ) : null}

      {field.kind === 'dateTime' ? (
        <>
          <Form.Item className="form-editor-horizontal-table-body-fields__content-form-item" label="유형">
            <CmsRadioGroup
              value={field.dateTimeMode}
              onChange={e => {
                const v = e.target.value as 'date' | 'time' | 'dateTime'
                setColumnField({ ...field, dateTimeMode: v })
              }}
            >
              <CmsRadio value="date">날짜</CmsRadio>
              <CmsRadio value="time">시간</CmsRadio>
              <CmsRadio value="dateTime">날짜+시간</CmsRadio>
            </CmsRadioGroup>
          </Form.Item>
          <Form.Item className="form-editor-horizontal-table-body-fields__content-form-item" label="입력 미리보기">
            <div
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            >
              <DateTimeColumnPickerPreview field={field} />
            </div>
          </Form.Item>
          <Form.Item className="form-editor-horizontal-table-body-fields__content-form-item" label="입력창 안내 텍스트">
            <CmsInput
              width="100%"
              inputSize="large"
              value={field.placeholder}
              onChange={e => setColumnField({ ...field, placeholder: e.target.value })}
              placeholder={HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER}
            />
          </Form.Item>
        </>
      ) : null}

      {(field.kind === 'single' || field.kind === 'multiple') && (
        <OptionListEditor
          values={field.options}
          onChange={options => {
            if (field.kind === 'single') {
              setColumnField({ kind: 'single', options })
            } else {
              setColumnField({ kind: 'multiple', options })
            }
          }}
          addLabel="+ 항목 추가"
          addButtonIcon={false}
        />
      )}
    </li>
  )
}

export function FormEditorHorizontalTableBodyFields({
  paragraph,
  paragraphId,
  rowIndex,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraph: HorizontalTableParagraph
  paragraphId: string
  rowIndex: number
  updateParagraph: FormUpdateParagraph
  /** 삭제 후 포커스할 데이터 행 인덱스(이전 행, 삭제 행이 0이면 0) */
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  const p = normalizeHorizontalTableParagraph(paragraph)
  const colCount = Math.max(1, p.columnHeaders.length)
  const rows = p.dataRows.map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  if (rows.length === 0) {
    rows.push(Array.from({ length: colCount }, () => ''))
  }
  const cells = rows[rowIndex] ?? Array.from({ length: colCount }, () => '')
  const fieldCols = p.columnFields

  const deleteRow = () => {
    let removed = false
    updateParagraph(paragraphId, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
      const next = horizontalTableRemoveRow(cur, rowIndex)
      if (next == null) {
        message.warning('데이터 행은 최소 1개 이상 유지해야 합니다.')
        return cur
      }
      removed = true
      return next
    })
    if (removed) onBodyRowDeleted?.(Math.max(0, rowIndex - 1))
  }

  const removeColumn = (columnIndex: number) => {
    updateParagraph(paragraphId, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
      const next = horizontalTableRemoveColumn(cur, columnIndex)
      if (next == null) {
        message.warning(
          `열은 최소 ${HORIZONTAL_TABLE_MIN_COLUMN_COUNT}개 이상 유지해야 합니다.`
        )
        return cur
      }
      return next
    })
  }

  const isFieldFlavor = p.tableFlavor === 'field'
  const bodyPanelTitle = isFieldFlavor
    ? '테이블_가로형(필드형)_항목 선택 시'
    : '테이블_가로형_항목 선택 시 (바디)'

  return (
    <div className="form-editor-horizontal-table-body-fields">
      <h3 className="form-editor-horizontal-table-body-fields__title">{bodyPanelTitle}</h3>
      <button
        type="button"
        className="form-editor-horizontal-table-body-fields__row-delete"
        onClick={e => {
          e.stopPropagation()
          deleteRow()
        }}
      >
        <FormEditorHorizontalTableBodyRowDeleteIcon />
        <span className="form-editor-horizontal-table-body-fields__row-delete-label">행 삭제</span>
      </button>
      <div className="form-editor-horizontal-table-body-fields__hint">
        <span className="form-editor-horizontal-table-body-fields__hint-mark" aria-hidden>
          *
        </span>
        <div className="form-editor-horizontal-table-body-fields__hint-body">
          <p className="form-editor-horizontal-table-body-fields__hint-line">
            <span>항목 옆</span>
            <span
              className="form-editor-horizontal-table-body-fields__hint-x-inline"
              aria-hidden
            >
              <FormEditorHorizontalTableHintXIcon />
            </span>
            는 동일 열을, [행 삭제]는 선택 행을 삭제합니다.
          </p>
        </div>
      </div>
      <ul className="form-editor-horizontal-table-body-fields__list">
        {p.tableFlavor === 'text'
          ? cells.map((cell, colIdx) => (
              <TextModeBodyFieldItem
                key={`text-body-${rowIndex}-${colIdx}`}
                cell={cell}
                colIdx={colIdx}
                rowIndex={rowIndex}
                paragraphId={paragraphId}
                updateParagraph={updateParagraph}
                removeColumn={removeColumn}
                colCount={colCount}
              />
            ))
          : Array.from({ length: colCount }, (_, colIdx) => {
              const field = fieldCols[colIdx] ?? defaultFieldForColumnKind('subjective')
              return (
                <FieldModeConfigBlock
                  key={`field-body-${rowIndex}-${colIdx}`}
                  field={field}
                  colIdx={colIdx}
                  rowIndex={rowIndex}
                  paragraphId={paragraphId}
                  updateParagraph={updateParagraph}
                  removeColumn={removeColumn}
                  colCount={colCount}
                />
              )
            })}
      </ul>
    </div>
  )
}
