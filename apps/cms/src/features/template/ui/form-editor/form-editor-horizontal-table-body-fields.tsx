import { Form } from 'antd'
import { CmsInput } from '@/shared/ui/cms-input'
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
  normalizeHorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorHorizontalTableHintXIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-hint-x-icon'
import { FormEditorHorizontalTableHeaderDeleteIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-header-delete-icon'
import {
  FormEditorCustomFieldPanel,
  FormEditorFieldHint,
  FormEditorFieldHintLine,
  FormEditorFieldHintXInline,
  FormEditorFieldList,
  FormEditorFieldListItem,
  FormEditorFieldTypeRow,
} from '@/features/template/ui/form-editor/form-editor-custom-field-panel'
import { FormEditorDateTimeFieldPreview } from '@/features/template/ui/form-editor/form-editor-date-time-field-preview'
import { FormEditorOptionListEditor } from '@/features/template/ui/form-editor/form-editor-option-list-editor'
import { useHorizontalTableBodyFieldActions } from '@/features/template/ui/form-editor/use-horizontal-table-body-field-actions'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'

const TEXT_TYPE_OPTIONS = [{ value: 'text', label: '텍스트형' }]

const FIELD_TYPE_OPTIONS: { value: HorizontalTableFieldColumnKind; label: string }[] = [
  { value: 'subjective', label: '주관식형' },
  { value: 'dropdown', label: '드롭다운형' },
  { value: 'dateTime', label: '날짜/시간형' },
  { value: 'single', label: '단일선택형' },
  { value: 'multiple', label: '다중선택형' },
]

function TextModeBodyFieldItem({
  cell,
  colIdx,
  rowIndex,
  removeColumn,
  setTextCell,
  colCount,
}: {
  cell: string
  colIdx: number
  rowIndex: number
  removeColumn: (i: number) => void
  setTextCell: (i: number, value: string) => void
  colCount: number
}) {
  return (
    <FormEditorFieldListItem>
      <div className="form-editor-horizontal-table-body-fields__cell-title">
        {colIdx + 1}-{rowIndex + 1}. 항목
      </div>
      <FormEditorFieldTypeRow
        trailing={
          colCount > HORIZONTAL_TABLE_MIN_COLUMN_COUNT ? (
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
          ) : null
        }
      >
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
        label="작성 내용"
      >
        <CmsInput
          width="100%"
          inputSize="large"
          className="form-editor-horizontal-table-body-fields__content-input"
          value={cell}
          onChange={e => setTextCell(colIdx, e.target.value)}
          placeholder={HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER}
        />
      </Form.Item>
    </FormEditorFieldListItem>
  )
}

function FieldModeConfigBlock({
  field,
  colIdx,
  rowIndex,
  removeColumn,
  setColumnFieldAt,
  colCount,
}: {
  field: HorizontalTableColumnField
  colIdx: number
  rowIndex: number
  removeColumn: (i: number) => void
  setColumnFieldAt: (i: number, next: HorizontalTableColumnField) => void
  colCount: number
}) {
  const setColumnField = (next: HorizontalTableColumnField) => {
    setColumnFieldAt(colIdx, next)
  }

  return (
    <FormEditorFieldListItem>
      <div className="form-editor-horizontal-table-body-fields__cell-title">
        {colIdx + 1}-{rowIndex + 1}. 항목
      </div>
      <FormEditorFieldTypeRow
        trailing={
          colCount > HORIZONTAL_TABLE_MIN_COLUMN_COUNT ? (
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
          ) : null
        }
      >
        <CmsSelect
          className="form-editor-horizontal-table-body-fields__cms-select"
          inputSize="large"
          width="100%"
          value={field.kind}
          options={FIELD_TYPE_OPTIONS}
          onChange={v => {
            setColumnField(defaultFieldForColumnKind(v as HorizontalTableFieldColumnKind))
          }}
          withAllOption={false}
        />
      </FormEditorFieldTypeRow>

      {field.kind === 'subjective' ? (
        <Form.Item
          className="form-editor-horizontal-table-body-fields__content-form-item"
          label="입력창 안내 텍스트"
        >
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
          <Form.Item
            className="form-editor-horizontal-table-body-fields__content-form-item"
            label="입력창 안내 텍스트"
          >
            <CmsInput
              width="100%"
              inputSize="large"
              value={field.placeholder}
              onChange={e => setColumnField({ ...field, placeholder: e.target.value })}
              placeholder={HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER}
            />
          </Form.Item>
          <Form.Item
            className="form-editor-horizontal-table-body-fields__content-form-item"
            label="드롭다운 옵션"
          >
            <FormEditorOptionListEditor
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
          <Form.Item
            className="form-editor-horizontal-table-body-fields__content-form-item"
            label="유형"
          >
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
          <Form.Item
            className="form-editor-horizontal-table-body-fields__content-form-item"
            label="입력 미리보기"
          >
            <div
              className="form-editor-horizontal-table-body-fields__date-preview"
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            >
              <FormEditorDateTimeFieldPreview field={field} />
            </div>
          </Form.Item>
        </>
      ) : null}

      {(field.kind === 'single' || field.kind === 'multiple') && (
        <FormEditorOptionListEditor
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
    </FormEditorFieldListItem>
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
  const { deleteRow, removeColumn, setTextCell, setColumnField } =
    useHorizontalTableBodyFieldActions({
      paragraphId,
      rowIndex,
      updateParagraph,
      onBodyRowDeleted,
    })

  const isFieldFlavor = p.tableFlavor === 'field'
  const bodyPanelTitle = isFieldFlavor
    ? '테이블_가로형(필드형)_항목 선택 시'
    : '테이블_가로형_항목 선택 시 (바디)'

  return (
    <FormEditorCustomFieldPanel
      title={bodyPanelTitle}
      onDeleteRow={deleteRow}
      hint={
        <FormEditorFieldHint>
          <FormEditorFieldHintLine>
            <span>항목 옆</span>
            <FormEditorFieldHintXInline>
              <FormEditorHorizontalTableHintXIcon />
            </FormEditorFieldHintXInline>
            는 동일 열을, [행 삭제]는 선택 행을 삭제합니다.
          </FormEditorFieldHintLine>
        </FormEditorFieldHint>
      }
    >
      <FormEditorFieldList>
        {p.tableFlavor === 'text'
          ? cells.map((cell, colIdx) => (
              <TextModeBodyFieldItem
                key={`text-body-${rowIndex}-${colIdx}`}
                cell={cell}
                colIdx={colIdx}
                rowIndex={rowIndex}
                removeColumn={removeColumn}
                setTextCell={setTextCell}
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
                  removeColumn={removeColumn}
                  setColumnFieldAt={setColumnField}
                  colCount={colCount}
                />
              )
            })}
      </FormEditorFieldList>
    </FormEditorCustomFieldPanel>
  )
}
