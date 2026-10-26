import type { MemberListKind } from '@/shared/config/member-list-kinds'

/** 학교 삭제 안내 — 시안 2줄(질문 + 영구 삭제 경고) */
export const SCHOOL_DELETE_IMPACT_LINE =
  '삭제 시 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.'

/** 회원 삭제 안내 — 단건·일괄·상세 공통 본문(질문 다음 한 단락) */
export const MEMBER_BULK_DELETE_IMPACT_LINE =
  '삭제 시 자동으로 회원 탈퇴 처리되며, 개인정보는 관련 법령 및 당사의 개인정보처리방침에 따라 삭제·처리됩니다. 삭제된 정보는 복구할 수 없습니다.'

const MEMBER_DELETE_IMPACT_LINES = [
  '삭제 시 자동으로 회원 탈퇴 처리되며, 개인정보와 활동 내역을 비롯한 모든 회원 정보가',
  '즉시 삭제됩니다. 삭제된 정보는 복구할 수 없습니다.',
] as const

/** 회원 상세 > 탈퇴 안내 본문 */
export function buildMemberWithdrawMessageLines(params: { displayName: string } | null): string[] {
  if (!params) return []
  const name = params.displayName.trim()
  if (!name) return []
  return [
    `**[${name}] 님**을 탈퇴 처리하시겠습니까?`,
    '탈퇴 시 개인정보는 관련 법령 및 당사의 개인정보처리방침에 따라 삭제∙처리됩니다.',
    '삭제된 정보는 복구할 수 없습니다.',
  ]
}

/** 회원 상세 > 학교 삭제 안내 본문 */
export function buildSchoolDeleteMessageLines(params: { displayName: string } | null): string[] {
  if (!params) return []
  const name = params.displayName.trim()
  if (!name) return []
  return [`**[${name}]**를 삭제하시겠습니까?`, SCHOOL_DELETE_IMPACT_LINE]
}

/** 프로필(내 정보) > 본인 탈퇴 안내 본문 */
export function buildSelfWithdrawMessageLines(): string[] {
  return [
    'JA KOREA 서비스를 탈퇴하시겠습니까?',
    '탈퇴 시 개인정보는 관련 법령 및 당사의 개인정보처리방침에 따라 삭제∙처리됩니다.',
    '삭제된 정보는 복구할 수 없습니다. 탈퇴하시려면 로그인 비밀번호를 입력해 주세요.',
  ]
}

/** 회원 단건·상세 삭제 안내 본문 */
export function buildMemberSingleDeleteGuideLines(displayName: string): string[] {
  const name = displayName.trim()
  if (!name) return []
  return [`**[${name}] 님**을 삭제하시겠습니까?`, MEMBER_BULK_DELETE_IMPACT_LINE]
}

/** 회원 목록 > 삭제 안내 본문 (단일·일괄·학교) */
export function buildMemberListDeleteGuideLines(names: string[], kind: MemberListKind): string[] {
  const normalized = names.map(name => name.trim()).filter(Boolean)
  if (normalized.length === 0) return []
  if (kind === 'institutions' && normalized.length >= 2) {
    const othersCount = normalized.length - 1
    return [
      `**[${normalized[0]}] 외 ${othersCount}개**를 삭제하시겠습니까?`,
      SCHOOL_DELETE_IMPACT_LINE,
    ]
  }
  if (normalized.length >= 2) {
    const othersCount = normalized.length - 1
    const question = `**[${normalized[0]}] 님 외 ${othersCount}명**을 삭제하시겠습니까?`
    if (kind === 'instructors') {
      return [question, ...MEMBER_DELETE_IMPACT_LINES]
    }
    return [question, MEMBER_BULK_DELETE_IMPACT_LINE]
  }
  if (kind === 'institutions') {
    return buildSchoolDeleteMessageLines({ displayName: normalized[0] })
  }
  if (kind === 'instructors') {
    return [`**[${normalized[0]}] 님**을 삭제하시겠습니까?`, ...MEMBER_DELETE_IMPACT_LINES]
  }
  return buildMemberSingleDeleteGuideLines(normalized[0])
}
