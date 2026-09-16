/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { writingFormDraftToSchemaJson } from '@/features/template/api/adapters/form-template-draft-adapters'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'
import {
  isLocalStorageQuotaExceededError,
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
  removeWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/template/api/form-templates-api-client', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/template/api/form-templates-api-client')>()
  return {
    ...actual,
    updateFormTemplateVersionRemote: vi.fn(),
    fetchFormTemplateVersionRemote: vi.fn(),
    fetchFormTemplateVersionsRemote: vi.fn(),
  }
})

vi.mock('@/features/template/api/form-template-version-cache', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/template/api/form-template-version-cache')>()
  return {
    ...actual,
    getFormTemplateVersionCacheEntry: vi.fn(),
  }
})

import {
  fetchFormTemplateVersionRemote,
  fetchFormTemplateVersionsRemote,
  updateFormTemplateVersionRemote,
} from '@/features/template/api/form-templates-api-client'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import {
  loadFormTemplateVersionDraft,
  saveFormTemplateVersionDraft,
} from '@/features/template/api/admin-form-templates-service'

const updateRemoteMock = vi.mocked(updateFormTemplateVersionRemote)
const fetchRemoteMock = vi.mocked(fetchFormTemplateVersionRemote)
const fetchVersionsMock = vi.mocked(fetchFormTemplateVersionsRemote)
const getCacheMock = vi.mocked(getFormTemplateVersionCacheEntry)

const TEMPLATE_CODE = 'registration-general'

describe('isLocalStorageQuotaExceededError', () => {
  it('detects QuotaExceededError by name', () => {
    expect(isLocalStorageQuotaExceededError({ name: 'QuotaExceededError' })).toBe(true)
    expect(isLocalStorageQuotaExceededError({ name: 'TypeError' })).toBe(false)
  })
})

describe('saveFormTemplateVersionDraft / loadFormTemplateVersionDraft', () => {
  beforeEach(() => {
    localStorage.clear()
    updateRemoteMock.mockReset()
    fetchRemoteMock.mockReset()
    fetchVersionsMock.mockReset()
    getCacheMock.mockReset()
    getCacheMock.mockReturnValue({
      templateCode: TEMPLATE_CODE,
      templateId: 1,
      templateVersionId: 10,
      latestVersionId: 10,
    })
  })

  it('resolves when local succeeds even if remote PATCH fails', async () => {
    updateRemoteMock.mockRejectedValue(new Error('network'))
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: TEMPLATE_CODE,
        draft,
      })
    ).resolves.toBeUndefined()

    expect(updateRemoteMock).toHaveBeenCalled()
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)?.draft.paragraphs.length).toBeGreaterThan(0)
  })

  it('resolves when versionId is missing (remote skipped after local)', async () => {
    getCacheMock.mockReturnValue({
      templateCode: TEMPLATE_CODE,
      templateId: 1,
    })
    fetchVersionsMock.mockResolvedValue([])
    updateRemoteMock.mockResolvedValue({} as never)
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: TEMPLATE_CODE,
        draft,
      })
    ).resolves.toBeUndefined()

    expect(updateRemoteMock).not.toHaveBeenCalled()
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)).not.toBeNull()
  })

  it('throws when localStorage quota is exceeded', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      throw err
    })
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: TEMPLATE_CODE,
        draft,
      })
    ).rejects.toSatisfy(isLocalStorageQuotaExceededError)

    setItem.mockRestore()
  })

  it('prefers newer local over stale remote and does not overwrite local', async () => {
    const localDraft = createProgramRegistrationDraft('general')
    persistWritingFormTemplateSave({
      templateId: TEMPLATE_CODE,
      draft: localDraft,
      editorState: { marker: 'local-newer' },
    })
    const local = loadWritingFormTemplateSave(TEMPLATE_CODE)
    expect(local).not.toBeNull()

    // remote older than local
    const olderAt = new Date(Date.parse(local!.savedAt) - 60_000).toISOString()
    const staleRemoteDraft = createProgramRegistrationDraft('general')
    fetchRemoteMock.mockResolvedValue({
      templateVersionId: 10,
      versionNo: 1,
      schemaJson: writingFormDraftToSchemaJson(staleRemoteDraft),
      extensionJson: JSON.stringify({ editorState: { marker: 'remote-stale' } }),
      updatedAt: olderAt,
    } as never)

    const loaded = await loadFormTemplateVersionDraft(TEMPLATE_CODE)
    expect(loaded?.editorState).toEqual({ marker: 'local-newer' })
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)?.editorState).toEqual({
      marker: 'local-newer',
    })
  })

  it('returns newer remote without overwriting local draft on entry', async () => {
    const localDraft = createProgramRegistrationDraft('general')
    persistWritingFormTemplateSave({
      templateId: TEMPLATE_CODE,
      draft: localDraft,
      editorState: { marker: 'local-older' },
    })
    const local = loadWritingFormTemplateSave(TEMPLATE_CODE)!
    const newerAt = new Date(Date.parse(local.savedAt) + 60_000).toISOString()

    fetchRemoteMock.mockResolvedValue({
      templateVersionId: 10,
      versionNo: 2,
      schemaJson: writingFormDraftToSchemaJson(localDraft),
      extensionJson: JSON.stringify({ editorState: { marker: 'remote-newer' } }),
      updatedAt: newerAt,
    } as never)

    const loaded = await loadFormTemplateVersionDraft(TEMPLATE_CODE)
    expect(loaded?.editorState).toEqual({ marker: 'remote-newer' })
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)?.editorState).toEqual({
      marker: 'local-older',
    })

    removeWritingFormTemplateSave(TEMPLATE_CODE)
  })
})
