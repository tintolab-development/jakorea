import { Form } from 'antd'
import { DeferredCmsInput } from '@/features/template/ui/shared/deferred-cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import type {
  HorizontalTableColumnField,
  HorizontalTableFieldColumnKind,
  HorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  defaultFieldForColumnKind,
  getEffectiveHorizontalCellField,
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  HORIZONTAL_TABLE_MIN_COLUMN_COUNT,
  normalizeHorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  FormEditorCustomFieldPanel,
  FormEditorFieldHint,
  FormEditorFieldHintLine,
  FormEditorFieldHintXInline,
  FormEditorFieldList,
  FormEditorFieldListItem,
  FormEditorFieldTypeRow,
} from '@/features/template/ui/form-editor/table-fields/form-editor-custom-field-panel'
import { FormEditorDateTimeFieldPreview } from '@/features/template/ui/form-editor/table-fields/form-editor-date-time-field-preview'
import { FormEditorOptionListEditor } from '@/features/template/ui/form-editor/table-fields/form-editor-option-list-editor'
import { useHorizontalTableBodyFieldActions } from '@/features/template/ui/form-editor/hooks/use-horizontal-table-body-field-actions'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

/** 셀렉트에 노출하는 유형 — dropdown·날짜+시간은 시드/레거시만 */
type HorizontalFieldTypeSelectValue =
  | Exclude<HorizontalTableFieldColumnKind, 'dateTime' | 'dropdown'>
  | 'date'
  | 'time'
  | 'dropdown'

const FIELD_TYPE_OPTIONS: { value: HorizontalFieldTypeSelectValue; label: string }[] = [
  { value: 'text', label: '텍스트형' },
  { value: 'subjective', label: '주관식형' },
  { value: 'date', label: '날짜형' },
  { value: 'time', label: '시간형' },
  { value: 'single', label: '단일 선택형' },
  { value: 'multiple', label: '다중 선택형' },
]

function fieldToSelectValue(field: HorizontalTableColumnField): HorizontalFieldTypeSelectValue {
  if (field.kind === 'dateTime') {
    return field.dateTimeMode === 'time' ? 'time' : 'date'
  }
  return field.kind
}

function selectValueToField(value: HorizontalFieldTypeSelectValue): HorizontalTableColumnField {
  if (value === 'date') {
    return { kind: 'dateTime', dateTimeMode: 'date', placeholder: '' }
  }
  if (value === 'time') {
    return { kind: 'dateTime', dateTimeMode: 'time', placeholder: '' }
  }
  if (value === 'dropdown') {
    return defaultFieldForColumnKind('dropdown')
  }
  return defaultFieldForColumnKind(value)
}

