/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const copyMock = vi.fn()
const fetchTemplatesMock = vi.fn()
const fetchPayloadMock = vi.fn()
const fetchVersionsMock = vi.fn()

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  copyFormTemplateVersionRemote: (...args: unknown[]) => copyMock(...args),
  fetchFormTemplatesRemote: (...args: unknown[]) => fetchTemplatesMock(...args),
  fetchFormTemplatePayloadByCodeRemote: (...args: unknown[]) => fetchPayloadMock(...args),
  fetchFormTemplateVersionsRemote: (...args: unknown[]) => fetchVersionsMock(...args),
  fetchFormTemplateVersionRemote: vi.fn(),
  updateFormTemplateVersionRemote: vi.fn(),
  updateFormTemplateRemote: vi.fn(),
  createFormTemplateRemote: vi.fn(),
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
    copyMock.mockReset()
    fetchTemplatesMock.mockReset()
    fetchPayloadMock.mockReset()
    fetchVersionsMock.mockReset()
    fetchTemplatesMock.mockResolvedValue({ items: [], totalPages: 1 })
    fetchVersionsMock.mockResolvedValue([])
  })

  it('resolves a catalog template by code when the list cache is empty', async () => {
    fetchPayloadMock.mockResolvedValue({
      templateId: 42,
      templateVersionId: 7,
      versionNo: 1,
    })
    copyMock.mockResolvedValue({
      templateId: 99,
      templateVersionId: 100,
      templateCode: 'survey-admin-copy',
      versionNo: 1,
    })

    const newCode = await duplicateFormTemplateVersionRemote({
      sourceTemplateCode: 'survey-admin',
    })

    expect(newCode).toBe('survey-admin-copy')
    expect(copyMock).toHaveBeenCalledWith(42, { sourceVersionId: 7, versionLabel: undefined })
    expect(getFormTemplateVersionCacheEntry('survey-admin-copy')).toMatchObject({
      templateId: 99,
      templateVersionId: 100,
    })
  })

  it('does not fall back to a local stub when remote duplicate fails', async () => {
    fetchPayloadMock.mockResolvedValue(null)

    await expect(
      duplicateWritingTemplate({
        sourceTemplateId: 'survey-admin',
        category: 'survey',
      })
    ).rejects.toThrow('복제할 템플릿 ID를 찾을 수 없습니다')
  })
})
