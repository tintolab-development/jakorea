import { useEffect, useMemo, useState } from 'react'
import { WRITING_FORM_TEMPLATE_SAVE_EVENT } from '@/features/template/lib/writing-form-template-local-save'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  buildSurveyPollResultSectionsFromDraft,
  buildSurveyPollResultSectionsFromSummary,
  type SurveyPollResultSection,
} from '../../lib/survey-management/aggregate-survey-poll-results'
import { paginateSurveyPollPdfSections } from '../../lib/survey-management/paginate-survey-poll-pdf-pages'
import { resolveSurveyWritingDraft } from '../../lib/survey-management/survey-writing-draft'
import type {
  SurveyPollRawResponse,
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
}

export function SurveyPollResultsView({
  templateId,
  templateVersionId,
  responseCount,
  participantTotal,
  responses,
  questionSummaries,
  pdfTitle = '강의 평가 결과',
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

  const pdfPages = useMemo(() => paginateSurveyPollPdfSections(sections), [sections])

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

  return (
    <div className="ujat-survey-poll-results">
      <div className="ujat-survey-poll-results__summary">{summary}</div>

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
        {pdfPages.map((pageSections, pageIndex) => (
          <section
            key={`pdf-page-${pageIndex}`}
            className="ujat-survey-poll-results__pdf-page"
            data-form-document-pdf-page
          >
            <div className="ujat-survey-poll-results__pdf-header">
              <p className="ujat-survey-poll-results__pdf-kicker">JA Korea</p>
              <h2 className="ujat-survey-poll-results__pdf-title">{pdfTitle}</h2>
            </div>
            <div className="ujat-survey-poll-results__summary ujat-survey-poll-results__pdf-summary">
              {summary}
            </div>

            <div className="ujat-survey-poll-results__pdf-sections">
              {pageSections.map(section => (
                <div
                  key={`pdf-${pageIndex}-${section.paragraphId}`}
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
      </div>
    </div>
  )
}
