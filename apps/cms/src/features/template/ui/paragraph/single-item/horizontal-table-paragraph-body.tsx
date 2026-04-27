import { useMemo, useState } from 'react'
import { Input } from 'antd'
import type {
  HorizontalTableParagraph,
  HorizontalTableRowSelection,
} from '@/features/template/model/writing-form-draft.schema'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
import '@/features/template/ui/form-editor/form-editor.css'

/** 캔버스 테이블 셀 전용 — 우측 커스텀 필드는 비번호 고정 문구 유지 */
function tableHeaderPlaceholder(colIndex: number) {
  return `${colIndex + 1}. 항목명을 입력해 주세요`
}

function tableCellPlaceholder(colIndex: number, rowIndex: number) {
  return `${colIndex + 1}-${rowIndex + 1}. 내용을 입력해 주세요`
}

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
        'form-editor-horizontal-table__cell-text',
        variant === 'header'
          ? 'form-editor-horizontal-table__cell-text--header'
          : 'form-editor-horizontal-table__cell-text--body',
        !filled ? 'form-editor-horizontal-table__cell-text--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {filled ? value : placeholder}
    </span>
  )
}

function isEventFromTableCellInput(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('.ant-input') != null
}

export function HorizontalTableParagraphBody({
  paragraph,
  onChange,
  isEditMode,
  tableRowSelection: controlledSelection,
  onTableRowSelectionChange,
}: {
  paragraph: HorizontalTableParagraph
  onChange: (next: HorizontalTableParagraph) => void
  isEditMode: boolean
  /** 있으면 상위(우측 패널)와 행 선택 동기화 */
  tableRowSelection?: HorizontalTableRowSelection | null
  onTableRowSelectionChange?: (next: HorizontalTableRowSelection | null) => void
}) {
  const [internalSelection, setInternalSelection] = useState<HorizontalTableRowSelection | null>(null)
  const isControlled = onTableRowSelectionChange != null
  const selection = isControlled ? (controlledSelection ?? null) : internalSelection
  const setSelection = (next: HorizontalTableRowSelection | null) => {
    if (isControlled) onTableRowSelectionChange(next)
    else setInternalSelection(next)
  }

  const colCount = Math.max(1, paragraph.columnHeaders.length)
  const headers = paragraph.columnHeaders.slice(0, colCount)
  while (headers.length < colCount) headers.push('')

  const rows = paragraph.dataRows.map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  if (rows.length === 0) {
    rows.push(Array.from({ length: colCount }, () => ''))
  }

  const activeSelection = useMemo((): HorizontalTableRowSelection | null => {
    if (selection == null) return null
    if (selection.area === 'header') return selection
    if (selection.row < 0 || selection.row >= rows.length) return null
    return selection
  }, [selection, rows.length])

  const isHeaderRowSelected = () => activeSelection?.area === 'header'
  const isBodyRowSelected = (rowIdx: number) =>
    activeSelection?.area === 'body' && activeSelection.row === rowIdx

  const toggleHeaderRow = () => {
    setSelection(activeSelection?.area === 'header' ? null : { area: 'header' })
  }
  const toggleBodyRow = (rowIdx: number) => {
    setSelection(
      activeSelection?.area === 'body' && activeSelection.row === rowIdx
        ? null
        : { area: 'body', row: rowIdx }
    )
  }

  const setHeaderValue = (col: number, value: string) => {
    const next = [...paragraph.columnHeaders]
    while (next.length < colCount) next.push('')
    const slice = next.slice(0, colCount)
    slice[col] = value
    onChange({ ...paragraph, columnHeaders: slice })
  }

  const setCellValue = (rowIdx: number, colIdx: number, value: string) => {
    const nextRows = paragraph.dataRows.map(r => [...r])
    const row = [...(nextRows[rowIdx] ?? [])]
    while (row.length <= colIdx) row.push('')
    row[colIdx] = value
    nextRows[rowIdx] = row
    onChange({ ...paragraph, dataRows: nextRows })
  }

  return (
    <div className="form-editor-body form-editor-horizontal-table-wrap">
      <div
        className="form-editor-horizontal-table"
        role="grid"
        aria-readonly={!isEditMode}
      >
        <div
          className={[
            'form-editor-horizontal-table__row',
            'form-editor-horizontal-table__row--header',
            isHeaderRowSelected() ? 'form-editor-horizontal-table__row--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="row"
          aria-selected={isHeaderRowSelected()}
        >
          {headers.map((h, i) => (
            <div
              key={`h-${i}`}
              className="form-editor-horizontal-table__th"
              role="columnheader"
              onClick={e => {
                if (isEventFromTableCellInput(e.target)) return
                toggleHeaderRow()
              }}
            >
              {isEditMode ? (
                <div className="form-editor-horizontal-table__cell-input-shell form-editor-horizontal-table__cell-input-shell--header">
                  <Input
                    variant="borderless"
                    value={h ?? ''}
                    placeholder={tableHeaderPlaceholder(i)}
                    onChange={e => setHeaderValue(i, e.target.value)}
                    onFocus={() => setSelection({ area: 'header' })}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                    }}
                  />
                </div>
              ) : (
                <HorizontalTableCellText
                  value={h ?? ''}
                  placeholder={tableHeaderPlaceholder(i)}
                  variant="header"
                />
              )}
            </div>
          ))}
        </div>
        {rows.map((cells, rowIdx) => (
          <div
            key={`r-${rowIdx}`}
            className={[
              'form-editor-horizontal-table__row',
              isBodyRowSelected(rowIdx) ? 'form-editor-horizontal-table__row--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="row"
            aria-selected={isBodyRowSelected(rowIdx)}
          >
            {cells.map((cell, colIdx) => (
              <div
                key={`c-${rowIdx}-${colIdx}`}
                className="form-editor-horizontal-table__td"
                role="gridcell"
                onClick={e => {
                  if (isEventFromTableCellInput(e.target)) return
                  toggleBodyRow(rowIdx)
                }}
              >
                {isEditMode ? (
                  <div className="form-editor-horizontal-table__cell-input-shell form-editor-horizontal-table__cell-input-shell--body">
                    <Input
                      variant="borderless"
                      value={cell}
                      placeholder={tableCellPlaceholder(colIdx, rowIdx)}
                      onChange={e => setCellValue(rowIdx, colIdx, e.target.value)}
                      onFocus={() => setSelection({ area: 'body', row: rowIdx })}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                      }}
                    />
                  </div>
                ) : (
                  <HorizontalTableCellText
                    value={cell}
                    placeholder={tableCellPlaceholder(colIdx, rowIdx)}
                    variant="body"
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {paragraph.showBottomText ? (
        <div className="form-editor-horizontal-table__bottom">
          <ParagraphInput
            type="description"
            className="form-editor-horizontal-table__bottom-input"
            value={paragraph.bottomText}
            isEditMode={false}
            placeholder="설명을 입력해 주세요"
          />
        </div>
      ) : null}
    </div>
  )
}
