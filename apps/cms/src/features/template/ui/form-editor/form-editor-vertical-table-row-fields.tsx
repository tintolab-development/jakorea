import { Form } from 'antd'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import type { VerticalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  normalizeVerticalTableParagraph,
  verticalTablePanelStageTitle,
} from '@/features/template/model/writing-form-draft.schema'
import {
  FormEditorCustomFieldPanel,
  FormEditorFieldHint,
  FormEditorFieldHintLine,
  FormEditorFieldList,
  FormEditorFieldListItem,
  FormEditorFieldTypeRow,
} from '@/features/template/ui/form-editor/form-editor-custom-field-panel'
import { useVerticalTableRowFieldActions } from '@/features/template/ui/form-editor/use-vertical-table-row-field-actions'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'

const TEXT_TYPE_OPTIONS = [{ value: 'text', label: '텍스트형' }]

export function FormEditorVerticalTableRowFields({
  paragraph,
  paragraphId,
  rowIndex,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraph: VerticalTableParagraph
  paragraphId: string
  rowIndex: number
  updateParagraph: FormUpdateParagraph
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  const p = normalizeVerticalTableParagraph(paragraph)
  const rowCount = Math.max(1, p.rows.length)
  if (rowIndex < 0 || rowIndex >= rowCount) return null

  const row = p.rows[rowIndex]!
  const stageCount: 1 | 2 = row.stageCount === 2 ? 2 : 1
  const stages = stageCount === 1 ? [0] : [0, 1]
  const { deleteRow, setStageCount, setHeader, setCell } = useVerticalTableRowFieldActions({
    paragraphId,
    rowIndex,
    updateParagraph,
    onBodyRowDeleted,
  })

  return (
    <FormEditorCustomFieldPanel
      className="form-editor-horizontal-table-body-fields form-editor-vertical-table-row-fields"
      title="테이블_세로형(텍스트형)_항목 선택 시"
      beforeDelete={
        <div className="form-editor-vertical-table-row-fields__structure">
          <span className="form-editor-vertical-table-row-fields__structure-label">
            테이블 구조
          </span>
          <CmsRadioGroup
            className="form-editor-vertical-table-row-fields__structure-radios"
            size="medium"
            value={stageCount}
            onChange={e => setStageCount(Number(e.target.value) as 1 | 2)}
          >
            <CmsRadio value={1} size="medium">
              1단
            </CmsRadio>
            <CmsRadio value={2} size="medium">
              2단
            </CmsRadio>
          </CmsRadioGroup>
        </div>
      }
      onDeleteRow={deleteRow}
      hint={
        <FormEditorFieldHint mark="＊">
          <FormEditorFieldHintLine>
            [행 삭제] 버튼을 누르면 선택된 행 항목이 일괄 삭제됩니다.
          </FormEditorFieldHintLine>
        </FormEditorFieldHint>
      }
    >
      <div
        className="form-editor-vertical-table-row-fields__list-wrap"
        key={`vt-row-${rowIndex}-sc-${stageCount}`}
      >
        <FormEditorFieldList>
          {stages.map(si => (
            <FormEditorFieldListItem key={`vt-${rowIndex}-s-${si}`}>
              <div className="form-editor-horizontal-table-body-fields__cell-title">
                {verticalTablePanelStageTitle(rowIndex, si, stageCount)}
              </div>
              <FormEditorFieldTypeRow>
                <CmsSelect
                  className="form-editor-horizontal-table-body-fields__cms-select"
                  inputSize="large"
                  width="100%"
                  value="text"
                  options={TEXT_TYPE_OPTIONS}
                  disabled
                  withAllOption={false}
                />
              </FormEditorFieldTypeRow>
              <Form.Item
                className="form-editor-horizontal-table-body-fields__content-form-item"
                label="항목명"
              >
                <CmsInput
                  width="100%"
                  inputSize="large"
                  className="form-editor-horizontal-table-body-fields__content-input"
                  value={row.headers[si] ?? ''}
                  onChange={e => setHeader(si, e.target.value)}
                  placeholder="항목명을 입력해 주세요"
                />
              </Form.Item>
              <Form.Item
                className="form-editor-horizontal-table-body-fields__content-form-item"
                label="내용"
              >
                <CmsInput
                  width="100%"
                  inputSize="large"
                  className="form-editor-horizontal-table-body-fields__content-input"
                  value={row.cells[si] ?? ''}
                  onChange={e => setCell(si, e.target.value)}
                  placeholder="내용을 입력해 주세요"
                />
              </Form.Item>
            </FormEditorFieldListItem>
          ))}
        </FormEditorFieldList>
      </div>
    </FormEditorCustomFieldPanel>
  )
}
