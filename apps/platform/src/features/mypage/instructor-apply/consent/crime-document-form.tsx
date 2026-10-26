import { useCallback, useState } from 'react'
import {
  PFAlertModal,
  PFButton,
  PFFormFileAttach,
  PFFormSection,
  PFItemDeleteButton,
  PFText,
} from '@/shared/ui'
import {
  formatSingleFileUploadHint,
  validateUploadFileSize,
} from '@/shared/lib/file-upload-policy'
import { submitPortalCrimeConsentComplete } from '../../settings/lib/submit-portal-consent-document'
import type { InstructorApplyConsentKey } from './catalog'
import { CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE } from './catalog'
import { downloadCrimeConsentFormDocument } from './crime-consent-form-document'
import { markInstructorApplyConsentAgreed } from './form-persist'
import type { ConsentWriteSubmitContext } from './write-form'
import { uploadMemberPortalFile } from '../api/member-file-upload'
import styles from './consent-form.module.css'

const CRIME_CONSENT_UPLOAD_ACCEPT =
  'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png'
const CRIME_CONSENT_FILE_TYPE_ALERT_MESSAGE = 'PDF, JPG, PNG 파일만 업로드할 수 있습니다.'
const PDF_FILE_NAME_PATTERN = /\.pdf$/i
const IMAGE_FILE_NAME_PATTERN = /\.(jpe?g|png)$/i

const CRIME_CONSENT_UPLOAD_HINTS = [
  formatSingleFileUploadHint('PDF, JPG, PNG'),
  '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
] as const

function isCrimeConsentUploadFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  if (mime === 'application/pdf' || mime === 'image/jpeg' || mime === 'image/png') {
    return true
  }
  return PDF_FILE_NAME_PATTERN.test(file.name) || IMAGE_FILE_NAME_PATTERN.test(file.name)
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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDownloadForm = useCallback(() => {
    void downloadCrimeConsentFormDocument().catch(error => {
      console.debug('crimeConsentForm download failed', error)
    })
  }, [])

  const handleFileSelect = (file: File) => {
    if (!isCrimeConsentUploadFile(file)) {
      setAlertMessage(CRIME_CONSENT_FILE_TYPE_ALERT_MESSAGE)
      return
    }
    const sizeError = validateUploadFileSize(file)
    if (sizeError) {
      setAlertMessage(sizeError)
      return
    }
    setUploading(true)
    void uploadMemberPortalFile({ file, filePurpose: 'CRIMINAL_HISTORY_EVIDENCE' })
      .then(() => {
        setUploadedFileName(file.name)
        onUploadedChange(true)
      })
      .catch(() => {
        onUploadedChange(false)
        setUploadedFileName(null)
        setAlertMessage('증빙 서류 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      })
      .finally(() => {
        setUploading(false)
      })
  }

  const handleRemoveFile = () => {
    if (uploading || isSubmitting) return
    setUploadedFileName(null)
    onUploadedChange(false)
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

  const showUploadedFile = uploaded && uploadedFileName != null && uploadedFileName.trim() !== ''

  return (
    <>
      <div className={styles.form}>
        <PFFormSection>
          <div className={styles.crimeDownloadRow}>
            <div className={styles.crimeDownloadCopy}>
              <PFText as="h2" typo="form-section-title" color="black" className={styles.crimeStepTitle}>
                1. 동의서 양식 다운로드
              </PFText>
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-500">
                성범죄 경력 조회 동의서 양식을 다운로드하여 작성 및 서명해 주세요.
              </PFText>
            </div>
            <PFButton
              size="large"
              variant="secondary"
              type="button"
              className={styles.crimeDownloadButton}
              onClick={handleDownloadForm}
            >
              양식 다운로드
            </PFButton>
          </div>
        </PFFormSection>

        <PFFormSection
          title="2. 작성한 동의서 업로드"
          required
          description="작성 및 서명이 완료된 동의서를 업로드해 주세요."
        >
          <section className={styles.crimeAttachSection} aria-label="동의서 파일 첨부">
            <PFText as="p" typo="label-md" color="neutral-warm-600" className={styles.crimeAttachLabel}>
              작성한 동의서를 첨부해 주세요.
            </PFText>
            <PFFormFileAttach
              className={styles.crimeAttachButton}
              accept={CRIME_CONSENT_UPLOAD_ACCEPT}
              buttonLabel="동의서 업로드"
              buttonVariant="tertiary"
              buttonSize="xlarge"
              buttonFullWidth
              uploading={uploading}
              disabled={isSubmitting}
              aria-label="동의서 업로드"
              onFileSelect={handleFileSelect}
            />
            <ul className={styles.crimeAttachHints}>
              {CRIME_CONSENT_UPLOAD_HINTS.map(hint => (
                <li key={hint}>
                  <PFText as="span" typo="label-md" className={styles.crimeAttachHintText}>
                    {hint}
                  </PFText>
                </li>
              ))}
            </ul>
            {showUploadedFile ? (
              <ul className={styles.crimeAttachList} aria-label="첨부된 동의서">
                <li className={styles.crimeAttachListRow}>
                  <PFText
                    as="span"
                    typo="bd-md-md"
                    color="black"
                    className={styles.crimeAttachFileName}
                    title={uploadedFileName}
                  >
                    {uploadedFileName}
                  </PFText>
                  <PFItemDeleteButton
                    aria-label={`${uploadedFileName} 삭제`}
                    disabled={uploading || isSubmitting}
                    onClick={handleRemoveFile}
                  />
                </li>
              </ul>
            ) : null}
          </section>
        </PFFormSection>

        <div className={styles.actions}>
          <PFButton
            size="xlarge"
            width={240}
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? '제출 중…' : '작성완료'}
          </PFButton>
        </div>
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
