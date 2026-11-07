import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  PFAlertModal,
  PFButton,
  PFFormFileAttach,
  PFFormSection,
  PFItemDeleteButton,
  PFText,
} from '@/shared/ui'
import { formatSingleFileUploadHint } from '@/shared/lib/file-upload-policy'
import { submitPortalCrimeConsentComplete } from '../../settings/lib/submit-portal-consent-document'
import type { InstructorApplyConsentKey } from './catalog'
import {
  CrimeConsentCatalogDownloadError,
  downloadCrimeConsentFormDocument,
} from './crime-consent-form-document'
import {
  canRecheckCrimeConsentOriginalFile,
  classifyCrimeConsentOriginalFile,
  CRIME_CONSENT_MESSAGES,
  CRIME_CONSENT_ORIGINAL_ACCEPT,
  CRIME_CONSENT_ORIGINAL_FILE_PURPOSE,
  CRIME_CONSENT_ORIGINAL_UPLOAD_POLICY,
  CrimeConsentOriginalNotReadyError,
  validateCrimeConsentOriginalFile,
} from './crime-consent-original'
import { createCrimeConsentSubmitSession } from './crime-consent-submit'
import {
  isAbortError,
  resolveCrimeConsentSubmitErrorMessage,
  resolveCrimeConsentUploadErrorMessage,
} from './crime-consent-error'
import { markInstructorApplyConsentAgreed } from './form-persist'
import type { ConsentWriteSubmitContext } from './write-form'
import {
  MemberFileScanTimeoutError,
  uploadMemberPortalFile,
  waitForMemberPortalFileAvailable,
  type MemberFileUploadStatus,
} from '../api/member-file-upload'
import styles from './consent-form.module.css'

/**
 * 시안(P6·C08)은 `PDF, JPG, PNG`이지만 `CRIMINAL_HISTORY_CONSENT_ORIGINAL`의 JPG/PNG 수용이
 * API 계약(OpenAPI filePurpose 설명)에 없어 실제 허용·안내는 PDF 유지 — BE 확인 후 확장.
 */
const CRIME_CONSENT_UPLOAD_HINTS = [
  formatSingleFileUploadHint('PDF'),
  '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
] as const

const UPLOADING_MESSAGE = '동의서를 업로드하는 중입니다. 잠시만 기다려 주세요.'

/** 원본 PDF 업로드 상태. `fileObjectId`는 CLEAN+AVAILABLE을 확인한 `ready`에서만 제출에 쓴다. */
type CrimeOriginalUpload =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; phase: MemberFileUploadStatus }
  | { status: 'scanPending'; fileName: string; fileObjectId: number }
  | { status: 'ready'; fileName: string; fileObjectId: number }

