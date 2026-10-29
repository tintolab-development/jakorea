export const formTemplateQueryKeys = {
  all: ['form-templates'] as const,
  writingSections: () => [...formTemplateQueryKeys.all, 'writing-sections'] as const,
  issuanceSections: () => [...formTemplateQueryKeys.all, 'issuance-sections'] as const,
  versionDraft: (templateCode: string) =>
    [...formTemplateQueryKeys.all, 'version-draft', templateCode] as const,
  /** GET /form-template-versions/{id} — 프로그램 모집·신청 hydrate와 공유 */
  versionById: (templateVersionId: number) =>
    [...formTemplateQueryKeys.all, 'version-by-id', templateVersionId] as const,
  /** GET /form-templates/by-code/{templateCode}/published-payload */
  publishedPayload: (templateCode: string) =>
    [...formTemplateQueryKeys.all, 'published-payload', templateCode] as const,
  /** 프로그램 설문 결과 — 바인딩된 게시 version 본문 (GET /form-template-versions/{id}) */
  surveyVersionDraft: (templateVersionId: number) =>
    [...formTemplateQueryKeys.all, 'survey-version-draft', templateVersionId] as const,
}
