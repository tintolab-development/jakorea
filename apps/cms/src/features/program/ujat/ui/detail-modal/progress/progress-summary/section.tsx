import { UjatEducationProgressSchoolSummaryTable } from './school-summary-table'
import { UjatEducationProgressVolunteerSummaryTable } from './volunteer-summary-table'
import './section.css'

export function UjatEducationProgressSummarySection() {
  return (
    <div className="ujat-edu-progress-summary">
      <section className="ujat-edu-progress-summary__block" aria-labelledby="ujat-edu-summary-school">
        <h2 id="ujat-edu-summary-school" className="ujat-edu-progress-summary__title">
          학교 교육 진행 요약
        </h2>
        <div className="ujat-edu-progress-summary__table-wrap">
          <UjatEducationProgressSchoolSummaryTable />
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
          <UjatEducationProgressVolunteerSummaryTable />
        </div>
      </section>
    </div>
  )
}
