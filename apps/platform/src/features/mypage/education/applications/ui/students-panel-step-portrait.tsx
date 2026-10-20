import { type ChangeEvent, useRef, useState } from 'react'
import type { PortalOrganizationPortraitConsent } from '../api/student-documents-types'
import illustHackerUrl from '@/shared/assets/illustration/illust-hacker.svg'
import fileDownloadMintUrl from '@/shared/assets/icons/file-download-mint.svg'
import fileUploadBlackUrl from '@/shared/assets/icons/file-upload-black.svg'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import type { PortraitConsentTemplateDownloadProgress } from '../lib/student-documents-template-download'
import styles from './students-panel.module.css'

const PORTRAIT_UPLOAD_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp'

type StudentsPanelStepPortraitProps = {
  isLoading: boolean
  consent: PortalOrganizationPortraitConsent | null | undefined
  hasSubmission: boolean
  uploadBlockedMessage?: string | null
  isDownloadingTemplate: boolean
  downloadProgress?: PortraitConsentTemplateDownloadProgress | null
  isUploading: boolean
  onDownloadTemplate: () => void
  onUploadFile: (file: File) => void
}

export function StudentsPanelStepPortrait({
  isLoading,
  consent,
  hasSubmission,
  uploadBlockedMessage,
  isDownloadingTemplate,
  downloadProgress,
  isUploading,
  onDownloadTemplate,
  onUploadFile,
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
          disabled={isUploading || Boolean(uploadBlockedMessage)}
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
        accept={PORTRAIT_UPLOAD_ACCEPT}
        className={styles.hiddenFile}
        onChange={handleFileChange}
        aria-label="초상권 동의서 파일 선택"
      />

      {isLoading ? (
        <div className={styles.portraitBox} role="status" aria-busy="true">
          <PFLoadingSpinner label="초상권 동의서를 불러오는 중" />
        </div>
      ) : hasSubmission ? (
        <div className={styles.portraitBox}>
          <PFText as="p" typo="bd-md-sb" color="black">
            초상권 동의서가 등록되었어요
          </PFText>
          {consent?.submittedAt ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              제출일: {formatSubmittedAt(consent.submittedAt)}
            </PFText>
          ) : null}
          {consent?.status ? (
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500">
              상태: {consent.status}
            </PFText>
          ) : null}
        </div>
      ) : (
        <div className={styles.portraitBoxEmpty}>
          <div className={styles.emptyContent}>
            <img
              className={styles.portraitEmptyIllustration}
              src={illustHackerUrl}
              alt=""
              width={120}
              height={120}
              aria-hidden="true"
            />
            <PFText as="p" typo="hl-lg" color="black">
              아직 초상권 동의서가
              <br />
              등록되지 않았어요
            </PFText>
          </div>
        </div>
      )}

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

function formatSubmittedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}
