import { useCallback, useEffect, useState } from 'react'
import crimeConsentDefaultImage from '@/assets/images/template/성범좌 경력 조회.png'
import { settingsJsonToSettingsPayload } from '@/features/template/api/adapters/form-template-draft-adapters'
import { fetchFormTemplateVersionRemote } from '@/features/template/api/form-templates-api-client'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { resolveFormTemplateCatalogIds } from '@/features/template/api/admin-form-templates-service'
import {
  downloadCatalogDocumentFile,
  parseCatalogDocumentSettings,
  replaceAgreementCrimeCatalogDocument,
  type CatalogDocumentSettings,
} from '@/features/template/lib/agreement-crime-catalog-document'
import { AGREEMENT_CRIME_TEMPLATE_CODE } from '@/features/template/lib/agreement-crime-consent-settings'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import { loadAdminFileBlob } from '@/shared/lib/admin-file-upload'
import type { FormTemplateVersionResponse } from '@/shared/api/generated/forms-surveys/schemas'

export function useAgreementCrimeConsentDocumentEditor(active: boolean) {
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()
  const [displaySrc, setDisplaySrc] = useState<string>(crimeConsentDefaultImage)
  const [documentSettings, setDocumentSettings] = useState<CatalogDocumentSettings | null>(null)
  const [version, setVersion] = useState<FormTemplateVersionResponse | null>(null)
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [replacing, setReplacing] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const applyServerDocument = useCallback(async (next: FormTemplateVersionResponse) => {
    const settings = parseCatalogDocumentSettings(settingsJsonToSettingsPayload(next.settingsJson))
    setVersion(next)
    setDocumentSettings(settings)
    const activeFileId = settings?.activeFileObjectId
    if (activeFileId == null) {
      setDisplaySrc(crimeConsentDefaultImage)
      return
    }
    try {
      const blob = await loadAdminFileBlob(activeFileId, { skipGlobalErrorAlert: true })
      setDisplaySrc(URL.createObjectURL(blob))
    } catch {
      setDisplaySrc(crimeConsentDefaultImage)
    }
  }, [])

  useEffect(() => {
    if (!active) {
      setDisplaySrc(crimeConsentDefaultImage)
      setDocumentSettings(null)
      setVersion(null)
      setTemplateId(null)
      setDownloadError(null)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const cached = getFormTemplateVersionCacheEntry(AGREEMENT_CRIME_TEMPLATE_CODE)
        const resolved =
          cached?.templateId != null &&
          (cached.templateVersionId != null || cached.latestVersionId != null)
            ? {
                templateId: cached.templateId,
                templateVersionId: cached.templateVersionId ?? cached.latestVersionId,
              }
            : await resolveFormTemplateCatalogIds(AGREEMENT_CRIME_TEMPLATE_CODE)
        if (resolved?.templateId == null || resolved.templateVersionId == null) return
        const loaded = await fetchFormTemplateVersionRemote(resolved.templateVersionId)
        if (cancelled) return
        setTemplateId(resolved.templateId)
        await applyServerDocument(loaded)
      } catch (error) {
        if (!cancelled) showSaveFailure(error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [active, applyServerDocument, showSaveFailure])

  const handleDocumentFile = useCallback(
    async (file: File) => {
      if (templateId == null || version?.templateVersionId == null) {
        showSaveFailure(new Error('성범죄 경력조회 동의서 버전을 찾지 못했습니다.'))
        return
      }
      const previous = documentSettings
      setReplacing(true)
      setDownloadError(null)
      try {
        await replaceAgreementCrimeCatalogDocument({
          templateId,
          versionId: version.templateVersionId,
          file,
          version,
        })
        const refreshed = await fetchFormTemplateVersionRemote(version.templateVersionId)
        await applyServerDocument(refreshed)
        showSaveSuccess()
      } catch (error) {
        setDocumentSettings(previous)
        showSaveFailure(error)
      } finally {
        setReplacing(false)
      }
    },
    [applyServerDocument, documentSettings, showSaveFailure, showSaveSuccess, templateId, version]
  )

  const downloadFile = useCallback(async (fileObjectId: number, fileName: string) => {
    setDownloadError(null)
    try {
      await downloadCatalogDocumentFile({ fileObjectId, fileName })
    } catch (error) {
      const message = error instanceof Error ? error.message : '문서를 다운로드하지 못했습니다.'
      setDownloadError(message)
      showSaveFailure(error)
    }
  }, [showSaveFailure])

  return {
    displaySrc,
    replacementFileName: null as string | null,
    uploadedFile: null as File | null,
    documentSettings,
    replacing,
    downloadError,
    handleDocumentFile,
    downloadFile,
  }
}
