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
  const { columnRegions, schoolSummary, volunteerSummary, loading, isError, isRemote } =
    useUjatEducationProgressSummary(programId)
  if (loading) {
    return (
      <div className="ujat-edu-progress-summary" role="status">
        <Spin size="large" />
      </div>
    )
  }
  if (!isRemote) {
    return (
      <div className="ujat-edu-progress-summary" role="status">
        원격 API를 사용할 수 없어 교육 진행 요약을 표시하지 않습니다.
      </div>
    )
  }
  if (isError) {
    return (
      <div className="ujat-edu-progress-summary" role="alert">
        교육 진행 요약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
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
          <UjatEducationProgressSchoolSummaryTable
            regions={columnRegions}
            summary={schoolSummary}
          />
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
          <UjatEducationProgressVolunteerSummaryTable
            regions={columnRegions}
            summary={volunteerSummary}
          />
        </div>
      </section>
    </div>
  )
}
