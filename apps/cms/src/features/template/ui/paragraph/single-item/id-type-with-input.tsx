import { CmsInput, CmsRadio } from '@/shared/ui'
import type { IdTypeWithInputParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor.css'
import './id-type-with-input.css'

const INPUT_PLACEHOLDER_BY_OPTION_ID: Record<string, string> = {
  'agreement-notice-id-resident': '주민등록번호를 입력해 주세요',
  'agreement-notice-id-passport': '여권번호를 입력해 주세요',
  'agreement-notice-id-driver': '운전면허번호를 입력해 주세요',
  'agreement-notice-id-alien': '외국인등록번호를 입력해 주세요',
}

function placeholderForOption(optionId: string, fallback: string): string {
  return INPUT_PLACEHOLDER_BY_OPTION_ID[optionId] ?? fallback
}

/** 동의 양식 — 식별번호 유형(라디오) + 단일 텍스트 입력 본문 */
export function IdTypeWithInputBody({
  paragraph,
  onChange,
  isEditMode,
  documentMode = false,
}: {
  paragraph: IdTypeWithInputParagraph
  onChange: (next: IdTypeWithInputParagraph) => void
  isEditMode: boolean
  /** A4 문서 미리보기 모드 */
  documentMode?: boolean
}) {
  const options = paragraph.options?.length ? paragraph.options : []
  const selectedId =
    paragraph.selectedOptionId != null &&
    options.some(o => o.id === paragraph.selectedOptionId)
      ? paragraph.selectedOptionId
      : (options[0]?.id ?? null)

  const ph =
    selectedId != null
      ? placeholderForOption(selectedId, paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요')
      : paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'
  const inputValueForView = documentMode ? '' : paragraph.inputValue
  const inputPlaceholderForView = documentMode ? '' : ph
  const inputDisabled = documentMode || !isEditMode

  const setSelected = (nextId: string) => {
    onChange({
      ...paragraph,
      selectedOptionId: nextId,
      inputPlaceholder: placeholderForOption(
        nextId,
        paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'
      ),
      inputValue: '',
    })
  }

  return (
    <div className="id-type-with-input">
      <CmsRadio.Group
        className={[
          'id-type-with-input__radios',
          documentMode ? 'id-type-with-input__radios--document-ui' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        value={selectedId ?? undefined}
        onChange={e => {
          if (!isEditMode) return
          setSelected(String(e.target.value))
        }}
        disabled={documentMode || !isEditMode}
      >
        {options.map(opt => (
          <CmsRadio key={opt.id} value={opt.id} className="id-type-with-input__radio">
            {opt.label}
          </CmsRadio>
        ))}
      </CmsRadio.Group>
      <CmsInput
        className="id-type-with-input__input"
        inputSize="large"
        width={280}
        value={inputValueForView}
        placeholder={inputPlaceholderForView}
        disabled={inputDisabled}
        onChange={e => {
          if (!isEditMode) return
          onChange({ ...paragraph, inputValue: e.target.value, inputPlaceholder: ph })
        }}
      />
    </div>
  )
}

/** 동의 양식 — 식별번호 유형(라디오) + 단일 텍스트 입력 */
export function IdTypeWithInput({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: IdTypeWithInputParagraph
  onChange: (next: IdTypeWithInputParagraph) => void
  isEditMode: boolean
}) {
  return (
    <div className="form-editor-body">
      <IdTypeWithInputBody
        paragraph={paragraph}
        onChange={onChange}
        isEditMode={isEditMode}
      />
    </div>
  )
}
