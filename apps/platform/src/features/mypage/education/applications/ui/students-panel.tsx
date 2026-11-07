import { useMemo, useRef, useState } from 'react'
import type { ProgramApplicationType } from '../api/types'
import {
  isOrganizationStudentDocumentsQueryEnabled,
  isOrganizationStudentDocumentsUiScope,
  useCancelOrganizationPortraitConsentMutation,
  useDownloadPortraitConsentTemplateMutation,
  useDownloadStudentRosterTemplateMutation,
  useImportOrganizationStudentRosterMutation,
  useOrganizationPortraitConsentQuery,
  useOrganizationStudentDocumentPolicyQuery,
  useOrganizationStudentRosterQuery,
  useSubmitOrganizationPortraitConsentMutation,
} from '../api/student-documents-hooks'
import { certificateRowsForApplication } from '../lib/certificate-bulk-download'
import { resolveOrganizationApplicationId } from '../lib/resolve-organization-application-id'
import {
  hasOrganizationPortraitConsentSubmission,
  resolveStudentRosterCount,
} from '../lib/student-documents-display'
import {
  readStudentDocumentsErrorCode,
  resolveStudentDocumentsErrorMessage,
} from '../lib/student-documents-errors'
import {
  canCancelOrganizationPortraitConsent,
  isPortalStudentDocumentsSupported,
  isPortalStudentDocumentsUnsupported,
  resolvePortraitUploadBlockedMessage,
  STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE,
} from '../lib/student-documents-policy'
import { validatePortraitConsentUploadFile } from '../lib/validate-student-document-file'
import type { PortraitConsentTemplateDownloadProgress } from '../lib/student-documents-template-download'
import { PFAlertModal, PFLoadingSpinner, PFText } from '@/shared/ui'
import { StudentsPanelCertificateModal } from './students-panel-certificate-modal'
import { StudentsPanelStepPortrait } from './students-panel-step-portrait'
import { StudentsPanelStepRoster } from './students-panel-step-roster'
import { StudentsPanelUnsupported } from './students-panel-unsupported'
import styles from './students-panel.module.css'

type PortraitUploadedFile = {
  name: string
  size: number
}

type PortraitUploadedFileState = PortraitUploadedFile & {
  applicationId: string
  /** PUT 응답 fileObjectId — 현재 서버 제출과 같을 때만 로컬 메타를 보조로 씁니다. */
  fileObjectId: number | null
}

export type EducationStudentsPanelProps = {
  applicationId: string
  applicationType: ProgramApplicationType | null
  /** 기관(학교) 프로그램 — `applicationType` 보조 */
  organizationProgram?: boolean
  /** 포기 이후 회차 비노출용 — 학생 명단 API는 신청 단위 */
  lastParticipatedSession?: number
}

