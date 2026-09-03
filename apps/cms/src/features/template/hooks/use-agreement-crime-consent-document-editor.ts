import { useCallback, useEffect, useRef, useState } from 'react'
import crimeConsentDefaultImage from '@/assets/images/template/성범좌 경력 조회.png'
import {
  AGREEMENT_CRIME_TEMPLATE_CODE,
  buildAgreementCrimeConsentSettings,
  parseAgreementCrimeConsentSettings,
  readImageFileAsDataUrl,
} from '@/features/template/lib/agreement-crime-consent-settings'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

const EMPTY_CRIME_CONSENT_DRAFT: WritingFormDraft = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [],
}

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
    void loadWritingFormTemplateDraft(AGREEMENT_CRIME_TEMPLATE_CODE).then(saved => {
      if (cancelled || ignoreDraftLoadRef.current) return
      const settings = parseAgreementCrimeConsentSettings(saved?.settingsJson)
      if (settings.documentImageUrl != null) {
        setDisplaySrc(settings.documentImageUrl)
        setReplacementFileName(settings.replacementFileName ?? null)
        return
      }
      setDisplaySrc(crimeConsentDefaultImage)
      setReplacementFileName(null)
    })

    return () => {
      cancelled = true
    }
  }, [active])

  const persistDocument = useCallback(
    async (args: { documentImageUrl: string; replacementFileName: string | null }) => {
      try {
        await persistWritingFormTemplateDraft({
          templateId: AGREEMENT_CRIME_TEMPLATE_CODE,
          draft: normalizeWritingFormDraft(EMPTY_CRIME_CONSENT_DRAFT),
          settingsJson: buildAgreementCrimeConsentSettings(args),
        })
        showSaveSuccess()
      } catch (error) {
        console.debug('agreementCrimeConsent save failed', error)
        showSaveFailure()
      }
    },
    [showSaveFailure, showSaveSuccess]
  )

  const handleDocumentFile = useCallback(
    async (file: File) => {
      ignoreDraftLoadRef.current = true
      const dataUrl = await readImageFileAsDataUrl(file)
      setDisplaySrc(dataUrl)
      setReplacementFileName(file.name)
      setUploadedFile(file)
      await persistDocument({
        documentImageUrl: dataUrl,
        replacementFileName: file.name,
      })
    },
    [persistDocument]
  )

  return {
    displaySrc,
    replacementFileName,
    uploadedFile,
    handleDocumentFile,
  }
}
