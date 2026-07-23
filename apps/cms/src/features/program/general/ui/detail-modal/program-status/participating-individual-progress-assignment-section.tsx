import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import type { Program } from '@/types/domain'
import { useParticipatingIndividualProgressAssignment } from '@/features/program/general/hooks/use-participating-individual-progress-assignment'
import { ParticipatingIndividualProgressAssignmentSessionPanel } from './participating-individual-progress-assignment-session-panel'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './school-detail-attendance-section.css'
import './participating-individual-progress-assignment-section.css'

export function ParticipatingIndividualProgressAssignmentSection({ program }: { program: Program }) {
  // P2-5: 프로그램 단위 과제 admin API 없음 — mock 유지 (원격 전환 제외).
  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    getSessionParticipants,
  } = useParticipatingIndividualProgressAssignment(program)

  return (
    <div className="participating-individual-progress-assignment-section school-detail-attendance-section">
      <FilterTableLayout
        className="school-detail-attendance-section__filter-layout"
        bordered={false}
        filterResponsiveWrap={false}
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
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
