import { type ChangeEvent, useRef, useState } from 'react'
import type { PortalOrganizationPortraitConsent } from '../api/student-documents-types'
import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import fileDownloadBlackUrl from '@/shared/assets/icons/file-download-black.svg'
import filePreviewUrl from '@/shared/assets/icons/file-preview.svg'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import styles from './students-panel.module.css'

const PORTRAIT_UPLOAD_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp'

type StudentsPanelStepPortraitProps = {
  remoteEnabled: boolean
  isLoading: boolean
  consent: PortalOrganizationPortraitConsent | null | undefined
  hasSubmission: boolean
  portraitUploadAllowed: boolean
  isDownloadingTemplate: boolean
  isUploading: boolean
  onDownloadTemplate: () => void
  onUploadFile: (file: File) => void
}

export function StudentsPanelStepPortrait({
  remoteEnabled,
  isLoading,
  consent,
  hasSubmission,
  portraitUploadAllowed,
  isDownloadingTemplate,
  isUploading,
  onDownloadTemplate,
  onUploadFile,
}: StudentsPanelStepPortraitProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const handlePickFile = () => {
    if (!remoteEnabled) {
      setAlertMessage('초상권 동의서 업로드는 로그인 후 이용할 수 있습니다.')
      return
    }
    if (!portraitUploadAllowed) {
      setAlertMessage('초상권 동의서 제출 기한이 지났거나 제출할 수 없습니다.')
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
        <PFText id="students-step-portrait-title" as="h2" typo="hl-sm" color="black" className={styles.stepTitle}>
          Step 2 학생 초상권 동의서를 업로드 해주세요
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.stepDescription}>
          제공된 양식에 초상권 동의를 받은 후 업로드 해주세요.
        </PFText>
      </div>

      <div className={styles.portraitActionGroup}>
        <PFButton
          type="button"
          size="large"
          variant="secondary"
          disabled={!remoteEnabled || isDownloadingTemplate}
          onClick={onDownloadTemplate}
        >
          <span className={styles.buttonInner}>
            <img src={fileDownloadBlackUrl} alt="" width={20} height={20} aria-hidden="true" />
            양식 다운로드
          </span>
        </PFButton>
        <PFButton
          type="button"
          size="large"
          variant="secondary"
          disabled={!remoteEnabled || isUploading || !portraitUploadAllowed}
          onClick={handlePickFile}
        >
          <span className={styles.buttonInner}>
            <img src={filePreviewUrl} alt="" width={20} height={20} aria-hidden="true" />
            {isUploading ? '업로드 중' : '파일 업로드'}
          </span>
        </PFButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={PORTRAIT_UPLOAD_ACCEPT}
        className={styles.hiddenFile}
        onChange={handleFileChange}
        aria-label="초상권 동의서 파일 선택"
      />

      {isLoading ? (
        <div className={styles.portraitBox}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500">
            초상권 동의서를 불러오는 중입니다.
          </PFText>
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
              className={styles.illustration}
              src={illustExclamationUrl}
              alt=""
              width={100}
              height={100}
              aria-hidden="true"
            />
            <PFText as="p" typo="hl-lg" color="black" className={styles.emptyTitle}>
              아직 초상권 동의서가 등록되지 않았어요
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
