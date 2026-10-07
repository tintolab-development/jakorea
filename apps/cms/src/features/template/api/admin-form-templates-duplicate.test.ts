/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createMock = vi.fn()
const fetchTemplatesMock = vi.fn()
const fetchPayloadMock = vi.fn()
const fetchVersionMock = vi.fn()
const fetchVersionsMock = vi.fn()

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  copyFormTemplateVersionRemote: vi.fn(),
  fetchFormTemplatesRemote: (...args: unknown[]) => fetchTemplatesMock(...args),
  fetchFormTemplatePayloadByCodeRemote: (...args: unknown[]) => fetchPayloadMock(...args),
  fetchFormTemplateVersionsRemote: (...args: unknown[]) => fetchVersionsMock(...args),
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchVersionMock(...args),
  updateFormTemplateVersionRemote: vi.fn(),
  updateFormTemplateRemote: vi.fn(),
  createFormTemplateRemote: (...args: unknown[]) => createMock(...args),
  deleteFormTemplateRemote: vi.fn(),
  publishFormTemplateVersionRemote: vi.fn(),
}))

import { duplicateFormTemplateVersionRemote } from '@/features/template/api/admin-form-templates-service'
import { duplicateWritingTemplate } from '@/features/template/api/duplicate-writing-template'
import {
  clearFormTemplateVersionCache,
  getFormTemplateVersionCacheEntry,
} from '@/features/template/api/form-template-version-cache'

describe('duplicateFormTemplateVersionRemote', () => {
  beforeEach(() => {
    clearFormTemplateVersionCache()
    createMock.mockReset()
    fetchTemplatesMock.mockReset()
    fetchPayloadMock.mockReset()
    fetchVersionMock.mockReset()
    fetchVersionsMock.mockReset()
    fetchTemplatesMock.mockResolvedValue({ items: [], totalPages: 1 })
    fetchVersionsMock.mockResolvedValue([])
    fetchVersionMock.mockResolvedValue({
      templateVersionId: 7,
      schemaJson: '{"paragraphs":[]}',
      extensionJson: '{"overlay":{}}',
      settingsJson: '{"a":1}',
    })
  })

  it('creates a new template row from the source version', async () => {
    fetchPayloadMock.mockResolvedValue({
      templateId: 42,
      templateVersionId: 7,
      versionNo: 1,
    })
    createMock.mockResolvedValue({
      templateId: 99,
      templateCode: 'recruitment-school-custom-01',
      versions: [{ templateVersionId: 100, versionNo: 1 }],
    })

    const newCode = await duplicateFormTemplateVersionRemote({
      sourceTemplateCode: 'recruitment-school',
      category: 'application',
      templateName: '일반_참여 기관 모집 폼 (1)',
    })

    expect(newCode).toBe('recruitment-school-custom-01')
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateName: '일반_참여 기관 모집 폼 (1)',
        category: 'RECRUITMENT',
        schemaJson: '{"paragraphs":[]}',
        extensionJson: '{"overlay":{}}',
        settingsJson: '{"a":1}',
        sourceTemplateId: 42,
        sourceVersionId: 7,
        sourceTemplateCode: 'recruitment-school',
        templateCode: expect.stringMatching(/^recruitment-school-copy-\d+$/),
      })
    )
    expect(getFormTemplateVersionCacheEntry('recruitment-school-custom-01')).toMatchObject({
      templateId: 99,
      templateVersionId: 100,
    })
  })

  it('uses the source template name when no name is given', async () => {
    fetchPayloadMock.mockResolvedValue({
      templateId: 42,
      templateVersionId: 7,
      templateName: '만족도조사 (학생용)',
    })
    createMock.mockResolvedValue({
      templateId: 99,
      templateCode: 'survey-student-custom',
      versions: [{ templateVersionId: 100 }],
    })

    await duplicateFormTemplateVersionRemote({
      sourceTemplateCode: 'survey-student',
      category: 'survey',
    })

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ templateName: '만족도조사 (학생용)', category: 'SURVEY' })
    )
  })

  it('rejects when the response keeps the source template code', async () => {
    fetchPayloadMock.mockResolvedValue({ templateId: 42, templateVersionId: 7 })
    createMock.mockResolvedValue({
      templateId: 42,
      templateCode: 'survey-admin',
      versions: [{ templateVersionId: 8 }],
    })

    await expect(
      duplicateFormTemplateVersionRemote({
        sourceTemplateCode: 'survey-admin',
        category: 'survey',
      })
    ).rejects.toThrow('신규 템플릿 코드를 응답에서 찾을 수 없습니다')
    expect(getFormTemplateVersionCacheEntry('survey-admin')?.templateId).toBe(42)
  })

  it('does not fall back to a local stub when remote duplicate fails', async () => {
    fetchPayloadMock.mockResolvedValue(null)

    await expect(
      duplicateWritingTemplate({
        sourceTemplateId: 'survey-admin',
        category: 'survey',
      })
    ).rejects.toThrow('복제할 템플릿 ID를 찾을 수 없습니다')
    expect(createMock).not.toHaveBeenCalled()
  })
})