export function EducationStudentsPanel({
  applicationId,
  applicationType,
  organizationProgram = false,
}: EducationStudentsPanelProps) {
  const documentsScope = { organizationProgram }
  const documentsUiScope = isOrganizationStudentDocumentsUiScope(
    applicationType,
    applicationId,
    documentsScope
  )
  const remoteEnabled = isOrganizationStudentDocumentsQueryEnabled(
    applicationType,
    applicationId,
    documentsScope
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [portraitTemplateDownloadProgress, setPortraitTemplateDownloadProgress] =
    useState<PortraitConsentTemplateDownloadProgress | null>(null)
  const [portraitUploadedFileState, setPortraitUploadedFileState] =
    useState<PortraitUploadedFileState | null>(null)
  const [certificateModalOpen, setCertificateModalOpen] = useState(false)
  const portraitCancelInFlightRef = useRef(false)

  const policyQuery = useOrganizationStudentDocumentPolicyQuery(
    applicationType,
    applicationId,
    documentsScope
  )
  const policy = policyQuery.data
  const documentsSupported = isPortalStudentDocumentsSupported(policy)
  const documentsUnsupported = isPortalStudentDocumentsUnsupported(policy)
  const documentsQueryOptions = { studentDocumentsSupported: documentsSupported }

  const rosterQuery = useOrganizationStudentRosterQuery(
    applicationType,
    applicationId,
    documentsScope,
    documentsQueryOptions
  )
  const portraitQuery = useOrganizationPortraitConsentQuery(
    applicationType,
    applicationId,
    documentsScope,
    documentsQueryOptions
  )

  const downloadRosterTemplate = useDownloadStudentRosterTemplateMutation(applicationId)
  const downloadPortraitTemplate = useDownloadPortraitConsentTemplateMutation(applicationId, {
    onProgress: progress => setPortraitTemplateDownloadProgress(progress),
  })
  const importRoster = useImportOrganizationStudentRosterMutation(applicationId, applicationType)
  const submitPortrait = useSubmitOrganizationPortraitConsentMutation(
    applicationId,
    applicationType
  )
  const cancelPortrait = useCancelOrganizationPortraitConsentMutation(
    applicationId,
    applicationType
  )

  const portraitConsent = portraitQuery.data
  const portraitUploadedFile =
    portraitUploadedFileState?.applicationId === applicationId &&
    portraitUploadedFileState.fileObjectId != null &&
    portraitUploadedFileState.fileObjectId === portraitConsent?.fileObjectId
      ? portraitUploadedFileState
      : null
  const canCancelPortrait = canCancelOrganizationPortraitConsent(portraitConsent, policy)

  const rows = rosterQuery.data?.rows ?? []
  const rosterCount = resolveStudentRosterCount(rosterQuery.data?.totalCount, rows.length)
  const certificateRows = useMemo(
    () =>
      certificateRowsForApplication(
        rosterQuery.data,
        resolveOrganizationApplicationId(applicationId) ?? ''
      ),
    [rosterQuery.data, applicationId]
  )

  const portraitUploadBlockedMessage = useMemo(
    () => resolvePortraitUploadBlockedMessage(policy),
    [policy]
  )

  const hasPortraitSubmission = useMemo(
    () => hasOrganizationPortraitConsentSubmission(portraitQuery.data),
    [portraitQuery.data]
  )

  const certificateButtonEnabled = rosterCount > 0

  const isPolicyLoading = remoteEnabled && policyQuery.isLoading
  const isDocumentsLoading =
    remoteEnabled && documentsSupported && (rosterQuery.isLoading || portraitQuery.isLoading)
  const isLoading = isPolicyLoading || isDocumentsLoading
  const isFileUploading = importRoster.isPending || submitPortrait.isPending

  const handleAsyncError = (error: unknown, fallback: string) => {
    setErrorMessage(resolveStudentDocumentsErrorMessage(error, fallback))
  }

  const runPortraitTemplateDownload = () => {
    if (!ensureDocumentsApiReady()) return
    if (portraitUploadBlockedMessage) {
      setErrorMessage(portraitUploadBlockedMessage)
      return
    }

    setPortraitTemplateDownloadProgress('requesting')
    void downloadPortraitTemplate
      .mutateAsync()
      .catch(error => {
        setErrorMessage(
          resolveStudentDocumentsErrorMessage(error, '초상권 동의서 양식을 받지 못했습니다.')
        )
      })
      .finally(() => setPortraitTemplateDownloadProgress(null))
  }

  const runPortraitCancel = () => {
    if (!ensureDocumentsApiReady()) return
    if (!portraitConsent || !canCancelPortrait) return
    if (cancelPortrait.isPending || portraitCancelInFlightRef.current) return

    portraitCancelInFlightRef.current = true
    void cancelPortrait
      .mutateAsync(portraitConsent)
      .then(() => setPortraitUploadedFileState(null))
      .catch(error => {
        if (readStudentDocumentsErrorCode(error) === 'PORTRAIT_CONSENT_NOT_FOUND') {
          setPortraitUploadedFileState(null)
          return
        }
        handleAsyncError(error, '초상권 동의서 업로드를 취소하지 못했습니다.')
      })
      .finally(() => {
        portraitCancelInFlightRef.current = false
      })
  }

  const ensureDocumentsApiReady = (): boolean => {
    if (!documentsUiScope) {
      setErrorMessage('기관 신청 건에서만 학생 명단·초상권 동의서를 제출할 수 있습니다.')
      return false
    }
    if (!remoteEnabled) {
      setErrorMessage('로그인 후 이용할 수 있습니다.')
      return false
    }
    if (documentsUnsupported || !documentsSupported) {
      setErrorMessage(STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE)
      return false
    }
    return true
  }

  if (remoteEnabled && policyQuery.isError) {
    return (
      <div className={styles.unsupportedShell}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          제출 정책을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </PFText>
      </div>
    )
  }

  if (remoteEnabled && documentsSupported && rosterQuery.isError) {
    return (
      <div className={styles.unsupportedShell}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          학생 명단을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </PFText>
      </div>
    )
  }

  if (remoteEnabled && documentsUnsupported) {
    return (
      <>
        <StudentsPanelUnsupported />
        <PFAlertModal
          open={errorMessage != null}
          title="안내"
          description={errorMessage ?? ''}
          confirmLabel="확인"
          onConfirm={() => setErrorMessage(null)}
        />
      </>
    )
  }

  if (isPolicyLoading) {
    return (
      <div className={styles.unsupportedShell} role="status" aria-busy="true">
        <PFLoadingSpinner label="제출 안내를 불러오는 중" />
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <StudentsPanelStepRoster
        isLoading={isLoading}
        rosterCount={rosterCount}
        rows={rows}
        certificateButtonEnabled={certificateButtonEnabled}
        isDownloadingTemplate={downloadRosterTemplate.isPending}
        isImporting={importRoster.isPending}
        onDownloadTemplate={() => {
          if (!ensureDocumentsApiReady()) return
          void downloadRosterTemplate
            .mutateAsync()
            .catch(error => handleAsyncError(error, '학생 명단 양식을 받지 못했습니다.'))
        }}
        onImportFile={file => {
          if (!ensureDocumentsApiReady()) return
          void importRoster
            .mutateAsync(file)
            .catch(error => handleAsyncError(error, '학생 명단을 업로드하지 못했습니다.'))
        }}
        onCertificateIssue={() => setCertificateModalOpen(true)}
      />

      <StudentsPanelStepPortrait
        isLoading={isLoading}
        consent={portraitConsent}
        uploadedFile={portraitUploadedFile}
        hasSubmission={hasPortraitSubmission}
        uploadBlockedMessage={portraitUploadBlockedMessage}
        isDownloadingTemplate={downloadPortraitTemplate.isPending}
        downloadProgress={portraitTemplateDownloadProgress}
        isUploading={submitPortrait.isPending}
        canCancelUpload={canCancelPortrait}
        isCancelling={cancelPortrait.isPending}
        onCancelUpload={runPortraitCancel}
        onDownloadTemplate={runPortraitTemplateDownload}
        onUploadFile={file => {
          if (!ensureDocumentsApiReady()) return
          if (portraitUploadBlockedMessage) {
            setErrorMessage(portraitUploadBlockedMessage)
            return
          }
          const validationError = validatePortraitConsentUploadFile(file)
          if (validationError) {
            setErrorMessage(validationError)
            return
          }
          void submitPortrait
            .mutateAsync(file)
            .then(data => {
              setPortraitUploadedFileState({
                applicationId,
                fileObjectId: typeof data.fileObjectId === 'number' ? data.fileObjectId : null,
                name: file.name,
                size: file.size,
              })
            })
            .catch(error => handleAsyncError(error, '초상권 동의서를 업로드하지 못했습니다.'))
        }}
      />

      <PFAlertModal
        open={errorMessage != null}
        title="안내"
        description={errorMessage ?? ''}
        confirmLabel="확인"
        onConfirm={() => {
          setErrorMessage(null)
        }}
      />

      {isFileUploading ? (
        <div className={styles.fileUploadLoadingOverlay} aria-busy="true">
          <PFLoadingSpinner label="파일 업로드 처리 중" />
        </div>
      ) : null}

      <StudentsPanelCertificateModal
        applicationId={applicationId}
        open={certificateModalOpen}
        rows={certificateRows}
        onClose={() => setCertificateModalOpen(false)}
      />
    </div>
  )
}
