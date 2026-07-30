import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { portraitPersonalConsentNameValue } from '@/features/template/ui/paragraph/table/agreement-portrait-personal-consent-name-row'

/** 사용자(작성) 모드 — 성명 미입력 시 확인·서명란 표시 */
export const AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER = '(작성자)'

const NOTICE_SUBJECT_NAME_ITEM_ID = 'agreement-notice-subj-name'

function extractPortraitName(paragraphs: WritingFormParagraph[]): string {
  const table = paragraphs.find(p => p.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable)
  if (table == null || table.kind !== 'single_item' || table.variant !== 'vertical_table') {
    return ''
  }
  return portraitPersonalConsentNameValue(table.rows[0]?.cells[0] ?? '')
}

function extractNoticeSubjectName(paragraphs: WritingFormParagraph[]): string {
  const subject = paragraphs.find(p => p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject)
  if (subject == null || subject.kind !== 'single_item' || subject.variant !== 'short_essay') {
    return ''
  }
  const item = subject.items?.find(entry => entry.id === NOTICE_SUBJECT_NAME_ITEM_ID)
  return item?.bodyText?.trim() ?? ''
}

/**
 * 동의서 draft에 성명 입력란이 있으면 그 값을 반환.
 * 지급조서 기본정보는 draft 밖(로컬 폼)이라 호출측에서 별도 전달.
 */
export function extractAgreementDraftAuthorName(
  templateId: string,
  draft: WritingFormDraft | null | undefined
): string {
  if (draft == null) return ''
  const paragraphs = draft.paragraphs

  if (templateId === 'agreement-portrait') {
    return extractPortraitName(paragraphs)
  }
  if (templateId === 'agreement-notice') {
    return extractNoticeSubjectName(paragraphs)
  }
  return ''
}

/** 사용자 모드 표시명 — 비어 있으면 `(작성자)` */
export function resolveAgreementUserModeAuthorDisplayName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER
}
