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

export function UserDetailFullpageModalsStack() {
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
      />
      <AssignmentSubmissionModal
        open={modals.assignment.open}
        onCancel={modals.assignment.close}
        application={modals.assignment.data ?? undefined}
        userName={displayUser.name}
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
