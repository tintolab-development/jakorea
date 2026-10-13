import { type ChangeEvent, useRef, useState } from 'react'
import type { PortalStudentRosterItem } from '../api/student-documents-types'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import fileDownloadBlackUrl from '@/shared/assets/icons/file-download-black.svg'
import filePreviewUrl from '@/shared/assets/icons/file-preview.svg'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import styles from './students-panel.module.css'

const EXCEL_ACCEPT =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls'

type StudentsPanelStepRosterProps = {
  remoteEnabled: boolean
  isLoading: boolean
  rosterCount: number
  rows: PortalStudentRosterItem[]
  rosterUploadAllowed: boolean
  certificateIssueEnabled: boolean
  isDownloadingTemplate: boolean
  isImporting: boolean
  onDownloadTemplate: () => void
  onImportFile: (file: File) => void
  onCertificateIssue: () => void
}

export function StudentsPanelStepRoster({
  remoteEnabled,
  isLoading,
  rosterCount,
  rows,
  rosterUploadAllowed,
  certificateIssueEnabled,
  isDownloadingTemplate,
  isImporting,
  onDownloadTemplate,
  onImportFile,
  onCertificateIssue,
}: StudentsPanelStepRosterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const hasStudents = rosterCount > 0

  const handlePickExcel = () => {
    if (!remoteEnabled) {
      setAlertMessage('학생 명단 업로드는 로그인 후 이용할 수 있습니다.')
      return
    }
    if (!rosterUploadAllowed) {
      setAlertMessage('학생 명단 제출 기한이 지났거나 제출할 수 없습니다.')
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    onImportFile(file)
  }

  return (
    <section className={styles.stepMain} aria-labelledby="students-step-roster-title">
      <div className={styles.stepHeader}>
        <PFText id="students-step-roster-title" as="h2" typo="hl-sm" color="black" className={styles.stepTitle}>
          Step 1 학생 명단을 등록해 주세요
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.stepDescription}>
          프로그램 시작 전, 참여 학생 명단을 등록해야 해요. 제공된 엑셀 양식을 작성해 업로드 해주세요.
        </PFText>
      </div>

      <div className={styles.rosterActionRow}>
        <div className={styles.rosterActionGroup}>
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
            disabled={!remoteEnabled || isImporting || !rosterUploadAllowed}
            onClick={handlePickExcel}
          >
            <span className={styles.buttonInner}>
              <img src={filePreviewUrl} alt="" width={20} height={20} aria-hidden="true" />
              {isImporting ? '업로드 중' : '엑셀 업로드'}
            </span>
          </PFButton>
        </div>
        <PFButton
          type="button"
          size="large"
          variant="tertiary"
          disabled={!certificateIssueEnabled}
          onClick={onCertificateIssue}
        >
          수료증 발급하기
        </PFButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={EXCEL_ACCEPT}
        className={styles.hiddenFile}
        onChange={handleFileChange}
        aria-label="학생 명단 엑셀 파일 선택"
      />

      {isLoading ? (
        <div className={styles.contentBox}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500">
            학생 명단을 불러오는 중입니다.
          </PFText>
        </div>
      ) : hasStudents ? (
        <div className={styles.contentBox}>
          <PFText as="p" typo="bd-md-sb" color="black" className={styles.rosterSummary}>
            참여 학생 {rosterCount}명
          </PFText>
          <ul className={styles.rosterList}>
            {rows.map(row => (
              <li key={row.rosterId ?? `${row.studentName}-${row.studentNo}`} className={styles.rosterListItem}>
                <PFText as="span" typo="bd-md-md" color="black">
                  {row.studentName?.trim() || '-'}
                </PFText>
                <PFText as="span" typo="bd-md-rg" color="neutral-cool-600">
                  {[row.grade, row.className, row.studentNo != null ? `${row.studentNo}번` : '']
                    .filter(part => part != null && String(part).trim() !== '')
                    .join(' · ')}
                </PFText>
              </li>
            ))}
          </ul>
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
