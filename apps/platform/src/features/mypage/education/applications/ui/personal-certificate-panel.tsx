import { useEffect, useState, type ReactNode } from 'react'
import type { ProgramDetailCase } from '@/features/program'
import illustDiplomaUrl from '@/shared/assets/illustration/illust-diploma.svg'
import { PFAlertModal, PFButton } from '@/shared/ui'
import {
  useDownloadPersonalCertificateMutation,
  useIssuePersonalCertificateMutation,
  usePersonalCertificateAvailabilityQuery,
} from '../api/personal-certificate-hooks'
import { readPortalCertificateIssueId } from '../api/personal-certificate-types'
import type { ProgramApplicationType } from '../api/types'
import {
  isPersonalCertificateActionable,
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
  const availabilityQuery = usePersonalCertificateAvailabilityQuery({
    programId,
    enabled: eligibleSurface,
  })
  const issueMutation = useIssuePersonalCertificateMutation({
    applicationType: applicationType ?? null,
    applicationId,
  })
  const downloadMutation = useDownloadPersonalCertificateMutation()
  const [alertMessage, setAlertMessage] = useState('')
  const [localIssueId, setLocalIssueId] = useState<number | null>(null)

  useEffect(() => {
    setLocalIssueId(null)
  }, [programId, applicationId])

  const availability = availabilityQuery.availability

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

  const existingIssueId =
    localIssueId ??
    (availability?.existingIssueId != null && Number(availability.existingIssueId) > 0
      ? Number(availability.existingIssueId)
      : null)
  const issued = existingIssueId != null
  const canIssueNew =
    !issued && availability?.available === true && availability?.canDownload !== true
  const actionable = isPersonalCertificateActionable(availability) || localIssueId != null
  const participantId =
    (availability?.participantId != null && Number(availability.participantId) > 0
      ? Number(availability.participantId)
      : null) ?? (participantIdHint != null && participantIdHint > 0 ? participantIdHint : null)

  const busy =
    availabilityQuery.isLoading ||
    availabilityQuery.isFetching ||
    issueMutation.isPending ||
    downloadMutation.isPending

  const handleDownload = async (issueId: number) => {
    try {
      await downloadMutation.mutateAsync(issueId)
    } catch (error) {
      setAlertMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : '수료증을 다운로드하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      )
    }
  }

  const handleIssue = async () => {
    if (participantId == null) {
      setAlertMessage('참가자 정보가 없어 수료증을 발급할 수 없습니다.')
      return
    }
    const programIdNumber = Number(programId)
    if (!Number.isInteger(programIdNumber) || programIdNumber <= 0) {
      setAlertMessage('프로그램 정보가 올바르지 않습니다.')
      return
    }
    try {
      const issued = await issueMutation.mutateAsync({
        programId: programIdNumber,
        participantId,
        certificateType: 'AUTO',
        issueReason: 'PERSONAL_ARCHIVE',
      })
      const issueId = readPortalCertificateIssueId(issued)
      if (issueId == null) {
        await availabilityQuery.refetch()
        setAlertMessage('수료증이 발급되었습니다. 다운로드를 다시 시도해 주세요.')
        return
      }
      setLocalIssueId(issueId)
      await handleDownload(issueId)
      await availabilityQuery.refetch()
    } catch (error) {
      setAlertMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : '수료증을 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      )
    }
  }

  // 발급·다운로드가 가능할 때만 노출. 불가 사유(발급 불가 등)는 헤더에 띄우지 않는다.
  if (!actionable) return null

  return (
    <section aria-label="수료증">
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
            {issued ? '수료증 다운로드' : '수료증 발급하기'}
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
      variant="certificate"
      disabled={disabled}
      className={styles.actionButton}
      onClick={onClick}
    >
      {children}
      <img
        className={styles.actionIllustration}
        src={illustDiplomaUrl}
        alt=""
        width={48}
        height={48}
        aria-hidden="true"
      />
    </PFButton>
  )
}
