import { useMemo, useState } from 'react'
import { Input } from 'antd'
import type { VerticalTableParagraph, VerticalTableRow } from '@/features/template/model/writing-form-draft.schema'
import {
  normalizeVerticalTableParagraph,
  verticalTableHeaderPlaceholder,
} from '@/features/template/model/writing-form-draft.schema'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
import '@/features/template/ui/paragraph/single-item/vertical-table-paragraph-body.css'

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

const VERTICAL_TABLE_CELL_PLACEHOLDER = '내용을 입력해 주세요'

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
          return { stageCount: 1, headers: [value], cells: r.cells }
        }
        const headers: [string, string] = [...r.headers]
        headers[stageIdx] = value
        return { stageCount: 2, headers, cells: r.cells }
      }),
    })
  }

  const setCell = (rowIdx: number, stageIdx: number, value: string) => {
    onChange({
      ...p,
      rows: replaceRowStage(p.rows, rowIdx, r => {
        if (r.stageCount === 1) {
          return { stageCount: 1, headers: r.headers, cells: [value] }
        }
        const cells: [string, string] = [...r.cells]
        cells[stageIdx] = value
        return { stageCount: 2, headers: r.headers, cells }
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
    const cPh = VERTICAL_TABLE_CELL_PLACEHOLDER

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
          {isEditMode ? (
            <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
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
            <VerticalTableCellText value={cell} placeholder={cPh} variant="body" />
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
