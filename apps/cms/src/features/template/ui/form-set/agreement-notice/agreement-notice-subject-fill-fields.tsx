import { applyConsentShortEssayItemInput } from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  type ShortEssayParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useDeferredFieldCommit } from '@/features/template/ui/shared/use-deferred-field-commit'
import { CmsDateTextInput, CmsInput, CmsPhoneInput } from '@/shared/ui'
import './agreement-notice-subject-fill-fields.css'

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

function SubjectFillField({
  itemId,
  label,
  placeholder,
  kind,
  bodyText,
  isBodyInteractive,
  onCommitBody,
}: {
  itemId: string
  label: string
  placeholder: string
  kind: 'name' | 'birth' | 'phone'
  bodyText: string
  isBodyInteractive: boolean
  onCommitBody: (itemId: string, bodyText: string) => void
}) {
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(
    bodyText,
    isBodyInteractive
      ? next => onCommitBody(itemId, applyConsentShortEssayItemInput(itemId, next))
      : undefined
  )

  const commitFormatted = (nextRaw: string) => {
    setEditValue(applyConsentShortEssayItemInput(itemId, nextRaw))
    flushEditValue()
  }

  const control =
    kind === 'name' ? (
      <CmsInput
        id={`notice-subject-${itemId}`}
        inputSize="large"
        width="100%"
        value={editValue}
        placeholder={placeholder}
        readOnly={!isBodyInteractive}
        onChange={
          isBodyInteractive
            ? e => setEditValue(applyConsentShortEssayItemInput(itemId, e.target.value))
            : undefined
        }
        onBlur={isBodyInteractive ? () => commitFormatted(editValue) : undefined}
      />
    ) : kind === 'birth' ? (
      <CmsDateTextInput
        id={`notice-subject-${itemId}`}
        inputSize="large"
        width="100%"
        value={editValue}
        placeholder={placeholder}
        maxLength={10}
        readOnly={!isBodyInteractive}
        onValueChange={
          isBodyInteractive
            ? value => setEditValue(applyConsentShortEssayItemInput(itemId, value))
            : undefined
        }
        onBlur={isBodyInteractive ? () => commitFormatted(editValue) : undefined}
      />
    ) : (
      <CmsPhoneInput
        id={`notice-subject-${itemId}`}
        inputSize="large"
        width="100%"
        value={editValue}
        placeholder={placeholder}
        readOnly={!isBodyInteractive}
        onChange={
          isBodyInteractive
            ? event => setEditValue(applyConsentShortEssayItemInput(itemId, event.target.value))
            : undefined
        }
        onBlur={isBodyInteractive ? () => commitFormatted(editValue) : undefined}
      />
    )

  return (
    <div className="agreement-notice-subject-fill-field">
      <span className="agreement-notice-subject-fill-field__label">
        <span className="agreement-notice-subject-fill-field__bullet" aria-hidden>
          ·
        </span>
        {label}
      </span>
      <div className="agreement-notice-subject-fill-field__control">{control}</div>
    </div>
  )
}

/** 행정정보「대상자 본인」— 동의서 작성(fill) 전용. ShortEssay 항목 선택 UX 없이 입력만 */
export function AgreementNoticeSubjectFillFields({
  paragraph,
  onChange,
  isBodyInteractive,
}: {
  paragraph: ShortEssayParagraph
  onChange: (next: ShortEssayParagraph) => void
  isBodyInteractive: boolean
}) {
  const updateItemBodyText = (itemId: string, bodyText: string) => {
    const currentItems = paragraph.items ?? []
    const nextItems = currentItems.map(item => (item.id === itemId ? { ...item, bodyText } : item))
    onChange({
      ...paragraph,
      items: nextItems,
      bodyText: nextItems[0]?.bodyText ?? '',
    })
  }

  return (
    <div className="agreement-notice-subject-fill-fields">
      {SUBJECT_FIELD_SPECS.map(spec => (
        <SubjectFillField
          key={spec.itemId}
          itemId={spec.itemId}
          label={spec.label}
          placeholder={
            paragraph.items?.find(item => item.id === spec.itemId)?.placeholder?.trim() ||
            spec.placeholder
          }
          kind={spec.kind}
          bodyText={readItemBodyText(paragraph, spec.itemId)}
          isBodyInteractive={isBodyInteractive}
          onCommitBody={updateItemBodyText}
        />
      ))}
    </div>
  )
}
