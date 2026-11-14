import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { WRITING_FORM_TEMPLATE_SAVE_EVENT } from '@/features/template/lib/writing-form-template-local-save'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  buildSurveyPollResultSectionsFromDraft,
  buildSurveyPollResultSectionsFromSummary,
  type SurveyPollResultSection,
} from '../../lib/survey-management/aggregate-survey-poll-results'
import {
  paginateSurveyPollPdfSections,
  paginateSurveyPollPdfSectionsByHeight,
  type SurveyPollPdfPageItem,
} from '../../lib/survey-management/paginate-survey-poll-pdf-pages'
import { resolveSurveyWritingDraft } from '../../lib/survey-management/survey-writing-draft'
import type {
  SurveyPollRawResponse,
  SurveyProgressStatus,
  SurveyResultQuestionSummary,
} from '../../lib/survey-management/survey-management-types'
import { SurveyScaleResultChart } from './survey-scale-result-chart'
import { SurveyTextResponsesTable } from './survey-text-responses-table'
import './survey-management.css'

export type SurveyPollResultsViewProps = {
  templateId: string
  /** 응답이 묶인 게시 version — 지정 시 문항 구성을 그 version 기준으로 집계 */
  templateVersionId?: number
  responseCount: number
  participantTotal: number
  responses?: SurveyPollRawResponse[]
  /**
   * summary API 행. 비어 있지 않으면 version schema 조회 없이 이 값으로 결과를 구성한다.
   * `null` = summary 로딩 중(대기), `undefined`·빈 배열 = version/템플릿 draft로 집계
   */
  questionSummaries?: SurveyResultQuestionSummary[] | null
  pdfTitle?: string
  /**
   * 요약 줄 앞 진행 상태 뱃지(「진행 중 / 진행 완료」). 일반 프로그램 시안 전용 — 생략 시 뱃지 없음(UJAT 기존 동작).
   * `before_start`는 뱃지를 그리지 않는다.
   */
  statusBadge?: SurveyProgressStatus
}

const SURVEY_RESULTS_STATUS_BADGE_LABELS: Partial<Record<SurveyProgressStatus, string>> = {
  in_progress: '진행 중',
  finished: '진행 완료',
}

/** PDF 한 쪽 높이(px) — `.ujat-survey-poll-results__pdf-page` 폭 794px의 A4 비율 */
const SURVEY_POLL_PDF_PAGE_HEIGHT = 1123

