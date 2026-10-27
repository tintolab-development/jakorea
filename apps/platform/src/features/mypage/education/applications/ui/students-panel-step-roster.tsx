import { type ChangeEvent, useRef, useState } from 'react'
import type { PortalStudentRosterItem } from '../api/student-documents-types'
import illustDiplomaGrayUrl from '@/shared/assets/illustration/illust-diploma-gray.svg'
import illustDiplomaUrl from '@/shared/assets/illustration/illust-diploma.svg'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import fileDownloadMintUrl from '@/shared/assets/icons/file-download-mint.svg'
import fileUploadBlackUrl from '@/shared/assets/icons/file-upload-black.svg'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import {
  STUDENT_ROSTER_FILE_ACCEPT,
  STUDENT_ROSTER_UPLOAD_HINT,
  validateStudentRosterUploadFile,
} from '../lib/student-roster-upload-policy'
import { StudentsPanelRosterTable } from './students-panel-roster-table'
import styles from './students-panel.module.css'

type StudentsPanelStepRosterProps = {
  isLoading: boolean
  rosterCount: number
  rows: PortalStudentRosterItem[]
  certificateButtonEnabled: boolean
  isDownloadingTemplate: boolean
  isImporting: boolean
  onDownloadTemplate: () => void
  onImportFile: (file: File) => void
  onCertificateIssue: () => void
}

export function StudentsPanelStepRoster({
  isLoading,
  rosterCount,
  rows,
  certificateButtonEnabled,
  isDownloadingTemplate,
  isImporting,
  onDownloadTemplate,
  onImportFile,
  onCertificateIssue,
}: StudentsPanelStepRosterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const hasStudents = rosterCount > 0
  const isCertificateDisabled = !certificateButtonEnabled

  const handlePickExcel = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateStudentRosterUploadFile(file)
    if (validationError) {
      setAlertMessage(validationError)
      return
    }
    onImportFile(file)
  }

  return (
    <section className={styles.stepMain} aria-labelledby="students-step-roster-title">
      <div className={styles.stepHeader}>
        <PFText
          id="students-step-roster-title"
          as="h2"
          typo="hl-sm"
          color="black"
          className={styles.stepTitle}
        >
          <span className={styles.stepLabel}>Step 1</span> 학생 명단을 등록해 주세요
        </PFText>
        <PFText as="p" typo="bd-md-md" color="black" className={styles.stepDescription}>
          프로그램 시작 전, 참여 학생 명단을 등록해야 해요. 제공된 양식을 작성해 업로드해 주세요.
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.uploadHint}>
          {STUDENT_ROSTER_UPLOAD_HINT}
        </PFText>
      </div>

      <div className={styles.rosterActionRow}>
        <div className={styles.rosterActionGroup}>
          <PFButton
            type="button"
            size="large"
            variant="secondary"
            disabled={isDownloadingTemplate}
            onClick={onDownloadTemplate}
          >
            <span className={styles.buttonInner}>
              <img src={fileDownloadMintUrl} alt="" width={20} height={20} aria-hidden="true" />
              양식 다운로드
            </span>
          </PFButton>
          <PFButton
            type="button"
            size="large"
            variant="tertiary"
            disabled={isImporting}
            onClick={handlePickExcel}
          >
            <span className={styles.buttonInner}>
              <img src={fileUploadBlackUrl} alt="" width={20} height={20} aria-hidden="true" />
              {isImporting ? '업로드 중' : '파일 업로드'}
            </span>
          </PFButton>
        </div>
        <PFButton
          type="button"
          variant="certificate"
          disabled={isCertificateDisabled}
          onClick={onCertificateIssue}
        >
          수료증 발급하기
          <img
            className={styles.certificateIllustration}
            src={isCertificateDisabled ? illustDiplomaGrayUrl : illustDiplomaUrl}
            alt=""
            width={48}
            height={48}
            aria-hidden="true"
          />
        </PFButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={STUDENT_ROSTER_FILE_ACCEPT}
        className={styles.hiddenFile}
        onChange={handleFileChange}
        aria-label="학생 명단 파일 선택 (XLSX, CSV)"
      />

      {isLoading ? (
        <div className={styles.contentBox} role="status" aria-busy="true">
          <PFLoadingSpinner label="학생 명단을 불러오는 중" />
        </div>
      ) : hasStudents ? (
        <div className={styles.rosterTableBox}>
          <StudentsPanelRosterTable rows={rows} />
        </div>
      ) : (
        <div className={styles.contentBoxEmpty}>
          <div className={styles.emptyContent}>
            <img
              className={styles.illustration}
              src={illustQuotationUrl}
              alt=""
              width={100}
              height={100}
              aria-hidden="true"
            />
            <PFText as="p" typo="hl-lg" color="black" className={styles.emptyTitle}>
              아직 등록된 학생이 없어요
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
