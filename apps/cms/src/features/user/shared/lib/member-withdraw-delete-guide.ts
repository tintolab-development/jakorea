import type { MemberListKind } from '@/shared/config/member-list-kinds'

/** 회원 상세 > 탈퇴 안내 본문 */
export function buildMemberWithdrawMessageLines(params: { displayName: string } | null): string[] {
  if (!params) return []
  const name = params.displayName.trim()
  if (!name) return []
  return [
    `[${name}] 회원을 탈퇴 처리하시겠습니까?`,
    '탈퇴 처리 시 등록 및 관련된 정보는 모두 탈퇴됩니다.',
    '탈퇴된 목록 및 정보는 되돌릴 수 없습니다. 정말 탈퇴하시겠습니까?',
  ]
}

/** 회원 상세 > 학교 삭제 안내 본문 */
export function buildSchoolDeleteMessageLines(params: { displayName: string } | null): string[] {
  if (!params) return []
  const name = params.displayName.trim()
  if (!name) return []
  return [
    `[${name}]를 삭제하시겠습니까?`,
    '삭제 시 즉시 탈퇴 처리 되며, 등록 및 관련된 정보는 모두 삭제됩니다.',
    '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
  ]
}

/** 프로필(내 정보) > 본인 탈퇴 안내 본문 */
export function buildSelfWithdrawMessageLines(): string[] {
  return [
    'JA KOREA 서비스에서 탈퇴하시겠습니까?',
    '탈퇴 시 회원님의 계정 정보, 이용 내역 및 저장된 데이터가 모두 영구 삭제됩니다.',
    '삭제된 정보는 복구가 불가능합니다. 정말 탈퇴하시겠습니까?',
  ]
}

/** 회원 목록 > 삭제 안내 본문 (단일·일괄·학교) */
export function buildMemberListDeleteGuideLines(
  names: string[],
  kind: MemberListKind
): string[] {
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
    return [
      `선택한 ${normalized.length}명의 회원을 삭제하시겠습니까?`,
      '삭제 시 즉시 탈퇴 처리 되며, 등록 및 관련된 정보는 모두 삭제됩니다.',
      '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
    ]
  }
  if (kind === 'institutions') {
    return buildSchoolDeleteMessageLines({ displayName: normalized[0] })
  }
  return [
    `[${normalized[0]}] 회원을 삭제하시겠습니까?`,
    '삭제 시 즉시 탈퇴 처리 되며, 등록 및 관련된 정보는 모두 삭제됩니다.',
    '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
  ]
}
