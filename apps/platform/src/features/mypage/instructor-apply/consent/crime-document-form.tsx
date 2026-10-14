import { type ChangeEvent, useCallback, useRef, useState } from 'react'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import { submitPortalCrimeConsentComplete } from '../../settings/lib/submit-portal-consent-document'
import type { InstructorApplyConsentKey } from './catalog'
import { CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE } from './catalog'
import { downloadCrimeConsentFormDocument } from './crime-consent-form-document'
import { markInstructorApplyConsentAgreed } from './form-persist'
import type { ConsentWriteSubmitContext } from './write-form'
import { uploadMemberPortalFile } from '../api/member-file-upload'
import styles from './consent-form.module.css'

const CRIME_CONSENT_UPLOAD_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp'
const CRIME_CONSENT_FILE_TYPE_ALERT_MESSAGE = 'PDF 또는 이미지 파일만 업로드할 수 있습니다.'
const PDF_FILE_NAME_PATTERN = /\.pdf$/i
const IMAGE_FILE_NAME_PATTERN = /\.(jpe?g|png|webp)$/i

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('invalid file data'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

function isCrimeConsentUploadFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  if (mime === 'application/pdf' || mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp') {
    return true
  }
  return PDF_FILE_NAME_PATTERN.test(file.name) || IMAGE_FILE_NAME_PATTERN.test(file.name)
}

function isPdfPreviewSrc(src: string, fileName: string | null): boolean {
  if (fileName != null && PDF_FILE_NAME_PATTERN.test(fileName)) return true
  return src.startsWith('data:application/pdf')
}

/** CMS `MemberConsentCrimeModal`과 동일 — A4 문서 업로드 후 제출 */
const PORTAL_SUBMIT_FAILED_MESSAGE =
  '동의서를 제출하지 못했어요. 잠시 후 다시 시도해 주세요.'

export function CrimeConsentDocumentForm({
  consentKey,
  uploaded,
  onUploadedChange,
  onComplete,
  incomplete,
  submitContext = 'instructorApply',
  portalSubmitEnabled = false,
}: {
  consentKey: InstructorApplyConsentKey
  uploaded: boolean
  onUploadedChange: (uploaded: boolean) => void
  onComplete: () => void
  incomplete: boolean
  submitContext?: ConsentWriteSubmitContext
  portalSubmitEnabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [previewFileName, setPreviewFileName] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePickDocument = () => {
    fileInputRef.current?.click()
  }

  const handleDownloadForm = useCallback(() => {
    void downloadCrimeConsentFormDocument().catch(error => {
      console.debug('crimeConsentForm download failed', error)
    })
  }, [])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!isCrimeConsentUploadFile(file)) {
      setAlertMessage(CRIME_CONSENT_FILE_TYPE_ALERT_MESSAGE)
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setAlertMessage('파일은 20MB 이하만 업로드할 수 있습니다.')
      return
    }
    setUploading(true)
    void uploadMemberPortalFile({ file, filePurpose: 'CRIMINAL_HISTORY_EVIDENCE' })
      .then(async () => {
        const dataUrl = await readFileAsDataUrl(file)
        setPreviewSrc(dataUrl)
        setPreviewFileName(file.name)
        onUploadedChange(true)
      })
      .catch(() => {
        onUploadedChange(false)
        setAlertMessage('증빙 서류 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      })
      .finally(() => {
        setUploading(false)
      })
  }

  const handleSubmit = () => {
    if (isSubmitting) return
    if (incomplete) {
      setAlertMessage(CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE)
      return
    }
    if (portalSubmitEnabled) {
      setIsSubmitting(true)
      void submitPortalCrimeConsentComplete(consentKey)
        .then(() => {
          if (submitContext === 'instructorApply') {
            markInstructorApplyConsentAgreed(consentKey)
          }
          onComplete()
        })
        .catch(() => setAlertMessage(PORTAL_SUBMIT_FAILED_MESSAGE))
        .finally(() => setIsSubmitting(false))
      return
    }
    markInstructorApplyConsentAgreed(consentKey)
    onComplete()
  }

  return (
    <>
      <div className={styles.crimeDocument}>
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
          동의서 문서를 다운로드 후 작성해서 업로드 해주세요. 업로드가 완료되어야 동의된 것으로
          간주됩니다.
        </PFText>
        <div className={styles.crimeDocumentActions}>
          <PFButton size="large" variant="secondary" type="button" onClick={handleDownloadForm}>
            양식 다운로드
          </PFButton>
          <PFButton
            size="large"
            variant="secondary"
            type="button"
            disabled={uploading}
            onClick={handlePickDocument}
          >
            {uploading ? '업로드 중' : '문서 업로드'}
          </PFButton>
          {uploaded ? (
            <PFText as="span" typo="bd-sm-rg" color="primary-500">
              업로드 완료
            </PFText>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={CRIME_CONSENT_UPLOAD_ACCEPT}
          className={styles.visuallyHiddenFile}
          onChange={handleFileChange}
          aria-label="동의서 문서 파일 선택"
        />
        {previewSrc ? (
          <div className={styles.crimeDocumentPreview}>
            {isPdfPreviewSrc(previewSrc, previewFileName) ? (
              <iframe
                className={styles.crimeDocumentPreviewPdf}
                src={previewSrc}
                title="업로드한 성범죄 경력 조회 동의서"
              />
            ) : (
              <img src={previewSrc} alt="업로드한 성범죄 경력 조회 동의서" />
            )}
          </div>
        ) : null}
      </div>
      <div className={styles.actions}>
        <PFButton
          size="xlarge"
          width={240}
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? '제출 중…' : '작성 완료'}
        </PFButton>
      </div>
      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? ''}
        onConfirm={() => setAlertMessage(null)}
      />
    </>
  )
}
