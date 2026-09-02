import { Form } from 'antd'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  HORIZONTAL_TABLE_MIN_COLUMN_COUNT,
  horizontalTableRemoveColumn,
  normalizeHorizontalTableParagraph,
  writingOutlineLabel,
} from '@/features/template/model/writing-form-draft.schema'
import {
  FormEditorCustomFieldPanel,
  FormEditorFieldHint,
  FormEditorFieldHintLine,
  FormEditorFieldHintXInline,
  FormEditorFieldList,
  FormEditorFieldListItem,
} from '@/features/template/ui/form-editor/table-fields/form-editor-custom-field-panel'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { CmsInput } from '@/shared/ui/cms-input'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export function FormEditorHorizontalTableHeaderFields({
  paragraph,
  paragraphId,
  updateParagraph,
}: {
  paragraph: HorizontalTableParagraph
  paragraphId: string
  updateParagraph: FormUpdateParagraph
}) {
  const pNorm = normalizeHorizontalTableParagraph(paragraph)
  const colCount = Math.max(1, pNorm.columnHeaders.length)

  const removeCol = (columnIndex: number) => {
    updateParagraph(paragraphId, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
      const next = horizontalTableRemoveColumn(cur, columnIndex)
      if (next == null) {
        return cur
      }
      return next
    })
  }

  const panelTitle = writingOutlineLabel(paragraph)

  return (
    <FormEditorCustomFieldPanel
      className="form-editor-horizontal-table-header-fields"
      titleClassName="form-editor-horizontal-table-header-fields__title"
      title={panelTitle}
      subtitle="헤더 항목"
      hint={
        <FormEditorFieldHint tone="header">
          <FormEditorFieldHintLine tone="header">
            <span>항목 옆</span>
            <FormEditorFieldHintXInline tone="header">
              <ItemDeleteButton
                className="item-delete-button form-editor-horizontal-table-hint-button"
                aria-label="동일 열 삭제 예시"
                disabled
              />
            </FormEditorFieldHintXInline>
            <span>아이콘 선택 시 해당 항목과 동일한 열의 항목이</span>
          </FormEditorFieldHintLine>
          <FormEditorFieldHintLine tone="header" second>
            일괄 삭제됩니다. 헤더는 최소 1개 이상의 항목이 필수입니다.
          </FormEditorFieldHintLine>
        </FormEditorFieldHint>
      }
    >
      <FormEditorFieldList className="form-editor-horizontal-table-header-fields__list">
        {pNorm.columnHeaders.map((header, i) => (
          <FormEditorFieldListItem
            key={`hdr-${i}`}
            className="form-editor-horizontal-table-header-fields__item"
          >
            <Form.Item
              className="form-editor-horizontal-table-header-fields__form-item"
              label={`${i + 1}. 항목`}
            >
              <div className="form-editor-horizontal-table-header-fields__row">
                <div className="form-editor-horizontal-table-header-fields__input-wrap">
                  <CmsInput
                    width="100%"
                    inputSize="large"
                    className="form-editor-horizontal-table-header-fields__cms-input"
                    value={header}
                    onChange={e =>
                      updateParagraph(paragraphId, cur => {
                        if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table')
                          return cur
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
                  <ItemDeleteButton
                    className="item-delete-button form-editor-horizontal-table-header-fields__delete"
                    aria-label={`${i + 1}열 삭제`}
                    onClick={e => {
                      e.stopPropagation()
                      removeCol(i)
                    }}
                  />
                ) : null}
              </div>
            </Form.Item>
          </FormEditorFieldListItem>
        ))}
      </FormEditorFieldList>
    </FormEditorCustomFieldPanel>
  )
}
