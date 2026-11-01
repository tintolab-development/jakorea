/** 신청 정보 미리보기 — 버전 응답 전에는 시드 placeholder 대신 로딩. */

export function shouldRequireRemoteApplicationDraft(
  templateVersionId: number | undefined
): boolean {
  return templateVersionId != null
}

export function shouldShowApplicationFormPreviewLoading(input: {
  bindingsLoading: boolean
  isDraftLoading: boolean
}): boolean {
  return input.bindingsLoading || input.isDraftLoading
}
