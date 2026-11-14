import type { MultipleChoiceParagraph } from '@/features/template/model/writing-form-draft.schema'
import { resolveUjatInstitutionSubmitConfirmationItemLabel } from '@/features/template/lib/ujat-institution-submit-confirmation-label'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

type UjatProgramApplicationSubmitConfirmationParagraphProps = {
  paragraph: MultipleChoiceParagraph
  onChange: (next: MultipleChoiceParagraph) => void
  readOnlyPreview?: boolean
  choiceDisplayOnly?: boolean
  replaceYearPlaceholder?: boolean
}

/**
 * UJAT 참여 기관 신청 — 제출 확인 1항을 시안(node 12875:515171)과 같이 라디오 1개로 표시.
 * 템플릿 관리 화면은 미선택으로 시작하고, 값은 기존과 같이 selectedPreviewSingleId(선택 = 항목 id)로 저장한다.
 */
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
        <CmsRadioGroup
          className="multiple-choice-radio-group"
          size="medium"
          disabled={controlDisabled}
          value={checked ? item.id : null}
          onChange={() => {
            if (!interactive) return
            onChange({
              ...paragraph,
              selectedPreviewSingleId: item.id,
              selectedPreviewMultipleIds: [],
            })
          }}
        >
          <div role="presentation" className="multiple-choice-row">
            <CmsRadio value={item.id} disabled={controlDisabled}>
              {label}
            </CmsRadio>
          </div>
        </CmsRadioGroup>
      ) : null}
    </div>
  )
}
