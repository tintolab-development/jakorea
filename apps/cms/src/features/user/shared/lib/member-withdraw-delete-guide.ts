import type { MemberListKind } from '@/shared/config/member-list-kinds'

/** 회원 상세 > 탈퇴 안내 본문 */
export function buildMemberWithdrawMessageLines(params: { displayName: string } | null): string[] {
  if (!params) return []
  const name = params.displayName.trim()
  if (!name) return []
  return [
    `[${name}] 님을 탈퇴 처리하시겠습니까?`,
    '탈퇴 처리 시 개인정보와 활동 내역을 비롯한 모든 회원 정보가 즉시 삭제되며,',
    '삭제된 정보는 복구할 수 없습니다.',
  ]
}

/** 회원 상세 > 학교 삭제 안내 본문 */
export function buildSchoolDeleteMessageLines(params: { displayName: string } | null): string[] {
  if (!params) return []
  const name = params.displayName.trim()
  if (!name) return []
  return [
    `[${name}]를 삭제하시겠습니까?`,
    '삭제 시 등록 및 관련된 정보는 모두 삭제됩니다.',
    '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
  ]
}

/** 프로필(내 정보) > 본인 탈퇴 안내 본문 */
export function buildSelfWithdrawMessageLines(): string[] {
  return [
    'JA KOREA 서비스를 탈퇴하시겠습니까?',
    '탈퇴 시 회원님의 개인정보와 활동 내역을 비롯한 모든 회원 정보가 즉시 삭제되며,',
    '삭제된 정보는 복구할 수 없습니다.',
  ]
}

/** 회원 목록 > 삭제 안내 본문 (단일·일괄·학교) */
export function buildMemberListDeleteGuideLines(names: string[], kind: MemberListKind): string[] {
  const normalized = names.map(name => name.trim()).filter(Boolean)
  if (normalized.length === 0) return []
  if (kind === 'institutions' && normalized.length >= 2) {
    return [
      `선택한 ${normalized.length}개의 학교를 삭제하시겠습니까?`,
      '삭제 시 즉시 삭제 처리 되며, 등록 및 관련된 정보는 모두 삭제됩니다.',
      '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
    ]
  }
  if (normalized.length >= 2) {
    const othersCount = normalized.length - 1
    return [
      `**[${normalized[0]}] 님 외 ${othersCount}명**을 삭제하시겠습니까?`,
      '삭제 시 자동으로 회원 탈퇴 처리되며, 개인정보와 활동 내역을 비롯한 모든 회원 정보가',
      '즉시 삭제됩니다. 삭제된 정보는 복구할 수 없습니다.',
    ]
  }
  if (kind === 'institutions') {
    return buildSchoolDeleteMessageLines({ displayName: normalized[0] })
  }
  return [
    `[${normalized[0]}] 님을 삭제하시겠습니까?`,
    '삭제 시 자동으로 회원 탈퇴 처리되며, 개인정보와 활동 내역을 비롯한 모든 회원 정보가',
    '즉시 삭제됩니다. 삭제된 정보는 복구할 수 없습니다.',
  ]
}
