import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
  WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import {
  buildMemberWithdrawMessageLines,
  buildSchoolDeleteMessageLines,
  buildSelfWithdrawMessageLines,
} from '@/features/user/shared/lib/member-withdraw-delete-guide'

export type MemberWithdrawGuideVariant = 'member_withdraw' | 'school_delete' | 'self_withdraw'

export interface MemberWithdrawGuideModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
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
  requiredConfirmInput: string
  confirmInputPlaceholder: string
} {
  const { variant, displayName = '', confirmText: confirmTextOverride } = props

  if (variant === 'school_delete') {
    return {
      title: '학교 삭제 안내',
      lines: buildSchoolDeleteMessageLines({ displayName }),
      confirmText: confirmTextOverride ?? '학교 삭제',
      requiredConfirmInput: DELETE_GUIDE_TYPED_CONFIRM_VALUE,
      confirmInputPlaceholder: DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
    }
  }

  if (variant === 'self_withdraw') {
    return {
      title: '회원 탈퇴 처리 안내',
      lines: buildSelfWithdrawMessageLines(),
      confirmText: confirmTextOverride ?? '회원 탈퇴',
      requiredConfirmInput: WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE,
      confirmInputPlaceholder: WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
    }
  }

  return {
    title: '회원 탈퇴 처리 안내',
    lines: buildMemberWithdrawMessageLines({ displayName }),
    confirmText: confirmTextOverride ?? '탈퇴',
    requiredConfirmInput: WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE,
    confirmInputPlaceholder: WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
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
      confirmLoading={confirmLoading}
      zIndex={zIndex}
    />
  )
}
