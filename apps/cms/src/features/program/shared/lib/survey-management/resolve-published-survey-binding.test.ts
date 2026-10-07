import { beforeEach, describe, expect, it, vi } from 'vitest'

const resolveFormTemplateCatalogIds = vi.fn()
const fetchFormTemplateVersionsRemote = vi.fn()

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  resolveFormTemplateCatalogIds: (...args: unknown[]) => resolveFormTemplateCatalogIds(...args),
}))

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  fetchFormTemplateVersionsRemote: (...args: unknown[]) => fetchFormTemplateVersionsRemote(...args),
}))

import {
  resolvePublishedSurveyBinding,
  surveyBindingResolutionAlert,
} from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'

describe('resolvePublishedSurveyBinding', () => {
  beforeEach(() => {
    resolveFormTemplateCatalogIds.mockReset()
    fetchFormTemplateVersionsRemote.mockReset()
  })

  it('binds the latest published version of the selected template', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 99, templateVersionId: 101 })
    fetchFormTemplateVersionsRemote.mockResolvedValue([
      { templateVersionId: 100, versionNo: 1, versionStatus: 'PUBLISHED' },
      { templateVersionId: 101, versionNo: 2, versionStatus: 'DRAFT' },
      { templateVersionId: 102, versionNo: 3, versionStatus: 'PUBLISHED' },
    ])

    await expect(resolvePublishedSurveyBinding('survey-student')).resolves.toEqual({
      ok: true,
      templateId: 99,
      templateVersionId: 102,
    })
    expect(fetchFormTemplateVersionsRemote).toHaveBeenCalledWith(99)
  })

  it('returns not_published when the catalog template has no published version', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 99, templateVersionId: 100 })
    fetchFormTemplateVersionsRemote.mockResolvedValue([
      { templateVersionId: 100, versionNo: 1, versionStatus: 'DRAFT' },
    ])

    await expect(resolvePublishedSurveyBinding('survey-student')).resolves.toEqual({
      ok: false,
      reason: 'not_published',
    })
  })

  it('returns not_found when the selected template has no server id', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue(null)

    await expect(resolvePublishedSurveyBinding('missing')).resolves.toEqual({
      ok: false,
      reason: 'not_found',
    })
    expect(fetchFormTemplateVersionsRemote).not.toHaveBeenCalled()
  })
})

describe('surveyBindingResolutionAlert', () => {
  it('asks to publish when the selected form has no published version', () => {
    expect(surveyBindingResolutionAlert('not_published')).toContain('게시')
    expect(surveyBindingResolutionAlert('not_found')).toContain('서버 ID')
  })
})
