import {
  createEducatorFacilitatorPledgeDraft,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/**
 * 교육진행자 서약서 — 템플릿 관리 우측 「커스텀 필드」 목록 전용 문구 (시안 5767:41865·12956:1678).
 * 좌측 카드 제목(시드)과 문구가 다른 단락만. 카드 제목·저장값·미리보기·문서는 그대로.
 */
const PLEDGE_NAV_LABEL_BY_ID: Readonly<Record<string, string>> = {
  [EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title]: 'JA Korea 교육진행자 서약서(안)',
  [EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause1]: '아동·청소년 보호와 성범죄 예방',
  [EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause2]: '종교적 정치적 중립성 유지',
}

function seedTitleOf(paragraph: WritingFormParagraph): string {
  if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
    return paragraph.surveyTitle.trim()
  }
  return (paragraph.paragraphTitle ?? '').trim()
}

/** 시드 초안의 단락 제목 — 사용자가 제목을 바꾸지 않았을 때만 목록 전용 문구로 바꾼다 */
const PLEDGE_SEED_TITLE_BY_ID: ReadonlyMap<string, string> = new Map(
  createEducatorFacilitatorPledgeDraft().paragraphs.map(p => [p.id, seedTitleOf(p)])
)

/**
 * 목록 줄 문구(번호 접두 제외). 해당 없으면 undefined → 기본 줄(카드 제목) 사용.
 * - 시드 제목 그대로인 제목·조항: 시안 목록 문구
 * - 사용자가 제목을 바꾼 경우: 사용자 제목(기본 줄)
 * - 위반 동의 마무리글: 본문 첫 줄 전체(시안 「본 서약을 위반할 경우, …」 — 목록 말줄임은 CSS)
 */
export function resolveEducatorPledgeNavLabel(paragraph: WritingFormParagraph): string | undefined {
  if (
    paragraph.id === EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing &&
    paragraph.kind === 'description' &&
    paragraph.variant === 'closing'
  ) {
    const firstLine = paragraph.body.trim().split('\n')[0]?.trim() ?? ''
    return firstLine === '' ? undefined : firstLine
  }
  const navLabel = PLEDGE_NAV_LABEL_BY_ID[paragraph.id]
  if (navLabel == null) return undefined
  return seedTitleOf(paragraph) === PLEDGE_SEED_TITLE_BY_ID.get(paragraph.id) ? navLabel : undefined
}
