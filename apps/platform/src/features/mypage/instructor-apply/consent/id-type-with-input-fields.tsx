import {
  AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID,
  isIdTypeResidentOptionId,
  joinIdTypeResidentInputValue,
  splitIdTypeResidentInputValue,
  type IdTypeWithInputParagraph,
} from '@jakorea/form-schema/writing-form'
import { PFFormResidentNumberInput, PFText, PFTextInput } from '@/shared/ui'
import styles from './consent-form.module.css'

const INPUT_PLACEHOLDER_BY_OPTION_ID: Record<string, string> = {
  [AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID]: '주민등록번호를 입력해 주세요',
  'agreement-notice-id-passport': '여권번호를 입력해 주세요',
  'agreement-notice-id-driver': '운전면허번호를 입력해 주세요',
  'agreement-notice-id-alien': '외국인등록번호를 입력해 주세요',
}

function placeholderForOption(optionId: string, fallback: string): string {
  return INPUT_PLACEHOLDER_BY_OPTION_ID[optionId] ?? fallback
}

/** CMS `IdTypeWithInputBody`와 동일 — 주민등록번호는 앞·뒤 2칸 */
export function PlatformIdTypeWithInputFields({
  paragraph,
  onChange,
  lockResidentIdType = false,
}: {
  paragraph: IdTypeWithInputParagraph
  onChange: (next: IdTypeWithInputParagraph) => void
  /** 행정정보 공동이용 — 라디오를 주민등록번호로 고정·비활성 */
  lockResidentIdType?: boolean
}) {
  const options = paragraph.options?.length ? paragraph.options : []
  const selectedId = lockResidentIdType
    ? AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID
    : paragraph.selectedOptionId != null && options.some(o => o.id === paragraph.selectedOptionId)
      ? paragraph.selectedOptionId
      : (options[0]?.id ?? '')
  const isResident = isIdTypeResidentOptionId(selectedId)
  const residentParts = splitIdTypeResidentInputValue(paragraph.inputValue)

  const placeholder =
    selectedId !== ''
      ? placeholderForOption(
          selectedId,
          paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'
        )
      : paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'

  const patchInputValue = (inputValue: string) => {
    onChange({
      ...paragraph,
      selectedOptionId: lockResidentIdType
        ? AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID
        : paragraph.selectedOptionId,
      inputValue,
      inputPlaceholder: placeholder,
    })
  }

  return (
    <div className={styles.idTypeWithInput}>
      <div className={styles.idTypeWithInputRadios} role="radiogroup" aria-label="식별번호 종류">
        {options.map(opt => (
          <label key={opt.id} className={styles.radioOption}>
            <input
              type="radio"
              name={`id-type-${paragraph.id}`}
              value={opt.id}
              checked={selectedId === opt.id}
              disabled={lockResidentIdType}
              onChange={() => {
                if (lockResidentIdType) return
                onChange({
                  ...paragraph,
                  selectedOptionId: opt.id,
                  inputPlaceholder: placeholderForOption(
                    opt.id,
                    paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'
                  ),
                  inputValue: '',
                })
              }}
            />
            <PFText
              as="span"
              typo="bd-md-rg"
              color={selectedId === opt.id ? 'primary-500' : 'black'}
            >
              {opt.label}
            </PFText>
          </label>
        ))}
      </div>
      {isResident ? (
        <div className={styles.idTypeWithInputResident}>
          <PFFormResidentNumberInput
            frontValue={residentParts.front}
            backValue={residentParts.back}
            onFrontChange={value =>
              patchInputValue(joinIdTypeResidentInputValue(value, residentParts.back))
            }
            onBackChange={value =>
              patchInputValue(joinIdTypeResidentInputValue(residentParts.front, value))
            }
          />
        </div>
      ) : (
        <PFTextInput
          variant="formPage"
          size="large"
          className={styles.idTypeWithInputInput}
          placeholder={placeholder}
          value={paragraph.inputValue}
          onValueChange={patchInputValue}
        />
      )}
    </div>
  )
}
