import { useRef, useState } from 'react'
import type { PortalCertificateIssueReason } from '../api/personal-certificate-types'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import illustDiplomaUrl from '@/shared/assets/illustration/illust-diploma.svg'
import { formatDisplayDate } from '@/shared/lib/format-display-date'
import { PLATFORM_ALERT_COPY } from '@/shared/lib/platform-alert-copy'
import { PFAlertModal, PFButton, PFLoadingSpinner } from '@/shared/ui'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import {
  useDownloadMyCertificateMutation,
  useIssueMyCertificateMutation,
  useMyCertificateAvailabilityQuery,
} from '../api/certificate-hooks'
import type { ProgramApplicationType } from '../api/types'
import {
  resolveExclusivePersonalCertificateSlot,
  shouldFetchIndividualCertificateAvailability,
} from '../lib/certificate-cta'
import { buildCertificateDownloadFileName } from '../lib/certificate-download-file-name'
import { isCertificateIssuancePeriodExpiredMessage } from '../lib/certificate-reason-messages'
import {
  PERSONAL_CERTIFICATE_ISSUE_NOTICE,
  PERSONAL_CERTIFICATE_ISSUE_REASONS,
  portalCertificateCtaButtonLabel,
  portalCertificateDocumentLabel,
} from '../lib/personal-certificate-eligibility'
import styles from './certificate-issue-cta.module.css'

type CertificateIssueCtaProps = {
  isTeacher: boolean
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  programId?: string | number | null
  programTitle?: string
  programType?: string | null
  programGroup?: string | null
  detailCase?: string | null
  canIssueCertificate?: boolean | null
  certificateStatus?: string | null
}

