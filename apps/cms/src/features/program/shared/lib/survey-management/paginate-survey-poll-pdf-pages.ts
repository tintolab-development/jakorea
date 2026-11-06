import type { SurveyPollResultSection } from './aggregate-survey-poll-results'

/** A4 한 장에 넣는 척도 문항 수. 서술형은 행이 길어질 수 있어 문항당 1페이지. */
export const SURVEY_POLL_PDF_SCALE_SECTIONS_PER_PAGE = 3

/**
 * 설문·만족도 결과 PDF 캡처용 페이지 묶음.
 * 빈 결과도 헤더·요약이 보이도록 1페이지를 남긴다.
 *
 * 모든 문항을 A4 1장(`overflow: hidden`)에 넣으면 2페이지 이후가 잘린다.
 * html2canvas는 `[data-form-document-pdf-page]` 개수만큼만 캡처하므로 반드시 여러 장으로 나눈다.
 */
export function paginateSurveyPollPdfSections(
  sections: readonly SurveyPollResultSection[],
  scalePerPage = SURVEY_POLL_PDF_SCALE_SECTIONS_PER_PAGE
): SurveyPollResultSection[][] {
  const perPage = Math.max(1, scalePerPage)
  if (sections.length === 0) return [[]]

  const pages: SurveyPollResultSection[][] = []
  let currentScalePage: SurveyPollResultSection[] = []

  const flushScalePage = () => {
    if (currentScalePage.length === 0) return
    pages.push(currentScalePage)
    currentScalePage = []
  }

  for (const section of sections) {
    if (section.kind === 'text') {
      flushScalePage()
      pages.push([section])
      continue
    }
    if (currentScalePage.length >= perPage) {
      flushScalePage()
    }
    currentScalePage.push(section)
  }
  flushScalePage()
  return pages
}
