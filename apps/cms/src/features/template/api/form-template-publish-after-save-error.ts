/** 템플릿 관리 저장은 됐지만 이어서 한 발행이 실패한 경우 */
export const FORM_TEMPLATE_PUBLISH_AFTER_SAVE_FAILED = 'FORM_TEMPLATE_PUBLISH_AFTER_SAVE_FAILED'

export class FormTemplatePublishAfterSaveError extends Error {
  readonly code = FORM_TEMPLATE_PUBLISH_AFTER_SAVE_FAILED
  readonly versionId: number
  readonly leftoverDraftVersionIds: readonly number[]

  constructor(args: {
    versionId: number
    leftoverDraftVersionIds?: readonly number[]
    cause?: unknown
  }) {
    super('저장은 됐지만 발행에 실패했습니다.')
    this.name = 'FormTemplatePublishAfterSaveError'
    this.versionId = args.versionId
    this.leftoverDraftVersionIds = args.leftoverDraftVersionIds ?? []
    if (args.cause !== undefined) {
      this.cause = args.cause
    }
  }
}

export function isFormTemplatePublishAfterSaveError(
  error: unknown
): error is FormTemplatePublishAfterSaveError {
  return error instanceof FormTemplatePublishAfterSaveError
}
