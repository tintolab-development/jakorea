import { Spin } from 'antd'
import { UjatEducationProgressSchoolSummaryTable } from './school-summary-table'
import { UjatEducationProgressVolunteerSummaryTable } from './volunteer-summary-table'
import { useUjatEducationProgressSummary } from './use-summary'
import './section.css'

export function UjatEducationProgressSummarySection({
  programId,
}: {
  programId?: string | null
}) {
  const { schoolSummary, volunteerSummary, loading } = useUjatEducationProgressSummary(programId)
  if (loading) {
    return (
      <div className="ujat-edu-progress-summary" role="status">
        <Spin size="large" />
      </div>
    )
  }
  return (
    <div className="ujat-edu-progress-summary">
      <section className="ujat-edu-progress-summary__block" aria-labelledby="ujat-edu-summary-school">
        <h2 id="ujat-edu-summary-school" className="ujat-edu-progress-summary__title">
          학교 교육 진행 요약
        </h2>
        <div className="ujat-edu-progress-summary__table-wrap">
          <UjatEducationProgressSchoolSummaryTable summary={schoolSummary} />
        </div>
      </section>

      <section
        className="ujat-edu-progress-summary__block"
        aria-labelledby="ujat-edu-summary-volunteer"
      >
        <h2 id="ujat-edu-summary-volunteer" className="ujat-edu-progress-summary__title">
          봉사단 교육 진행 요약
        </h2>
        <div className="ujat-edu-progress-summary__table-wrap">
          <UjatEducationProgressVolunteerSummaryTable summary={volunteerSummary} />
        </div>
      </section>
    </div>
  )
}
