import { useId } from 'react'
import { Form, message } from 'antd'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  horizontalTableRemoveColumn,
  horizontalTableRemoveRow,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorHorizontalTableBodyRowDeleteIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-body-row-delete-icon'
import { FormEditorHorizontalTableHeaderDeleteIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-header-delete-icon'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'

const TEXT_TYPE_OPTIONS = [{ value: 'text', label: '텍스트형' }]

function FormEditorHorizontalTableBodyHintXIcon() {
  const maskId = `ht-body-hint-x-mask-${useId().replace(/:/g, '')}`
  return (
    <svg
      className="form-editor-horizontal-table-body-fields__hint-x-icon"
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <mask id={maskId} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
        <rect width="20" height="20" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M9.99967 10.8783L12.5605 13.4393C12.6759 13.5546 12.821 13.6136 12.9957 13.6164C13.1703 13.6191 13.318 13.56 13.4388 13.4393C13.5595 13.3185 13.6199 13.1721 13.6199 13.0002C13.6199 12.8282 13.5595 12.6818 13.4388 12.561L10.8778 10.0002L13.4388 7.43933C13.5541 7.32391 13.6131 7.17884 13.6159 7.00412C13.6186 6.82954 13.5595 6.68183 13.4388 6.561C13.318 6.4403 13.1716 6.37995 12.9997 6.37995C12.8277 6.37995 12.6813 6.4403 12.5605 6.561L9.99967 9.12204L7.43884 6.561C7.32342 6.44572 7.17836 6.38669 7.00363 6.38391C6.82905 6.38127 6.68134 6.4403 6.56051 6.561C6.43981 6.68183 6.37947 6.82822 6.37947 7.00016C6.37947 7.17211 6.43981 7.3185 6.56051 7.43933L9.12155 10.0002L6.56051 12.561C6.44523 12.6764 6.3862 12.8215 6.38342 12.9962C6.38079 13.1708 6.43981 13.3185 6.56051 13.4393C6.68134 13.56 6.82773 13.6204 6.99967 13.6204C7.17162 13.6204 7.31801 13.56 7.43884 13.4393L9.99967 10.8783ZM10.0011 17.9168C8.90613 17.9168 7.8769 17.7091 6.91342 17.2935C5.94995 16.8779 5.1119 16.314 4.39926 15.6016C3.68662 14.8893 3.12238 14.0516 2.70655 13.0885C2.29085 12.1254 2.08301 11.0965 2.08301 10.0016C2.08301 8.90662 2.29079 7.87738 2.70634 6.91391C3.1219 5.95044 3.68586 5.11238 4.39822 4.39975C5.11058 3.68711 5.94829 3.12287 6.91134 2.70704C7.8744 2.29134 8.90335 2.0835 9.99822 2.0835C11.0932 2.0835 12.1225 2.29127 13.0859 2.70683C14.0494 3.12238 14.8875 3.68634 15.6001 4.3987C16.3127 5.11107 16.877 5.94877 17.2928 6.91183C17.7085 7.87489 17.9163 8.90384 17.9163 9.9987C17.9163 11.0937 17.7086 12.1229 17.293 13.0864C16.8775 14.0499 16.3135 14.8879 15.6011 15.6006C14.8888 16.3132 14.0511 16.8775 13.088 17.2933C12.125 17.709 11.096 17.9168 10.0011 17.9168Z"
          fill="currentColor"
        />
      </g>
    </svg>
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
  onBodyRowDeleted?: () => void
}) {
  const colCount = Math.max(1, paragraph.columnHeaders.length)
  const rows = paragraph.dataRows.map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  if (rows.length === 0) {
    rows.push(Array.from({ length: colCount }, () => ''))
  }
  const cells = rows[rowIndex] ?? Array.from({ length: colCount }, () => '')

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
    if (removed) onBodyRowDeleted?.()
  }

  const setCellValue = (colIdx: number, value: string) => {
    updateParagraph(paragraphId, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
      const nextRows = cur.dataRows.map(r => [...r])
      const row = [...(nextRows[rowIndex] ?? [])]
      while (row.length <= colIdx) row.push('')
      row[colIdx] = value
      nextRows[rowIndex] = row
      return { ...cur, dataRows: nextRows }
    })
  }

  const removeColumn = (columnIndex: number) => {
    updateParagraph(paragraphId, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
      const next = horizontalTableRemoveColumn(cur, columnIndex)
      if (next == null) {
        message.warning('헤더는 최소 1개 이상의 항목이 필수입니다.')
        return cur
      }
      return next
    })
  }

  return (
    <div className="form-editor-horizontal-table-body-fields">
      <h3 className="form-editor-horizontal-table-body-fields__title">
        테이블_가로형_항목 선택 시 (바디)
      </h3>
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
        <p className="form-editor-horizontal-table-body-fields__hint-line form-editor-horizontal-table-body-fields__hint-line--inline">
          <span>* 항목 옆</span>
          <span className="form-editor-horizontal-table-body-fields__hint-icon-lockup">
            <FormEditorHorizontalTableBodyHintXIcon />
            아이콘
          </span>
          <span> 선택 시 해당 항목과 동일한 열의 항목이 일괄 삭제됩니다.</span>
        </p>
        <p className="form-editor-horizontal-table-body-fields__hint-line">
          [행 삭제] 버튼을 누르면 선택된 행 항목이 일괄 삭제됩니다.
        </p>
      </div>
      <ul className="form-editor-horizontal-table-body-fields__list">
        {cells.map((cell, colIdx) => (
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
                onChange={e => setCellValue(colIdx, e.target.value)}
                placeholder="텍스트를 입력해 주세요"
              />
            </Form.Item>
          </li>
        ))}
      </ul>
    </div>
  )
}
