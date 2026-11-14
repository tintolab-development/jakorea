import { Form } from 'antd'
import { DeferredCmsInput } from '@/features/template/ui/shared/deferred-cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import type {
  VerticalTableParagraph,
  VerticalTableStageKind,
} from '@/features/template/model/writing-form-draft.schema'
import {
  DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER,
  effectiveVerticalStageKinds,
  isVerticalDateOrTimeStageKind,
  normalizeVerticalChoiceOptions,
  normalizeVerticalTableParagraph,
  verticalTablePanelStageTitle,
  verticalTableParagraphWithChoiceOptions,
} from '@/features/template/model/writing-form-draft.schema'
import {
  FormEditorCustomFieldPanel,
  FormEditorFieldHint,
  FormEditorFieldHintLine,
  FormEditorFieldList,
  FormEditorFieldListItem,
  FormEditorFieldTypeRow,
} from '@/features/template/ui/form-editor/table-fields/form-editor-custom-field-panel'
import { FormEditorOptionListEditor } from '@/features/template/ui/form-editor/table-fields/form-editor-option-list-editor'
import { useVerticalTableRowFieldActions } from '@/features/template/ui/form-editor/hooks/use-vertical-table-row-field-actions'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

const VERTICAL_TABLE_CELL_KIND_OPTIONS: { value: VerticalTableStageKind; label: string }[] = [
  { value: 'text', label: '텍스트형' },
  { value: 'subjective', label: '주관식형' },
  { value: 'date', label: '날짜형' },
  { value: 'time', label: '시간형' },
  { value: 'single_choice', label: '단일선택형' },
  { value: 'multiple_choice', label: '다중선택형' },
  { value: 'file_attachment', label: '파일첨부형' },
]

type FormEditorVerticalTableRowFieldsProps = {
  paragraph: VerticalTableParagraph
  paragraphId: string
  rowIndex: number
  updateParagraph: FormUpdateParagraph
  onBodyRowDeleted?: (nextRowIndex: number) => void
  /** 구조 조작 전용 잠금 — 행 삭제·1단/2단·셀 유형 변경 막음, 항목명·내용·안내 텍스트는 편집 */
  structureControlLocked?: boolean
}

export function FormEditorVerticalTableRowFields({
  paragraph,
  paragraphId,
  rowIndex,
  updateParagraph,
  onBodyRowDeleted,
  structureControlLocked = false,
}: FormEditorVerticalTableRowFieldsProps) {
  const p = normalizeVerticalTableParagraph(paragraph)
  const rowCount = Math.max(1, p.rows.length)
  if (rowIndex < 0 || rowIndex >= rowCount) return null
  return (
    <FormEditorVerticalTableRowFieldsBody
      paragraph={paragraph}
      paragraphId={paragraphId}
      rowIndex={rowIndex}
      updateParagraph={updateParagraph}
      onBodyRowDeleted={onBodyRowDeleted}
      structureControlLocked={structureControlLocked}
    />
  )
}

