export const formTemplateQueryKeys = {
  all: ['form-templates'] as const,
  writingSections: () => [...formTemplateQueryKeys.all, 'writing-sections'] as const,
  versionDraft: (templateCode: string) =>
    [...formTemplateQueryKeys.all, 'version-draft', templateCode] as const,
}
