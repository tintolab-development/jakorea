import type {
  SurveyParagraph,
  SurveyTitleNumberingStyle,
} from '@/features/template/model/survey-draft.schema'
import { surveyOutlineLabel } from '@/features/template/model/survey-draft.schema'

/** 번호 대상 단락에 대해 1부터 부여되는 순번 (전체 paragraphs 순서 기준) */
export function getTitleNumberSequenceIndex(
  paragraphs: SurveyParagraph[],
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

function formatToken(style: SurveyTitleNumberingStyle, sequence: number): string {
  if (style === 'none') return ''
  if (style === 'numeric') return `${sequence}`
  if (style === 'alpha') {
    // 1 -> A, 26 -> Z, 27 -> AA (간단 구현)
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

/** 카드/헤더용: 접두 + 구분자 + 원문 타이틀(또는 아웃라인 라벨) */
export function getSurveyParagraphDisplayTitle(
  paragraphs: SurveyParagraph[],
  paragraph: SurveyParagraph,
  style: SurveyTitleNumberingStyle
): string {
  const base =
    paragraph.kind === 'description' && paragraph.variant === 'closing'
      ? surveyOutlineLabel(paragraph)
      : paragraph.paragraphTitle.trim() || surveyOutlineLabel(paragraph)

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

/** 우측 네비 한 줄(스크린샷: "Q1. 설문자 정보" 등) */
export function getSurveyNavDisplayLine(
  paragraphs: SurveyParagraph[],
  paragraph: SurveyParagraph,
  style: SurveyTitleNumberingStyle
): string {
  return getSurveyParagraphDisplayTitle(paragraphs, paragraph, style)
}