function FormEditorVerticalTableRowFieldsBody({
  paragraph,
  paragraphId,
  rowIndex,
  updateParagraph,
  onBodyRowDeleted,
  structureControlLocked = false,
}: FormEditorVerticalTableRowFieldsProps) {
  const p = normalizeVerticalTableParagraph(paragraph)
  const row = p.rows[rowIndex]!
  const rowCount = Math.max(1, p.rows.length)
  const canDeleteRow = !structureControlLocked && rowCount > 1
  const stageCount: 1 | 2 = row.stageCount === 2 ? 2 : 1
  const stages = stageCount === 1 ? [0] : [0, 1]
  const {
    deleteRow,
    setStageCount,
    setHeader,
    setCell,
    setStageKind,
    setPlaceholderHint,
  } = useVerticalTableRowFieldActions({
    paragraphId,
    rowIndex,
    updateParagraph,
    onBodyRowDeleted,
  })

  return (
    <FormEditorCustomFieldPanel
      className="form-editor-horizontal-table-body-fields form-editor-vertical-table-row-fields"
      beforeDelete={
        <div className="form-editor-vertical-table-row-fields__structure">
          <span className="form-editor-vertical-table-row-fields__structure-label">
            테이블 구조
          </span>
          <CmsRadioGroup
            className="form-editor-vertical-table-row-fields__structure-radios"
            size="medium"
            value={stageCount}
            disabled={structureControlLocked}
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
      onDeleteRow={canDeleteRow ? deleteRow : undefined}
      hint={
        canDeleteRow ? (
          <FormEditorFieldHint mark="＊">
            <FormEditorFieldHintLine>
              [행 삭제] 버튼을 누르면 선택된 행 항목이 일괄 삭제됩니다.
            </FormEditorFieldHintLine>
          </FormEditorFieldHint>
        ) : null
      }
    >
      <div
        className="form-editor-vertical-table-row-fields__list-wrap"
        key={`vt-row-${rowIndex}-sc-${stageCount}`}
      >
        <FormEditorFieldList>
          {stages.map(si => {
            const stageKind = effectiveVerticalStageKinds(row, p.verticalTableFlavor)[
              si as 0 | 1
            ] ?? 'text'
            const isDateOrTime = isVerticalDateOrTimeStageKind(stageKind)

            return (
              <FormEditorFieldListItem key={`vt-${rowIndex}-s-${si}`}>
                <div className="form-editor-horizontal-table-body-fields__cell-title">
                  {verticalTablePanelStageTitle(rowIndex, si, stageCount)}
                </div>
                <FormEditorFieldTypeRow>
                  <CmsSelect
                    className="form-editor-horizontal-table-body-fields__cms-select"
                    inputSize="large"
                    width="100%"
                    value={stageKind === 'date_time' ? 'date' : stageKind}
                    options={VERTICAL_TABLE_CELL_KIND_OPTIONS}
                    allowClear={false}
                    disabled={structureControlLocked}
                    onChange={v => {
                      if (structureControlLocked) return
                      setStageKind(si, v as VerticalTableStageKind)
                    }}
                    withAllOption={false}
                  />
                </FormEditorFieldTypeRow>
                <Form.Item
                  className="form-editor-horizontal-table-body-fields__content-form-item"
                  label="항목명"
                >
                  <DeferredCmsInput
                    width="100%"
                    inputSize="large"
                    className="form-editor-horizontal-table-body-fields__content-input"
                    value={row.headers[si] ?? ''}
                    onCommit={next => setHeader(si, next)}
                    placeholder="항목명을 입력해 주세요"
                  />
                </Form.Item>
                {isDateOrTime ? (
                  <Form.Item
                    className="form-editor-horizontal-table-body-fields__content-form-item"
                    label="입력창 안내 텍스트"
                  >
                    <DeferredCmsInput
                      width="100%"
                      inputSize="large"
                      className="form-editor-horizontal-table-body-fields__content-input"
                      value={row.placeholderHints?.[si] ?? ''}
                      onCommit={next => setPlaceholderHint(si, next)}
                      placeholder={DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER}
                    />
                  </Form.Item>
                ) : stageKind === 'subjective' ? (
                  <Form.Item
                    className="form-editor-horizontal-table-body-fields__content-form-item"
                    label="입력창 안내 텍스트"
                  >
                    <DeferredCmsInput
                      width="100%"
                      inputSize="large"
                      className="form-editor-horizontal-table-body-fields__content-input"
                      value={row.placeholderHints?.[si] ?? ''}
                      onCommit={next => setPlaceholderHint(si, next)}
                      placeholder={DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER}
                    />
                  </Form.Item>
                ) : stageKind === 'single_choice' || stageKind === 'multiple_choice' ? (
                  <div className="form-editor-vertical-table-row-fields__choice-options">
                    <FormEditorOptionListEditor
                      values={normalizeVerticalChoiceOptions(p.verticalChoiceOptions)}
                      onChange={options =>
                        updateParagraph(paragraphId, cur => {
                          if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table')
                            return cur
                          return verticalTableParagraphWithChoiceOptions(
                            cur as VerticalTableParagraph,
                            options
                          )
                        })
                      }
                      addLabel="+ 항목 추가"
                      addButtonIcon={false}
                    />
                  </div>
                ) : stageKind === 'file_attachment' ? null : (
                  <Form.Item
                    className="form-editor-horizontal-table-body-fields__content-form-item"
                    label="내용"
                  >
                    <DeferredCmsInput
                      width="100%"
                      inputSize="large"
                      className="form-editor-horizontal-table-body-fields__content-input"
                      value={row.cells[si] ?? ''}
                      onCommit={next => setCell(si, next)}
                      placeholder="내용을 입력해 주세요"
                    />
                  </Form.Item>
                )}
              </FormEditorFieldListItem>
            )
          })}
        </FormEditorFieldList>
      </div>
    </FormEditorCustomFieldPanel>
  )
}
