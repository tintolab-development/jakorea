import { useMemo, useState } from 'react'
import { DatePicker, Input, TimePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { VerticalTableParagraph, VerticalTableRow } from '@/features/template/model/writing-form-draft.schema'
import {
  DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER,
  normalizeVerticalTableParagraph,
  verticalTableHeaderPlaceholder,
} from '@/features/template/model/writing-form-draft.schema'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
import { DividerVertical } from '@/shared/components/divider-vertical'
import '@/features/template/ui/paragraph/single-item/vertical-table-paragraph-body.css'

dayjs.extend(customParseFormat)

function isEventFromTableInteractive(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.closest(
      [
        '.ant-input',
        '.ant-select',
        '.ant-select-selector',
        '.ant-picker',
        '.ant-picker-input',
        '.ant-checkbox',
        'input',
        'textarea',
        'label',
        'button',
        '.ant-radio',
      ].join(',')
    ) != null
  )
}

/** 텍스트형 세로 테이블 td 기본 안내(상수) */
const VERTICAL_TABLE_TEXT_CELL_PLACEHOLDER = DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER

const VT_DATE_PLACEHOLDER = '날짜를 선택해 주세요'
const VT_TIME_PLACEHOLDER = '시간을 선택해 주세요'

function verticalTableFieldPopupContainer(): HTMLElement {
  return document.body
}

const verticalTablePickerPopupStyles = {
  popup: {
    root: { minWidth: 300 },
  },
} as const

function toDayjs(mode: 'date' | 'time', raw: string): Dayjs | null {
  if (!raw?.trim()) return null
  if (mode === 'date') {
    const d = dayjs(raw, 'YYYY-MM-DD', true)
    return d.isValid() ? d : null
  }
  const d = dayjs(raw, 'HH:mm', true)
  return d.isValid() ? d : null
}

function fromDayjs(mode: 'date' | 'time', d: Dayjs | null): string {
  if (!d || !d.isValid()) return ''
  if (mode === 'date') return d.format('YYYY-MM-DD')
  return d.format('HH:mm')
}

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
        'form-editor-vertical-table__cell-text',
        variant === 'header'
          ? 'form-editor-vertical-table__cell-text--header'
          : 'form-editor-vertical-table__cell-text--body',
        !filled ? 'form-editor-vertical-table__cell-text--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {filled ? value : placeholder}
    </span>
  )
}

function replaceRowStage(
  rows: VerticalTableRow[],
  rowIdx: number,
  patch: (r: VerticalTableRow) => VerticalTableRow
): VerticalTableRow[] {
  return rows.map((r, i) => (i === rowIdx ? patch(r) : r))
}

