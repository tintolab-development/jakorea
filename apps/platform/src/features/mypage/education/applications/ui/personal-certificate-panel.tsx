import { useEffect, useState, type ReactNode } from 'react'
import type { ProgramDetailCase } from '@/features/program'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import illustDiplomaUrl from '@/shared/assets/illustration/illust-diploma.svg'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import { availabilityReasonMessage } from '../api/personal-certificate-client'
import {
  useDownloadPersonalCertificateMutation,
  useIssuePersonalCertificateMutation,
  usePersonalCertificateAvailabilityQuery,
} from '../api/personal-certificate-hooks'
import { readPortalCertificateIssueId } from '../api/personal-certificate-types'
import type { ProgramApplicationType } from '../api/types'
import { buildCertificateDownloadFileName } from '../lib/certificate-download-file-name'
import {
  isPersonalCertificateActionable,
  portalCertificateDocumentLabel,
  portalCertificateIssueType,
  shouldShowPersonalCertificateAction,
} from '../lib/personal-certificate-eligibility'
import styles from './personal-certificate-panel.module.css'

type EducationPersonalCertificatePanelProps = {
  programId: string
  applicationId: string
  applicationType: ProgramApplicationType | string | null | undefined
  programType?: string | null
  programGroup?: string | null
  detailCase?: ProgramDetailCase | string | null
  isTeacher?: boolean
  isWithdrawnDuring?: boolean
  /** 상세 힌트 — 발급 가능 여부의 최종 판정으로 쓰지 않는다 */
  certificateStatus?: string | null
  canIssueCertificateHint?: boolean | null
  participantIdHint?: number | null
}

