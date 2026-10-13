import { applyKoreanPhoneInputChange } from '@jakorea/domain/shared/korean-phone'
import { applyConsentShortEssayItemInput, formatConsentBirthDateInput } from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  type ShortEssayParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFTextInput } from '@/shared/ui'

const SUBJECT_FIELD_SPECS = [
  {
    itemId: AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name,
    label: '성명',
    placeholder: '성명을 입력해 주세요',
    kind: 'name' as const,
  },
  {
    itemId: AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth,
    label: '생년월일',
    placeholder: '생년월일 8자리를 입력해 주세요',
    kind: 'birth' as const,
  },
  {
    itemId: AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone,
    label: '전화번호',
    placeholder: '전화번호를 입력해 주세요',
    kind: 'phone' as const,
  },
]

function readItemBodyText(paragraph: ShortEssayParagraph, itemId: string): string {
  return paragraph.items?.find(item => item.id === itemId)?.bodyText ?? ''
}

/** 행정정보「5. 대상자 본인」— 시안: 상단 회색 라벨 + formPage 입력(플레이스홀더는 schema) */
export function AgreementNoticeSubjectFillFields({
  paragraph,
  onUpdateParagraph,
}: {
  paragraph: ShortEssayParagraph
  onUpdateParagraph: FormUpdateParagraph
}) {
  const commitItem = (itemId: string, bodyText: string) => {
    onUpdateParagraph(paragraph.id, current => {
      if (current.kind !== 'single_item' || current.variant !== 'short_essay') {
        return current
      }
      const nextItems = (current.items ?? []).map(item =>
        item.id === itemId ? { ...item, bodyText } : item,
      )
      return {
        ...current,
        items: nextItems,
        bodyText: nextItems[0]?.bodyText ?? '',
      }
    })
  }

  return (
    <PFFormFieldTable>
      {SUBJECT_FIELD_SPECS.map(spec => {
        const item = paragraph.items?.find(entry => entry.id === spec.itemId)
        const placeholder = item?.placeholder?.trim() || spec.placeholder
        const value = readItemBodyText(paragraph, spec.itemId)

        return (
          <PFFormFieldRow key={spec.itemId} type="single">
            <PFFormField label={spec.label} layout="vertical">
              <PFTextInput
                variant="formPage"
                size="large"
                value={value}
                placeholder={placeholder}
                inputMode={spec.kind === 'birth' || spec.kind === 'phone' ? 'numeric' : undefined}
                maxLength={
                  spec.kind === 'birth' ? 10 : spec.kind === 'phone' ? 13 : undefined
                }
                type={spec.kind === 'phone' ? 'tel' : undefined}
                autoComplete={spec.kind === 'phone' ? 'tel' : undefined}
                onValueChange={
                  spec.kind === 'birth'
                    ? next => commitItem(spec.itemId, formatConsentBirthDateInput(next))
                    : spec.kind === 'name'
                      ? next =>
                          commitItem(spec.itemId, applyConsentShortEssayItemInput(spec.itemId, next))
                      : undefined
                }
                onChange={
                  spec.kind === 'phone'
                    ? event => {
                        const nextValue = applyKoreanPhoneInputChange(
                          value,
                          event.target.value,
                          event.target.selectionStart,
                        ).formatted
                        event.target.value = nextValue
                        commitItem(spec.itemId, nextValue)
                      }
                    : undefined
                }
              />
            </PFFormField>
          </PFFormFieldRow>
        )
      })}
    </PFFormFieldTable>
  )
}
