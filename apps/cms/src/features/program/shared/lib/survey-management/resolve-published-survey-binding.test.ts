import { beforeEach, describe, expect, it, vi } from 'vitest'

const resolveFormTemplateCatalogIds = vi.fn()
const publishFormTemplateVersionById = vi.fn()

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  resolveFormTemplateCatalogIds: (...args: unknown[]) => resolveFormTemplateCatalogIds(...args),
  publishFormTemplateVersionById: (...args: unknown[]) => publishFormTemplateVersionById(...args),
}))

import { resolvePublishedDuplicatedSurveyBinding } from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'

describe('resolvePublishedDuplicatedSurveyBinding', () => {
  beforeEach(() => {
    resolveFormTemplateCatalogIds.mockReset()
    publishFormTemplateVersionById.mockReset()
  })

  it('publishes the duplicated version before binding', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 99, templateVersionId: 100 })
    publishFormTemplateVersionById.mockResolvedValue(100)

    await expect(resolvePublishedDuplicatedSurveyBinding('survey-admin-copy')).resolves.toEqual({
      templateId: 99,
      templateVersionId: 100,
    })
    expect(publishFormTemplateVersionById).toHaveBeenCalledWith(100)
  })

  it('keeps the copied version when it is already published', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 99, templateVersionId: 100 })
    publishFormTemplateVersionById.mockRejectedValue({
      response: { status: 409 },
      message: 'already published',
    })

    await expect(resolvePublishedDuplicatedSurveyBinding('survey-admin-copy')).resolves.toEqual({
      templateId: 99,
      templateVersionId: 100,
    })
  })

  it('returns null when the duplicated template has no server id', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue(null)

    await expect(resolvePublishedDuplicatedSurveyBinding('missing')).resolves.toBeNull()
    expect(publishFormTemplateVersionById).not.toHaveBeenCalled()
  })
})
