import { AdminManagedProgramHistory } from '@/features/user/detail/ui/admin-managed-program-history'
import { UserProgramsSection } from '@/features/user/detail/ui/user-programs-section'
import { UserDetailFullpageBasicTabContent } from './user-detail-fullpage-basic-tab-content'
import { UserDetailFullpageSettlementPanel } from './user-detail-fullpage-settlement-panel'
import { useUserDetailFullpageShell } from './user-detail-fullpage-shell-context'

export function UserDetailFullpageTabPanels() {
  const {
    mode,
    permissionRole,
    displayUser,
    tabState,
    derived,
    applications,
    applicationsLoading,
    volunteerHistories,
    volunteerHistoriesLoading,
    personalInfoRevealed,
    instructorResumeApplicantRow,
    basicInfoEntrySource,
    onNavigateToLinkedUser,
    onProgressStatusChange,
    onOpenLectureAttendance,
    onOpenAssignmentSubmission,
    onOpenEnrollmentProgramDetail,
    basicInfoEditing,
    basicInfoEditScope,
    basicInfoDraft,
    onBasicInfoDraftChange,
    adminPermissionVariantPatching,
    onPatchAdminPermissionVariantFromDetailView,
    onPermissionResendNotification,
    onOpenJaGradeEvaluation,
    scheduleChangeCount,
  } = useUserDetailFullpageShell()

  const { sections, strategy, enrollmentTableRows, resolvedProgramsChild } = derived

  return (
    <>
      {tabState.lnb === 'detail-info' && (
        <UserDetailFullpageBasicTabContent
          mode={mode}
          permissionRole={permissionRole}
          user={displayUser}
          basicTab={sections.basicTab}
          basicInfoEntrySource={basicInfoEntrySource}
          personalInfoRevealed={personalInfoRevealed}
          instructorResumeApplicantRow={instructorResumeApplicantRow}
          onNavigateToLinkedUser={onNavigateToLinkedUser}
          memberInfoEditing={basicInfoEditing && basicInfoEditScope === 'profile'}
          memberInfoDraft={basicInfoDraft}
          onMemberInfoDraftChange={onBasicInfoDraftChange}
          adminPermissionVariantPatching={adminPermissionVariantPatching}
          onPatchAdminPermissionVariantFromDetailView={onPatchAdminPermissionVariantFromDetailView}
          onPermissionResendNotification={onPermissionResendNotification}
          onOpenJaGradeEvaluation={onOpenJaGradeEvaluation}
          scheduleChangeCount={scheduleChangeCount}
        />
      )}
      {tabState.lnb === 'history' &&
        (sections.historyTab.useAdminManagedProgramHistory ? (
          <AdminManagedProgramHistory user={displayUser} />
        ) : (
          <UserProgramsSection
            user={displayUser}
            applications={applications}
            enrollmentTableRows={enrollmentTableRows}
            loading={applicationsLoading}
            activeProgramsChild={resolvedProgramsChild}
            volunteerHistories={volunteerHistories}
            volunteerHistoriesLoading={volunteerHistoriesLoading}
            hasProgramsChildMenu={strategy.hasProgramsChildMenu}
            programsHistoryConfig={sections.programsHistory}
            onProgressStatusChange={onProgressStatusChange}
            onOpenLectureAttendance={onOpenLectureAttendance}
            onOpenAssignment={onOpenAssignmentSubmission}
            onRowClick={onOpenEnrollmentProgramDetail}
          />
        ))}
      {tabState.lnb === 'payment-status' && (
        <UserDetailFullpageSettlementPanel
          user={displayUser}
          showInstructorPayment={sections.settlement.showInstructorPayment}
        />
      )}
    </>
  )
}
