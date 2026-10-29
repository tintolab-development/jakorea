import { useCallback, useEffect, useRef, useState } from 'react'
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
  /** C10: 미리보기용 blob URL — 교체·비활성·언마운트 시 revoke */
  const objectUrlRef = useRef<string | null>(null)

  const showDisplaySrc = useCallback((nextSrc: string, objectUrl: string | null) => {
    const previous = objectUrlRef.current
    objectUrlRef.current = objectUrl
    setDisplaySrc(nextSrc)
    if (previous != null && previous !== objectUrl) URL.revokeObjectURL(previous)
  }, [])

  useEffect(
    () => () => {
      if (objectUrlRef.current != null) URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    },
    []
  )

  const applyServerDocument = useCallback(
    async (next: FormTemplateVersionResponse) => {
      const settings = parseCatalogDocumentSettings(settingsJsonToSettingsPayload(next.settingsJson))
      setVersion(next)
      setDocumentSettings(settings)
      const activeFileId = settings?.activeFileObjectId
      if (activeFileId == null) {
        showDisplaySrc(crimeConsentDefaultImage, null)
        return
      }
      try {
        const blob = await loadAdminFileBlob(activeFileId, { skipGlobalErrorAlert: true })
        const objectUrl = URL.createObjectURL(blob)
        showDisplaySrc(objectUrl, objectUrl)
      } catch {
        showDisplaySrc(crimeConsentDefaultImage, null)
      }
    },
    [showDisplaySrc]
  )

  useEffect(() => {
    if (!active) {
      showDisplaySrc(crimeConsentDefaultImage, null)
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
  }, [active, applyServerDocument, showDisplaySrc, showSaveFailure])

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
      // C10: 이력에 남은 실제 파일명 우선, 없으면 파일 메타 → 기존 이름
      const originalFileName = documentSettings?.versions?.find(
        item => item.fileObjectId === fileObjectId && item.fileName != null
      )?.fileName
      await downloadCatalogDocumentFile({ fileObjectId, fileName, originalFileName })
    } catch (error) {
      const message = error instanceof Error ? error.message : '문서를 다운로드하지 못했습니다.'
      setDownloadError(message)
      showSaveFailure(error)
    }
  }, [documentSettings, showSaveFailure])

  const activeFileName =
    documentSettings?.versions?.find(
      item =>
        item.fileObjectId === documentSettings.activeFileObjectId &&
        (documentSettings.activeVersionNo == null ||
          item.versionNo === documentSettings.activeVersionNo)
    )?.fileName ?? null

  return {
    displaySrc,
    replacementFileName: activeFileName,
    uploadedFile: null as File | null,
    documentSettings,
    replacing,
    downloadError,
    handleDocumentFile,
    downloadFile,
  }
}
