import {
  DeleteGuideModal,
  buildMemberWithdrawMessageLines,
  buildSchoolDeleteMessageLines,
} from '@/features/program/ui/manager-delete-guide-modal'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { LectureAttendanceModal } from '@/features/program/ui/lecture-attendance-modal'
import { AssignmentSubmissionModal } from '@/features/program/ui/assignment-submission-modal'
import { UserPersonalInfoRevealConfirmModal } from '@/features/user/detail/ui/user-personal-info-reveal-confirm-modal'
import { useUserDetailFullpageShell } from './user-detail-fullpage-shell-context'

const PERSONAL_INFO_REVEAL_MODAL_Z = 1100

export function UserDetailFullpageModalsStack() {
  const {
    modals,
    displayUser,
    withdrawConfirmOpen,
    onWithdrawModalCancel,
    onWithdrawModalConfirm,
    derived,
    personalInfoRevealConfirmOpen,
    onClosePersonalInfoRevealConfirm,
    onSubmitPersonalInfoReveal,
  } = useUserDetailFullpageShell()

  const { sections } = derived

  return (
    <>
      {personalInfoRevealConfirmOpen ? (
        <UserPersonalInfoRevealConfirmModal
          onCancel={onClosePersonalInfoRevealConfirm}
          onConfirm={onSubmitPersonalInfoReveal}
          zIndex={PERSONAL_INFO_REVEAL_MODAL_Z}
        />
      ) : null}
      {withdrawConfirmOpen && (
        <DeleteGuideModal
          open
          onCancel={onWithdrawModalCancel}
          onConfirm={onWithdrawModalConfirm}
          title={sections.withdraw.isSchoolDelete ? '학교 탈퇴 안내' : '회원 탈퇴 안내'}
          lines={
            sections.withdraw.isSchoolDelete
              ? buildSchoolDeleteMessageLines({
                  displayName:
                    displayUser.schoolInfo?.schoolName?.trim() || displayUser.name,
                })
              : buildMemberWithdrawMessageLines({ displayName: displayUser.name })
          }
          confirmText="삭제"
          confirmVariant="delete"
          requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
          confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
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
