import { useCallback, useState } from 'react'
import { Space, Spin } from 'antd'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { useUjatInstitutionApplicationDetail } from '@/features/program/ujat/api/use-institution-application-detail'
import { useUjatInstitutionTeacherPrivacyReveal } from '../shared/use-institution-teacher-privacy-reveal'
import { UjatInstitutionApplicationDetailView } from './detail-view'
import {
  UjatInstitutionApplicationActionModal,
  type UjatInstitutionApplicationModalAction,
} from '../list/action-modal'
import { TemporaryActionModal } from '../temporary-action-modal'
import type { UjatTemporaryActionKind } from '../temporary-action-copy'
import { releaseUjatTemporarySchedules } from '../list/temp-release'
import {
  UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_CONTENT,
  UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_TITLE,
  UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_CONTENT,
  UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_TITLE,
  UJAT_INSTITUTION_TEMP_ASSIGN_COMPLETE_CONTENT,
  UJAT_INSTITUTION_TEMP_ASSIGN_COMPLETE_TITLE,
  UJAT_INSTITUTION_TEMP_REJECT_DETAIL_COMPLETE_CONTENT,
  UJAT_INSTITUTION_TEMP_REJECT_DETAIL_COMPLETE_TITLE,
  UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_CONTENT,
  UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_TITLE,
} from '../list/temp-assign-complete'
import {
  buildTemporaryAssignmentFailureLines,
  type TemporaryAssignmentBulkResponse,
} from '@/features/program/ujat/api/temporary-assignments'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import {
  toOrganizationApproveNotifyTiming,
  toTimedBulkNotifyTiming,
} from '@/features/program/general/lib/application-decision-notify-timing'
import './detail-page.css'

