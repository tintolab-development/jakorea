/** uuid ↔ memberId 매핑 — 목록 로드 시 채우고 상세·삭제·권한 API에서 사용 */
const uuidToMemberId = new Map<string, number>()
const memberIdToUuid = new Map<number, string>()

export function registerMemberIdMapping(uuid: string, memberId: number): void {
  if (!uuid || memberId == null || Number.isNaN(memberId)) return
  uuidToMemberId.set(uuid, memberId)
  memberIdToUuid.set(memberId, uuid)
}

export function getMemberIdByUuid(uuid: string): number | undefined {
  return uuidToMemberId.get(uuid)
}

export function getUuidByMemberId(memberId: number): string | undefined {
  return memberIdToUuid.get(memberId)
}

export function clearMemberIdRegistry(): void {
  uuidToMemberId.clear()
  memberIdToUuid.clear()
}

export function resolveMemberIdForApi(
  userId: string,
  hint?: { memberId?: number }
): number {
  if (hint?.memberId != null && !Number.isNaN(hint.memberId)) {
    return hint.memberId
  }
  const fromRegistry = getMemberIdByUuid(userId)
  if (fromRegistry != null) return fromRegistry
  if (/^\d+$/.test(userId.trim())) {
    return Number(userId)
  }
  throw new Error('회원 식별자(memberId)를 찾을 수 없습니다. 목록에서 다시 열어 주세요.')
}
