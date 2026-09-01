import {
  formatConsentBirthDateInput,
  formatConsentPhoneInput,
} from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  normalizeWritingFormDraft,
  type VerticalTableRow,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { User } from '@/types/user'

export type MemberConsentMemberContext = {
  name: string
  birthDate?: string
  phone?: string
  schoolEnrollmentStatus: 'enrolled' | 'not_enrolled'
  schoolName?: string
  grade?: string
  affiliationOrganization?: string
  affiliationNone?: boolean
  /** 초상권 동의서 소속 셀렉트 고정 옵션(강사 신규 등록 등) */
  portraitAffiliationSelectOptions?: ReadonlyArray<{ value: string; label: string }>
}

function birthDateToNoticeValue(birthDate: string | undefined): string {
  const digits = birthDate?.replace(/\D/g, '') ?? ''
  if (digits.length === 8) return formatConsentBirthDateInput(digits)
  return ''
}

function resolvePortraitAffiliationCell(ctx: MemberConsentMemberContext): string {
  if (ctx.affiliationNone) return '소속 없음'

  if (ctx.schoolEnrollmentStatus === 'enrolled') {
    const affiliation = [ctx.schoolName, ctx.grade].map(part => part?.trim()).filter(Boolean).join(' ')
    if (affiliation) return affiliation
  }

  const organization = ctx.affiliationOrganization?.trim()
  if (organization) return organization

  return ''
}

function fillPersonalConsentTable(
  paragraph: WritingFormParagraph,
  ctx: MemberConsentMemberContext
): WritingFormParagraph {
  if (paragraph.id !== AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable) {
    return paragraph
  }
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'vertical_table') {
    return paragraph
  }

  const name = ctx.name.trim() || '한글 성명'
  const affiliationCell = resolvePortraitAffiliationCell(ctx)

  const rows: VerticalTableRow[] = [
    {
      stageCount: 2,
      headers: ['성명', '소속'],
      cells: [name, affiliationCell],
    },
    ...paragraph.rows.slice(1),
  ]

  return { ...paragraph, rows }
}

function fillNoticeSubjectParagraph(
  paragraph: WritingFormParagraph,
  ctx: MemberConsentMemberContext
): WritingFormParagraph {
  if (paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subject) {
    return paragraph
  }
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') {
    return paragraph
  }

  const name = ctx.name.trim()
  const birth = birthDateToNoticeValue(ctx.birthDate)
  const phone = ctx.phone?.trim() ?? ''

  return {
    ...paragraph,
    items: (paragraph.items ?? []).map(item => {
      if (item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name) {
        return { ...item, bodyText: name }
      }
      if (item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth) {
        return { ...item, bodyText: birth }
      }
      if (item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone) {
        return { ...item, bodyText: formatConsentPhoneInput(phone) }
      }
      return item
    }),
  }
}

/**
 * 동의-only 보기 미리보기용. 동의서 **작성(write)** 모달에서는 사용하지 않는다.
 */
export function applyMemberPortraitConsentPrefill(
  draft: WritingFormDraft,
  ctx: MemberConsentMemberContext
): WritingFormDraft {
  const normalized = normalizeWritingFormDraft(draft)
  return {
    ...normalized,
    paragraphs: normalized.paragraphs.map(paragraph => fillPersonalConsentTable(paragraph, ctx)),
  }
}

/**
 * 동의-only 보기 미리보기용 — 미선택 multiple_choice·표 하단 동의에 「동의」선택.
 * 동의서 **작성(write)** 모달에서는 사용하지 않는다.
 */
export function applyEducatorFacilitatorPledgeDefaultAgree(
  draft: WritingFormDraft
): WritingFormDraft {
  const normalized = normalizeWritingFormDraft(draft)
  return {
    ...normalized,
    paragraphs: normalized.paragraphs.map(paragraph => {
      let next = paragraph

      if ('showBottomConsent' in next && next.showBottomConsent === true && next.bottomConsent == null) {
        next = { ...next, bottomConsent: 'agree' }
      }

      if (next.kind !== 'single_item' || next.variant !== 'multiple_choice') {
        return next
      }
      if (next.selectedPreviewSingleId != null && next.selectedPreviewSingleId !== '') {
        return next
      }
      const agree = next.items.find(
        item => item.label.trim() === '동의' || item.id.includes('-agree')
      )
      if (agree == null) return next
      return { ...next, selectedPreviewSingleId: agree.id }
    }),
  }
}

/**
 * 동의-only 보기 미리보기용. 동의서 **작성(write)** 모달에서는 사용하지 않는다.
 */
export function applyMemberNoticeConsentPrefill(
  draft: WritingFormDraft,
  ctx: MemberConsentMemberContext
): WritingFormDraft {
  const normalized = normalizeWritingFormDraft(draft)
  return {
    ...normalized,
    paragraphs: normalized.paragraphs.map(paragraph => fillNoticeSubjectParagraph(paragraph, ctx)),
  }
}

const USER_AFFILIATION_PIPE_SEP = ' | ' as const

/** 회원 상세 — 동의서 보기(동의-only 미리보기)용 회원 컨텍스트 */
export function buildMemberConsentContextFromUser(
  user: Pick<User, 'name' | 'schoolEnrollmentStatus' | 'affiliation'> & {
    birthDate?: string
    phone?: string
  }
): MemberConsentMemberContext {
  const enrolled = user.schoolEnrollmentStatus === 'ENROLLED'
  const affiliationRaw = user.affiliation?.trim() ?? ''
  const pipeIdx = affiliationRaw.indexOf(USER_AFFILIATION_PIPE_SEP)
  const primaryAffiliation =
    pipeIdx === -1 ? affiliationRaw : affiliationRaw.slice(0, pipeIdx).trim()
  const affiliationSuffix =
    pipeIdx === -1 ? '' : affiliationRaw.slice(pipeIdx + USER_AFFILIATION_PIPE_SEP.length).trim()

  return {
    name: user.name?.trim() ?? '',
    birthDate: user.birthDate,
    phone: user.phone,
    schoolEnrollmentStatus: enrolled ? 'enrolled' : 'not_enrolled',
    schoolName: enrolled ? primaryAffiliation || undefined : undefined,
    grade: enrolled && affiliationSuffix ? affiliationSuffix : undefined,
    affiliationOrganization: !enrolled ? primaryAffiliation || undefined : undefined,
  }
}
