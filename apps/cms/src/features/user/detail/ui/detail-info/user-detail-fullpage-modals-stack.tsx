import { useMemo, useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DeleteGuideModal,
  buildMemberWithdrawMessageLines,
  buildSchoolDeleteMessageLines,
} from '@/features/program/general/ui/manager-delete-guide-modal'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
  WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { LectureAttendanceModal } from '@/features/program/general/ui/lecture-attendance-modal'
import { AssignmentSubmissionModal } from '@/features/program/general/ui/assignment-submission-modal'
import { InstructorPermissionRevokeModal } from '@/features/user/detail/ui/modal/instructor-permission-revoke-modal'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import { useUserDetailFullpageShell } from './user-detail-fullpage-shell-context'
import { InstitutionDeleteBlockedModal } from '@/features/user/shared/ui/institution-delete-blocked-modal'
import { JaGradeEvaluationModal } from '@/features/user/detail/ui/modal/ja-grade-evaluation-modal'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { resolveMemberApplicationIdFromApplication } from '@/features/user/api/member-program-history-ids'
import { fetchApplicationAssignmentSubmissionsRemote } from '@/features/user/api/members-api-client'
import {
  bulkDownloadMemberAssignmentSubmissionsRemote,
  fetchApplicationLectureAttendanceRemote,
} from '@/features/user/api/member-program-history-api-client'
import { mapMemberAssignmentSubmissionsToDetail } from '@/features/user/api/map-member-assignment-submissions'
import { mapMemberLectureAttendanceToDetail } from '@/features/user/api/map-member-lecture-attendance'
import { downloadFromBulkEndpoint } from '@/features/user/api/download-bulk-endpoint'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

