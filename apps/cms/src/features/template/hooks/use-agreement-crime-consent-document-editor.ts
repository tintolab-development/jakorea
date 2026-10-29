import { useCallback, useEffect, useRef, useState } from 'react'
import crimeConsentDefaultImage from '@/assets/images/template/성범좌 경력 조회.png'
import {
  fetchFormTemplatePayloadByCodeRemote,
  replaceCatalogDocumentRemote,
} from '@/features/template/api/form-templates-api-client'
import {
  resolveFormTemplateCatalogIds,
} from '@/features/template/api/admin-form-templates-service'
import {
  AGREEMENT_CRIME_TEMPLATE_CODE,
  readFileAsDataUrl,
} from '@/features/template/lib/agreement-crime-consent-settings'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import { contentUrlForFileObjectId } from '@/shared/lib/admin-file-upload'
import {
  ADMIN_FILE_PURPOSE,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload/upload-maybe-mock'

export function useAgreementCrimeConsentDocumentEditor(active: boolean) {
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()
  const ignoreDraftLoadRef = useRef(false)
  const [displaySrc, setDisplaySrc] = useState<string>(crimeConsentDefaultImage)
  const [replacementFileName, setReplacementFileName] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!active) {
      ignoreDraftLoadRef.current = false
      setDisplaySrc(crimeConsentDefaultImage)
      setReplacementFileName(null)
      setUploadedFile(null)
      return
    }

    let cancelled = false
    ignoreDraftLoadRef.current = false
    void fetchFormTemplatePayloadByCodeRemote(AGREEMENT_CRIME_TEMPLATE_CODE).then(payload => {
      if (cancelled || ignoreDraftLoadRef.current) return
      const document = payload.catalogDocument
      const src =
        document?.downloadPath?.trim() ||
        (document?.activeFileObjectId != null
          ? contentUrlForFileObjectId(document.activeFileObjectId)
          : '')
      if (src !== '') {
        setDisplaySrc(src)
        setReplacementFileName(document?.fileName ?? null)
        return
      }
      setDisplaySrc(crimeConsentDefaultImage)
      setReplacementFileName(null)
    }).catch(error => {
      console.debug('agreementCrimeConsent catalog document load failed', error)
      if (cancelled || ignoreDraftLoadRef.current) return
      setDisplaySrc(crimeConsentDefaultImage)
      setReplacementFileName(null)
    })

    return () => {
      cancelled = true
    }
  }, [active])

  const replaceDocument = useCallback(
    async (file: File) => {
      try {
        const catalog = await resolveFormTemplateCatalogIds(AGREEMENT_CRIME_TEMPLATE_CODE)
        if (catalog?.templateId == null) {
          throw new Error('성범죄 동의서 템플릿 ID를 찾을 수 없습니다.')
        }
        const uploaded = await uploadAdminFileMaybeMock({
          file,
          owner: {
            ownerDomain: 'CONTENT',
            ownerType: 'FORM_TEMPLATE',
            ownerId: catalog.templateId,
            filePurpose: ADMIN_FILE_PURPOSE.FORM_CATALOG_DOCUMENT,
          },
          originalFileName: file.name,
          waitUntilAvailable: true,
        })
        await replaceCatalogDocumentRemote(catalog.templateId, {
          fileObjectId: uploaded.fileObjectId,
        })
        showSaveSuccess()
      } catch (error) {
        console.debug('agreementCrimeConsent save failed', error)
        showSaveFailure(error)
      }
    },
    [showSaveFailure, showSaveSuccess]
  )

  const handleDocumentFile = useCallback(
    async (file: File) => {
      ignoreDraftLoadRef.current = true
      const dataUrl = await readFileAsDataUrl(file)
      setDisplaySrc(dataUrl)
      setReplacementFileName(file.name)
      setUploadedFile(file)
      await replaceDocument(file)
    },
    [replaceDocument]
  )

  return {
    displaySrc,
    replacementFileName,
    uploadedFile,
    handleDocumentFile,
  }
}
