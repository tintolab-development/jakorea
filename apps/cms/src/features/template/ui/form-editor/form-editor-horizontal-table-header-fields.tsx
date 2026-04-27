import { Form, message } from 'antd'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  HORIZONTAL_TABLE_MIN_COLUMN_COUNT,
  horizontalTableRemoveColumn,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorHorizontalTableHintXIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-hint-x-icon'
import { FormEditorHorizontalTableHeaderDeleteIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-header-delete-icon'
import { CmsInput } from '@/shared/ui/cms-input'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'

export function FormEditorHorizontalTableHeaderFields({
  paragraph,
  paragraphId,
  updateParagraph,
}: {
  paragraph: HorizontalTableParagraph
  paragraphId: string
  updateParagraph: FormUpdateParagraph
}) {
  const colCount = Math.max(1, paragraph.columnHeaders.length)

  const removeCol = (columnIndex: number) => {
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

  const isFieldFlavor = paragraph.tableFlavor === 'field'
  const panelTitle = isFieldFlavor
    ? '테이블_가로형(필드형)_항목 선택 시 (헤더)'
    : '테이블_가로형_항목 선택 시 (헤더)'

  return (
    <div className="form-editor-horizontal-table-header-fields">
      <h3 className="form-editor-horizontal-table-header-fields__title">{panelTitle}</h3>
      <div className="form-editor-horizontal-table-header-fields__hint">
        <span className="form-editor-horizontal-table-header-fields__hint-mark" aria-hidden>
          *
        </span>
        <div className="form-editor-horizontal-table-header-fields__hint-body">
          <p className="form-editor-horizontal-table-header-fields__hint-line">
            <span>항목 옆</span>
            <span
              className="form-editor-horizontal-table-header-fields__hint-x-inline"
              aria-hidden
            >
              <FormEditorHorizontalTableHintXIcon />
            </span>
            <span>아이콘 선택 시 해당 항목과 동일한 열의 항목이</span>
          </p>
          <p
            className="form-editor-horizontal-table-header-fields__hint-line form-editor-horizontal-table-header-fields__hint-line--second"
          >
            일괄 삭제됩니다. 헤더는 최소 1개 이상의 항목이 필수입니다.
          </p>
        </div>
      </div>
      <ul className="form-editor-horizontal-table-header-fields__list">
        {paragraph.columnHeaders.map((header, i) => (
          <li key={`hdr-${i}`} className="form-editor-horizontal-table-header-fields__item">
            <Form.Item className="form-editor-horizontal-table-header-fields__form-item" label={`${i + 1}. 항목`}>
              <div className="form-editor-horizontal-table-header-fields__row">
                <div className="form-editor-horizontal-table-header-fields__input-wrap">
                  <CmsInput
                    width="100%"
                    inputSize="large"
                    className="form-editor-horizontal-table-header-fields__cms-input"
                    value={header}
                    onChange={e =>
                      updateParagraph(paragraphId, cur => {
                        if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
                        const next = [...cur.columnHeaders]
                        while (next.length < colCount) next.push('')
                        next[i] = e.target.value
                        return { ...cur, columnHeaders: next.slice(0, colCount) }
                      })
                    }
                    placeholder="항목명을 입력해 주세요"
                  />
                </div>
                {colCount > HORIZONTAL_TABLE_MIN_COLUMN_COUNT ? (
                  <button
                    type="button"
                    className="form-editor-horizontal-table-header-fields__delete"
                    aria-label={`${i + 1}열 삭제`}
                    onClick={e => {
                      e.stopPropagation()
                      removeCol(i)
                    }}
                  >
                    <FormEditorHorizontalTableHeaderDeleteIcon />
                  </button>
                ) : null}
              </div>
            </Form.Item>
          </li>
        ))}
      </ul>
    </div>
  )
}