export function CertificateIssueCta({
  isTeacher,
  applicationType,
  applicationId,
  programId,
  programTitle,
  programType,
  programGroup,
  detailCase,
  canIssueCertificate,
  certificateStatus: _certificateStatus,
}: CertificateIssueCtaProps) {
  const availabilityEnabled = shouldFetchIndividualCertificateAvailability({
    isTeacher,
    applicationType,
    programType,
    programGroup,
    detailCase,
    canIssueCertificate,
    programId,
  })
  const completionQuery = useMyCertificateAvailabilityQuery({
    programId,
    enabled: availabilityEnabled,
    certificateType: 'COMPLETION',
  })
  const slot = resolveExclusivePersonalCertificateSlot({
    completion: completionQuery.data,
  })
  const activeKind = slot.type
  const view = slot.view
  const availabilityQuery = {
    data: completionQuery.data,
  }
  const issueMutation = useIssueMyCertificateMutation({
    applicationType,
    applicationId,
  })
  const downloadMutation = useDownloadMyCertificateMutation()
  const { displayName } = useMypageMember()
  const pendingRef = useRef(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [issueReason, setIssueReason] = useState<PortalCertificateIssueReason>('PERSONAL_ARCHIVE')
  const [completeIssuedAt, setCompleteIssuedAt] = useState<string | null>(null)
  const [completeIssueId, setCompleteIssueId] = useState<number | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const isBusy = issueMutation.isPending || downloadMutation.isPending
  const documentLabel = portalCertificateDocumentLabel('COMPLETION')

  const handleDownload = async (issueId: number, issuedAt?: string | null) => {
    if (isBusy || pendingRef.current) return
    pendingRef.current = true
    try {
      await downloadMutation.mutateAsync({
        certificateIssueId: issueId,
        fileName: buildCertificateDownloadFileName({
          documentLabel,
          memberName: displayName,
          issuedAt,
        }),
      })
    } catch (error) {
      setAlertMessage(
        getProgramApplicationApiErrorMessage(error, `${documentLabel}을 다운로드하지 못했습니다.`),
      )
    } finally {
      pendingRef.current = false
    }
  }

  const handleIssue = async () => {
    if (isBusy || pendingRef.current) return
    const availability = availabilityQuery.data
    if (view.kind === 'download') {
      setConfirmOpen(false)
      // 재다운로드 파일명 날짜 = 발급일(availability.issuedAt). 없으면 다운로드일.
      await handleDownload(view.issueId, availability?.issuedAt)
      return
    }
    const participantId = availability?.participantId
    const parsedProgramId = Number(programId)
    if (
      participantId == null ||
      !Number.isInteger(parsedProgramId) ||
      parsedProgramId <= 0
    ) {
      setAlertMessage(`${documentLabel} 발급 대상 정보를 확인하지 못했습니다.`)
      return
    }
    pendingRef.current = true
    try {
      const result = await issueMutation.mutateAsync({
        programId: parsedProgramId,
        participantId,
        certificateType: 'COMPLETION',
        issueReason,
      })
      setConfirmOpen(false)
      if (result.certificateIssueId == null) {
        setAlertMessage(`${documentLabel} 발급 결과를 확인하지 못했습니다.`)
        return
      }
      setCompleteIssueId(result.certificateIssueId)
      setCompleteIssuedAt(result.issuedAt ?? null)
    } catch (error) {
      setConfirmOpen(false)
      setAlertMessage(
        getProgramApplicationApiErrorMessage(error, `${documentLabel}을 발급하지 못했습니다.`),
      )
    } finally {
      pendingRef.current = false
    }
  }

  if (!availabilityEnabled || !activeKind || view.kind === 'hidden') return null

  const title = portalCertificateCtaButtonLabel({
    certificateType: activeKind,
    action: view.kind === 'download' ? 'download' : 'issue',
  })
  const issuedDateLabel = completeIssuedAt ? formatDisplayDate(completeIssuedAt) : ''

  return (
    <>
      <div className={styles.block}>
        <div className={styles.submitRow}>
          <PFButton
            type="button"
            variant="certificate"
            size="large"
            disabled={isBusy}
            className={styles.submitButton}
            onClick={() => {
              if (view.kind === 'download') {
                void handleDownload(view.issueId, availabilityQuery.data?.issuedAt)
                return
              }
              setConfirmOpen(true)
            }}
          >
            {title}
            <img
              className={styles.submitIllustration}
              src={illustDiplomaUrl}
              alt=""
              width={48}
              height={48}
              aria-hidden="true"
            />
          </PFButton>
        </div>
      </div>

      <PFAlertModal
        open={confirmOpen}
        title={`${documentLabel} 발급하기`}
        description={
          <>
            {PERSONAL_CERTIFICATE_ISSUE_NOTICE}
            <span className={styles.reasonList}>
              {PERSONAL_CERTIFICATE_ISSUE_REASONS.map(reason => (
                <label key={reason.value} className={styles.reasonItem}>
                  <input
                    type="radio"
                    name="certificate-issue-reason"
                    checked={issueReason === reason.value}
                    onChange={() => setIssueReason(reason.value)}
                  />
                  {reason.label}
                </label>
              ))}
            </span>
            {programTitle ? `${programTitle} ${documentLabel}을 발급합니다. ` : null}
            발급 후에는 취소할 수 없습니다.
          </>
        }
        confirmLabel="발급하기"
        confirmLoading={issueMutation.isPending}
        confirmDisabled={issueMutation.isPending}
        onConfirm={() => {
          void handleIssue()
        }}
        onDismiss={() => {
          if (issueMutation.isPending) return
          setConfirmOpen(false)
        }}
      />

      <PFAlertModal
        open={completeIssueId != null}
        title={`${documentLabel} 발급 완료`}
        description={
          <>
            {issuedDateLabel ? `발급일 ${issuedDateLabel}` : null}
            {issuedDateLabel ? <br /> : null}
            {documentLabel}을 다운로드할 수 있습니다.
          </>
        }
        confirmLabel={`${documentLabel} 다운받기`}
        confirmLoading={downloadMutation.isPending}
        confirmDisabled={downloadMutation.isPending}
        onConfirm={() => {
          if (completeIssueId == null) return
          void handleDownload(completeIssueId, completeIssuedAt)
        }}
        onDismiss={() => {
          if (downloadMutation.isPending) return
          setCompleteIssueId(null)
          setCompleteIssuedAt(null)
        }}
      />

      <PFAlertModal
        open={alertMessage != null}
        title={
          isCertificateIssuancePeriodExpiredMessage(alertMessage)
            ? PLATFORM_ALERT_COPY.certificateExpired.title
            : '안내'
        }
        description={
          isCertificateIssuancePeriodExpiredMessage(alertMessage)
            ? PLATFORM_ALERT_COPY.certificateExpired.description
            : (alertMessage ?? '')
        }
        onConfirm={() => setAlertMessage(null)}
      />
      {downloadMutation.isPending ? (
        <PFLoadingSpinner blocking label={`${documentLabel}을 다운로드하는 중`} />
      ) : null}
    </>
  )
}
