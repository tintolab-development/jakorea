import { useMemo } from 'react'
import { UJAT_SURVEY_POLL_RESPONSES_MOCK } from '@/data/mock/ujat-survey-poll-responses-mock'
import { buildSurveyPollResultSections } from '../lib/aggregate-survey-poll-results'
import { UjatSurveyScaleResultChart } from './ujat-survey-scale-result-chart'
import { UjatSurveyTextResponsesTable } from './ujat-survey-text-responses-table'
import './ujat-survey-poll-results.css'

export type UjatSurveyPollResultsViewProps = {
  templateId: string
  responseCount: number
  participantTotal: number
}

export function UjatSurveyPollResultsView({
  templateId,
  responseCount,
  participantTotal,
}: UjatSurveyPollResultsViewProps) {
  const sections = useMemo(
    () => buildSurveyPollResultSections(templateId, UJAT_SURVEY_POLL_RESPONSES_MOCK),
    [templateId]
  )

  return (
    <div className="ujat-survey-poll-results">
      <div
        className="ujat-survey-poll-results__summary ujat-survey-poll-results__section--pdf-page"
        data-form-document-pdf-page
      >
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
      </div>

      <div className="ujat-survey-poll-results__sections">
        {sections.map(section => (
          <section
            key={section.paragraphId}
            className="ujat-survey-poll-results__section ujat-survey-poll-results__section--pdf-page"
            data-form-document-pdf-page
            aria-labelledby={`ujat-survey-result-${section.paragraphId}`}
          >
            <h3 className="ujat-survey-poll-results__section-title" id={`ujat-survey-result-${section.paragraphId}`}>
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
    </div>
  )
}
