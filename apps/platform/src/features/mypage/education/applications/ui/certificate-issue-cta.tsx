import { useRef, useState } from 'react'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import illustDiplomaUrl from '@/shared/assets/illustration/illust-diploma.svg'
import { formatDisplayDate } from '@/shared/lib/format-display-date'
import { PFAlertModal, PFButton, PFLoadingSpinner } from '@/shared/ui'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import {
  useDownloadMyCertificateMutation,
  useIssueMyCertificateMutation,
  useMyCertificateAvailabilityQuery,
} from '../api/certificate-hooks'
import type { ProgramApplicationType } from '../api/types'
import {
  resolveCertificateCtaView,
  shouldFetchIndividualCertificateAvailability,
} from '../lib/certificate-cta'
import { buildCertificateDownloadFileName } from '../lib/certificate-download-file-name'
import {
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
  certificateStatus,
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
  const [completeIssuedAt, setCompleteIssuedAt] = useState<string | null>(null)
  const [completeIssueId, setCompleteIssueId] = useState<number | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const view = resolveCertificateCtaView({
    isTeacher,
    applicationType,
    programType,
    programGroup,
    detailCase,
    canIssueCertificate,
    certificateStatus,
    availability: availabilityQuery.data,
  })
  const isBusy = issueMutation.isPending || downloadMutation.isPending
  const documentLabel = portalCertificateDocumentLabel(availabilityQuery.data?.certificateType)

  const handleDownload = async (issueId: number) => {
    if (isBusy || pendingRef.current) return
    pendingRef.current = true
    try {
      await downloadMutation.mutateAsync({
        certificateIssueId: issueId,
        fileName: buildCertificateDownloadFileName({
          documentLabel,
          memberName: displayName,
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
    const existingIssueId = availability?.existingIssueId
    if (
      availability?.canDownload === true ||
      (typeof existingIssueId === 'number' && existingIssueId > 0)
    ) {
      setConfirmOpen(false)
      if (typeof existingIssueId === 'number' && existingIssueId > 0) {
        await handleDownload(existingIssueId)
      }
      return
    }
    const participantId = availability?.participantId
    const parsedProgramId = Number(programId)
    if (
      !availability?.certificateType ||
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
      })
      setConfirmOpen(false)
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

  if (!availabilityEnabled || view.kind === 'hidden') return null

  const title =
    view.kind === 'download' ? `${documentLabel} 다운받기` : `${documentLabel} 발급하기`
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
                void handleDownload(view.issueId)
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
            {programTitle ? `${programTitle} ${documentLabel}을 발급합니다. ` : null}
            발급 후에는 취소할 수 없습니다. 파일은 관리자 양식의 제목·본문·이사장명·하단
            정보를 따릅니다.
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
          void handleDownload(completeIssueId)
        }}
        onDismiss={() => {
          if (downloadMutation.isPending) return
          setCompleteIssueId(null)
          setCompleteIssuedAt(null)
        }}
      />

      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? ''}
        onConfirm={() => setAlertMessage(null)}
      />
      {downloadMutation.isPending ? (
        <PFLoadingSpinner blocking label={`${documentLabel}을 다운로드하는 중`} />
      ) : null}
    </>
  )
}