export function UserDetailFullpageModalsStack() {
  const { showAlert } = useCmsAlert()
  const {
    modals,
    displayUser,
    withdrawConfirmOpen,
    onWithdrawModalCancel,
    onWithdrawModalConfirm,
    institutionDeleteBlockedOpen,
    onCloseInstitutionDeleteBlocked,
    derived,
    instructorPermissionRevokeOpen,
    onCloseInstructorPermissionRevoke,
    onConfirmInstructorPermissionRevoke,
    jaGradeEvaluationOpen,
    onCloseJaGradeEvaluation,
    onCompleteJaGradeEvaluation,
    scheduleChangeCount,
    basicInfoEditing,
    basicInfoEditScope,
    basicInfoDraft,
    basicInfoSaveLoading,
    onCancelBasicInfoEdit,
    onSaveBasicInfoEdit,
    onBasicInfoDraftChange,
  } = useUserDetailFullpageShell()

  const { sections } = derived
  const membersRemote = isMembersRemoteEnabled()
  const assignmentApplication = modals.assignment.data
  const attendanceApplication = modals.lectureAttendance.data
  const memberId = displayUser.memberId
  const assignmentId =
    assignmentApplication != null
      ? resolveMemberApplicationIdFromApplication(assignmentApplication)
      : undefined
  const attendanceApplicationId =
    attendanceApplication != null
      ? resolveMemberApplicationIdFromApplication(attendanceApplication)
      : undefined

  const assignmentSubmissionsQuery = useQuery({
    queryKey: ['member-detail-assignment-submissions', memberId, assignmentId],
    enabled: Boolean(
      membersRemote &&
        modals.assignment.open &&
        memberId != null &&
        assignmentId != null
    ),
    queryFn: () => fetchApplicationAssignmentSubmissionsRemote(memberId!, assignmentId!),
  })

  const lectureAttendanceQuery = useQuery({
    queryKey: ['member-detail-lecture-attendance', memberId, attendanceApplicationId],
    enabled: Boolean(
      membersRemote &&
        modals.lectureAttendance.open &&
        memberId != null &&
        attendanceApplicationId != null
    ),
    queryFn: () => fetchApplicationLectureAttendanceRemote(memberId!, attendanceApplicationId!),
  })

  const assignmentRemoteDetail = useMemo(() => {
    if (!membersRemote || !assignmentApplication || !modals.assignment.open) return undefined
    const submissions = assignmentSubmissionsQuery.data
    if (!submissions) return null
    const programTitle =
      (assignmentApplication.customFields?.programName as string | undefined)?.trim() || '프로그램'
    return mapMemberAssignmentSubmissionsToDetail(
      submissions,
      programTitle,
      displayUser.name
    )
  }, [
    membersRemote,
    assignmentApplication,
    modals.assignment.open,
    assignmentSubmissionsQuery.data,
    displayUser.name,
  ])

  const attendanceRemoteDetail = useMemo(() => {
    if (!membersRemote || !modals.lectureAttendance.open) return undefined
    const data = lectureAttendanceQuery.data
    if (!data) return null
    return mapMemberLectureAttendanceToDetail(data, displayUser.name)
  }, [membersRemote, modals.lectureAttendance.open, lectureAttendanceQuery.data, displayUser.name])

  const [assignmentBulkDownloading, setAssignmentBulkDownloading] = useState(false)

  const handleAssignmentBulkDownload = useCallback(async () => {
    if (memberId == null || assignmentId == null) return
    setAssignmentBulkDownloading(true)
    try {
      const response = await bulkDownloadMemberAssignmentSubmissionsRemote(memberId, assignmentId)
      if (response.downloadEndpoint) {
        await downloadFromBulkEndpoint(response.downloadEndpoint, '과제_일괄')
      }
    } catch (error) {
      showAlert({
        title: '안내',
        content: getMemberApiErrorMessage(error, '과제 일괄 다운로드에 실패했습니다.'),
      })
    } finally {
      setAssignmentBulkDownloading(false)
    }
  }, [memberId, assignmentId, showAlert])

  return (
    <>
      <InstitutionDeleteBlockedModal
        open={institutionDeleteBlockedOpen}
        onClose={onCloseInstitutionDeleteBlocked}
        selectedCount={1}
      />
      {withdrawConfirmOpen && (
        <DeleteGuideModal
          open
          onCancel={onWithdrawModalCancel}
          onConfirm={onWithdrawModalConfirm}
          title={sections.withdraw.isSchoolDelete ? '학교 삭제 안내' : '회원 탈퇴 안내'}
          lines={
            sections.withdraw.isSchoolDelete
              ? buildSchoolDeleteMessageLines({
                  displayName: displayUser.schoolInfo?.schoolName?.trim() || displayUser.name,
                })
              : buildMemberWithdrawMessageLines({ displayName: displayUser.name })
          }
          confirmText={sections.withdraw.isSchoolDelete ? '학교 삭제' : '탈퇴'}
          confirmVariant="delete"
          requiredConfirmInput={
            sections.withdraw.isSchoolDelete
              ? DELETE_GUIDE_TYPED_CONFIRM_VALUE
              : WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE
          }
          confirmInputPlaceholder={
            sections.withdraw.isSchoolDelete
              ? DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER
              : WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER
          }
        />
      )}
      <InstructorPermissionRevokeModal
        open={instructorPermissionRevokeOpen}
        instructorName={displayUser.name}
        onCancel={onCloseInstructorPermissionRevoke}
        onConfirm={onConfirmInstructorPermissionRevoke}
      />
      <MemberAdminCommentModal
        open={basicInfoEditing && basicInfoEditScope === 'comment'}
        value={basicInfoDraft?.adminComment ?? ''}
        loading={basicInfoSaveLoading}
        onChange={value => onBasicInfoDraftChange({ adminComment: value })}
        onCancel={onCancelBasicInfoEdit}
        onConfirm={() => {
          void onSaveBasicInfoEdit()
        }}
      />

      <LectureAttendanceModal
        open={modals.lectureAttendance.open}
        onCancel={modals.lectureAttendance.close}
        application={modals.lectureAttendance.data ?? undefined}
        userName={displayUser.name}
        remoteDetail={membersRemote ? attendanceRemoteDetail : undefined}
        remoteDetailLoading={membersRemote && lectureAttendanceQuery.isLoading}
      />
      <AssignmentSubmissionModal
        open={modals.assignment.open}
        onCancel={modals.assignment.close}
        application={modals.assignment.data ?? undefined}
        userName={displayUser.name}
        programTitle={
          (assignmentApplication?.customFields?.programName as string | undefined)?.trim()
        }
        remoteDetail={membersRemote ? assignmentRemoteDetail : undefined}
        remoteDetailLoading={membersRemote && assignmentSubmissionsQuery.isLoading}
        onBulkDownload={membersRemote ? handleAssignmentBulkDownload : undefined}
        bulkDownloadLoading={assignmentBulkDownloading}
      />
      <JaGradeEvaluationModal
        open={jaGradeEvaluationOpen}
        instructorMemberId={displayUser.memberId}
        instructorUserId={displayUser.id}
        scheduleChangeCount={scheduleChangeCount ?? 0}
        onClose={onCloseJaGradeEvaluation}
        onComplete={onCompleteJaGradeEvaluation}
      />
    </>
  )
}
