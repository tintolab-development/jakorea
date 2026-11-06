import { useEffect, useState, type ReactNode } from 'react'
import type { ProgramDetailCase } from '@/features/program'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import illustDiplomaUrl from '@/shared/assets/illustration/illust-diploma.svg'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import { availabilityReasonMessage } from '../api/personal-certificate-client'
import type { MemberCertificateAvailabilityResponse } from '../api/personal-certificate-types'
import {
  useDownloadPersonalCertificateMutation,
  useIssuePersonalCertificateMutation,
  usePersonalCertificateAvailabilityQuery,
} from '../api/personal-certificate-hooks'
import { readPortalCertificateIssueId } from '../api/personal-certificate-types'
import type { ProgramApplicationType } from '../api/types'
import {
  resolveExclusivePersonalCertificateSlot,
  resolvePortalCertificateIssueParticipantId,
} from '../lib/certificate-cta'
import { buildCertificateDownloadFileName } from '../lib/certificate-download-file-name'
import {
  portalCertificateCtaButtonLabel,
  portalCertificateDocumentLabel,
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

type CertificateKind = 'COMPLETION' | 'PARTICIPATION'

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
  const completionQuery = usePersonalCertificateAvailabilityQuery({
    programId,
    enabled: eligibleSurface,
    certificateType: 'COMPLETION',
  })
  const participationQuery = usePersonalCertificateAvailabilityQuery({
    programId,
    enabled: eligibleSurface,
    certificateType: 'PARTICIPATION',
  })
  const issueMutation = useIssuePersonalCertificateMutation({
    applicationType: applicationType ?? null,
    applicationId,
  })
  const downloadMutation = useDownloadPersonalCertificateMutation()
  const { displayName } = useMypageMember()
  const [alertMessage, setAlertMessage] = useState('')
  const [localIssueIds, setLocalIssueIds] = useState<
    Partial<Record<CertificateKind, number>>
  >({})

  useEffect(() => {
    setLocalIssueIds({})
  }, [programId, applicationId])

  useEffect(() => {
    const availability = completionQuery.availability ?? participationQuery.availability
    if (!availability) return
    const fromAvailability = resolvePortalCertificateIssueParticipantId({
      availabilityParticipantId: availability.participantId,
    })
    if (
      fromAvailability != null &&
      participantIdHint != null &&
      participantIdHint > 0 &&
      fromAvailability !== participantIdHint
    ) {
      console.warn('[personal-certificate] participantId mismatch; availability wins', {
        availabilityParticipantId: fromAvailability,
        applicationParticipantId: participantIdHint,
      })
    }
  }, [completionQuery.availability, participantIdHint, participationQuery.availability])

  useEffect(() => {
    const availability = completionQuery.availability ?? participationQuery.availability
    if (!availability || typeof canIssueCertificateHint !== 'boolean') return
    const expected = availability.available === true || availability.canDownload === true
    if (expected !== canIssueCertificateHint) {
      console.warn('[personal-certificate] canIssueCertificate hint mismatch; availability wins', {
        canIssueCertificateHint,
        available: availability.available,
        canDownload: availability.canDownload,
        certificateType: availability.certificateType,
      })
    }
  }, [
    canIssueCertificateHint,
    completionQuery.availability,
    participationQuery.availability,
  ])

  if (!eligibleSurface) return null

  const busy =
    completionQuery.isLoading ||
    completionQuery.isFetching ||
    participationQuery.isLoading ||
    participationQuery.isFetching ||
    issueMutation.isPending ||
    downloadMutation.isPending

  const slot = resolveExclusivePersonalCertificateSlot({
    completion: completionQuery.availability,
    participation: participationQuery.availability,
  })

  if (slot.type == null || slot.view.kind === 'hidden') {
    if (!isWithdrawnDuring) return null
    if (completionQuery.isLoading || participationQuery.isLoading) return null
    return (
      <section aria-label="참가인증서">
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {availabilityReasonMessage(participationQuery.availability) ||
            availabilityReasonMessage(completionQuery.availability) ||
            '인정된 교육 실적이 없어 참가인증서를 발급할 수 없습니다.'}
        </PFText>
      </section>
    )
  }

  const activeKind = slot.type
  const activeView = slot.view
  const activeAvailability =
    activeKind === 'PARTICIPATION'
      ? participationQuery.availability
      : completionQuery.availability

  const resolveParticipantId = (availability: MemberCertificateAvailabilityResponse | null) =>
    resolvePortalCertificateIssueParticipantId({
      availabilityParticipantId: availability?.participantId,
    })

  const handleDownload = async (issueId: number, documentLabel: string) => {
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

  const handleIssue = async (
    kind: CertificateKind,
    availability: MemberCertificateAvailabilityResponse | null,
  ) => {
    const documentLabel = portalCertificateDocumentLabel(kind)
    const participantId = resolveParticipantId(availability)
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
        certificateType: kind,
        issueReason: 'PERSONAL_ARCHIVE',
      })
      const certificateIssueId = readPortalCertificateIssueId(issuedResponse)
      if (certificateIssueId == null) {
        setAlertMessage(`${documentLabel} 발급 결과를 확인하지 못했습니다.`)
        return
      }
      if (kind === 'COMPLETION') {
        setLocalIssueIds(prev => ({ ...prev, [kind]: certificateIssueId }))
      }
      await handleDownload(certificateIssueId, documentLabel)
      await Promise.all([completionQuery.refetch(), participationQuery.refetch()])
    } catch (error) {
      setAlertMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : `${documentLabel}을 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.`,
      )
    }
  }

  const documentLabel = portalCertificateDocumentLabel(activeKind)
  const title = portalCertificateCtaButtonLabel({
    certificateType: activeKind,
    action: activeView.kind === 'download' ? 'download' : 'issue',
  })
  const localIssueId = localIssueIds[activeKind]

  return (
    <section aria-label="증명서 발급" className={styles.root}>
      <div className={styles.actions}>
        <CertificateDiplomaButton
          disabled={
            busy ||
            (activeView.kind === 'issue' && resolveParticipantId(activeAvailability) == null)
          }
          onClick={() => {
            if (activeView.kind === 'download') {
              void handleDownload(activeView.issueId, documentLabel)
              return
            }
            if (activeKind === 'COMPLETION' && localIssueId != null) {
              void handleDownload(localIssueId, documentLabel)
              return
            }
            void handleIssue(activeKind, activeAvailability)
          }}
        >
          {title}
        </CertificateDiplomaButton>
      </div>
      <PFAlertModal
        open={Boolean(alertMessage)}
        title="안내"
        description={alertMessage}
        confirmLabel="확인"
        onConfirm={() => setAlertMessage('')}
      />
      {downloadMutation.isPending || issueMutation.isPending ? (
        <PFLoadingSpinner blocking label="증명서를 처리하는 중" />
      ) : null}
    </section>
  )
}

function CertificateDiplomaButton({
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
      size="large"
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
