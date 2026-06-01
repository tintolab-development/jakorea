import { useEffect, useMemo, useState } from 'react'
import {
  UJAT_SURVEY_POLL_RESPONSES_MOCK,
  type UjatSurveyPollRawResponse,
} from '@/data/mock/ujat-survey-poll-responses-mock'
import { WRITING_FORM_TEMPLATE_SAVE_EVENT } from '@/features/template/lib/writing-form-template-local-save'
import { buildSurveyPollResultSections } from '../lib/aggregate-survey-poll-results'
import { UjatSurveyScaleResultChart } from './ujat-survey-scale-result-chart'
import { UjatSurveyTextResponsesTable } from './ujat-survey-text-responses-table'
import './ujat-survey-poll-results.css'

export type UjatSurveyPollResultsViewProps = {
  templateId: string
  responseCount: number
  participantTotal: number
  responses?: UjatSurveyPollRawResponse[]
}

export function UjatSurveyPollResultsView({
  templateId,
  responseCount,
  participantTotal,
  responses,
}: UjatSurveyPollResultsViewProps) {
  const [templateSaveRevision, setTemplateSaveRevision] = useState(0)

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

  const sections = useMemo(
    () => buildSurveyPollResultSections(templateId, responses ?? UJAT_SURVEY_POLL_RESPONSES_MOCK),
    [templateId, responses, templateSaveRevision]
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
            aria-labelledby={`ujat-survey-result-${section.paragraphId}`}
          >
            <h3
              className="ujat-survey-poll-results__section-title"
              id={`ujat-survey-result-${section.paragraphId}`}
            >
              {section.title}
            </h3>
            <div className="ujat-survey-poll-results__section-divider" aria-hidden />
            <div className="ujat-survey-poll-results__section-body">
              {section.kind === 'scale' ? (
                <UjatSurveyScaleResultChart data={section.data} />
              ) : (
                <UjatSurveyTextResponsesTable rows={section.rows} />
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="ujat-survey-poll-results__pdf-pages" aria-hidden>
        <section className="ujat-survey-poll-results__pdf-page" data-form-document-pdf-page>
          <div className="ujat-survey-poll-results__pdf-header">
            <p className="ujat-survey-poll-results__pdf-kicker">JA Korea</p>
            <h2 className="ujat-survey-poll-results__pdf-title">강의 평가 결과</h2>
          </div>
          <div className="ujat-survey-poll-results__summary ujat-survey-poll-results__pdf-summary">
            {summary}
          </div>

          <div className="ujat-survey-poll-results__pdf-sections">
            {sections.map(section => (
              <div key={`pdf-${section.paragraphId}`} className="ujat-survey-poll-results__pdf-section">
                <h3 className="ujat-survey-poll-results__pdf-section-title">{section.title}</h3>
                <div className="ujat-survey-poll-results__section-divider" aria-hidden />
                <div className="ujat-survey-poll-results__section-body">
                  {section.kind === 'scale' ? (
                    <UjatSurveyScaleResultChart data={section.data} />
                  ) : (
                    <UjatSurveyTextResponsesTable rows={section.rows} />
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
