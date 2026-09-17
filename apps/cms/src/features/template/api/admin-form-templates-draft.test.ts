/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { writingFormDraftToSchemaJson } from '@/features/template/api/adapters/form-template-draft-adapters'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'
import { loadWritingFormTemplateSave } from '@/features/template/lib/writing-form-template-local-save'

const updateRemoteMock = vi.fn()
const fetchRemoteMock = vi.fn()
const fetchVersionsMock = vi.fn()
const fetchTemplatesMock = vi.fn().mockResolvedValue({ items: [] })
const getCacheMock = vi.fn()

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  updateFormTemplateVersionRemote: (...args: unknown[]) => updateRemoteMock(...args),
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchRemoteMock(...args),
  fetchFormTemplateVersionsRemote: (...args: unknown[]) => fetchVersionsMock(...args),
  fetchFormTemplatesRemote: (...args: unknown[]) => fetchTemplatesMock(...args),
  copyFormTemplateVersionRemote: vi.fn(),
  createFormTemplateRemote: vi.fn(),
  deleteFormTemplateRemote: vi.fn(),
  publishFormTemplateVersionRemote: vi.fn(),
  updateFormTemplateRemote: vi.fn(),
}))

vi.mock('@/features/template/api/form-template-version-cache', () => ({
  getFormTemplateVersionCacheEntry: (...args: unknown[]) => getCacheMock(...args),
  upsertFormTemplateVersionCacheEntry: vi.fn(),
  removeFormTemplateVersionCacheEntry: vi.fn(),
  clearFormTemplateVersionCache: vi.fn(),
  upsertFormTemplateVersionCacheFromListItems: vi.fn(),
}))

import {
  loadFormTemplateVersionDraft,
  saveFormTemplateVersionDraft,
} from '@/features/template/api/admin-form-templates-service'

const TEMPLATE_CODE = 'registration-general'

function stubLocalStorage() {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key]
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  })
}

describe('saveFormTemplateVersionDraft / loadFormTemplateVersionDraft', () => {
  beforeEach(() => {
    stubLocalStorage()
    updateRemoteMock.mockReset()
    fetchRemoteMock.mockReset()
    fetchVersionsMock.mockReset()
    fetchTemplatesMock.mockReset()
    fetchTemplatesMock.mockResolvedValue({ items: [] })
    getCacheMock.mockReset()
    getCacheMock.mockReturnValue({
      templateCode: TEMPLATE_CODE,
      templateId: 1,
      templateVersionId: 10,
      latestVersionId: 10,
    })
  })

  it('rejects when remote PATCH fails (remote SSOT)', async () => {
    updateRemoteMock.mockRejectedValue(new Error('network'))
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: TEMPLATE_CODE,
        draft,
      })
    ).rejects.toThrow('network')

    expect(updateRemoteMock).toHaveBeenCalled()
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)).toBeNull()
  })

  it('rejects when versionId is missing', async () => {
    getCacheMock.mockReturnValue({
      templateCode: TEMPLATE_CODE,
      templateId: 1,
    })
    fetchVersionsMock.mockResolvedValue([])
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: TEMPLATE_CODE,
        draft,
      })
    ).rejects.toThrow(/버전 ID/)

    expect(updateRemoteMock).not.toHaveBeenCalled()
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)).toBeNull()
  })

  it('resolves when remote PUT succeeds without writing localStorage', async () => {
    updateRemoteMock.mockResolvedValue({})
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: TEMPLATE_CODE,
        draft,
      })
    ).resolves.toBeUndefined()

    expect(updateRemoteMock).toHaveBeenCalled()
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)).toBeNull()
  })

  it('returns remote draft and ignores localStorage by default', async () => {
    const remoteDraft = createProgramRegistrationDraft('general')
    fetchRemoteMock.mockResolvedValue({
      templateVersionId: 10,
      versionNo: 2,
      schemaJson: writingFormDraftToSchemaJson(remoteDraft),
      extensionJson: JSON.stringify({ editorState: { marker: 'remote' } }),
      updatedAt: new Date().toISOString(),
    })

    const loaded = await loadFormTemplateVersionDraft(TEMPLATE_CODE)
    expect(loaded?.editorState).toEqual({ marker: 'remote' })
  })
})
