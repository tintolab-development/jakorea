import type { MultipleChoiceParagraph } from '@/features/template/model/writing-form-draft.schema'
import { resolveUjatInstitutionSubmitConfirmationItemLabel } from '@/features/template/lib/ujat-institution-submit-confirmation-label'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

type UjatProgramApplicationSubmitConfirmationParagraphProps = {
  paragraph: MultipleChoiceParagraph
  onChange: (next: MultipleChoiceParagraph) => void
  readOnlyPreview?: boolean
  choiceDisplayOnly?: boolean
  replaceYearPlaceholder?: boolean
}

/** UJAT 참여 기관 신청 — 제출 확인 1항을 시안과 같이 체크박스로 표시 */
export function UjatProgramApplicationSubmitConfirmationParagraph({
  paragraph,
  onChange,
  readOnlyPreview = false,
  choiceDisplayOnly = false,
  replaceYearPlaceholder = false,
}: UjatProgramApplicationSubmitConfirmationParagraphProps) {
  const item = paragraph.items[0]
  const interactive = !readOnlyPreview && !choiceDisplayOnly
  const controlDisabled = readOnlyPreview && !choiceDisplayOnly
  const checked = choiceDisplayOnly
    ? false
    : item != null && paragraph.selectedPreviewSingleId === item.id
  const label = item
    ? replaceYearPlaceholder
      ? resolveUjatInstitutionSubmitConfirmationItemLabel(item.label)
      : item.label
    : ''

  return (
    <div
      className="multiple-choice-body"
      style={interactive ? undefined : { pointerEvents: 'none' }}
    >
      {item ? (
        <div role="presentation" className="multiple-choice-row">
          <CmsCheckbox
            checkboxSize="medium"
            checked={checked}
            disabled={controlDisabled}
            onChange={e => {
              if (!interactive) return
              onChange({
                ...paragraph,
                selectedPreviewSingleId: e.target.checked ? item.id : null,
                selectedPreviewMultipleIds: [],
              })
            }}
          />
          <span className="multiple-choice-row__label">{label}</span>
        </div>
      ) : null}
    </div>
  )
}
