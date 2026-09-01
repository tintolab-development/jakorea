import { CmsInput, CmsNumericInput, CmsRadio } from '@/shared/ui'
import {
  AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID,
  isIdTypeResidentOptionId,
  joinIdTypeResidentInputValue,
  splitIdTypeResidentInputValue,
  type IdTypeWithInputParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor.css'
import './id-type-with-input.css'

const INPUT_PLACEHOLDER_BY_OPTION_ID: Record<string, string> = {
  [AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID]: '주민등록번호를 입력해 주세요',
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
  lockResidentIdType = false,
}: {
  paragraph: IdTypeWithInputParagraph
  onChange: (next: IdTypeWithInputParagraph) => void
  isEditMode: boolean
  /** A4 문서 미리보기 모드 */
  documentMode?: boolean
  /** 행정정보 공동이용 — 라디오를 주민등록번호로 고정·비활성 */
  lockResidentIdType?: boolean
}) {
  const options = paragraph.options?.length ? paragraph.options : []
  const selectedId = lockResidentIdType
    ? AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID
    : paragraph.selectedOptionId != null &&
        options.some(o => o.id === paragraph.selectedOptionId)
      ? paragraph.selectedOptionId
      : (options[0]?.id ?? null)
  const isResident = isIdTypeResidentOptionId(selectedId)
  const residentParts = splitIdTypeResidentInputValue(paragraph.inputValue)

  const ph =
    selectedId != null
      ? placeholderForOption(selectedId, paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요')
      : paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'
  const radiosDisabled = documentMode || !isEditMode || lockResidentIdType
  const inputsDisabled = documentMode || !isEditMode

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

  const patchInputValue = (inputValue: string) => {
    if (!isEditMode) return
    onChange({
      ...paragraph,
      selectedOptionId: lockResidentIdType
        ? AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID
        : paragraph.selectedOptionId,
      inputValue,
      inputPlaceholder: ph,
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
          if (!isEditMode || lockResidentIdType) return
          setSelected(String(e.target.value))
        }}
        disabled={radiosDisabled}
      >
        {options.map(opt => (
          <CmsRadio key={opt.id} value={opt.id} className="id-type-with-input__radio">
            {opt.label}
          </CmsRadio>
        ))}
      </CmsRadio.Group>
      {isResident ? (
        <div className="id-type-with-input__resident">
          <CmsNumericInput
            className="id-type-with-input__resident-input"
            mode="numericText"
            inputSize="large"
            width="100%"
            value={residentParts.front}
            placeholder="주민등록 앞 6자리"
            disabled={inputsDisabled}
            maxLength={6}
            aria-label="주민등록번호 앞자리"
            onValueChange={value =>
              patchInputValue(joinIdTypeResidentInputValue(value, residentParts.back))
            }
          />
          <span className="id-type-with-input__dash" aria-hidden>
            -
          </span>
          <CmsNumericInput
            className="id-type-with-input__resident-input"
            mode="numericText"
            inputSize="large"
            width="100%"
            value={residentParts.back}
            placeholder="주민등록 뒤 7자리"
            disabled={inputsDisabled}
            maxLength={7}
            aria-label="주민등록번호 뒷자리"
            onValueChange={value =>
              patchInputValue(joinIdTypeResidentInputValue(residentParts.front, value))
            }
          />
        </div>
      ) : (
        <CmsInput
          className="id-type-with-input__input"
          inputSize="large"
          width={280}
          value={paragraph.inputValue}
          placeholder={ph}
          disabled={inputsDisabled}
          onChange={e => patchInputValue(e.target.value)}
        />
      )}
    </div>
  )
}

/** 동의 양식 — 식별번호 유형(라디오) + 단일 텍스트 입력 */
export function IdTypeWithInput({
  paragraph,
  onChange,
  isEditMode,
  documentMode = false,
}: {
  paragraph: IdTypeWithInputParagraph
  onChange: (next: IdTypeWithInputParagraph) => void
  isEditMode: boolean
  documentMode?: boolean
}) {
  return (
    <div className="form-editor-body">
      <IdTypeWithInputBody
        paragraph={paragraph}
        onChange={onChange}
        isEditMode={isEditMode}
        documentMode={documentMode}
      />
    </div>
  )
}
