import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import { Alert, Spin } from 'antd'
import type { Program } from '@/types/domain'
import { useParticipatingIndividualProgressAttendance } from '@/features/program/general/hooks/use-participating-individual-progress-attendance'
import { ParticipatingIndividualProgressAttendanceSessionPanel } from './participating-individual-progress-attendance-session-panel'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './school-detail-attendance-section.css'
import './participating-individual-progress-attendance-section.css'

export function ParticipatingIndividualProgressAttendanceSection({ program }: { program: Program }) {
  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    saveSessionParticipant,
    getSessionParticipants,
    loading,
    loadError,
    backgroundRefetchError,
    isEmptyResult,
    refetchAttendance,
    isRefetching,
  } = useParticipatingIndividualProgressAttendance(program)

  if (loading) {
    return (
      <div className="detail-fullpage-modal__loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="participating-individual-progress-attendance-section school-detail-attendance-section">
        <Alert
          type="error"
          showIcon
          message="출석 정보를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          action={
            <CmsButton
              variant="secondary"
              loading={isRefetching}
              onClick={() => refetchAttendance()} >
              다시 시도
            </CmsButton>
          }
        />
      </div>
    )
  }

  return (
    <div className="participating-individual-progress-attendance-section school-detail-attendance-section">
      {backgroundRefetchError ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="최신 출석 정보를 불러오지 못했습니다."
          description="아래는 이전에 조회된 정보입니다."
          action={
            <CmsButton
              variant="secondary"
              loading={isRefetching}
              onClick={() => refetchAttendance()} >
              다시 시도
            </CmsButton>
          }
        />
      ) : null}
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
        {isEmptyResult ? (
          <div className="school-detail-attendance-section__empty">조회 결과가 없습니다.</div>
        ) : (
          <div className="school-detail-attendance-section__groups">
            {sessionGroups.map(session => (
              <ParticipatingIndividualProgressAttendanceSessionPanel
                key={session.id}
                session={session}
                appliedFilters={appliedFilters}
                getSessionParticipants={getSessionParticipants}
                onSaveParticipant={saveSessionParticipant}
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
