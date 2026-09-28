import {
  DELETE_GUIDE_PASSWORD_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
  WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import {
  DeleteGuideModal,
  type DeleteGuideConfirmInputMode,
} from '@/shared/ui/delete-guide-modal'
import {
  buildMemberWithdrawMessageLines,
  buildSchoolDeleteMessageLines,
  buildSelfWithdrawMessageLines,
} from '@/features/user/shared/lib/member-withdraw-delete-guide'

export type MemberWithdrawGuideVariant = 'member_withdraw' | 'school_delete' | 'self_withdraw'

export interface MemberWithdrawGuideModalProps {
  open: boolean
  onCancel: () => void
  /**
   * member_withdraw(비밀번호 모드)에서는 입력한 비밀번호를 인자로 전달.
   * school_delete / self_withdraw(문구 모드)는 확인 문구 또는 undefined.
   */
  onConfirm: (confirmInput?: string) => void
  variant: MemberWithdrawGuideVariant
  /** member_withdraw / school_delete 시 표시명 (self_withdraw는 미사용) */
  displayName?: string
  confirmText?: string
  confirmLoading?: boolean
  zIndex?: number
}

function resolveGuide(props: MemberWithdrawGuideModalProps): {
  title: string
  lines: string[]
  confirmText: string
  requiredConfirmInput?: string
  confirmInputPlaceholder: string
  confirmInputMode: DeleteGuideConfirmInputMode
} {
  const { variant, displayName = '', confirmText: confirmTextOverride } = props

  if (variant === 'school_delete') {
    return {
      title: '학교 삭제 안내',
      lines: buildSchoolDeleteMessageLines({ displayName }),
      confirmText: confirmTextOverride ?? '학교 삭제',
      requiredConfirmInput: DELETE_GUIDE_TYPED_CONFIRM_VALUE,
      confirmInputPlaceholder: DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
      confirmInputMode: 'phrase',
    }
  }

  // Admin 본인 탈퇴 — confirmationText "탈퇴" (BE 변경 없음)
  if (variant === 'self_withdraw') {
    return {
      title: '회원 탈퇴 안내',
      lines: buildSelfWithdrawMessageLines(),
      confirmText: confirmTextOverride ?? '회원 탈퇴',
      requiredConfirmInput: WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE,
      confirmInputPlaceholder: WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
      confirmInputMode: 'phrase',
    }
  }

  // CMS 회원 탈퇴 처리 — 관리자 현재 비밀번호
  return {
    title: '회원 탈퇴 처리 안내',
    lines: buildMemberWithdrawMessageLines({ displayName }),
    confirmText: confirmTextOverride ?? '회원 탈퇴',
    confirmInputPlaceholder: DELETE_GUIDE_PASSWORD_CONFIRM_PLACEHOLDER,
    confirmInputMode: 'password',
  }
}

/** 회원 탈퇴 / 학교 삭제 / 본인 탈퇴 — DeleteGuideModal thin wrapper */
export function MemberWithdrawGuideModal(props: MemberWithdrawGuideModalProps) {
  const { open, onCancel, onConfirm, confirmLoading, zIndex } = props
  const guide = resolveGuide(props)

  return (
    <DeleteGuideModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={guide.title}
      lines={guide.lines}
      confirmText={guide.confirmText}
      confirmVariant="delete"
      requiredConfirmInput={guide.requiredConfirmInput}
      confirmInputPlaceholder={guide.confirmInputPlaceholder}
      confirmInputMode={guide.confirmInputMode}
      confirmLoading={confirmLoading}
      zIndex={zIndex}
    />
  )
}