function toPx(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** 측정용 쪽(화면 밖, 캡처 대상 아님)에서 머리말·요약·문항 카드 높이를 재 높이 기준 쪽 나눔 값을 만든다. */
function measureSurveyPollPdfLayout(measurePage: HTMLElement, sections: readonly SurveyPollResultSection[]) {
  const header = measurePage.querySelector<HTMLElement>('[data-survey-pdf-measure="header"]')
  const summary = measurePage.querySelector<HTMLElement>('[data-survey-pdf-measure="summary"]')
  const sectionList = measurePage.querySelector<HTMLElement>('[data-survey-pdf-measure="sections"]')
  const sectionEls = Array.from(
    measurePage.querySelectorAll<HTMLElement>('[data-survey-pdf-measure="section"]')
  )
  if (header == null || summary == null || sectionList == null || sectionEls.length !== sections.length) {
    return null
  }

  const pageStyle = getComputedStyle(measurePage)
  const pageGap = toPx(pageStyle.rowGap)
  // 요약(총 N명 응답)은 첫 쪽에만 그리므로 2쪽부터는 요약 높이·간격만큼 문항 영역이 넓다.
  const continuationPageContentHeight =
    SURVEY_POLL_PDF_PAGE_HEIGHT -
    toPx(pageStyle.paddingTop) -
    toPx(pageStyle.paddingBottom) -
    header.getBoundingClientRect().height -
    pageGap
  const pageContentHeight =
    continuationPageContentHeight - summary.getBoundingClientRect().height - pageGap

  return {
    pageContentHeight,
    continuationPageContentHeight,
    sectionGap: toPx(getComputedStyle(sectionList).rowGap),
    minSectionHeight: sectionEls[0] ? toPx(getComputedStyle(sectionEls[0]).minHeight) : 0,
    sections: sectionEls.map((el, index) => ({
      height: el.getBoundingClientRect().height,
      rowHeights:
        sections[index]?.kind === 'text'
          ? Array.from(el.querySelectorAll<HTMLElement>('tbody tr')).map(
              row => row.getBoundingClientRect().height
            )
          : undefined,
    })),
  }
}

export function SurveyPollResultsView({
  templateId,
  templateVersionId,
  responseCount,
  participantTotal,
  responses,
  questionSummaries,
  pdfTitle = '강의 평가 결과',
  statusBadge,
}: SurveyPollResultsViewProps) {
  const [templateSaveRevision, setTemplateSaveRevision] = useState(0)
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)

  useEffect(() => {
    const handleTemplateSaved = (event: Event) => {
      const detail = (event as CustomEvent<{ templateId?: string }>).detail
      if (detail?.templateId === templateId) {
        setTemplateSaveRevision(revision => revision + 1)
      }
    }
    window.addEventListener(WRITING_FORM_TEMPLATE_SAVE_EVENT, handleTemplateSaved)
    return () => window.removeEventListener(WRITING_FORM_TEMPLATE_SAVE_EVENT, handleTemplateSaved)
  }, [templateId])

  const useSummary = questionSummaries != null && questionSummaries.length > 0
  const needsDraft = questionSummaries !== null && !useSummary

  useEffect(() => {
    if (!needsDraft) return
    let cancelled = false
    void resolveSurveyWritingDraft(templateId, {
      templateVersionId,
      fresh: templateSaveRevision > 0,
    }).then(next => {
      if (!cancelled) setDraft(next)
    })
    return () => {
      cancelled = true
    }
  }, [needsDraft, templateId, templateVersionId, templateSaveRevision])

  const sections = useMemo((): SurveyPollResultSection[] => {
    if (useSummary)
      return buildSurveyPollResultSectionsFromSummary(questionSummaries, responses ?? [])
    if (!needsDraft || draft == null) return []
    return buildSurveyPollResultSectionsFromDraft(
      draft,
      responses ?? []
    )
  }, [draft, needsDraft, questionSummaries, responses, useSummary])

  // 측정 전에는 개수 기준으로 나눠 두고, 측정 영역 높이를 잰 뒤 높이 기준으로 다시 채운다.
  const fallbackPdfPages = useMemo(
    (): SurveyPollPdfPageItem[][] =>
      paginateSurveyPollPdfSections(sections).map(page =>
        page.map(section => ({ key: section.paragraphId, section }))
      ),
    [sections]
  )
  const pdfMeasureRef = useRef<HTMLElement>(null)
  const [measuredPdfPages, setMeasuredPdfPages] = useState<{
    sections: readonly SurveyPollResultSection[]
    pages: SurveyPollPdfPageItem[][]
  } | null>(null)

  useLayoutEffect(() => {
    let cancelled = false
    const measure = () => {
      const measurePage = pdfMeasureRef.current
      if (cancelled || measurePage == null) return
      const measurements = measureSurveyPollPdfLayout(measurePage, sections)
      if (measurements == null) return
      setMeasuredPdfPages({
        sections,
        pages: paginateSurveyPollPdfSectionsByHeight(sections, measurements),
      })
    }
    measure()
    // 웹폰트가 늦게 오면 글자 높이가 바뀌므로 폰트 로드 후 한 번 더 잰다.
    void document.fonts?.ready.then(measure)
    return () => {
      cancelled = true
    }
  }, [sections])

  const pdfPages =
    measuredPdfPages != null && measuredPdfPages.sections === sections
      ? measuredPdfPages.pages
      : fallbackPdfPages

  const renderSectionTitle = (section: SurveyPollResultSection) => (
    <>
      {section.title}
      {section.required ? (
        <span className="ujat-survey-poll-results__required" aria-label="필수">
          *
        </span>
      ) : null}
    </>
  )

  const summary = (
    <>
      <p className="ujat-survey-poll-results__summary-primary">
        <span className="ujat-survey-poll-results__summary-text">총</span>
        <span className="ujat-survey-poll-results__summary-count-group">
          <span className="ujat-survey-poll-results__summary-count">
            {responseCount.toLocaleString()}
          </span>
          <span className="ujat-survey-poll-results__summary-text">명</span>
        </span>
        <span className="ujat-survey-poll-results__summary-text">응답</span>
      </p>
      <p className="ujat-survey-poll-results__summary-secondary">
        프로그램 참여 {participantTotal.toLocaleString()}명
      </p>
    </>
  )

  const statusBadgeLabel =
    statusBadge != null ? SURVEY_RESULTS_STATUS_BADGE_LABELS[statusBadge] : undefined

  return (
    <div className="ujat-survey-poll-results">
      <div className="ujat-survey-poll-results__summary">
        {statusBadgeLabel != null ? (
          <span
            className={`survey-results-status-badge survey-results-status-badge--${statusBadge}`}
          >
            {statusBadgeLabel}
          </span>
        ) : null}
        {summary}
      </div>

      <div className="ujat-survey-poll-results__sections">
        {sections.map(section => (
          <section
            key={section.paragraphId}
            className="ujat-survey-poll-results__section"
            aria-labelledby={`survey-result-${section.paragraphId}`}
          >
            <h3
              className="ujat-survey-poll-results__section-title"
              id={`survey-result-${section.paragraphId}`}
            >
              {renderSectionTitle(section)}
            </h3>
            <div className="ujat-survey-poll-results__section-divider" aria-hidden />
            <div className="ujat-survey-poll-results__section-body">
              {section.kind === 'scale' ? (
                <SurveyScaleResultChart data={section.data} />
              ) : (
                <SurveyTextResponsesTable rows={section.rows} />
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="ujat-survey-poll-results__pdf-pages" aria-hidden>
        {pdfPages.map((pageItems, pageIndex) => (
          <section
            key={`pdf-page-${pageIndex}`}
            className="ujat-survey-poll-results__pdf-page"
            data-form-document-pdf-page
          >
            <div className="ujat-survey-poll-results__pdf-header">
              <p className="ujat-survey-poll-results__pdf-kicker">JA Korea</p>
              <h2 className="ujat-survey-poll-results__pdf-title">{pdfTitle}</h2>
            </div>
            {/* 요약(총 N명 응답)은 첫 쪽에만 — 쪽마다 반복하면 머리말 아래에 같은 내용이 겹쳐 보인다. */}
            {pageIndex === 0 ? (
              <div className="ujat-survey-poll-results__summary ujat-survey-poll-results__pdf-summary">
                {summary}
              </div>
            ) : null}

            <div className="ujat-survey-poll-results__pdf-sections">
              {pageItems.map(({ key, section }) => (
                <div
                  key={`pdf-${pageIndex}-${key}`}
                  className="ujat-survey-poll-results__pdf-section"
                >
                  <h3 className="ujat-survey-poll-results__pdf-section-title">
                    {renderSectionTitle(section)}
                  </h3>
                  <div className="ujat-survey-poll-results__section-divider" aria-hidden />
                  <div className="ujat-survey-poll-results__section-body">
                    {section.kind === 'scale' ? (
                      <SurveyScaleResultChart data={section.data} />
                    ) : (
                      <SurveyTextResponsesTable rows={section.rows} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* 쪽 나눔 측정 전용 — 캡처 대상(`data-form-document-pdf-page`)이 아니며 모든 문항을 한 번에 그려 높이를 잰다. */}
        <section
          ref={pdfMeasureRef}
          className="ujat-survey-poll-results__pdf-page ujat-survey-poll-results__pdf-measure"
        >
          <div className="ujat-survey-poll-results__pdf-header" data-survey-pdf-measure="header">
            <p className="ujat-survey-poll-results__pdf-kicker">JA Korea</p>
            <h2 className="ujat-survey-poll-results__pdf-title">{pdfTitle}</h2>
          </div>
          <div
            className="ujat-survey-poll-results__summary ujat-survey-poll-results__pdf-summary"
            data-survey-pdf-measure="summary"
          >
            {summary}
          </div>
          <div className="ujat-survey-poll-results__pdf-sections" data-survey-pdf-measure="sections">
            {sections.map(section => (
              <div
                key={`pdf-measure-${section.paragraphId}`}
                className="ujat-survey-poll-results__pdf-section"
                data-survey-pdf-measure="section"
              >
                <h3 className="ujat-survey-poll-results__pdf-section-title">
                  {renderSectionTitle(section)}
                </h3>
                <div className="ujat-survey-poll-results__section-divider" aria-hidden />
                <div className="ujat-survey-poll-results__section-body">
                  {section.kind === 'scale' ? (
                    <SurveyScaleResultChart data={section.data} />
                  ) : (
                    <SurveyTextResponsesTable rows={section.rows} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
