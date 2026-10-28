import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import { showSaveCompletedAlert } from '@/shared/ui/show-save-completed-alert'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { Alert } from 'antd'
import { useSchoolDetailAttendance } from '../../../hooks/use-school-detail-attendance'
import {
  SCHOOL_DETAIL_ATTENDANCE_EXCEL_COLUMNS,
  resolveSchoolDetailAttendanceWorkbookFilename,
} from '../../../lib/school-detail-attendance-export'
import { SchoolDetailAttendanceSessionPanel } from './school-detail-attendance-session-panel'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './school-detail-attendance-section.css'

export function SchoolDetailAttendanceSection({
  row,
  program,
}: {
  row: ParticipatingSchoolRow
  program: Program
}) {
  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    saveSessionStudents,
    getSessionStudents,
    loading,
    loadError,
    backgroundRefetchError,
    isEmptyResult,
    emptyMessage,
    refetchAttendance,
    isRefetching,
    isSaving,
    requiresAssignmentScopeForAttendance,
    assignmentScopeLoading,
    assignmentScopeLoadError,
    getSessionScopeReadiness,
    resolveExcelExportRows,
    canExportAll,
  } = useSchoolDetailAttendance(row, program)

  const { exportExcel, isExporting } = useTableExcelExport({
    columns: SCHOOL_DETAIL_ATTENDANCE_EXCEL_COLUMNS,
    data: [],
    resolveData: resolveExcelExportRows,
    filename: resolveSchoolDetailAttendanceWorkbookFilename(row.schoolName),
  })

  const handleSaveSession = async (
    sessionId: string,
    students: Parameters<typeof saveSessionStudents>[1]
  ) => {
    await saveSessionStudents(sessionId, students)
    showSaveCompletedAlert()
  }

  if (loadError) {
    return (
      <div className="school-detail-attendance-section">
        <Alert
          type="error"
          showIcon
          message="출석 정보를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          action={
            <CmsButton
              variant="secondary"
              loading={isRefetching}
              onClick={() => refetchAttendance()}
            >
              다시 시도
            </CmsButton>
          }
        />
      </div>
    )
  }

  return (
    <div className="school-detail-attendance-section">
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
              onClick={() => refetchAttendance()}
            >
              다시 시도
            </CmsButton>
          }
        />
      ) : null}
      {requiresAssignmentScopeForAttendance && assignmentScopeLoadError ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="학급 일정 배정 정보를 불러오지 못했습니다."
          description="출석 저장이 제한됩니다. 잠시 후 다시 시도해 주세요."
          action={
            <CmsButton
              variant="secondary"
              loading={isRefetching}
              onClick={() => refetchAttendance()}
            >
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
        {loading ? (
          <div className="school-detail-attendance-section__empty">출석 정보를 불러오는 중…</div>
        ) : isEmptyResult ? (
          <div className="school-detail-attendance-section__empty">{emptyMessage}</div>
        ) : (
          <div className="school-detail-attendance-section__groups">
            {sessionGroups.map(session => {
              const scopeReadiness = getSessionScopeReadiness(session.id)
              const scopeBlocked =
                requiresAssignmentScopeForAttendance &&
                (assignmentScopeLoading ||
                  assignmentScopeLoadError ||
                  scopeReadiness?.ready === false)
              return (
                <SchoolDetailAttendanceSessionPanel
                  key={session.id}
                  session={session}
                  appliedFilters={appliedFilters}
                  getSessionStudents={getSessionStudents}
                  onSave={handleSaveSession}
                  saving={isSaving}
                  scopeBlocked={scopeBlocked}
                  onExportAll={exportExcel}
                  exporting={isExporting}
                  exportDisabled={!canExportAll}
                />
              )
            })}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
