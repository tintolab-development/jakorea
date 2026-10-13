import { useMemo, useState } from 'react'
import type { ProgramApplicationType } from '../api/types'
import {
  isOrganizationStudentDocumentsQueryEnabled,
  useDownloadPortraitConsentTemplateMutation,
  useDownloadStudentRosterTemplateMutation,
  useImportOrganizationStudentRosterMutation,
  useOrganizationPortraitConsentQuery,
  useOrganizationStudentDocumentPolicyQuery,
  useOrganizationStudentRosterQuery,
  useSubmitOrganizationPortraitConsentMutation,
} from '../api/student-documents-hooks'
import {
  hasOrganizationPortraitConsentSubmission,
  resolveStudentRosterCount,
} from '../lib/student-documents-display'
import { PFAlertModal } from '@/shared/ui'
import { StudentsPanelStepPortrait } from './students-panel-step-portrait'
import { StudentsPanelStepRoster } from './students-panel-step-roster'
import styles from './students-panel.module.css'

export type EducationStudentsPanelProps = {
  applicationId: string
  applicationType: ProgramApplicationType | null
  certificateAvailable?: boolean
  /** 포기 이후 회차 비노출용 — 학생 명단 API는 신청 단위 */
  lastParticipatedSession?: number
}

export function EducationStudentsPanel({
  applicationId,
  applicationType,
  certificateAvailable = false,
}: EducationStudentsPanelProps) {
  const remoteEnabled = isOrganizationStudentDocumentsQueryEnabled(applicationType, applicationId)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [certificateNoticeOpen, setCertificateNoticeOpen] = useState(false)

  const rosterQuery = useOrganizationStudentRosterQuery(applicationType, applicationId)
  const policyQuery = useOrganizationStudentDocumentPolicyQuery(applicationType, applicationId)
  const portraitQuery = useOrganizationPortraitConsentQuery(applicationType, applicationId)

  const downloadRosterTemplate = useDownloadStudentRosterTemplateMutation(applicationId)
  const downloadPortraitTemplate = useDownloadPortraitConsentTemplateMutation(applicationId)
  const importRoster = useImportOrganizationStudentRosterMutation(applicationId)
  const submitPortrait = useSubmitOrganizationPortraitConsentMutation(applicationId)

  const rows = rosterQuery.data?.rows ?? []
  const rosterCount = resolveStudentRosterCount(rosterQuery.data?.totalCount, rows.length)

  const rosterUploadAllowed = policyQuery.data?.studentRosterUploadAllowed !== false
  const portraitUploadAllowed = policyQuery.data?.portraitConsentUploadAllowed !== false

  const hasPortraitSubmission = useMemo(
    () => hasOrganizationPortraitConsentSubmission(portraitQuery.data),
    [portraitQuery.data],
  )

  const certificateIssueEnabled =
    remoteEnabled && rosterCount > 0 && Boolean(certificateAvailable)

  const isLoading =
    remoteEnabled &&
    (rosterQuery.isLoading || policyQuery.isLoading || portraitQuery.isLoading)

  const handleAsyncError = (error: unknown, fallback: string) => {
    const message = error instanceof Error && error.message.trim() ? error.message : fallback
    setErrorMessage(message)
  }

  return (
    <div className={styles.shell}>
      <StudentsPanelStepRoster
        remoteEnabled={remoteEnabled}
        isLoading={isLoading}
        rosterCount={rosterCount}
        rows={rows}
        rosterUploadAllowed={rosterUploadAllowed}
        certificateIssueEnabled={certificateIssueEnabled}
        isDownloadingTemplate={downloadRosterTemplate.isPending}
        isImporting={importRoster.isPending}
        onDownloadTemplate={() => {
          void downloadRosterTemplate
            .mutateAsync()
            .catch(error => handleAsyncError(error, '학생 명단 양식을 받지 못했습니다.'))
        }}
        onImportFile={file => {
          void importRoster
            .mutateAsync(file)
            .catch(error => handleAsyncError(error, '학생 명단을 업로드하지 못했습니다.'))
        }}
        onCertificateIssue={() => setCertificateNoticeOpen(true)}
      />

      <StudentsPanelStepPortrait
        remoteEnabled={remoteEnabled}
        isLoading={isLoading}
        consent={portraitQuery.data}
        hasSubmission={hasPortraitSubmission}
        portraitUploadAllowed={portraitUploadAllowed}
        isDownloadingTemplate={downloadPortraitTemplate.isPending}
        isUploading={submitPortrait.isPending}
        onDownloadTemplate={() => {
          void downloadPortraitTemplate
            .mutateAsync()
            .catch(error => handleAsyncError(error, '초상권 동의서 양식을 받지 못했습니다.'))
        }}
        onUploadFile={file => {
          void submitPortrait
            .mutateAsync(file)
            .catch(error => handleAsyncError(error, '초상권 동의서를 업로드하지 못했습니다.'))
        }}
      />

      <PFAlertModal
        open={errorMessage != null}
        title="안내"
        description={errorMessage ?? ''}
        confirmLabel="확인"
        onConfirm={() => setErrorMessage(null)}
      />

      <PFAlertModal
        open={certificateNoticeOpen}
        title="안내"
        description="수료증 발급 기능을 준비 중입니다."
        confirmLabel="확인"
        onConfirm={() => setCertificateNoticeOpen(false)}
      />
    </div>
  )
}
