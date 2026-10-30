/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const duplicateMock = vi.fn()
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
  copyFormTemplateVersionRemote: vi.fn(),
  fetchFormTemplatesRemote: (...args: unknown[]) => fetchTemplatesMock(...args),
  fetchFormTemplatePayloadByCodeRemote: (...args: unknown[]) => fetchPayloadMock(...args),
  fetchFormTemplateVersionsRemote: (...args: unknown[]) => fetchVersionsMock(...args),
  fetchFormTemplateVersionRemote: vi.fn(),
  updateFormTemplateVersionRemote: vi.fn(),
  updateFormTemplateRemote: vi.fn(),
  createFormTemplateRemote: vi.fn(),
  duplicateFormTemplateRemote: (...args: unknown[]) => duplicateMock(...args),
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
    duplicateMock.mockReset()
    fetchTemplatesMock.mockReset()
    fetchPayloadMock.mockReset()
    fetchVersionsMock.mockReset()
    fetchTemplatesMock.mockResolvedValue({ items: [], totalPages: 1 })
    fetchVersionsMock.mockResolvedValue([])
  })

  it('creates a new catalog row via duplicate API', async () => {
    fetchPayloadMock.mockResolvedValue({
      templateId: 4,
      templateVersionId: 89,
      versionNo: 1,
    })
    duplicateMock.mockResolvedValue({
      templateId: 512,
      templateCode: 'recruitment-participant-school-custom-01',
      latestVersionId: 1203,
      versions: [{ templateVersionId: 1203, versionNo: 1 }],
    })

    const newCode = await duplicateFormTemplateVersionRemote({
      sourceTemplateCode: 'recruitment-participant-school',
      sourceApiTemplateId: 4,
      sourceVersionId: 89,
      templateName: '일반_참여 기관 모집 폼 (1)',
    })

    expect(newCode).toBe('recruitment-participant-school-custom-01')
    expect(duplicateMock).toHaveBeenCalledWith(4, {
      templateName: '일반_참여 기관 모집 폼 (1)',
      sourceVersionId: 89,
    })
    expect(getFormTemplateVersionCacheEntry('recruitment-participant-school-custom-01')).toMatchObject(
      {
        templateId: 512,
        templateVersionId: 1203,
        systemTemplate: false,
        baseTemplateCode: 'recruitment-participant-school',
      }
    )
  })

  it('rejects when the response keeps the source template code', async () => {
    duplicateMock.mockResolvedValue({
      templateId: 4,
      templateCode: 'recruitment-participant-school',
      latestVersionId: 89,
    })

    await expect(
      duplicateFormTemplateVersionRemote({
        sourceTemplateCode: 'recruitment-participant-school',
        sourceApiTemplateId: 4,
        templateName: '일반_참여 기관 모집 폼 (1)',
      })
    ).rejects.toThrow('신규 템플릿 코드를 응답에서 찾을 수 없습니다')
  })

  it('rejects registration catalog original duplicate', async () => {
    await expect(
      duplicateFormTemplateVersionRemote({
        sourceTemplateCode: 'registration-general',
        sourceApiTemplateId: 1,
        sourceVersionId: 10,
      })
    ).rejects.toThrow(/등록 양식 CATALOG 원본/)
    expect(duplicateMock).not.toHaveBeenCalled()
  })

  it('rejects agreement-crime duplicate', async () => {
    await expect(
      duplicateFormTemplateVersionRemote({
        sourceTemplateCode: 'agreement-crime',
        sourceApiTemplateId: 2,
        sourceVersionId: 20,
      })
    ).rejects.toThrow(/성범죄/)
    expect(duplicateMock).not.toHaveBeenCalled()
  })

  it('does not fall back to a local stub when remote duplicate fails', async () => {
    fetchPayloadMock.mockResolvedValue(null)

    await expect(
      duplicateWritingTemplate({
        sourceTemplateId: 'survey-admin',
        category: 'survey',
      })
    ).rejects.toThrow('복제할 템플릿 ID를 찾을 수 없습니다')
    expect(duplicateMock).not.toHaveBeenCalled()
  })
})
