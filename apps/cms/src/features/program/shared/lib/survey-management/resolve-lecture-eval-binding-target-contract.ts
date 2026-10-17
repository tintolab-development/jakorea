/**
 * BE: LECTURE_EVALUATION + PROGRAM + targetScopeId null (프로그램당 활성 1건).
 * 서버 미배포 환경에서는 create API가 실패할 수 있음 — Mock/스테이징에서 검증.
 */
export const LECTURE_EVAL_PROGRAM_BINDING_SEND_ENABLED = true

export type LectureEvalBindingTargetContract = {
  targetScope: 'PROGRAM'
  targetScopeId: null
}

export function resolveLectureEvalBindingTargetContract(): LectureEvalBindingTargetContract {
  return {
    targetScope: 'PROGRAM',
    targetScopeId: null,
  }
}
