import {
  DeleteGuideModal,
  buildMemberWithdrawMessageLines,
  buildSchoolDeleteMessageLines,
} from '@/features/program/ui/manager-delete-guide-modal'
import { LectureAttendanceModal } from '@/features/program/ui/lecture-attendance-modal'
import { AssignmentSubmissionModal } from '@/features/program/ui/assignment-submission-modal'
import { useUserDetailFullpageShell } from './user-detail-fullpage-shell-context'

export function UserDetailFullpageModalsStack() {
  const {
    modals,
    displayUser,
    withdrawConfirmOpen,
    onWithdrawModalCancel,
    onWithdrawModalConfirm,
    derived,
  } = useUserDetailFullpageShell()

  const { sections } = derived

  return (
    <>
      {withdrawConfirmOpen && (
        <DeleteGuideModal
          open
          onCancel={onWithdrawModalCancel}
          onConfirm={onWithdrawModalConfirm}
          title={sections.withdraw.isSchoolDelete ? '학교 삭제 안내' : '회원 탈퇴 안내'}
          lines={
            sections.withdraw.isSchoolDelete
              ? buildSchoolDeleteMessageLines({ name: displayUser.name, email: displayUser.email })
              : buildMemberWithdrawMessageLines({ name: displayUser.name, email: displayUser.email })
          }
          confirmText={sections.withdraw.isSchoolDelete ? '삭제' : '탈퇴'}
          confirmVariant="delete"
        />
      )}

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
    </>
  )
}