export function EducationPersonalCertificatePanel({
  programId,
  applicationId,
  applicationType,
  programType,
  programGroup,
  detailCase,
  isTeacher,
  isWithdrawnDuring = false,
  canIssueCertificateHint,
  participantIdHint,
}: EducationPersonalCertificatePanelProps) {
  const eligibleSurface = shouldShowPersonalCertificateAction({
    applicationType,
    programType,
    programGroup,
    detailCase,
    isTeacher,
  })
  const autoQuery = usePersonalCertificateAvailabilityQuery({
    programId,
    enabled: eligibleSurface && !isWithdrawnDuring,
    certificateType: 'COMPLETION',
  })
  const participationQuery = usePersonalCertificateAvailabilityQuery({
    programId,
    enabled: eligibleSurface && isWithdrawnDuring,
    certificateType: 'PARTICIPATION',
  })
  const availability = isWithdrawnDuring ? participationQuery.availability : autoQuery.availability
  const issueMutation = useIssuePersonalCertificateMutation({
    applicationType: applicationType ?? null,
    applicationId,
  })
  const downloadMutation = useDownloadPersonalCertificateMutation()
  const { displayName } = useMypageMember()
  const [alertMessage, setAlertMessage] = useState('')
  const [localIssueId, setLocalIssueId] = useState<number | null>(null)

  useEffect(() => {
    setLocalIssueId(null)
  }, [programId, applicationId])

  useEffect(() => {
    if (!availability || typeof canIssueCertificateHint !== 'boolean') return
    const expected = availability.available === true || availability.canDownload === true
    if (expected !== canIssueCertificateHint) {
      console.warn('[personal-certificate] canIssueCertificate hint mismatch; availability wins', {
        canIssueCertificateHint,
        available: availability.available,
        canDownload: availability.canDownload,
      })
    }
  }, [availability, canIssueCertificateHint])

  if (!eligibleSurface) return null

  const documentLabel = isWithdrawnDuring
    ? '참가인증서'
    : portalCertificateDocumentLabel(availability?.certificateType)
  const existingIssueId =
    localIssueId ??
    (availability?.existingIssueId != null && Number(availability.existingIssueId) > 0
      ? Number(availability.existingIssueId)
      : null)
  const issued = existingIssueId != null
  const canIssueNew =
    !isWithdrawnDuring &&
    !issued &&
    availability?.available === true &&
    availability?.canDownload !== true &&
    portalCertificateIssueType(availability?.certificateType) !== 'PARTICIPATION'
  const actionable = isPersonalCertificateActionable(availability) || localIssueId != null
  const participantId =
    (availability?.participantId != null && Number(availability.participantId) > 0
      ? Number(availability.participantId)
      : null) ?? (participantIdHint != null && participantIdHint > 0 ? participantIdHint : null)

  const busy =
    autoQuery.isLoading ||
    autoQuery.isFetching ||
    participationQuery.isLoading ||
    participationQuery.isFetching ||
    issueMutation.isPending ||
    downloadMutation.isPending

  const handleDownload = async (issueId: number) => {
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
        error instanceof Error && error.message.trim()
          ? error.message
          : `${documentLabel}을 다운로드하지 못했습니다. 잠시 후 다시 시도해 주세요.`,
      )
    }
  }

  const handleIssue = async () => {
    if (participantId == null) {
      setAlertMessage(`참가자 정보가 없어 ${documentLabel}을 발급할 수 없습니다.`)
      return
    }
    const programIdNumber = Number(programId)
    if (!Number.isInteger(programIdNumber) || programIdNumber <= 0) {
      setAlertMessage('프로그램 정보가 올바르지 않습니다.')
      return
    }
    try {
      const issuedResponse = await issueMutation.mutateAsync({
        programId: programIdNumber,
        participantId,
        certificateType: 'COMPLETION',
        issueReason: 'PERSONAL_ARCHIVE',
      })
      const issueId = readPortalCertificateIssueId(issuedResponse)
      if (issueId == null) {
        if (isWithdrawnDuring) await participationQuery.refetch()
        else await autoQuery.refetch()
        setAlertMessage(`${documentLabel}이 발급되었습니다. 다운로드를 다시 시도해 주세요.`)
        return
      }
      setLocalIssueId(issueId)
      await handleDownload(issueId)
      if (isWithdrawnDuring) await participationQuery.refetch()
      else await autoQuery.refetch()
    } catch (error) {
      setAlertMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : `${documentLabel}을 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.`,
      )
    }
  }

  const ineligibleMessage = availabilityReasonMessage(availability)
  const periodLabel = availability?.certificatePeriodLabel?.trim() || ''

  if (!actionable) {
    if (!isWithdrawnDuring) return null
    if (autoQuery.isLoading || participationQuery.isLoading) return null
    return (
      <section aria-label="참가인증서">
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {ineligibleMessage || '인정된 교육 실적이 없어 참가인증서를 발급할 수 없습니다.'}
        </PFText>
      </section>
    )
  }

  return (
    <section aria-label={documentLabel}>
      {periodLabel ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.periodLabel}>
          {periodLabel}
        </PFText>
      ) : null}
      <div className={styles.actions}>
        {issued || canIssueNew ? (
          <CertificateActionButton
            disabled={busy || (!issued && participantId == null)}
            onClick={() => {
              if (existingIssueId != null) {
                void handleDownload(existingIssueId)
                return
              }
              void handleIssue()
            }}
          >
            {issued ? `${documentLabel} 다운로드` : `${documentLabel} 발급하기`}
          </CertificateActionButton>
        ) : null}
      </div>
      <PFAlertModal
        open={Boolean(alertMessage)}
        title="안내"
        description={alertMessage}
        confirmLabel="확인"
        onConfirm={() => setAlertMessage('')}
      />
      {downloadMutation.isPending || issueMutation.isPending ? (
        <PFLoadingSpinner
          blocking
          label={
            downloadMutation.isPending
              ? `${documentLabel}을 다운로드하는 중`
              : `${documentLabel}을 발급하는 중`
          }
        />
      ) : null}
    </section>
  )
}

function CertificateActionButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <PFButton
      type="button"
      variant="secondary"
      size="medium"
      width={200}
      disabled={disabled}
      onClick={onClick}
      className={styles.button}
    >
      <span className={styles.buttonInner}>
        <img src={illustDiplomaUrl} alt="" width={24} height={24} />
        {children}
      </span>
    </PFButton>
  )
}