function FieldModeConfigBlock({
  field,
  colIdx,
  rowIndex,
  removeColumn,
  setColumnFieldAt,
  colCount,
  structureControlLocked = false,
}: {
  field: HorizontalTableColumnField
  colIdx: number
  rowIndex: number
  removeColumn: (i: number) => void
  setColumnFieldAt: (i: number, next: HorizontalTableColumnField) => void
  colCount: number
  /** 구조 조작 전용 잠금 — 열 삭제·셀 유형 변경 막음, 안내 텍스트·선택지는 편집 */
  structureControlLocked?: boolean
}) {
  const setColumnField = (next: HorizontalTableColumnField) => {
    setColumnFieldAt(colIdx, next)
  }
  const isSeedDropdown = field.kind === 'dropdown'
  const selectOptions = isSeedDropdown
    ? [...FIELD_TYPE_OPTIONS, { value: 'dropdown' as const, label: '드롭다운형' }]
    : FIELD_TYPE_OPTIONS
  const fieldTypeLocked = isSeedDropdown || structureControlLocked
  const canRemoveColumn = !structureControlLocked && colCount > HORIZONTAL_TABLE_MIN_COLUMN_COUNT

  return (
    <FormEditorFieldListItem className="form-editor-horizontal-table-body-fields__item">
      <div className="form-editor-horizontal-table-body-fields__cell-title">
        {colIdx + 1}-{rowIndex + 1}. 항목
      </div>
      <FormEditorFieldTypeRow
        trailing={
          canRemoveColumn ? (
            <ItemDeleteButton
              className="item-delete-button form-editor-horizontal-table-body-fields__cell-clear"
              aria-label={`${colIdx + 1}열 삭제`}
              onClick={e => {
                e.stopPropagation()
                removeColumn(colIdx)
              }}
            />
          ) : null
        }
      >
        <CmsSelect
          className="form-editor-horizontal-table-body-fields__cms-select"
          inputSize="large"
          width="100%"
          value={fieldToSelectValue(field)}
          options={selectOptions}
          disabled={fieldTypeLocked}
          onChange={v => {
            if (fieldTypeLocked) return
            setColumnField(selectValueToField(v as HorizontalFieldTypeSelectValue))
          }}
          withAllOption={false}
        />
      </FormEditorFieldTypeRow>

      {(field.kind === 'text' || field.kind === 'subjective') && (
        <Form.Item
          className="form-editor-horizontal-table-body-fields__content-form-item"
          label="입력창 안내 텍스트"
        >
          <DeferredCmsInput
            width="100%"
            inputSize="large"
            value={field.placeholder}
            onCommit={next =>
              setColumnField(
                field.kind === 'text'
                  ? { kind: 'text', placeholder: next }
                  : { kind: 'subjective', placeholder: next }
              )
            }
            placeholder={HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER}
          />
        </Form.Item>
      )}

      {field.kind === 'dateTime' ? (
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
  focusedCol: _focusedCol,
  updateParagraph,
  onBodyRowDeleted,
  structureControlLocked = false,
}: {
  paragraph: HorizontalTableParagraph
  paragraphId: string
  rowIndex: number
  focusedCol?: number
  updateParagraph: FormUpdateParagraph
  /** 삭제 후 포커스할 데이터 행 인덱스(이전 행, 삭제 행이 0이면 0) */
  onBodyRowDeleted?: (nextRowIndex: number) => void
  /** 구조 조작 전용 잠금 — 행/열 삭제·셀 유형 변경 숨김, 안내 텍스트는 편집 */
  structureControlLocked?: boolean
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
  const { deleteRow, removeColumn, setColumnField } = useHorizontalTableBodyFieldActions({
    paragraphId,
    rowIndex,
    updateParagraph,
    onBodyRowDeleted,
  })

  return (
    <FormEditorCustomFieldPanel
      onDeleteRow={structureControlLocked ? undefined : deleteRow}
      hint={
        structureControlLocked ? null : (
          <FormEditorFieldHint>
            <FormEditorFieldHintLine>
              <span>항목 옆</span>
              <FormEditorFieldHintXInline>
                <ItemDeleteButton
                  className="item-delete-button form-editor-horizontal-table-hint-button"
                  aria-label="동일 열 삭제 예시"
                  disabled
                />
              </FormEditorFieldHintXInline>
              는 동일 열을, [행 삭제]는 선택 행을 삭제합니다.
            </FormEditorFieldHintLine>
          </FormEditorFieldHint>
        )
      }
    >
      <FormEditorFieldList>
        {Array.from({ length: colCount }, (_, colIdx) => {
          const field =
            p.tableFlavor === 'field'
              ? getEffectiveHorizontalCellField(p, rowIndex, colIdx)
              : defaultFieldForColumnKind('text')
          return (
            <FieldModeConfigBlock
              key={`field-body-${rowIndex}-${colIdx}`}
              field={field}
              colIdx={colIdx}
              rowIndex={rowIndex}
              removeColumn={removeColumn}
              setColumnFieldAt={setColumnField}
              colCount={colCount}
              structureControlLocked={structureControlLocked}
            />
          )
        })}
      </FormEditorFieldList>
    </FormEditorCustomFieldPanel>
  )
}
