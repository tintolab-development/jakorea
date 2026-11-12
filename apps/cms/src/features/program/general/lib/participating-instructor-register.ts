/**
 * 참여 강사 「추가 등록」 — 등록 후 강사비 저장 (BE 회신 A4)
 * 1) POST …/participants (기존 형태, 추가 필드 없음) → participantId
 * 2) PATCH …/participants/{participantId}/instructor-fee-policy
 * 2단계가 실패해도 등록은 이미 끝난 상태다 — 등록 실패와 구분해 안내하고, 상세 [정보 수정]에서 다시 저장하게 한다.
 */

export type ParticipatingInstructorRegisterResult =
  /** 등록·강사비 저장 모두 완료 */
  | { status: 'registered'; participantId: string }
  /** 등록 완료, 강사비 저장 실패(참여 강사 상세 [정보 수정]에서 다시 저장) */
  | { status: 'fee-failed'; participantId: string | null; error: unknown }

/** 등록 성공 + 강사비 저장 실패 안내 */
export const PARTICIPATING_INSTRUCTOR_FEE_SAVE_FAILED_TITLE = '강사비 저장 실패'
export function buildParticipatingInstructorFeeSaveFailedMessage(reason: string): string {
  return `참여 강사 등록은 완료되었지만 강사비를 저장하지 못했습니다.\n${reason}\n참여 강사 상세의 [정보 수정]에서 강사비를 다시 저장해 주세요.`
}

export async function registerParticipatingInstructorWithFeePolicy(params: {
  /** 등록 — 실패하면 그대로 throw(등록 실패) */
  createParticipant: () => Promise<{ participantId?: number | null }>
  /** 강사비 저장 */
  saveFeePolicy: (participantId: string) => Promise<unknown>
}): Promise<ParticipatingInstructorRegisterResult> {
  const created = await params.createParticipant()
  const participantId = created.participantId != null ? String(created.participantId) : null
  if (!participantId) {
    return {
      status: 'fee-failed',
      participantId: null,
      error: new Error('등록 응답에 참여 강사 ID가 없어 강사비를 저장하지 못했습니다.'),
    }
  }
  try {
    await params.saveFeePolicy(participantId)
    return { status: 'registered', participantId }
  } catch (error) {
    return { status: 'fee-failed', participantId, error }
  }
}