export function UjatInstitutionApplicationDetailPage({
  institutionId,
  programId,
  onBack,
  onStatusUpdated,
  onOpenScheduleAssign,
}: {
  institutionId: string
  programId?: string | null
  onBack: () => void
  onStatusUpdated: () => void
  onOpenScheduleAssign?: () => void
}) {
  const { showAlert } = useCmsAlert()
  const {
    row,
    detail,
    loading,
    approveRemote,
    rejectRemote,
    tempRejectRemote,
    tempRejectCancelRemote,
    tempAssignRemote,
    tempAssignCancelRemote,
    invalidate,
    workflow,
    workflowReady,
  } = useUjatInstitutionApplicationDetail({ institutionId, programId })

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal,
    programPrivacyPending,
  } = useUjatInstitutionTeacherPrivacyReveal({
    institutionId,
    programId,
    accessItemLabel: row?.institutionName ?? 'UJAT 신청 기관',
  })

  const [pendingAction, setPendingAction] = useState<UjatInstitutionApplicationModalAction | null>(
    null
  )
  const [pendingTempKind, setPendingTempKind] = useState<UjatTemporaryActionKind | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handlePrimaryAction = useCallback(() => {
    if (!workflowReady || workflow.primaryDisabled) return
    if (workflow.primaryAction === 'open_schedule_assign') {
      setPendingTempKind('temp_assign')
      return
    }
    if (workflow.primaryAction === 'final_approve') {
      setPendingAction('application_approve')
    }
  }, [workflow.primaryAction, workflow.primaryDisabled, workflowReady])

  const handleFinalApprove = useCallback(
    (payload?: PermissionModalPayload) => {
      if (!workflow.canFinalApprove) {
        setPendingAction(null)
        showAlert({
          title: '안내',
          content: '먼저 임시 일정을 배정하고 기관 확인을 완료해 주세요.',
        })
        return
      }
      void (async () => {
        setActionLoading(true)
        try {
          await approveRemote(
            payload
              ? toOrganizationApproveNotifyTiming(payload.notifyTiming, payload.manualNotifyAt)
              : undefined
          )
          setPendingAction(null)
          onStatusUpdated()
          onBack()
          showAlert({
            title: '최종 승인',
            content: '기관 확인이 완료된 신청을 최종 승인했습니다.',
          })
        } catch (error) {
          showAlert({
            title: '안내',
            content: readApiErrorAlertMessage(error, '최종 승인에 실패했습니다.'),
          })
        } finally {
          setActionLoading(false)
        }
      })()
    },
    [approveRemote, onBack, onStatusUpdated, showAlert, workflow.canFinalApprove]
  )

  const handleActionConfirm = (payload: PermissionModalPayload) => {
    if (!pendingAction || !row) return
    if (pendingAction === 'application_approve') {
      handleFinalApprove(payload)
      return
    }
    const reason = payload.reason.trim()
    if (!reason) {
      showAlert({
        title: '필수 항목 미입력 안내',
        content: '반려 사유를 입력해 주세요.',
      })
      return
    }
    void (async () => {
      setActionLoading(true)
      try {
        await rejectRemote(
          reason,
          toTimedBulkNotifyTiming(payload.notifyTiming, payload.manualNotifyAt)
        )
        // 상세에 머문다 — rejectRemote가 상세·목록 쿼리를 무효화해 서버 재조회로 상태·버튼이 바뀐다.
        setPendingAction(null)
        onStatusUpdated()
        showAlert({
          title: UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_TITLE,
          content: UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_CONTENT,
        })
      } catch (error) {
        showAlert({
          title: '안내',
          content: readApiErrorAlertMessage(error, '신청기관 반려 처리에 실패했습니다.'),
        })
      } finally {
        setActionLoading(false)
      }
    })()
  }

  const closeTempModal = useCallback(() => {
    if (actionLoading) return
    setPendingTempKind(null)
  }, [actionLoading])

  /** 건별 실패(HTTP 200 failures[]) — 서버 message 그대로. 재조회로 최신 상태를 맞춘다 */
  const showTemporaryAssignmentFailure = useCallback(
    (response: TemporaryAssignmentBulkResponse, fallback: string) => {
      const lines = buildTemporaryAssignmentFailureLines(response.failures, { fallback })
      showAlert({ title: '안내', content: lines.length > 0 ? lines.join('\n') : fallback })
      void invalidate()
    },
    [invalidate, showAlert]
  )

  const handleTempActionConfirm = useCallback(async () => {
    if (!pendingTempKind || !row) return
    if (pendingTempKind === 'temp_assign' && row.tempAssignmentStatus !== 'evaluation_pending') {
      // 일정 저장 이후(기관 수정 요청 등) 주 버튼은 기존대로 「신청 기관 임시 배정」 탭에서 일정을 고친다.
      setPendingTempKind(null)
      onOpenScheduleAssign?.()
      return
    }
    // 완료 팝업은 상세 위에 띄우고 상세에 머문다(시안 06-2 → 07). 각 remote 호출이 상세 쿼리를
    // 무효화하므로 서버 재조회 결과로 임시 배정 현황·버튼이 바뀐다.
    setActionLoading(true)
    try {
      if (pendingTempKind === 'temp_assign') {
        // 평가 대기 → 임시 배정(일정 미배정). 일정 탭으로 이동하지 않는다(시안 09-1 → 09-2 → 10).
        const response = await tempAssignRemote()
        setPendingTempKind(null)
        if (response.successCount < 1) {
          showTemporaryAssignmentFailure(response, '임시 배정에 실패했습니다.')
          return
        }
        onStatusUpdated()
        // 팝업을 닫으면 상세를 다시 조회한다 — processed로 맞춘 캐시를 서버 값으로 덮어쓴다.
        const refetchDetail = () => {
          void invalidate()
        }
        showAlert({
          title: UJAT_INSTITUTION_TEMP_ASSIGN_COMPLETE_TITLE,
          content: UJAT_INSTITUTION_TEMP_ASSIGN_COMPLETE_CONTENT,
          onConfirm: refetchDetail,
          onDismiss: refetchDetail,
        })
        return
      }
      if (pendingTempKind === 'temp_reject_cancel') {
        await tempRejectCancelRemote()
        setPendingTempKind(null)
        onStatusUpdated()
        showAlert({
          title: UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_TITLE,
          content: UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_CONTENT,
        })
        return
      }
      if (pendingTempKind === 'temp_reject') {
        await tempRejectRemote()
        setPendingTempKind(null)
        onStatusUpdated()
        showAlert({
          title: UJAT_INSTITUTION_TEMP_REJECT_DETAIL_COMPLETE_TITLE,
          content: UJAT_INSTITUTION_TEMP_REJECT_DETAIL_COMPLETE_CONTENT,
        })
        return
      }
      if (pendingTempKind === 'temp_assign_cancel' && row.temporaryScheduleAssigned === false) {
        // 일정 없는 임시 배정 → 평가 대기: POST temporary-assignments:cancel
        // (temporary-rejections:cancel은 TEMP_REJECTED 전용이라 쓰지 않는다)
        const response = await tempAssignCancelRemote()
        setPendingTempKind(null)
        if (response.successCount < 1) {
          showTemporaryAssignmentFailure(response, '임시 배정 취소에 실패했습니다.')
          return
        }
        onStatusUpdated()
        showAlert({
          title: UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_TITLE,
          content: UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_CONTENT,
        })
        return
      }
      if (pendingTempKind === 'temp_assign_cancel') {
        // 활성 교육일 슬롯이 있는 임시 배정의 일정 해제 — 기존 PUT temporary-schedule { slots: [] }
        if (!programId) {
          showAlert({ title: '안내', content: '프로그램 정보가 없어 임시 배정을 취소할 수 없습니다.' })
          return
        }
        const results = await releaseUjatTemporarySchedules(String(programId), [
          { id: row.id, name: row.institutionName },
        ])
        const failed = results.find(item => !item.ok)
        if (failed) {
          showAlert({
            title: '안내',
            content: failed.message ?? '임시 배정 취소에 실패했습니다.',
          })
          return
        }
        await invalidate()
        setPendingTempKind(null)
        onStatusUpdated()
        showAlert({
          title: UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_TITLE,
          content: UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_CONTENT,
        })
      }
    } catch (error) {
      showAlert({
        title: '안내',
        content: readApiErrorAlertMessage(error, '임시 처리에 실패했습니다.'),
      })
    } finally {
      setActionLoading(false)
    }
  }, [
    invalidate,
    onOpenScheduleAssign,
    onStatusUpdated,
    pendingTempKind,
    programId,
    row,
    showAlert,
    showTemporaryAssignmentFailure,
    tempAssignCancelRemote,
    tempAssignRemote,
    tempRejectCancelRemote,
    tempRejectRemote,
  ])

  if (loading) {
    return (
      <div className="page-content-loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  if (!row || !detail) {
    return (
      <div className="ujat-institution-application-detail-page">
        <p>신청 기관 정보를 찾을 수 없습니다.</p>
        <CmsButton type="button" variant="secondary" size="large" onClick={onBack}>
          목록으로
        </CmsButton>
      </div>
    )
  }

  return (
    <div className="ujat-institution-application-detail-page">
      <div className="ujat-institution-application-detail-page__actions">
        <Space size={8} wrap>
          <>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            loading={actionLoading}
            onClick={() => setPendingAction('application_reject')} >
            신청 반려
          </CmsButton>
          {row.tempAssignmentStatus === 'evaluation_pending' ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              loading={actionLoading}
              onClick={() => setPendingTempKind('temp_reject')} >
              임시 반려
            </CmsButton>
          ) : null}
          {row.tempAssignmentStatus === 'temp_assigned' ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              loading={actionLoading}
              onClick={() => setPendingTempKind('temp_assign_cancel')} >
              임시 배정 취소
            </CmsButton>
          ) : null}
          {row.tempAssignmentStatus === 'temp_rejected' ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              loading={actionLoading}
              onClick={() => setPendingTempKind('temp_reject_cancel')} >
              임시 반려 취소
            </CmsButton>
          ) : null}
          {row.tempAssignmentStatus === 'evaluation_pending' ||
          workflow.primaryAction === 'final_approve' ||
          workflow.primaryAction === 'open_schedule_assign' ? (
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              loading={actionLoading}
              disabled={!workflowReady || workflow.primaryDisabled}
              onClick={handlePrimaryAction} >
              {workflow.primaryAction === 'open_schedule_assign' ? '임시 배정' : workflow.primaryLabel}
            </CmsButton>
          ) : null}
          </>
          <PersonalInfoRevealButton disabled={programPrivacyPending}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            onClick={openPersonalInfoRevealConfirm} />
        </Space>
      </div>

      <UjatInstitutionApplicationDetailView
        detail={detail}
        personalInfoRevealed={personalInfoRevealed}
      />
      {confirmModal}
      {pendingAction ? (
        <UjatInstitutionApplicationActionModal
          open
          action={pendingAction}
          variant="single"
          institutionName={row.institutionName}
          selectionCount={1}
          confirmLoading={actionLoading}
          onCancel={() => setPendingAction(null)}
          onConfirm={handleActionConfirm}
        />
      ) : null}
      {pendingTempKind ? (
        <TemporaryActionModal
          open
          kind={pendingTempKind}
          institutionNames={[row.institutionName]}
          loading={actionLoading}
          onCancel={closeTempModal}
          onConfirm={handleTempActionConfirm}
        />
      ) : null}
    </div>
  )
}
