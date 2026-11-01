import { useEffect, useState } from 'react'
import type { ProgramDetailCase } from '@/features/program'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import { availabilityReasonMessage } from '../api/personal-certificate-client'
import {
  useDownloadPersonalCertificateMutation,
  useIssuePersonalCertificateMutation,
  usePersonalCertificateAvailabilityQuery,
} from '../api/personal-certificate-hooks'
import { readPortalCertificateIssueId } from '../api/personal-certificate-types'
import type { ProgramApplicationType } from '../api/types'
import { labelForPortalCertificateStatus } from '../lib/certificate-status-label'
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
  certificateStatus,
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
      console.warn(
        '[personal-certificate] canIssueCertificate hint mismatch; availability wins',
        {
          canIssueCertificateHint,
          available: availability.available,
          canDownload: availability.canDownload,
        },
      )
    }
  }, [availability, canIssueCertificateHint])

  if (!eligibleSurface) return null

  const existingIssueId =
    localIssueId ??
    (availability?.existingIssueId != null && Number(availability.existingIssueId) > 0
      ? Number(availability.existingIssueId)
      : null)
  const canDownload =
    availability?.canDownload === true ||
    existingIssueId != null
  // 이미 ISSUED면 재발급 POST 금지 — download만.
  const canIssueNew =
    availability?.available === true &&
    availability?.canDownload !== true &&
    existingIssueId == null
  const actionable = isPersonalCertificateActionable(availability) || localIssueId != null
  const participantId =
    (availability?.participantId != null && Number(availability.participantId) > 0
      ? Number(availability.participantId)
      : null) ??
    (participantIdHint != null && participantIdHint > 0 ? participantIdHint : null)

  const statusLabel = labelForPortalCertificateStatus(certificateStatus)
  const reason =
    availabilityReasonMessage(availability) ??
    (availabilityQuery.isError ? '수료증 발급 가능 여부를 확인하지 못했습니다.' : null)

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
          : '수료증을 다운로드하지 못했습니다. 잠시 후 다시 시도해 주세요.',
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
          : '수료증을 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    }
  }

  if (availabilityQuery.isLoading && !availability) {
    return (
      <section className={styles.panel} aria-label="수료증">
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          수료증 발급 가능 여부를 확인하는 중입니다.
        </PFText>
      </section>
    )
  }

  if (!actionable) {
    // 자격 없음: reasonMessage(또는 조회 실패)가 있을 때만 안내. NOT_ELIGIBLE 배지만으로 패널을 항상 띄우지 않음.
    if (!reason) return null
    return (
      <section className={styles.panel} aria-label="수료증">
        {statusLabel ? (
          <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.status}>
            {statusLabel}
          </PFText>
        ) : null}
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.reason}>
          {reason}
        </PFText>
      </section>
    )
  }

  return (
    <section className={styles.panel} aria-label="수료증">
      <div className={styles.copy}>
        <PFText as="h2" typo="hl-sm" color="black" className={styles.title}>
          수료증
        </PFText>
        {statusLabel ? (
          <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.status}>
            {statusLabel}
          </PFText>
        ) : null}
        {reason && !canDownload ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.reason}>
            {reason}
          </PFText>
        ) : (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.reason}>
            {canDownload
              ? '발급된 수료증을 다운로드할 수 있습니다.'
              : '수료 조건을 충족하여 수료증을 발급할 수 있습니다.'}
          </PFText>
        )}
      </div>
      <div className={styles.actions}>
        {canDownload && existingIssueId != null ? (
          <PFButton
            type="button"
            variant="certificate"
            disabled={busy}
            onClick={() => void handleDownload(existingIssueId)}
          >
            수료증 다운로드
          </PFButton>
        ) : canIssueNew ? (
          <PFButton
            type="button"
            variant="certificate"
            disabled={busy || participantId == null}
            onClick={() => void handleIssue()}
          >
            수료증 발급
          </PFButton>
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
