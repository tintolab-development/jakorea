import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'
import { getBirthDateRangeMessage } from '@/features/auth/sign-up/lib/utils'

/**
 * 행정정보 ⑤ 대상자 본인 생년월일 — 회원가입과 같은 생년월일 범위(오늘(KST)까지 · 최대 만 120세).
 * 형식(8자리·실재 날짜) 검사는 공통 패키지(`getMemberConsentInvalidNoticeSubjectContactAlertMessage`) 그대로 둔다.
 */
export function getNoticeSubjectBirthRangeMessage(
  draft: WritingFormDraft,
  now: Date = new Date()
): string | null {
  const subject = draft.paragraphs.find(
    paragraph => paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject
  )
  if (subject == null || subject.kind !== 'single_item' || subject.variant !== 'short_essay') {
    return null
  }
  const birth =
    subject.items?.find(item => item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth)?.bodyText ?? ''
  return getBirthDateRangeMessage(birth, now)
}
