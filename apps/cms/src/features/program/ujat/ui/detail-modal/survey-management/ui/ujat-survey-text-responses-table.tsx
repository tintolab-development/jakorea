import type { UjatSurveyTextResponseRow } from '../lib/aggregate-survey-poll-results'
import './ujat-survey-poll-results.css'

type UjatSurveyTextResponsesTableProps = {
  rows: UjatSurveyTextResponseRow[]
}

export function UjatSurveyTextResponsesTable({ rows }: UjatSurveyTextResponsesTableProps) {
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
