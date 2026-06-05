import type { SurveyTextResponseRow } from '../../lib/survey-management/aggregate-survey-poll-results'
import './survey-management.css'

type SurveyTextResponsesTableProps = {
  rows: SurveyTextResponseRow[]
}

export function SurveyTextResponsesTable({ rows }: SurveyTextResponsesTableProps) {
  return (
    <div className="ujat-survey-text-responses-table">
      <table className="ujat-survey-text-responses-table__table">
        <thead>
          <tr>
            <th scope="col">답변내용</th>
            <th scope="col">답변자</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.respondentName}-${index}`}>
              <td className="ujat-survey-text-responses-table__cell--content">{row.content}</td>
              <td className="ujat-survey-text-responses-table__cell--respondent">{row.respondentName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
