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

/** A4 한 쪽(794×1123px 캡처 기준)에 문항을 담을 때 쓰는 실측값 */
export type SurveyPollPdfMeasurements = {
  /** 첫 쪽에서 머리말·요약(총 N명 응답)을 뺀 문항 영역 높이 */
  pageContentHeight: number
  /** 2쪽부터의 문항 영역 높이 — 머리말·요약은 첫 쪽에만 그리므로 쪽 여백만 뺀다. 생략 시 첫 쪽과 같다. */
  continuationPageContentHeight?: number
  /** 문항 카드 사이 간격 */
  sectionGap: number
  /** 문항 카드 최소 높이(CSS min-height) — 서술형을 나눈 조각도 이 높이보다 작아지지 않는다 */
  minSectionHeight: number
  /** `sections`와 같은 순서. 서술형은 답변 행 높이(`rowHeights`)를 함께 잰다. */
  sections: ReadonlyArray<{ height: number; rowHeights?: readonly number[] }>
}

export type SurveyPollPdfPageItem = {
  key: string
  /** 서술형이 여러 쪽으로 나뉘면 `rows`는 그 쪽에 들어간 답변만 담는다. */
  section: SurveyPollResultSection
}

/**
 * 실측 높이로 문항을 A4 쪽에 차례로 채운다. 남은 공간에 들어가지 않는 문항은 다음 쪽으로 넘기고,
 * 한 쪽보다 긴 서술형은 답변 행 단위로 다음 쪽에 이어 쓴다. 한 행도 들어가지 않는 빈 쪽이면 넘치더라도 놓는다.
 */
export function paginateSurveyPollPdfSectionsByHeight(
  sections: readonly SurveyPollResultSection[],
  measurements: SurveyPollPdfMeasurements
): SurveyPollPdfPageItem[][] {
  if (sections.length === 0) return [[]]

  const firstCapacity = Math.max(1, measurements.pageContentHeight)
  const continuationCapacity = Math.max(
    1,
    measurements.continuationPageContentHeight ?? measurements.pageContentHeight
  )
  const gap = Math.max(0, measurements.sectionGap)
  const minHeight = Math.max(0, measurements.minSectionHeight)

  const pages: SurveyPollPdfPageItem[][] = []
  let current: SurveyPollPdfPageItem[] = []
  let used = 0

  const capacity = () => (pages.length === 0 ? firstCapacity : continuationCapacity)
  const remaining = () => capacity() - used - (current.length > 0 ? gap : 0)
  const place = (item: SurveyPollPdfPageItem, height: number) => {
    used += (current.length > 0 ? gap : 0) + height
    current.push(item)
  }
  const nextPage = () => {
    if (current.length === 0) return
    pages.push(current)
    current = []
    used = 0
  }

  sections.forEach((section, index) => {
    const measured = measurements.sections[index]
    const fullHeight = Math.max(minHeight, measured?.height ?? minHeight)
    const rowHeights = measured?.rowHeights

    if (
      section.kind !== 'text' ||
      section.rows.length === 0 ||
      rowHeights == null ||
      rowHeights.length !== section.rows.length
    ) {
      if (fullHeight > remaining()) nextPage()
      place({ key: section.paragraphId, section }, fullHeight)
      return
    }

    const rowsTotal = rowHeights.reduce((sum, height) => sum + height, 0)
    const baseHeight = Math.max(0, (measured?.height ?? 0) - rowsTotal)
    const pieceHeight = (from: number, to: number) => {
      let height = baseHeight
      for (let row = from; row < to; row += 1) height += rowHeights[row]
      return Math.max(minHeight, height)
    }

    let start = 0
    let piece = 0
    while (start < section.rows.length) {
      let end = start
      while (end < section.rows.length && pieceHeight(start, end + 1) <= remaining()) end += 1

      if (end === start) {
        if (current.length > 0) {
          nextPage()
          continue
        }
        // 빈 쪽에도 한 행이 들어가지 않으면 넘치더라도 한 행은 놓는다(무한 반복 방지).
        end = start + 1
      }

      place(
        {
          key: `${section.paragraphId}-${piece}`,
          section: { ...section, rows: section.rows.slice(start, end) },
        },
        pieceHeight(start, end)
      )
      start = end
      piece += 1
      if (start < section.rows.length) nextPage()
    }
  })

  nextPage()
  return pages
}
