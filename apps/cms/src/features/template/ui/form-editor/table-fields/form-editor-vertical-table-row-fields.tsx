import { Form } from 'antd'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import type {
  DateTimeFieldMode,
  VerticalTableParagraph,
  VerticalTableStageKind,
} from '@/features/template/model/writing-form-draft.schema'
import {
  DATE_TIME_FIELD_MODE_OPTIONS,
  DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER,
  effectiveVerticalRowDateTimeModes,
  effectiveVerticalStageKinds,
  normalizeVerticalTableParagraph,
  verticalTablePanelStageTitle,
  writingOutlineLabel,
} from '@/features/template/model/writing-form-draft.schema'
import {
  FormEditorCustomFieldPanel,
  FormEditorFieldHint,
  FormEditorFieldHintLine,
  FormEditorFieldList,
  FormEditorFieldListItem,
  FormEditorFieldTypeRow,
} from '@/features/template/ui/form-editor/table-fields/form-editor-custom-field-panel'
import { useVerticalTableRowFieldActions } from '@/features/template/ui/form-editor/hooks/use-vertical-table-row-field-actions'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

const VERTICAL_TABLE_CELL_KIND_OPTIONS: { value: VerticalTableStageKind; label: string }[] = [
  { value: 'text', label: '텍스트형' },
  { value: 'subjective', label: '주관식형' },
  { value: 'date_time', label: '날짜/시간형' },
  { value: 'single_choice', label: '단일선택형' },
  { value: 'multiple_choice', label: '다중선택형' },
]

type FormEditorVerticalTableRowFieldsProps = {
  paragraph: VerticalTableParagraph
  paragraphId: string
  rowIndex: number
  updateParagraph: FormUpdateParagraph
  onBodyRowDeleted?: (nextRowIndex: number) => void
}

export function FormEditorVerticalTableRowFields({
  paragraph,
  paragraphId,
  rowIndex,
  updateParagraph,
  onBodyRowDeleted,
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
    />
  )
}

function FormEditorVerticalTableRowFieldsBody({
  paragraph,
  paragraphId,
  rowIndex,
  updateParagraph,
  onBodyRowDeleted,
}: FormEditorVerticalTableRowFieldsProps) {
  const p = normalizeVerticalTableParagraph(paragraph)
  const row = p.rows[rowIndex]!
  const rowCount = Math.max(1, p.rows.length)
  const canDeleteRow = rowCount > 1
  const stageCount: 1 | 2 = row.stageCount === 2 ? 2 : 1
  const stages = stageCount === 1 ? [0] : [0, 1]
  const {
    deleteRow,
    setStageCount,
    setHeader,
    setCell,
    setStageKind,
    setPlaceholderHint,
    setCompositeTimeHint,
    setDateTimeStageMode,
  } = useVerticalTableRowFieldActions({
    paragraphId,
    rowIndex,
    updateParagraph,
    onBodyRowDeleted,
  })

  return (
    <FormEditorCustomFieldPanel
      className="form-editor-horizontal-table-body-fields form-editor-vertical-table-row-fields"
      title={writingOutlineLabel(paragraph)}
      subtitle={`${rowIndex + 1}. 항목`}
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
            const dtModes =
              effectiveVerticalStageKinds(row, p.verticalTableFlavor)[si as 0 | 1] === 'date_time'
                ? effectiveVerticalRowDateTimeModes(row)
                : null
            const stageMode: DateTimeFieldMode | null = dtModes ? dtModes[si as 0 | 1] ?? 'date' : null
            const stageKind = effectiveVerticalStageKinds(row, p.verticalTableFlavor)[
              si as 0 | 1
            ] ?? 'text'

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
                    value={stageKind}
                    options={VERTICAL_TABLE_CELL_KIND_OPTIONS}
                    onChange={v => setStageKind(si, v as VerticalTableStageKind)}
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
                {stageKind === 'date_time' && stageMode !== null ? (
                  <>
                    <Form.Item
                      className="form-editor-horizontal-table-body-fields__content-form-item"
                      label="유형"
                    >
                      <CmsRadioGroup
                        className="form-editor-vertical-table-row-fields__datetime-mode-radios"
                        size="medium"
                        value={stageMode}
                        onChange={e =>
                          setDateTimeStageMode(si as 0 | 1, e.target.value as DateTimeFieldMode)
                        }
                      >
                        {DATE_TIME_FIELD_MODE_OPTIONS.map(opt => (
                          <CmsRadio key={opt.value} value={opt.value} size="medium">
                            {opt.label}
                          </CmsRadio>
                        ))}
                      </CmsRadioGroup>
                    </Form.Item>
                    {stageMode === 'date_time' ? (
                      <>
                        <Form.Item
                          className="form-editor-horizontal-table-body-fields__content-form-item"
                          label="날짜 입력창 안내 텍스트"
                        >
                          <CmsInput
                            width="100%"
                            inputSize="large"
                            className="form-editor-horizontal-table-body-fields__content-input"
                            value={row.placeholderHints?.[si] ?? ''}
                            onChange={e => setPlaceholderHint(si, e.target.value)}
                            placeholder={DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER}
                          />
                        </Form.Item>
                        <Form.Item
                          className="form-editor-horizontal-table-body-fields__content-form-item"
                          label="시간 입력창 안내 텍스트"
                        >
                          <CmsInput
                            width="100%"
                            inputSize="large"
                            className="form-editor-horizontal-table-body-fields__content-input"
                            value={row.dateTimeCompositeTimeHints?.[si] ?? ''}
                            onChange={e =>
                              setCompositeTimeHint(si as 0 | 1, e.target.value)
                            }
                            placeholder={DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER}
                          />
                        </Form.Item>
                      </>
                    ) : (
                      <Form.Item
                        className="form-editor-horizontal-table-body-fields__content-form-item"
                        label="입력창 안내 텍스트"
                      >
                        <CmsInput
                          width="100%"
                          inputSize="large"
                          className="form-editor-horizontal-table-body-fields__content-input"
                          value={row.placeholderHints?.[si] ?? ''}
                          onChange={e => setPlaceholderHint(si, e.target.value)}
                          placeholder={DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER}
                        />
                      </Form.Item>
                    )}
                  </>
                ) : stageKind === 'subjective' ? (
                  <Form.Item
                    className="form-editor-horizontal-table-body-fields__content-form-item"
                    label="입력창 안내 텍스트"
                  >
                    <CmsInput
                      width="100%"
                      inputSize="large"
                      className="form-editor-horizontal-table-body-fields__content-input"
                      value={row.placeholderHints?.[si] ?? ''}
                      onChange={e => setPlaceholderHint(si, e.target.value)}
                      placeholder={DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER}
                    />
                  </Form.Item>
                ) : stageKind === 'single_choice' ||
                  stageKind === 'multiple_choice' ? null : (
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
                )}
              </FormEditorFieldListItem>
            )
          })}
        </FormEditorFieldList>
      </div>
    </FormEditorCustomFieldPanel>
  )
}
