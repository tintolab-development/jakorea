import type {
  FormTitleNumberingStyle,
  SurveyWriteTitleSlot,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  getSurveyWriteTitleNumberPrefix as getSharedSurveyWriteTitleNumberPrefix,
  writingOutlineLabel,
} from '@/features/template/model/writing-form-draft.schema'

export { getSurveyWriteTitleSequence } from '@/features/template/model/writing-form-draft.schema'

/** 번호 대상 단락에 대해 1부터 부여되는 순번 (전체 paragraphs 순서 기준) */
export function getTitleNumberSequenceIndex(
  paragraphs: WritingFormParagraph[],
  paragraphId: string
): number | null {
  let n = 0
  for (const p of paragraphs) {
    if (!p.participatesInTitleNumbering) continue
    n += 1
    if (p.id === paragraphId) return n
  }
  return null
}

function formatToken(style: FormTitleNumberingStyle, sequence: number): string {
  if (style === 'none') return ''
  if (style === 'numeric') return `${sequence}`
  if (style === 'alpha') {
    let n = sequence
    let s = ''
    while (n > 0) {
      const rem = (n - 1) % 26
      s = String.fromCharCode(65 + rem) + s
      n = Math.floor((n - 1) / 26)
    }
    return s
  }
  if (style === 'q_repeat') return 'Q'
  if (style === 'q123') return `Q${sequence}`
  return `${sequence}`
}

/** 설문 write — `user_info`는 선택 필드 수만큼 Q를 소비. edit 번호는 `getFormParagraphTitleNumberPrefix` */
export function getSurveyWriteFormTitleNumberPrefix(
  paragraphs: WritingFormParagraph[],
  slot: SurveyWriteTitleSlot,
  style: FormTitleNumberingStyle
): string | undefined {
  return getSharedSurveyWriteTitleNumberPrefix(paragraphs, slot, style)
}

/** 카드 제목 `ParagraphInput` 앞 번호 접두 (예: `1. `, `A. `) — 번호 없으면 undefined */
export function getFormParagraphTitleNumberPrefix(
  paragraphs: WritingFormParagraph[],
  paragraph: WritingFormParagraph,
  style: FormTitleNumberingStyle
): string | undefined {
  if (!paragraph.participatesInTitleNumbering || style === 'none') return undefined
  const seq = getTitleNumberSequenceIndex(paragraphs, paragraph.id)
  if (seq == null) return undefined
  const token = formatToken(style, seq)
  if (!token) return undefined
  if (style === 'q_repeat') return `${token}. `
  return `${token}. `
}

/** 카드/헤더용: 접두 + 구분자 + 원문 타이틀(또는 아웃라인 라벨) */
export function getFormParagraphDisplayTitle(
  paragraphs: WritingFormParagraph[],
  paragraph: WritingFormParagraph,
  style: FormTitleNumberingStyle
): string {
  const base =
    paragraph.kind === 'description' && paragraph.variant === 'closing'
      ? writingOutlineLabel(paragraph)
      : (paragraph.paragraphTitle ?? '').trim() || writingOutlineLabel(paragraph)

  if (!paragraph.participatesInTitleNumbering || style === 'none') {
    if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
      return base === '제목 없음' ? '제목 없음' : base
    }
    if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
      return base
    }
    return base
  }

  const seq = getTitleNumberSequenceIndex(paragraphs, paragraph.id)
  if (seq == null) return base

  const token = formatToken(style, seq)
  if (!token) return base

  if (style === 'q_repeat') {
    return `${token}. ${base}`
  }
  return `${token}. ${base}`
}

/**
 * 우측 「커스텀 필드」 목록 줄에 쓸 번호 스타일.
 * 템플릿 관리 화면에서 「미선택」(`none`)이면 목록만 `numeric`(시안 「1. 참여 기관 모집 정보」)으로 번호를 붙인다.
 * 설문(`survey: true`)은 템플릿 관리 화면에서 타이틀 번호(Q1·Q 등)와 관계없이 목록만 단락 순번 숫자
 * (시안 5767:42989·5767:43362·12723:137188 「1. 설문자 정보」 — 카드 제목은 「Q1.」).
 * 설정 값·좌측 카드 제목·미리보기·문서·플랫폼은 원래 스타일 그대로이며, 그 밖의 스타일은 그대로 돌려준다.
 */
