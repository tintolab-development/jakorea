export type PortalBoundFormSubmitInput = {
  programId: number
  bindingId: number
  templateVersionId: number
  answers: Record<string, unknown>
  contextType?: string
  contextId?: number
  fileObjectIdsByQuestion?: Record<string, number[]>
}

/**
 * 활성 binding이 고정한 식별자를 그대로 제출한다.
 * templateVersionId를 카탈로그 최신 버전으로 조회하거나 교체하지 않는다.
 */
export function buildPortalBoundFormSubmitBody(input: PortalBoundFormSubmitInput) {
  return {
    templateVersionId: input.templateVersionId,
    programId: input.programId,
    programFormBindingId: input.bindingId,
    answers: input.answers,
    ...(input.contextType == null ? {} : { contextType: input.contextType }),
    ...(input.contextId == null ? {} : { contextId: input.contextId }),
    ...(input.fileObjectIdsByQuestion == null
      ? {}
      : { fileObjectIdsByQuestion: input.fileObjectIdsByQuestion }),
  }
}
