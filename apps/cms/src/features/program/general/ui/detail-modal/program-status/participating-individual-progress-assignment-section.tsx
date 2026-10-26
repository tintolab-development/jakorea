import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { Spin } from 'antd'
import type { Program } from '@/types/domain'
import { useParticipatingIndividualProgressAssignment } from '@/features/program/general/hooks/use-participating-individual-progress-assignment'
import { ParticipatingIndividualProgressAssignmentSessionPanel } from './participating-individual-progress-assignment-session-panel'
import type { ProgressAssignmentSurveyNavTab } from './participating-individual-progress-assignment-table'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './school-detail-attendance-section.css'
import './participating-individual-progress-assignment-section.css'

export function ParticipatingIndividualProgressAssignmentSection({
  program,
  onNavigateToSurveyCategory,
}: {
  program: Program
  onNavigateToSurveyCategory: (tab: ProgressAssignmentSurveyNavTab) => void
}) {
  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    getSessionParticipants,
    loading,
  } = useParticipatingIndividualProgressAssignment(program)

  if (loading) {
    return (
      <div className="detail-fullpage-modal__loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="participating-individual-progress-assignment-section school-detail-attendance-section">
      <FilterTableLayout
        className="school-detail-attendance-section__filter-layout"
        bordered={false}
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        showFilter
        showTitle={false}
        hideExcelDownload
      >
        {sessionGroups.length === 0 ? (
          <div className="school-detail-attendance-section__empty">조회 결과가 없습니다.</div>
        ) : (
          <div className="school-detail-attendance-section__groups">
            {sessionGroups.map(session => (
              <ParticipatingIndividualProgressAssignmentSessionPanel
                key={session.id}
                session={session}
                appliedFilters={appliedFilters}
                getSessionParticipants={getSessionParticipants}
                onViewSurveyResponse={onNavigateToSurveyCategory}
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
