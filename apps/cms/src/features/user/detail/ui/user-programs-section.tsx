import { useMemo } from 'react'
import { Table, Empty, message } from 'antd'
import type { Application, UserHistory } from '@/types/domain'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { MemberProgramLectureHistory } from './member-program-lecture-history'
import { createProgramHistoryColumns } from './detail-info/user-detail-program-history-columns'
import type { UserDetailProgramsChildKey } from '../lib/user-detail-fullpage-helpers'

export interface UserProgramsHistoryConfig {
  enrollmentSectionTitle: string
  enrollmentEmptyDescription: string
  enrollmentChildUsesStudentMemberHistory: boolean
  showLectureHistoryWhenLectureChild: boolean
  useSchoolProgramParticipationSingleView: boolean
}

export interface UserProgramsSectionProps {
  applications: Application[]
  enrollmentTableRows: Application[]
  loading: boolean
  activeProgramsChild: UserDetailProgramsChildKey
  volunteerHistories: UserHistory[]
  volunteerHistoriesLoading: boolean
  hasProgramsChildMenu: boolean
  programsHistoryConfig: UserProgramsHistoryConfig
  onProgressStatusChange: (
    app: Application,
    displayStatus: ProgramEnrollmentDisplayStatus
  ) => void | Promise<void>
  onOpenLectureAttendance: (record: Application) => void
  onOpenAssignment: (record: Application) => void
  onRowClick: (record: Application) => void
}

/** 회원 상세 — 프로그램·봉사 이력 탭 본문 (역할별 분기는 상위 전략에서 주입) */
export function UserProgramsSection({
  applications,
  enrollmentTableRows,
  loading,
  activeProgramsChild,
  volunteerHistories,
  volunteerHistoriesLoading,
  hasProgramsChildMenu,
  programsHistoryConfig,
  onProgressStatusChange,
  onOpenLectureAttendance,
  onOpenAssignment,
  onRowClick,
}: UserProgramsSectionProps) {
  const {
    enrollmentSectionTitle,
    enrollmentEmptyDescription,
    enrollmentChildUsesStudentMemberHistory,
    showLectureHistoryWhenLectureChild,
    useSchoolProgramParticipationSingleView,
  } = programsHistoryConfig

  const programHistoryColumns = useMemo(
    () =>
      createProgramHistoryColumns({
        onProgressStatusChange,
        onOpenLectureAttendance,
        onOpenAssignmentSubmission: onOpenAssignment,
      }),
    [onProgressStatusChange, onOpenLectureAttendance, onOpenAssignment]
  )

  const renderApplicationTable = (rows: Application[], emptyDescription: string) => (
    <div className="user-detail-modal__program-tab">
      {loading ? (
        <div className="user-detail-modal__loading">로딩 중...</div>
      ) : rows.length > 0 ? (
        <Table
          className="cms-data-table"
          columns={programHistoryColumns}
          dataSource={rows}
          rowKey="id"
          pagination={false}
          onRow={record => ({
            onClick: e => {
              const target = e.target as HTMLElement
              if (
                target.closest('.user-detail-modal__progress-cell') ||
                target.closest('.user-detail-modal__attendance-link') ||
                target.closest('.user-detail-modal__assignment-cell')
              )
                return
              onRowClick(record)
            },
            style: { cursor: 'pointer' },
          })}
        />
      ) : (
        <div className="user-detail-modal__program-tab-empty">
          <Empty description={emptyDescription} />
        </div>
      )}
    </div>
  )

  const enrollmentSection = (
    <FilterTableLayout
      bordered={false}
      className="user-detail-fullpage-modal__enrollment-layout"
      fields={[]}
      filters={{}}
      onFilterChange={() => {}}
      onSearch={() => {}}
      title={enrollmentSectionTitle}
      description={`총 ${enrollmentTableRows.length}건`}
    >
      {renderApplicationTable(enrollmentTableRows, enrollmentEmptyDescription)}
    </FilterTableLayout>
  )

  const volunteerProgramHistory = (
    <MemberProgramLectureHistory
      mode="volunteerProgram"
      volunteerHistories={volunteerHistories}
      loading={volunteerHistoriesLoading}
      onVolunteerRowClick={() => {
        message.info('봉사 프로그램 상세는 추후 연결됩니다.')
      }}
      onVolunteerCertificateDownload={() => {
        window.alert('준비 중입니다.')
      }}
    />
  )

  if (hasProgramsChildMenu) {
    return (
      <div className="user-detail-fullpage-modal__programs">
        {activeProgramsChild === 'enrollment' &&
          (enrollmentChildUsesStudentMemberHistory ? (
            <MemberProgramLectureHistory
              mode="studentEnrollment"
              applications={applications}
              loading={loading}
              onOpenAttendance={onOpenLectureAttendance}
              onOpenAssignment={onOpenAssignment}
              onDownloadCertificate={() => {
                window.alert('준비 중입니다.')
              }}
            />
          ) : (
            enrollmentSection
          ))}
        {activeProgramsChild === 'lecture' && showLectureHistoryWhenLectureChild && (
          <MemberProgramLectureHistory applications={applications} loading={loading} />
        )}
        {activeProgramsChild === 'volunteer' && volunteerProgramHistory}
      </div>
    )
  }

  if (useSchoolProgramParticipationSingleView) {
    return (
      <MemberProgramLectureHistory
        mode="schoolProgramParticipation"
        applications={applications}
        loading={loading}
        onBulkDelete={() => {
          message.info('이력 삭제는 추후 연결됩니다.')
        }}
      />
    )
  }

  return (
    <>
      {enrollmentSection}
      {volunteerProgramHistory}
    </>
  )
}
