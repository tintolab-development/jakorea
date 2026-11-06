/**
 * 일반 프로그램 봉사자 — 프로그램 신청 일괄 승인 안내 (면접 없음 일괄 / 2차 면접 일괄 합격)
 */

import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerApplicationApproveModalProps = {
  open: boolean
  volunteerName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export type GeneralVolunteerApplicationBulkApproveModalProps = {
  open: boolean
  subjectName: string
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerApplicationApproveCopy(volunteerName: string): {
  title: string
  message: string
} {
  const name = volunteerName.trim() || '회원'
  return {
    title: '프로그램 신청 승인 안내',
    message: `**[${name}]** 님의 프로그램 신청을 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.`,
  }
}

export function buildGeneralVolunteerApplicationBulkApproveCopy({
  subjectName,
  selectionCount,
}: {
  subjectName: string
  selectionCount: number
}): { title: string; message: string } {
  const name = subjectName.trim() || '회원'
  const rest = Math.max(0, selectionCount - 1)
  return {
    title: '프로그램 신청 일괄 승인 안내',
    message: `**[${name}] 님 외 ${rest}명**의 프로그램 신청을 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.`,
  }
}

function VolunteerApplicationBulkApproveInfoCallout() {
  return (
    <p className="instructor-bulk-approve-modal__callout-text">
      봉사자 일괄 승인 시{' '}
      <span className="instructor-bulk-approve-modal__callout-em">
        일정 및 기관 배정은 승인 후 봉사자 상세에서 개별 설정이 필요
      </span>
      합니다.
    </p>
  )
}

export function GeneralVolunteerApplicationApproveModal({
  open,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerApplicationApproveModalProps) {
  const copy = buildGeneralVolunteerApplicationApproveCopy(volunteerName)
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="instructor-bulk-approve-modal"
      title={copy.title}
      message={copy.message}
      infoCallout={<VolunteerApplicationBulkApproveInfoCallout />}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
    />
  )
}

export function GeneralVolunteerApplicationBulkApproveModal({
  open,
  subjectName,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerApplicationBulkApproveModalProps) {
  const copy = buildGeneralVolunteerApplicationBulkApproveCopy({ subjectName, selectionCount })
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="instructor-bulk-approve-modal"
      title={copy.title}
      message={copy.message}
      infoCallout={<VolunteerApplicationBulkApproveInfoCallout />}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
    />
  )
}