export function VerticalTableParagraphBody({
  paragraph,
  onChange,
  isEditMode,
  tableRowSelection: controlledRow,
  onTableRowSelectionChange,
}: {
  paragraph: VerticalTableParagraph
  onChange: (next: VerticalTableParagraph) => void
  isEditMode: boolean
  /** 있으면 상위와 본문 행 선택 동기화(다른 위젯 th/td 선택 시 단일 포커스) */
  tableRowSelection?: number | null
  onTableRowSelectionChange?: (row: number | null) => void
}) {
  const p = useMemo(() => normalizeVerticalTableParagraph(paragraph), [paragraph])
  const [internalRow, setInternalRow] = useState<number | null>(null)
  const isControlled = onTableRowSelectionChange != null
  const selectedRow = isControlled ? (controlledRow ?? null) : internalRow
  const setSelectedRow = (next: number | null) => {
    if (isControlled) onTableRowSelectionChange(next)
    else setInternalRow(next)
  }

  const setHeader = (rowIdx: number, stageIdx: number, value: string) => {
    onChange({
      ...p,
      rows: replaceRowStage(p.rows, rowIdx, r => {
        if (r.stageCount === 1) {
          return { stageCount: 1, headers: [value], cells: r.cells, placeholderHints: r.placeholderHints }
        }
        const headers: [string, string] = [...r.headers]
        headers[stageIdx] = value
        const next: VerticalTableRow = {
          stageCount: 2,
          headers,
          cells: r.cells,
          placeholderHints: r.placeholderHints,
        }
        if (r.dateTimeStage1Time !== undefined) {
          next.dateTimeStage1Time = r.dateTimeStage1Time
        }
        return next
      }),
    })
  }

  const setCell = (rowIdx: number, stageIdx: number, value: string) => {
    onChange({
      ...p,
      rows: replaceRowStage(p.rows, rowIdx, r => {
        if (r.stageCount === 1) {
          return { stageCount: 1, headers: r.headers, cells: [value], placeholderHints: r.placeholderHints }
        }
        const cells: [string, string] = [...r.cells]
        cells[stageIdx] = value
        const next: VerticalTableRow = {
          stageCount: 2,
          headers: r.headers,
          cells,
          placeholderHints: r.placeholderHints,
        }
        if (r.dateTimeStage1Time !== undefined) {
          next.dateTimeStage1Time = r.dateTimeStage1Time
        }
        return next
      }),
    })
  }

  const setDateTimeStage1Time = (rowIdx: number, value: string) => {
    onChange({
      ...p,
      rows: replaceRowStage(p.rows, rowIdx, r => {
        if (r.stageCount !== 2) return r
        return { ...r, dateTimeStage1Time: value }
      }),
    })
  }

  const toggleRow = (rowIdx: number) => {
    setSelectedRow(selectedRow === rowIdx ? null : rowIdx)
  }

  const renderStage = (row: VerticalTableRow, rowIdx: number, stageIdx: number) => {
    const header = row.headers[stageIdx] ?? ''
    const cell = row.cells[stageIdx] ?? ''
    const hPh = verticalTableHeaderPlaceholder(rowIdx, stageIdx, row.stageCount)
    const hint = row.placeholderHints?.[stageIdx] ?? ''
    const cPh =
      p.verticalTableFlavor === 'subjective'
        ? hint.trim() !== ''
          ? hint
          : DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER
        : VERTICAL_TABLE_TEXT_CELL_PLACEHOLDER

    const isDateTime = p.verticalTableFlavor === 'date_time'
    const secondStageDatePh =
      row.stageCount === 2 && stageIdx === 1 && hint.trim() !== '' ? hint : VT_DATE_PLACEHOLDER

    const renderDateTimeBody = () => {
      if (!isDateTime) return null

      if (row.stageCount === 2 && stageIdx === 1) {
        const timeVal = row.dateTimeStage1Time ?? ''
        return (
          <div className="form-editor-vertical-table__dt-composite">
            <DatePicker
              key={`vt-dt-d-${rowIdx}-${stageIdx}`}
              rootClassName="form-editor-vertical-table__field-box form-editor-vertical-table__field-box--picker form-editor-vertical-table__dt-picker--fixed"
              className="form-editor-vertical-table__dt-picker-inner"
              needConfirm={false}
              inputReadOnly
              styles={verticalTablePickerPopupStyles}
              getPopupContainer={verticalTableFieldPopupContainer}
              value={toDayjs('date', cell)}
              onChange={isEditMode ? d => setCell(rowIdx, stageIdx, fromDayjs('date', d)) : undefined}
              onFocus={() => setSelectedRow(rowIdx)}
              format="YYYY-MM-DD"
              placeholder={secondStageDatePh}
              disabled={!isEditMode}
            />
            <div className="form-editor-vertical-table__dt-divider-wrap">
              <DividerVertical />
            </div>
            <TimePicker
              key={`vt-dt-t-${rowIdx}-${stageIdx}`}
              rootClassName="form-editor-vertical-table__field-box form-editor-vertical-table__field-box--picker form-editor-vertical-table__dt-picker--fixed"
              className="form-editor-vertical-table__dt-picker-inner"
              needConfirm={false}
              inputReadOnly
              styles={verticalTablePickerPopupStyles}
              getPopupContainer={verticalTableFieldPopupContainer}
              value={toDayjs('time', timeVal)}
              onChange={isEditMode ? d => setDateTimeStage1Time(rowIdx, fromDayjs('time', d)) : undefined}
              onFocus={() => setSelectedRow(rowIdx)}
              format="HH:mm"
              minuteStep={5}
              placeholder={VT_TIME_PLACEHOLDER}
              disabled={!isEditMode}
            />
          </div>
        )
      }

      return (
        <DatePicker
          key={`vt-dt-${rowIdx}-${stageIdx}`}
          rootClassName="form-editor-vertical-table__field-box form-editor-vertical-table__field-box--picker form-editor-vertical-table__dt-picker--full"
          className="form-editor-vertical-table__dt-picker-inner"
          needConfirm={false}
          inputReadOnly
          styles={verticalTablePickerPopupStyles}
          getPopupContainer={verticalTableFieldPopupContainer}
          value={toDayjs('date', cell)}
          onChange={isEditMode ? d => setCell(rowIdx, stageIdx, fromDayjs('date', d)) : undefined}
          onFocus={() => setSelectedRow(rowIdx)}
          format="YYYY-MM-DD"
          placeholder={VT_DATE_PLACEHOLDER}
          disabled={!isEditMode}
        />
      )
    }

    const subjectiveShell =
      p.verticalTableFlavor === 'subjective'
        ? 'form-editor-vertical-table__cell-input-shell--body-subjective'
        : ''

    return (
      <div key={`${rowIdx}-s-${stageIdx}`} className="form-editor-vertical-table__stage">
        <div
          className="form-editor-vertical-table__th"
          role="columnheader"
          onClick={e => {
            if (isEventFromTableInteractive(e.target)) return
            toggleRow(rowIdx)
          }}
        >
          {isEditMode ? (
            <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--header">
              <Input
                variant="borderless"
                value={header}
                placeholder={hPh}
                onChange={e => setHeader(rowIdx, stageIdx, e.target.value)}
                onFocus={() => setSelectedRow(rowIdx)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                }}
              />
            </div>
          ) : (
            <VerticalTableCellText value={header} placeholder={hPh} variant="header" />
          )}
        </div>
        <div
          className="form-editor-vertical-table__td"
          role="gridcell"
          onClick={e => {
            if (isEventFromTableInteractive(e.target)) return
            toggleRow(rowIdx)
          }}
        >
          {isDateTime ? (
            <div
              className={[
                'form-editor-vertical-table__cell-input-shell',
                'form-editor-vertical-table__cell-input-shell--body',
                row.stageCount === 2 && stageIdx === 1
                  ? 'form-editor-vertical-table__cell-input-shell--body-dt-composite'
                  : 'form-editor-vertical-table__cell-input-shell--body-dt-full',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              {renderDateTimeBody()}
            </div>
          ) : isEditMode ? (
            <div
              className={[
                'form-editor-vertical-table__cell-input-shell',
                'form-editor-vertical-table__cell-input-shell--body',
                subjectiveShell,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Input
                variant="borderless"
                value={cell}
                placeholder={cPh}
                onChange={e => setCell(rowIdx, stageIdx, e.target.value)}
                onFocus={() => setSelectedRow(rowIdx)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                }}
              />
            </div>
          ) : (
            <>
              {p.verticalTableFlavor === 'subjective' ? (
                <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body form-editor-vertical-table__cell-input-shell--body-subjective">
                  <VerticalTableCellText value={cell} placeholder={cPh} variant="body" />
                </div>
              ) : (
                <VerticalTableCellText value={cell} placeholder={cPh} variant="body" />
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="form-editor-body form-editor-vertical-table-wrap">
      <div className="form-editor-vertical-table" role="grid" aria-readonly={!isEditMode}>
        {p.rows.map((row, rowIdx) => (
          <div
            key={`vr-${rowIdx}-sc${row.stageCount}`}
            className={[
              'form-editor-vertical-table__row',
              selectedRow === rowIdx ? 'form-editor-vertical-table__row--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="row"
            aria-selected={selectedRow === rowIdx}
          >
            {row.stageCount === 1
              ? renderStage(row, rowIdx, 0)
              : [0, 1].map(si => renderStage(row, rowIdx, si))}
          </div>
        ))}
      </div>

      {p.showBottomText ? (
        <div className="form-editor-vertical-table__bottom">
          <ParagraphInput
            type="description"
            className="form-editor-vertical-table__bottom-input"
            value={p.bottomText}
            isEditMode={isEditMode}
            onChange={next => onChange({ ...p, bottomText: next })}
            placeholder="설명을 입력해 주세요"
          />
        </div>
      ) : null}
    </div>
  )
}
