import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadAdminFile = vi.fn()
const putFormTemplateVersionJson = vi.fn()
const fetchFormTemplateVersionRemote = vi.fn()
const downloadAdminFile = vi.fn()

vi.mock('@/shared/lib/admin-file-upload', () => ({
  uploadAdminFile: (...args: unknown[]) => uploadAdminFile(...args),
  downloadAdminFile: (...args: unknown[]) => downloadAdminFile(...args),
}))

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchFormTemplateVersionRemote(...args),
}))

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  putFormTemplateVersionJson: (...args: unknown[]) => putFormTemplateVersionJson(...args),
}))

import {
  downloadCatalogDocumentFile,
  parseCatalogDocumentSettings,
  replaceAgreementCrimeCatalogDocument,
  settingsWithActiveCatalogDocument,
} from '@/features/template/lib/agreement-crime-catalog-document'

const serverDocument = {
  kind: 'EXTERNAL_FILE',
  templateCode: 'agreement-crime',
  activeFileObjectId: 10,
  activeVersionNo: 1,
  activatedAt: '2026-01-01T00:00:00Z',
  versions: [
    {
      versionNo: 1,
      fileObjectId: 10,
      activatedAt: '2026-01-01T00:00:00Z',
    },
  ],
}

describe('agreement crime catalog document', () => {
  beforeEach(() => {
    uploadAdminFile.mockReset()
    putFormTemplateVersionJson.mockReset()
    fetchFormTemplateVersionRemote.mockReset()
    downloadAdminFile.mockReset()
  })

  it('reads the active file and previous versions', () => {
    expect(parseCatalogDocumentSettings({ catalogDocument: serverDocument, keep: true })?.versions).toEqual(
      serverDocument.versions
    )
  })

  it('keeps other settings and only replaces activeFileObjectId before the server responds', () => {
    expect(settingsWithActiveCatalogDocument({ catalogDocument: serverDocument, keep: 1 }, 11)).toEqual({
      keep: 1,
      catalogDocument: {
        ...serverDocument,
        activeFileObjectId: 11,
      },
    })
  })

  it('uploads FORM_CATALOG_DOCUMENT and downloads by fileObjectId', async () => {
    uploadAdminFile.mockResolvedValue({ fileObjectId: 11 })
    putFormTemplateVersionJson.mockResolvedValue({})
    fetchFormTemplateVersionRemote.mockResolvedValue({
      settingsJson: JSON.stringify({
        catalogDocument: {
          ...serverDocument,
          activeFileObjectId: 11,
          activeVersionNo: 2,
          versions: [
            ...serverDocument.versions,
            { versionNo: 2, fileObjectId: 11, activatedAt: '2026-02-01T00:00:00Z' },
          ],
        },
      }),
    })
    const file = new File(['pdf'], 'document.pdf', { type: 'application/pdf' })

    const next = await replaceAgreementCrimeCatalogDocument({
      templateId: 25,
      versionId: 8,
      file,
      version: {
        schemaJson: '{"paragraphs":[]}',
        extensionJson: '{"overlay":{}}',
        settingsJson: JSON.stringify({ catalogDocument: serverDocument, keep: 1 }),
      },
    })

    expect(uploadAdminFile).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: {
          ownerDomain: 'FORM',
          ownerType: 'FORM_TEMPLATE',
          ownerId: 25,
          filePurpose: 'FORM_CATALOG_DOCUMENT',
        },
      })
    )
    const putBody = putFormTemplateVersionJson.mock.calls[0]?.[1] as { settingsJson: string }
    expect(JSON.parse(putBody.settingsJson).keep).toBe(1)
    expect(JSON.parse(putBody.settingsJson).catalogDocument.activeFileObjectId).toBe(11)
    expect(next?.versions).toHaveLength(2)
    expect(next?.activeFileObjectId).toBe(11)

    await downloadCatalogDocumentFile({ fileObjectId: 10, fileName: 'previous.pdf' })
    expect(downloadAdminFile).toHaveBeenCalledWith({ fileObjectId: 10, fileName: 'previous.pdf' })
  })

  it('does not change the caller snapshot when upload fails', async () => {
    uploadAdminFile.mockRejectedValue(new Error('scan failed'))
    const current = parseCatalogDocumentSettings({ catalogDocument: serverDocument })
    await expect(
      replaceAgreementCrimeCatalogDocument({
        templateId: 25,
        versionId: 8,
        file: new File(['pdf'], 'document.pdf', { type: 'application/pdf' }),
        version: { settingsJson: JSON.stringify({ catalogDocument: serverDocument }) },
      })
    ).rejects.toThrow('scan failed')
    expect(putFormTemplateVersionJson).not.toHaveBeenCalled()
    expect(current?.activeFileObjectId).toBe(10)
  })
})