export function CrimeConsentDocumentForm({
  consentKey,
  onComplete,
  submitContext = 'instructorApply',
  portalSubmitEnabled = false,
}: {
  consentKey: InstructorApplyConsentKey
  onComplete: () => void
  submitContext?: ConsentWriteSubmitContext
  portalSubmitEnabled?: boolean
}) {
  const [upload, setUpload] = useState<CrimeOriginalUpload>({ status: 'idle' })
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const uploadSeqRef = useRef(0)
  const uploadAbortRef = useRef<AbortController | null>(null)
  const submittingRef = useRef(false)
  /** 응답을 못 받은 complete를 같은 문서·같은 파일로 다시 보내기 위한 이력 (메모리 전용) */
  const submitSessionRef = useRef(createCrimeConsentSubmitSession())

  /** 진행 중 업로드·검사를 끊고 이후 늦게 도착한 응답을 무시한다. */
  const invalidateUpload = useCallback(() => {
    uploadSeqRef.current += 1
    uploadAbortRef.current?.abort()
    uploadAbortRef.current = null
    return uploadSeqRef.current
  }, [])

  useEffect(() => () => {
    invalidateUpload()
  }, [invalidateUpload])

  const handleDownloadForm = useCallback(() => {
    void downloadCrimeConsentFormDocument().catch(error => {
      const message =
        error instanceof CrimeConsentCatalogDownloadError
          ? error.message
          : CRIME_CONSENT_MESSAGES.formFileUnavailable
      setAlertMessage(message)
    })
  }, [])

  const runWithUploadSession = (
    fileName: string,
    initialPhase: MemberFileUploadStatus,
    task: (session: {
      signal: AbortSignal
      onStatusChange: (phase: MemberFileUploadStatus) => void
    }) => Promise<number>,
  ) => {
    const seq = invalidateUpload()
    const controller = new AbortController()
    uploadAbortRef.current = controller
    const isCurrent = () => uploadSeqRef.current === seq
    setUpload({ status: 'uploading', fileName, phase: initialPhase })

    void task({
      signal: controller.signal,
      onStatusChange: phase => {
        if (isCurrent()) setUpload({ status: 'uploading', fileName, phase })
      },
    })
      .then(fileObjectId => {
        if (!isCurrent()) return
        setUpload({ status: 'ready', fileName, fileObjectId })
      })
      .catch(error => {
        if (!isCurrent() || isAbortError(error)) return
        if (
          error instanceof MemberFileScanTimeoutError &&
          error.fileObjectId != null &&
          (error.lastFile == null || canRecheckCrimeConsentOriginalFile(error.lastFile))
        ) {
          setUpload({ status: 'scanPending', fileName, fileObjectId: error.fileObjectId })
          setAlertMessage(resolveCrimeConsentUploadErrorMessage(error))
          return
        }
        setUpload({ status: 'idle' })
        setAlertMessage(
          error instanceof MemberFileScanTimeoutError
            ? CRIME_CONSENT_MESSAGES.fileNotReady
            : resolveCrimeConsentUploadErrorMessage(error),
        )
      })
      .finally(() => {
        if (isCurrent()) uploadAbortRef.current = null
      })
  }

  const handleFileSelect = (file: File) => {
    if (submittingRef.current) return
    const validationError = validateCrimeConsentOriginalFile(file)
    if (validationError) {
      setAlertMessage(validationError)
      return
    }
    runWithUploadSession(file.name, 'PREPARING', ({ signal, onStatusChange }) =>
      uploadMemberPortalFile({
        file,
        filePurpose: CRIME_CONSENT_ORIGINAL_FILE_PURPOSE,
        policy: CRIME_CONSENT_ORIGINAL_UPLOAD_POLICY,
        signal,
        onStatusChange,
        classify: classifyCrimeConsentOriginalFile,
      }),
    )
  }

  const handleRecheckScan = () => {
    if (submittingRef.current || upload.status !== 'scanPending') return
    const { fileName, fileObjectId } = upload
    runWithUploadSession(fileName, 'SCANNING', ({ signal, onStatusChange }) =>
      waitForMemberPortalFileAvailable(fileObjectId, {
        signal,
        onStatusChange,
        classify: classifyCrimeConsentOriginalFile,
      }),
    )
  }

  const handleRemoveFile = () => {
    if (submittingRef.current) return
    invalidateUpload()
    setUpload({ status: 'idle' })
  }

  const handleSubmit = () => {
    if (submittingRef.current) return
    if (upload.status === 'uploading') {
      setAlertMessage(upload.phase === 'SCANNING' ? CRIME_CONSENT_MESSAGES.scanning : UPLOADING_MESSAGE)
      return
    }
    if (upload.status === 'scanPending') {
      setAlertMessage(CRIME_CONSENT_MESSAGES.scanTimeout)
      return
    }
    if (upload.status !== 'ready') {
      setAlertMessage(CRIME_CONSENT_MESSAGES.fileRequired)
      return
    }
    if (!portalSubmitEnabled) {
      markInstructorApplyConsentAgreed(consentKey)
      onComplete()
      return
    }

    const { fileName, fileObjectId } = upload
    const seq = uploadSeqRef.current
    submittingRef.current = true
    setIsSubmitting(true)
    void submitPortalCrimeConsentComplete(consentKey, {
      evidenceFileObjectId: fileObjectId,
      session: submitSessionRef.current,
    })
      .then(() => {
        if (submitContext === 'instructorApply') {
          markInstructorApplyConsentAgreed(consentKey)
        }
        void queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.consents() })
        onComplete()
      })
      .catch(error => {
        if (uploadSeqRef.current === seq && error instanceof CrimeConsentOriginalNotReadyError) {
          setUpload(
            error.reason === 'pending'
              ? { status: 'scanPending', fileName, fileObjectId }
              : { status: 'idle' },
          )
        }
        setAlertMessage(resolveCrimeConsentSubmitErrorMessage(error))
      })
      .finally(() => {
        submittingRef.current = false
        setIsSubmitting(false)
      })
  }

  const attachedFileName = upload.status === 'idle' ? null : upload.fileName
  const uploading = upload.status === 'uploading'
  const statusMessage =
    upload.status === 'uploading'
      ? upload.phase === 'SCANNING'
        ? CRIME_CONSENT_MESSAGES.scanning
        : UPLOADING_MESSAGE
      : upload.status === 'scanPending'
        ? CRIME_CONSENT_MESSAGES.scanTimeout
        : null

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
                성범죄경력 조회 동의서 양식을 다운로드하여 작성 및 서명해 주세요.
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
          description="작성 및 서명이 완료된 동의서를 PDF로 업로드해 주세요."
        >
          <section className={styles.crimeAttachSection} aria-label="동의서 파일 첨부">
            <PFText as="p" typo="label-md" color="neutral-warm-600" className={styles.crimeAttachLabel}>
              작성한 동의서를 첨부해 주세요.
            </PFText>
            <PFFormFileAttach
              className={styles.crimeAttachButton}
              accept={CRIME_CONSENT_ORIGINAL_ACCEPT}
              buttonLabel="파일 첨부"
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
            {attachedFileName ? (
              <ul className={styles.crimeAttachList} aria-label="첨부된 동의서">
                <li className={styles.crimeAttachListRow}>
                  <PFText
                    as="span"
                    typo="bd-md-md"
                    color="black"
                    className={styles.crimeAttachFileName}
                    title={attachedFileName}
                  >
                    {attachedFileName}
                  </PFText>
                  <PFItemDeleteButton
                    aria-label={`${attachedFileName} 삭제`}
                    disabled={isSubmitting}
                    onClick={handleRemoveFile}
                  />
                </li>
              </ul>
            ) : null}
            {statusMessage ? (
              <PFText as="p" typo="label-md" color="neutral-cool-500" role="status">
                {statusMessage}
              </PFText>
            ) : null}
            {upload.status === 'scanPending' ? (
              <PFButton
                size="large"
                variant="secondary"
                type="button"
                disabled={isSubmitting}
                onClick={handleRecheckScan}
              >
                검사 상태 확인
              </PFButton>
            ) : null}
          </section>
        </PFFormSection>

        <div className={styles.actions}>
          <PFButton
            size="xlarge"
            width={240}
            type="button"
            disabled={isSubmitting || uploading}
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
