import type { TrainedTeacherPerformanceSummaryView } from '../../api/performance-summary-adapters'
import './performance-summary-strip.css'

type Metric = {
  key: string
  label: string
  value: number
}

function buildMetrics(
  summary: TrainedTeacherPerformanceSummaryView,
  educationCompletionCount?: number
): Metric[] {
  const metrics: Metric[] = [
    { key: 'org', label: '기관 신청', value: summary.organizationApplicationCount },
    { key: 'teachers', label: '교육받은 교사', value: summary.trainedTeacherCount },
    { key: 'participants', label: '교사연수 참여', value: summary.teacherTrainingParticipantCount },
    { key: 'students', label: '학생 수', value: summary.studentCount },
    { key: 'classes', label: '학급 수', value: summary.classCount },
    { key: 'journal-ok', label: '일지 제출', value: summary.journalSubmittedCount },
    { key: 'journal-pending', label: '일지 미제출', value: summary.journalNotSubmittedCount },
  ]
  if (typeof educationCompletionCount === 'number') {
    metrics.push({
      key: 'education-completion',
      label: '학생교육 완료',
      value: educationCompletionCount,
    })
  }
  return metrics
}

export function TrainedTeachersPerformanceSummaryStrip({
  summary,
  loading,
  educationCompletionCount,
}: {
  summary: TrainedTeacherPerformanceSummaryView | undefined
  loading?: boolean
  /** education-completions 활성 건수 — 일지와 별도 SSOT */
  educationCompletionCount?: number
}) {
  if (!summary && !loading) return null

  const metrics = summary ? buildMetrics(summary, educationCompletionCount) : []

  return (
    <div
      className="trained-teachers-performance-summary-strip"
      aria-busy={loading ? true : undefined}
    >
      <div className="trained-teachers-performance-summary-strip__title-row">
        <span className="trained-teachers-performance-summary-strip__title">실적 요약</span>
        {summary ? (
          <span className="trained-teachers-performance-summary-strip__flags">
            {summary.teacherTrainingEnabled ? '교사연수 ON' : '교사연수 OFF'}
            {' · '}
            {summary.educationJournalEnabled ? '교육일지 ON' : '교육일지 OFF'}
          </span>
        ) : (
          <span className="trained-teachers-performance-summary-strip__flags">불러오는 중…</span>
        )}
      </div>
      {metrics.length > 0 ? (
        <ul className="trained-teachers-performance-summary-strip__metrics">
          {metrics.map(metric => (
            <li key={metric.key} className="trained-teachers-performance-summary-strip__metric">
              <span className="trained-teachers-performance-summary-strip__metric-label">
                {metric.label}
              </span>
              <span className="trained-teachers-performance-summary-strip__metric-value">
                {metric.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
