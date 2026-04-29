import { message } from 'antd'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { FormEditorHorizontalTableHeaderDeleteIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-header-delete-icon'
import { FormEditorHorizontalTableOptionAddIcon } from '@/features/template/ui/form-editor/form-editor-horizontal-table-option-add-icon'

const OPTION_LIST_MIN_DEFAULT = 1

export function FormEditorOptionListEditor({
  values,
  onChange,
  addLabel = '항목 추가',
  addButtonIcon = true,
  maxOptions,
  minOptions = OPTION_LIST_MIN_DEFAULT,
}: {
  values: string[]
  onChange: (next: string[]) => void
  addLabel?: string
  /** `false`이면 라벨의 `+`만 사용(예: `+ 항목 추가`) */
  addButtonIcon?: boolean
  /** 지정 시 `항목 추가`로 늘릴 수 있는 옵션 개수 상한(단일·다중 선택) */
  maxOptions?: number
  /** 행 삭제로 유지할 최소 항목 수 */
  minOptions?: number
}) {
  const atMax = maxOptions != null && values.length >= maxOptions
  const canRemoveRow = values.length > minOptions
  const add = () => {
    if (atMax) {
      message.warning(`선택지는 최대 ${maxOptions}개까지 추가할 수 있습니다.`)
      return
    }
    onChange([...values, ''])
  }
  const remove = (i: number) => {
    if (!canRemoveRow) {
      message.warning(`항목은 최소 ${minOptions}개 이상 유지해야 합니다.`)
      return
    }
    onChange(values.filter((_, j) => j !== i))
  }
  return (
    <ul className="form-editor-horizontal-table-body-fields__option-list">
      {values.map((v, oi) => (
        <li key={oi} className="form-editor-horizontal-table-body-fields__option-row">
          <div className="form-editor-horizontal-table-body-fields__option-type-row">
            <div className="form-editor-horizontal-table-body-fields__option-input-wrap">
              <span className="form-editor-horizontal-table-body-fields__option-index" aria-hidden>
                {oi + 1}.
              </span>
              <CmsInput
                className="form-editor-horizontal-table-body-fields__option-cms-input"
                width="100%"
                inputSize="large"
                value={v}
                onChange={e => {
                  const next = [...values]
                  next[oi] = e.target.value
                  onChange(next)
                }}
                placeholder="옵션"
              />
            </div>
            {canRemoveRow ? (
              <button
                type="button"
                className="form-editor-horizontal-table-body-fields__cell-clear"
                aria-label={`${oi + 1}번 항목 삭제`}
                onClick={e => {
                  e.stopPropagation()
                  remove(oi)
                }}
              >
                <FormEditorHorizontalTableHeaderDeleteIcon />
              </button>
            ) : null}
          </div>
        </li>
      ))}
      <li>
        <CmsButton
          type="button"
          variant="secondary"
          size="medium"
          className="form-editor-horizontal-table-body-fields__option-add"
          icon={addButtonIcon ? <FormEditorHorizontalTableOptionAddIcon /> : undefined}
          disabled={atMax}
          onClick={add}
        >
          {addLabel}
        </CmsButton>
      </li>
    </ul>
  )
}
