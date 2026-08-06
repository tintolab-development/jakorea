import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  normalizeWritingFormDraft,
  type VerticalTableRow,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { User } from '@/types/user'

export type MemberConsentMemberContext = {
  name: string
  schoolEnrollmentStatus: 'enrolled' | 'not_enrolled'
  schoolName?: string
  grade?: string
  affiliationOrganization?: string
  /** 초상권 동의서 소속 셀렉트 고정 옵션(강사 신규 등록 등) */
  portraitAffiliationSelectOptions?: ReadonlyArray<{ value: string; label: string }>
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
  const affiliationCell =
    ctx.portraitAffiliationSelectOptions != null && ctx.portraitAffiliationSelectOptions.length > 0
      ? ''
      : (() => {
          const affiliation =
            ctx.schoolEnrollmentStatus === 'enrolled'
              ? [ctx.schoolName, ctx.grade].map(part => part?.trim()).filter(Boolean).join(' ')
              : ctx.affiliationOrganization?.trim() ?? ''
          return affiliation || '소속 없음'
        })()

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

/** 회원 신규 등록 — `agreement-portrait` 양식에 기본 정보 반영 */
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

const USER_AFFILIATION_PIPE_SEP = ' | ' as const

/** 회원 상세 — 동의서 보기 모달용 회원 컨텍스트 */
export function buildMemberConsentContextFromUser(
  user: Pick<User, 'name' | 'schoolEnrollmentStatus' | 'affiliation'>
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
    schoolEnrollmentStatus: enrolled ? 'enrolled' : 'not_enrolled',
    schoolName: enrolled ? primaryAffiliation || undefined : undefined,
    grade: enrolled && affiliationSuffix ? affiliationSuffix : undefined,
    affiliationOrganization: !enrolled ? primaryAffiliation || undefined : undefined,
  }
}
