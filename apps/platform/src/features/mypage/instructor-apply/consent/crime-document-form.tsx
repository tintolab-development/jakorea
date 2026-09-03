import { type ChangeEvent, useCallback, useRef, useState } from 'react'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import { CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE } from './catalog'
import { downloadCrimeConsentFormDocument } from './crime-consent-form-document'
import { markInstructorApplyConsentAgreed } from './form-persist'
import styles from './consent-form.module.css'

const CRIME_CONSENT_UPLOAD_ACCEPT = 'application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.gif,.webp'
const CRIME_CONSENT_FILE_TYPE_ALERT_MESSAGE = 'PDF 또는 이미지 파일만 업로드할 수 있습니다.'
const PDF_FILE_NAME_PATTERN = /\.pdf$/i
const IMAGE_FILE_NAME_PATTERN = /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i

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
  if (mime === 'application/pdf' || mime.startsWith('image/')) return true
  return PDF_FILE_NAME_PATTERN.test(file.name) || IMAGE_FILE_NAME_PATTERN.test(file.name)
}

function isPdfPreviewSrc(src: string, fileName: string | null): boolean {
  if (fileName != null && PDF_FILE_NAME_PATTERN.test(fileName)) return true
  return src.startsWith('data:application/pdf')
}

/** CMS `MemberConsentCrimeModal`과 동일 — A4 문서 업로드 후 제출 */
export function CrimeConsentDocumentForm({
  uploaded,
  onUploadedChange,
  onComplete,
  incomplete,
}: {
  uploaded: boolean
  onUploadedChange: (uploaded: boolean) => void
  onComplete: () => void
  incomplete: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [previewFileName, setPreviewFileName] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

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
    void readFileAsDataUrl(file).then(dataUrl => {
      setPreviewSrc(dataUrl)
      setPreviewFileName(file.name)
      onUploadedChange(true)
    })
  }

  const handleSubmit = () => {
    if (incomplete) {
      setAlertMessage(CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE)
      return
    }
    markInstructorApplyConsentAgreed('consentSexOffenseCheck')
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
          <PFButton size="large" variant="secondary" type="button" onClick={handlePickDocument}>
            문서 업로드
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
        <PFButton size="xlarge" width={240} type="button" onClick={handleSubmit}>
          작성 완료
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
