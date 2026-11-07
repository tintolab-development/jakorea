import { applyKoreanPhoneInputChange } from '@jakorea/domain/shared/korean-phone'
import { applyConsentShortEssayItemInput } from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  type SessionPlanShortEssayParagraph,
  type ShortEssayParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { type ChangeEvent, useEffect } from 'react'
import { PFTextInput, PFTextarea } from '@/shared/ui'
import styles from './consent-form.module.css'

type ConsentShortEssayParagraph = ShortEssayParagraph | SessionPlanShortEssayParagraph

function resolveShowItemTitle(paragraph: ConsentShortEssayParagraph, itemCount: number): boolean {
  return itemCount >= 2 ? true : (paragraph.showItemTitle ?? false)
}

function resolveTextareaRows(paragraph: ConsentShortEssayParagraph): 1 | 4 | 5 {
  if (paragraph.variant === 'short_essay') {
    if (paragraph.itemInputRows === 1) return 1
    if (paragraph.itemInputRows === 4) return 4
    if (paragraph.itemInputRows === 5) return 5
  }
  return 5
}

/** 행정정보 ⑤ 대상자 본인 — 시안 라벨 앞 '・' (스키마 시드 문자열이 아니라 렌더 단계에서만 부여) */
const SUBJECT_LABEL_BULLET = '・'

/**
 * 행정정보 ⑤ 생년월일 — Platform 시안(P5) placeholder. CMS 시안(C09)은 `생년월일 8자리를 입력해 주세요`라
 * 스키마 값은 CMS 기준으로 두고 Platform 렌더에서만 바꾼다(입력 형식 검증은 그대로).
 */
const PLATFORM_NOTICE_SUBJECT_BIRTH_PLACEHOLDER = '생년월일을 입력해 주세요'

function isShortEssayVariant(
  current: { kind: string; variant: string },
): current is ConsentShortEssayParagraph {
  return (
    current.kind === 'single_item' &&
    (current.variant === 'short_essay' || current.variant === 'session_plan_short_essay')
  )
}

function commitItemBodyText(
  paragraphId: string,
  itemId: string,
  bodyText: string,
  onUpdateParagraph: FormUpdateParagraph,
) {
  onUpdateParagraph(paragraphId, current => {
    if (!isShortEssayVariant(current)) return current
    const nextItems = (current.items ?? []).map(item =>
      item.id === itemId ? { ...item, bodyText } : item,
    )
    return {
      ...current,
      items: nextItems,
      bodyText: nextItems[0]?.bodyText ?? current.bodyText,
    }
  })
}


/** Platform 동의·양식 — 단일항목 주관식형 fill (schema `showItemTitle` · `itemInputRows` SSOT) */
export function ConsentShortEssayFillFields({
  paragraph,
  onUpdateParagraph,
  lockedNoticeSubjectMemberName,
}: {
  paragraph: ConsentShortEssayParagraph
  onUpdateParagraph: FormUpdateParagraph
  /** 행정정보 `agreement-notice-subject` 성명 — 포털 회원명 고정 */
  lockedNoticeSubjectMemberName?: string
}) {
  const fallbackPlaceholder = paragraph.bodyPlaceholder || '답변을 입력해 주세요'
  const rows = resolveTextareaRows(paragraph)
  const items = paragraph.items ?? []
  const showItemTitle = resolveShowItemTitle(paragraph, items.length)
  const maxLength =
    paragraph.variant === 'short_essay' ? paragraph.maxLength : undefined
  const lockedName = lockedNoticeSubjectMemberName?.trim() ?? ''
  const nameItem = items.find(item => item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name)

  useEffect(() => {
    if (paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subject) return
    if (!lockedName) return
    if (nameItem?.bodyText === lockedName) return
    commitItemBodyText(paragraph.id, AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name, lockedName, onUpdateParagraph)
  }, [lockedName, nameItem?.bodyText, onUpdateParagraph, paragraph.id])

  if (items.length === 0) {
    return (
      <PFTextarea
        variant="formPage"
        size="large"
        rows={rows}
        maxLength={maxLength}
        placeholder={fallbackPlaceholder}
        value={paragraph.bodyText}
        onValueChange={value =>
          onUpdateParagraph(paragraph.id, current =>
            isShortEssayVariant(current) ? { ...current, bodyText: value } : current,
          )
        }
      />
    )
  }

  return (
    <div className={styles.consentShortEssayStack}>
      {items.map(item => {
        const baseLabel =
          showItemTitle && (item.label?.trim() ?? '') ? item.label!.trim() : undefined
        const label =
          baseLabel && paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject
            ? `${SUBJECT_LABEL_BULLET}${baseLabel}`
            : baseLabel
        const isPhone = item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone
        const isBirth = item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth
        const placeholder =
          isBirth && paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject
            ? PLATFORM_NOTICE_SUBJECT_BIRTH_PLACEHOLDER
            : item.placeholder?.trim() || fallbackPlaceholder
        const isLockedNoticeSubjectName =
          paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject &&
          item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name &&
          Boolean(lockedNoticeSubjectMemberName?.trim())

        if (isLockedNoticeSubjectName) {
          return (
            <PFTextInput
              key={item.id}
              variant="formPage"
              size="large"
              label={label}
              value={lockedNoticeSubjectMemberName ?? ''}
              readOnly
              disabled
              width="100%"
            />
          )
        }

        const handleValueChange = (nextRaw: string) => {
          const next = applyConsentShortEssayItemInput(item.id, nextRaw)
          commitItemBodyText(paragraph.id, item.id, next, onUpdateParagraph)
        }

        const handlePhoneChange = isPhone
          ? (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
              const nextValue = applyKoreanPhoneInputChange(
                item.bodyText,
                event.target.value,
                event.target.selectionStart,
              ).formatted
              event.target.value = nextValue
              commitItemBodyText(paragraph.id, item.id, nextValue, onUpdateParagraph)
            }
          : undefined

        // 단일행(itemInputRows 1) — 시안 field/h44: PFTextInput(large = h44 · radius 12)
        if (rows === 1) {
          return (
            <PFTextInput
              key={item.id}
              variant="formPage"
              size="large"
              label={label}
              placeholder={placeholder}
              value={item.bodyText}
              maxLength={isBirth ? 10 : isPhone ? 13 : maxLength}
              inputMode={isBirth || isPhone ? 'numeric' : undefined}
              autoComplete={isPhone ? 'tel' : undefined}
              width="100%"
              onValueChange={
                isPhone
                  ? value => {
                      // 입력 지우기 버튼 — 전화번호는 onChange로 포맷하므로 빈 값만 반영
                      if (value === '') commitItemBodyText(paragraph.id, item.id, '', onUpdateParagraph)
                    }
                  : handleValueChange
              }
              onChange={handlePhoneChange}
            />
          )
        }

        return (
          <PFTextarea
            key={item.id}
            variant="formPage"
            size="large"
            rows={rows}
            label={label}
            placeholder={placeholder}
            value={item.bodyText}
            maxLength={isBirth ? 10 : isPhone ? 13 : maxLength}
            inputMode={isBirth || isPhone ? 'numeric' : undefined}
            autoComplete={isPhone ? 'tel' : undefined}
            onValueChange={isPhone ? undefined : handleValueChange}
            onChange={handlePhoneChange}
          />
        )
      })}
    </div>
  )
}
