import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadAdminFile = vi.fn()
const putFormTemplateVersionJson = vi.fn()
const fetchFormTemplateVersionRemote = vi.fn()
const downloadAdminFile = vi.fn()
const deleteFileObject = vi.fn()
const getFileStatus = vi.fn()

vi.mock('@/shared/lib/admin-file-upload', () => ({
  uploadAdminFile: (...args: unknown[]) => uploadAdminFile(...args),
  downloadAdminFile: (...args: unknown[]) => downloadAdminFile(...args),
  deleteFileObject: (...args: unknown[]) => deleteFileObject(...args),
  getFileStatus: (...args: unknown[]) => getFileStatus(...args),
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
    deleteFileObject.mockReset()
    getFileStatus.mockReset()
    getFileStatus.mockRejectedValue(new Error('no meta'))
  })

  it('reads the active file and previous versions', () => {
    expect(parseCatalogDocumentSettings({ catalogDocument: serverDocument, keep: true })?.versions).toEqual(
      serverDocument.versions
    )
  })

  it('keeps other settings and history, appending the new active version', () => {
    const now = '2026-03-01T00:00:00Z'
    expect(
      settingsWithActiveCatalogDocument(
        { catalogDocument: serverDocument, keep: 1 },
        { fileObjectId: 11, fileName: '새 동의서.pdf' },
        now
      )
    ).toEqual({
      keep: 1,
      catalogDocument: {
        ...serverDocument,
        activeFileObjectId: 11,
        activeVersionNo: 2,
        activatedAt: now,
        versions: [
          { ...serverDocument.versions[0], replacedAt: now },
          { versionNo: 2, fileObjectId: 11, activatedAt: now, fileName: '새 동의서.pdf' },
        ],
      },
    })
  })

  it('does not duplicate history when the same file is already active', () => {
    const next = settingsWithActiveCatalogDocument({ catalogDocument: serverDocument }, 10)
    expect((next.catalogDocument as { versions: unknown[] }).versions).toHaveLength(1)
  })

  it('preserves a legacy activeFileObjectId without versions as history', () => {
    const now = '2026-03-01T00:00:00Z'
    const next = settingsWithActiveCatalogDocument(
      { catalogDocument: { activeFileObjectId: 5, activatedAt: '2025-12-01T00:00:00Z' } },
      11,
      now
    )
    expect((next.catalogDocument as { versions: unknown[] }).versions).toEqual([
      { versionNo: 1, fileObjectId: 5, activatedAt: '2025-12-01T00:00:00Z', replacedAt: now },
      { versionNo: 2, fileObjectId: 11, activatedAt: now },
    ])
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

  it('deletes the orphan upload and rethrows when the version PUT fails', async () => {
    uploadAdminFile.mockResolvedValue({ fileObjectId: 12 })
    putFormTemplateVersionJson.mockRejectedValue(new Error('409'))
    deleteFileObject.mockResolvedValue(undefined)
    await expect(
      replaceAgreementCrimeCatalogDocument({
        templateId: 25,
        versionId: 8,
        file: new File(['pdf'], 'document.pdf', { type: 'application/pdf' }),
        version: { settingsJson: JSON.stringify({ catalogDocument: serverDocument }) },
      })
    ).rejects.toThrow('409')
    expect(deleteFileObject).toHaveBeenCalledWith(12)
    expect(fetchFormTemplateVersionRemote).not.toHaveBeenCalled()
  })

  it('warns with the orphan id when cleanup also fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    uploadAdminFile.mockResolvedValue({ fileObjectId: 13 })
    putFormTemplateVersionJson.mockRejectedValue(new Error('409'))
    deleteFileObject.mockRejectedValue(new Error('403'))
    await expect(
      replaceAgreementCrimeCatalogDocument({
        templateId: 25,
        versionId: 8,
        file: new File(['pdf'], 'document.pdf', { type: 'application/pdf' }),
        version: { settingsJson: JSON.stringify({ catalogDocument: serverDocument }) },
      })
    ).rejects.toThrow('409')
    expect(warn).toHaveBeenCalledWith(expect.any(String), { orphanFileObjectId: 13 })
    warn.mockRestore()
  })

  it('rejects non-PDF and files over 20MB before uploading', async () => {
    const version = { settingsJson: JSON.stringify({ catalogDocument: serverDocument }) }
    await expect(
      replaceAgreementCrimeCatalogDocument({
        templateId: 25,
        versionId: 8,
        file: new File(['img'], 'scan.png', { type: 'image/png' }),
        version,
      })
    ).rejects.toThrow('PDF 파일만 업로드할 수 있습니다.')
    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 20 * 1024 * 1024 + 1 })
    await expect(
      replaceAgreementCrimeCatalogDocument({ templateId: 25, versionId: 8, file: big, version })
    ).rejects.toThrow('20MB 이하의 PDF 파일만 업로드할 수 있습니다.')
    expect(uploadAdminFile).not.toHaveBeenCalled()
  })

  it('downloads with the history name, then file metadata name, then fallback', async () => {
    await downloadCatalogDocumentFile({ fileObjectId: 10, fileName: 'fallback.pdf', originalFileName: '이력.pdf' })
    expect(downloadAdminFile).toHaveBeenLastCalledWith({ fileObjectId: 10, fileName: '이력.pdf' })
    expect(getFileStatus).not.toHaveBeenCalled()

    getFileStatus.mockResolvedValueOnce({ originalFileName: '원본.pdf' })
    await downloadCatalogDocumentFile({ fileObjectId: 10, fileName: 'fallback.pdf' })
    expect(downloadAdminFile).toHaveBeenLastCalledWith({ fileObjectId: 10, fileName: '원본.pdf' })
  })
})
