import { type ChangeEvent, useRef, useState } from 'react'
import type { PortalOrganizationPortraitConsent } from '../api/student-documents-types'
import illustHackerUrl from '@/shared/assets/illustration/illust-hacker.svg'
import closeBlackUrl from '@/shared/assets/icons/close-black.svg'
import fileDownloadMintUrl from '@/shared/assets/icons/file-download-mint.svg'
import fileUploadBlackUrl from '@/shared/assets/icons/file-upload-black.svg'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import type { PortraitConsentTemplateDownloadProgress } from '../lib/student-documents-template-download'
import { PORTRAIT_CONSENT_UPLOAD_ACCEPT } from '../lib/student-documents-template-download'
import styles from './students-panel.module.css'

type StudentsPanelStepPortraitProps = {
  isLoading: boolean
  consent: PortalOrganizationPortraitConsent | null | undefined
  /** 방금 업로드한 로컬 파일 — 서버 `originalFileName`·`fileSize`가 없을 때만 보조 */
  uploadedFile?: {
    name: string
    size: number
  } | null
  hasSubmission: boolean
  uploadBlockedMessage?: string | null
  isDownloadingTemplate: boolean
  downloadProgress?: PortraitConsentTemplateDownloadProgress | null
  isUploading: boolean
  canCancelUpload: boolean
  isCancelling: boolean
  onDownloadTemplate: () => void
  onUploadFile: (file: File) => void
  onCancelUpload: () => void
}

export function StudentsPanelStepPortrait({
  isLoading,
  consent,
  uploadedFile,
  hasSubmission,
  uploadBlockedMessage,
  isDownloadingTemplate,
  downloadProgress,
  isUploading,
  canCancelUpload,
  isCancelling,
  onDownloadTemplate,
  onUploadFile,
  onCancelUpload,
}: StudentsPanelStepPortraitProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const handlePickFile = () => {
    if (uploadBlockedMessage) {
      setAlertMessage(uploadBlockedMessage)
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    onUploadFile(file)
  }

  return (
    <section className={styles.stepSide} aria-labelledby="students-step-portrait-title">
      <div className={styles.stepHeader}>
        <PFText
          id="students-step-portrait-title"
          as="h2"
          typo="hl-sm"
          color="black"
          className={styles.stepTitle}
        >
          <span className={styles.stepLabel}>Step 2</span> 학생 초상권 동의서를 업로드 해주세요
        </PFText>
        <PFText as="p" typo="bd-md-md" color="black" className={styles.stepDescription}>
          제공된 양식에 초상권 동의를 받은 후 업로드 해주세요.
        </PFText>
      </div>

      <div className={styles.portraitActionGroup}>
        <PFButton
          type="button"
          size="large"
          variant="secondary"
          disabled={isDownloadingTemplate}
          onClick={onDownloadTemplate}
        >
          <span className={styles.buttonInner}>
            <img src={fileDownloadMintUrl} alt="" width={20} height={20} aria-hidden="true" />
            {downloadProgress === 'requesting'
              ? '다운로드 요청 중'
              : downloadProgress === 'generating'
                ? '양식 생성 중'
                : downloadProgress === 'downloading'
                  ? '다운로드 중'
                  : '양식 다운로드'}
          </span>
        </PFButton>
        <PFButton
          type="button"
          size="large"
          variant="tertiary"
          disabled={isUploading || isCancelling || Boolean(uploadBlockedMessage)}
          onClick={handlePickFile}
        >
          <span className={styles.buttonInner}>
            <img src={fileUploadBlackUrl} alt="" width={20} height={20} aria-hidden="true" />
            {isUploading ? '업로드 중' : '파일 업로드'}
          </span>
        </PFButton>
      </div>

      {uploadBlockedMessage ? (
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
          {uploadBlockedMessage}
        </PFText>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={PORTRAIT_CONSENT_UPLOAD_ACCEPT}
        className={styles.hiddenFile}
        onChange={handleFileChange}
        aria-label="초상권 동의서 파일 선택"
      />

      <div className={styles.portraitStatusArea}>
        {isLoading ? (
          <div className={styles.portraitBox} role="status" aria-busy="true">
            <PFLoadingSpinner label="초상권 동의서를 불러오는 중" />
          </div>
        ) : hasSubmission ? (
          <div className={styles.portraitSubmittedBox} role="status">
            <img
              className={styles.portraitStatusIllustration}
              src={illustHackerUrl}
              alt=""
              width={120}
              height={120}
              aria-hidden="true"
            />
            <div className={styles.portraitStatusBody}>
              <div className={styles.portraitSubmittedInfo}>
                <PFText
                  as="p"
                  typo="hl-lg"
                  color="black"
                  className={styles.portraitSubmittedFileName}
                  title={resolvePortraitFileName(consent, uploadedFile)}
                >
                  {resolvePortraitFileName(consent, uploadedFile)}
                </PFText>
                <PFText as="p" typo="bd-lg-rg" color="neutral-cool-500">
                  {formatPortraitFileMeta(consent, uploadedFile)}
                </PFText>
              </div>
              <PFButton
                type="button"
                variant="tertiary"
                size="xlarge"
                className={styles.portraitUploadCancel}
                disabled={!canCancelUpload || isCancelling || isUploading}
                aria-busy={isCancelling}
                onClick={onCancelUpload}
              >
                <span className={styles.buttonInner}>
                  <img src={closeBlackUrl} alt="" width={20} height={20} aria-hidden="true" />
                  {isCancelling ? '취소 중' : '업로드 취소'}
                </span>
              </PFButton>
            </div>
          </div>
        ) : (
          <div className={styles.portraitBoxEmpty}>
            <img
              className={styles.portraitStatusIllustration}
              src={illustHackerUrl}
              alt=""
              width={120}
              height={120}
              aria-hidden="true"
            />
            <div className={styles.portraitStatusBody}>
              <PFText as="p" typo="hl-lg" color="black" className={styles.portraitEmptyCopy}>
                아직 초상권 동의서가
                <br />
                등록되지 않았어요
              </PFText>
            </div>
          </div>
        )}
      </div>

      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? ''}
        confirmLabel="확인"
        onConfirm={() => setAlertMessage(null)}
      />
    </section>
  )
}

function resolvePortraitFileName(
  consent: PortalOrganizationPortraitConsent | null | undefined,
  uploadedFile?: { name: string } | null,
): string {
  return (
    consent?.originalFileName?.trim() ||
    uploadedFile?.name.trim() ||
    '초상권 동의서 파일'
  )
}

function formatPortraitFileMeta(
  consent: PortalOrganizationPortraitConsent | null | undefined,
  uploadedFile?: { size: number } | null,
): string {
  const submittedAt = consent?.submittedAt?.trim() || consent?.updatedAt?.trim()
  const dateLabel = submittedAt ? formatSubmittedAt(submittedAt) : ''
  const fileSize = consent?.fileSize ?? uploadedFile?.size
  const sizeLabel = formatPortraitFileSize(fileSize)
  return [dateLabel, sizeLabel].filter(Boolean).join(', ')
}

function formatSubmittedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${d} ${hours}:${minutes}`
}

function formatPortraitFileSize(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return ''
  const megabytes = value / (1024 * 1024)
  if (megabytes >= 1) return `${megabytes.toFixed(1).replace(/\.0$/, '')}MB`
  return `${Math.max(1, Math.round(value / 1024))}KB`
}
