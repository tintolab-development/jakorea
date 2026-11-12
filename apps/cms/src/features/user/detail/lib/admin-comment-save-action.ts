/**
 * 관리자 코멘트 저장 분기 (QA-0044).
 * 코멘트는 대상·화면(screenCode)마다 1건이고, 별도 삭제 버튼 없이 내용을 비워 저장하면 삭제한다.
 */
export type AdminCommentSaveAction = 'upsert' | 'delete' | 'close'

export function resolveAdminCommentSaveAction(params: {
  /** 저장하려는 입력값 */
  nextComment: string | null | undefined
  /** 편집을 열 때 저장되어 있던 코멘트 */
  existingComment: string | null | undefined
}): AdminCommentSaveAction {
  if ((params.nextComment ?? '').trim()) return 'upsert'
  return (params.existingComment ?? '').trim() ? 'delete' : 'close'
}
