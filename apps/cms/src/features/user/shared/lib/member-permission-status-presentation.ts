import type { MemberPermissionApplicationStatus } from '@/types/member-permission-application'

/** 회원 권한 신청 축. 프로그램 신청 승인·활성권한 자체와 강제 통합하지 않는다. */
export const MEMBER_PERMISSION_APPROVAL_LABELS: Record<MemberPermissionApplicationStatus, string> = {
  PENDING: '승인 대기', APPROVED: '승인 완료', REJECTED: '신청 반려',
}
const MEMBER_PERMISSION_APPROVAL_ACCENT: Record<MemberPermissionApplicationStatus, string> = {
  PENDING: 'var(--color-green, #1e8c29)',
  APPROVED: 'var(--main-BK, #3d3d3d)',
  REJECTED: '#c32f4a',
}

export function getMemberPermissionStatusPresentation(
  status: MemberPermissionApplicationStatus,
  options: { revoked?: boolean } = {}
) {
  // revoked는 소비처가 기존 정책으로 계산한 표시 조건. 신청 승인 raw 값/이력은 변경하지 않는다.
  return {
    label: options.revoked ? '권한 종료' : MEMBER_PERMISSION_APPROVAL_LABELS[status],
    accentColor: options.revoked ? MEMBER_PERMISSION_APPROVAL_ACCENT.REJECTED : MEMBER_PERMISSION_APPROVAL_ACCENT[status],
  }
}

export function getMemberPermissionApprovalFilterOptions() {
  return [
    { label: '전체', value: 'ALL' },
    ...(['PENDING', 'APPROVED', 'REJECTED'] as const).map(value => ({
      label: MEMBER_PERMISSION_APPROVAL_LABELS[value], value,
    })),
  ]
}
