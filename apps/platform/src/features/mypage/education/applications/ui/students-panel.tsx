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
  resolveRosterUploadBlockedMessage,
  STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE,
} from '../lib/student-documents-policy'
import {
  isPortraitConsentUploadFileTypeAllowed,
  PORTRAIT_CONSENT_FILE_FORMATS_LABEL,
  validatePortraitConsentUploadFile,
} from '../lib/validate-student-document-file'
import { buildFileTypeInvalidAlertCopy } from '@/shared/lib/platform-alert-copy'
import {
  educationNoticeAlert,
  resolveEducationErrorAlert,
  type EducationAlert,
} from '../../shared/lib/education-error-alert'
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
  const [alert, setAlert] = useState<EducationAlert | null>(null)
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
  const rosterUploadBlockedMessage = useMemo(
    () => resolveRosterUploadBlockedMessage(policy),
    [policy]
  )

  const hasPortraitSubmission = useMemo(
    () => hasOrganizationPortraitConsentSubmission(portraitQuery.data),
    [portraitQuery.data]
  )

  const certificateButtonEnabled =
    rosterCount > 0 && rows.some(row => row.satisfactionSurveyCompleted === true)

  const isPolicyLoading = remoteEnabled && policyQuery.isLoading
  const isDocumentsLoading =
    remoteEnabled && documentsSupported && (rosterQuery.isLoading || portraitQuery.isLoading)
  const isLoading = isPolicyLoading || isDocumentsLoading
  const isFileUploading = importRoster.isPending || submitPortrait.isPending

  /** 시안 「오류 제한 팝업」 — 네트워크·처리 제한·처리 실패(서버·코드별 안내는 설명에) */
  const handleAsyncError = (error: unknown) => {
    setAlert(resolveEducationErrorAlert(error, resolveStudentDocumentsErrorMessage))
  }

  const runPortraitTemplateDownload = () => {
    if (!ensureDocumentsApiReady()) return
    if (portraitUploadBlockedMessage) {
      setAlert(educationNoticeAlert(portraitUploadBlockedMessage))
      return
    }

    setPortraitTemplateDownloadProgress('requesting')
    void downloadPortraitTemplate
      .mutateAsync()
      .catch(error => {
        handleAsyncError(error)
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
        handleAsyncError(error)
      })
      .finally(() => {
        portraitCancelInFlightRef.current = false
      })
  }

  const ensureDocumentsApiReady = (): boolean => {
    if (!documentsUiScope) {
      setAlert(educationNoticeAlert('기관 신청 건에서만 학생 명단·초상권 동의서를 제출할 수 있습니다.'))
      return false
    }
    if (!remoteEnabled) {
      setAlert(educationNoticeAlert('로그인 후 이용할 수 있습니다.'))
      return false
    }
    if (documentsUnsupported || !documentsSupported) {
      setAlert(educationNoticeAlert(STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE))
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
          open={alert != null}
          title={alert?.title ?? ''}
          description={alert?.description}
          confirmLabel="확인"
          onConfirm={() => setAlert(null)}
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
            .catch(error => handleAsyncError(error))
        }}
        rosterUploadBlockedMessage={rosterUploadBlockedMessage}
        onImportFile={file => {
          if (!ensureDocumentsApiReady()) return
          if (rosterUploadBlockedMessage) {
            setAlert(educationNoticeAlert(rosterUploadBlockedMessage))
            return
          }
          void importRoster
            .mutateAsync(file)
            .catch(error => handleAsyncError(error))
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
            setAlert(educationNoticeAlert(portraitUploadBlockedMessage))
            return
          }
          if (!isPortraitConsentUploadFileTypeAllowed(file)) {
            setAlert(buildFileTypeInvalidAlertCopy(PORTRAIT_CONSENT_FILE_FORMATS_LABEL))
            return
          }
          const validationError = validatePortraitConsentUploadFile(file)
          if (validationError) {
            setAlert(educationNoticeAlert(validationError))
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
            .catch(error => handleAsyncError(error))
        }}
      />

      <PFAlertModal
        open={alert != null}
        title={alert?.title ?? ''}
        description={alert?.description}
        confirmLabel="확인"
        onConfirm={() => {
          setAlert(null)
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