export function resolveNavTitleNumberingStyle(
  style: FormTitleNumberingStyle,
  isTemplateManagement: boolean,
  options?: { survey?: boolean }
): FormTitleNumberingStyle {
  if (!isTemplateManagement) return style
  if (options?.survey === true) return 'numeric'
  return style === 'none' ? 'numeric' : style
}

/** 우측 네비 한 줄 */
export function getFormNavDisplayLine(
  paragraphs: WritingFormParagraph[],
  paragraph: WritingFormParagraph,
  style: FormTitleNumberingStyle
): string {
  return getFormParagraphDisplayTitle(paragraphs, paragraph, style)
}

const NAV_EMPTY_TITLE_PLACEHOLDER = '타이틀을 입력해 주세요'

export type TemplateManagementNavLine = {
  id: string
  displayLine: string
  /** 회색 안내 줄 — `FormEditorFieldNav`가 템플릿 관리 화면에서만 적용 */
  placeholder: boolean
  /** 이동 핸들 없는 고정 행 — `FormEditorFieldNav`가 템플릿 관리 화면에서만 적용 */
  pinned: boolean
}

/**
 * 템플릿 관리 우측 「커스텀 필드」 목록 한 줄 (시안 12723:137188·5767:42989·5767:43362·5767:49321·5767:41865·
 * 5767:42072·16046:109928).
 * - 제목형 단락: 빈 제목이면 `titlePlaceholder`(「설문 제목 입력」·「동의서 제목 입력」) 회색, 항상 고정
 * - 마무리글: `closingPlaceholder`면 회색(설문·직접 등록 동의 시안), 항상 고정
 * - 대리 확인 문구 카드(`proxyConfirmHost`, 제목 없는 설명형): 본문 첫 줄(지급조서·영수증 사전 동의서 시안)
 * - 그 밖에 제목 없는 단락: 번호 + 「타이틀을 입력해 주세요」 회색
 * - `pinnedIds`(구조 잠금 단락): 핸들 없이 고정
 * - `navLabel`: 목록 전용 문구(시안이 카드 제목과 다른 시드 단락). 값이 있으면 번호 + 그 문구, 카드 제목·저장값은 그대로
 */
export function buildTemplateManagementNavLine(
  paragraphs: WritingFormParagraph[],
  paragraph: WritingFormParagraph,
  style: FormTitleNumberingStyle,
  options: {
    titlePlaceholder: string
    closingPlaceholder: boolean
    proxyConfirmHost?: boolean
    pinnedIds?: ReadonlySet<string>
    navLabel?: (paragraph: WritingFormParagraph) => string | undefined
  }
): TemplateManagementNavLine {
  const pinnedById = options.pinnedIds?.has(paragraph.id) ?? false
  const navLabel = options.navLabel?.(paragraph)
  const displayLineOf = () =>
    navLabel != null
      ? `${getFormParagraphTitleNumberPrefix(paragraphs, paragraph, style) ?? ''}${navLabel}`
      : getFormNavDisplayLine(paragraphs, paragraph, style)
  if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
    const empty = paragraph.surveyTitle.trim() === ''
    return {
      id: paragraph.id,
      displayLine: empty ? options.titlePlaceholder : displayLineOf(),
      placeholder: empty,
      pinned: true,
    }
  }
  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    return {
      id: paragraph.id,
      displayLine: displayLineOf(),
      placeholder: options.closingPlaceholder,
      pinned: true,
    }
  }
  if (paragraph.kind === 'description' || (paragraph.paragraphTitle ?? '').trim() !== '') {
    return {
      id: paragraph.id,
      displayLine: displayLineOf(),
      placeholder: false,
      pinned: pinnedById,
    }
  }
  if (
    options.proxyConfirmHost === true &&
    paragraph.variant === 'agreement_explanation_text' &&
    paragraph.bodyText.trim() !== ''
  ) {
    return {
      id: paragraph.id,
      displayLine: paragraph.bodyText.trim().split('\n')[0] ?? '',
      placeholder: false,
      pinned: pinnedById,
    }
  }
  const prefix = getFormParagraphTitleNumberPrefix(paragraphs, paragraph, style) ?? ''
  return {
    id: paragraph.id,
    displayLine: `${prefix}${NAV_EMPTY_TITLE_PLACEHOLDER}`,
    placeholder: true,
    pinned: pinnedById,
  }
}
