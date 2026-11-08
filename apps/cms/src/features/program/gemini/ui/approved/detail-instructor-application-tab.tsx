import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { Key } from 'react'
import { Spin } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { getGeneralProgramApiErrorCode } from '@/features/program/general/api/get-general-program-api-error'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { ApplicantsDetailContents } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-contents'
import type { ApplicantInstructorApplicationInfoData } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-application-info'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { Program } from '@/types/domain'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { FilterTableToolbarButton, useCmsAlert } from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { formatGeminiApiError } from '../../lib/gemini-api-error'
import {
  useApproveGeminiInstructorApplicationMutation,
  useGeminiApprovedInstructorApplicationsQuery,
  useResendGeminiInstructorApplicationNotificationMutation,
} from '../../api/visiting-training/hooks'
import { geminiVisitingTrainingQueryKeys } from '../../api/visiting-training/query-keys'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import { resolveGeminiInstructorApprovalAction } from '../../lib/approved/instructor-approval-action'
import { GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS } from '../../model/approved/instructor-application-filter-fields'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import type {
  GeminiInstructorApplicationApprovalStatus,
  GeminiInstructorApplicationRow,
} from '../../model/approved/instructor-application-types'
import { GeminiInstructorApprovalModal } from './instructor-approval-modal'
import './detail-instructor-application-tab.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

type PendingFilters = {
  instructorName: string
  homeSido: string
  homeSigungu: string
  experienceYears: string
  grade: string
  approvalStatus: GeminiInstructorApplicationApprovalStatus | 'ALL'
}

const APPROVAL_STATUS_LABEL: Record<GeminiInstructorApplicationApprovalStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인 완료',
  REJECTED: '신청 반려',
  UNKNOWN: '상태 확인 필요',
}

const INITIAL_PENDING_FILTERS: PendingFilters = {
  instructorName: '',
  homeSido: '',
  homeSigungu: '',
  experienceYears: 'ALL',
  grade: 'ALL',
  approvalStatus: 'ALL',
}

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  instructorName: 140,
  homeRegion: 220,
  experience: 140,
  grade: 140,
  contact: 220,
  email: 220,
  monthlyAssignment: 140,
  approvalStatus: 160,
} as const

const TABLE_SCROLL_X =
  TABLE_COLUMN_WIDTHS.checkbox +
  COL.no +
  COL.instructorName +
  COL.homeRegion +
  COL.experience +
  COL.grade +
  COL.contact +
  COL.email +
  COL.monthlyAssignment +
  COL.approvalStatus

function approvalStatusText(status: GeminiInstructorApplicationApprovalStatus) {
  const base = 'gemini-approved-instructor-application-tab__approval'
  const modifier =
    status === 'PENDING'
      ? `${base}--pending`
      : status === 'APPROVED'
        ? `${base}--approved`
        : status === 'REJECTED'
          ? `${base}--rejected`
          : `${base}--unknown`
  return <span className={`${base} ${modifier}`}>{APPROVAL_STATUS_LABEL[status]}</span>
}

function toHomeRegionText(row: GeminiInstructorApplicationRow): string {
  return `${row.homeSido} ${row.homeSigungu}`.trim()
}

function canApprove(availableActions?: string[]): boolean {
  return availableActions?.includes('APPROVE') === true
}

function canResendNotification(availableActions?: string[]): boolean {
  return availableActions?.includes('RESEND_NOTIFICATION') === true
}

function resolveApplicationDetailErrorMessage(error: unknown): string {
  const code = getGeneralProgramApiErrorCode(error)
  const status = getApiErrorHttpStatus(error)
  if (status === 403) return '강사 신청 상세를 조회할 권한이 없습니다.'
  if (code === 'GEMINI_APPROVED_TRAINING_NOT_FOUND') {
    return '승인 연수 정보를 찾을 수 없습니다.'
  }
  if (code === 'GEMINI_INSTRUCTOR_APPLICATION_NOT_FOUND') {
    return '강사 신청 정보를 찾을 수 없습니다.'
  }
  if (status === 409 || code === 'APPLICATION_TRAINING_MISMATCH') {
    return '해당 승인 연수에 속하지 않는 강사 신청입니다. 목록을 다시 확인해 주세요.'
  }
  return '강사 신청 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export function GeminiApprovedTrainingDetailInstructorApplicationTab({
  approvedTrainingId,
  trainingDetail,
  selectedApplicationId = null,
  selectedApplicationDetail = null,
  selectedApplicationDetailLoading = false,
  selectedApplicationDetailError,
  onOpenApplicationDetail,
  onCloseApplicationDetail,
}: {
  approvedTrainingId: string
  trainingDetail: GeminiApprovedTrainingDetail
  selectedApplicationId?: string | null
  selectedApplicationDetail?: ApplicantInstructorRow | null
  selectedApplicationDetailLoading?: boolean
  selectedApplicationDetailError?: unknown
  onOpenApplicationDetail?: (applicationId: string) => void
  onCloseApplicationDetail?: () => void
}) {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [confirmModal, setConfirmModal] = useState<{
    mode: 'approve' | 'change'
    target: GeminiInstructorApplicationRow
  } | null>(null)
  const handledDetailErrorRef = useRef<string | null>(null)

  const listQuery = useGeminiApprovedInstructorApplicationsQuery(
    approvedTrainingId,
    {
      instructorName: appliedFilters.instructorName,
      homeSido: appliedFilters.homeSido,
      homeSigungu: appliedFilters.homeSigungu,
      experienceYears: appliedFilters.experienceYears,
      grade: appliedFilters.grade,
      approvalStatus: appliedFilters.approvalStatus,
    },
    !selectedApplicationId
  )
  const approveMutation = useApproveGeminiInstructorApplicationMutation(approvedTrainingId)
  const resendNotificationMutation =
    useResendGeminiInstructorApplicationNotificationMutation(approvedTrainingId)

  const rows = useMemo(
    () => listQuery.data?.pages.flatMap(page => page.rows) ?? [],
    [listQuery.data]
  )
  const totalElements = listQuery.data?.pages[0]?.totalElements ?? rows.length
  const hasApprovedInstructor = trainingDetail.instructorAssigned
  const selectedRow =
    selectedRowKeys.length === 1
      ? rows.find(row => row.id === String(selectedRowKeys[0]))
      : undefined
  const selectedRowCanApprove = canApprove(selectedRow?.availableActions)

  useEffect(() => {
    setSelectedRowKeys([])
    setPendingFilters(INITIAL_PENDING_FILTERS)
    setAppliedFilters(INITIAL_PENDING_FILTERS)
  }, [approvedTrainingId])

  useEffect(() => {
    if (!selectedApplicationId || !selectedApplicationDetailError || !onCloseApplicationDetail) {
      handledDetailErrorRef.current = null
      return
    }
    const code = getGeneralProgramApiErrorCode(selectedApplicationDetailError)
    const status = getApiErrorHttpStatus(selectedApplicationDetailError)
    if (
      status !== 404 &&
      status !== 409 &&
      code !== 'GEMINI_APPROVED_TRAINING_NOT_FOUND' &&
      code !== 'GEMINI_INSTRUCTOR_APPLICATION_NOT_FOUND' &&
      code !== 'APPLICATION_TRAINING_MISMATCH'
    ) {
      return
    }
    const errorKey = `${selectedApplicationId}:${status ?? ''}:${code ?? ''}`
    if (handledDetailErrorRef.current === errorKey) return
    handledDetailErrorRef.current = errorKey

    const message = resolveApplicationDetailErrorMessage(selectedApplicationDetailError)
    showAlert({
      title:
        status === 409 || code === 'APPLICATION_TRAINING_MISMATCH'
          ? '강사 신청 변경 안내'
          : '강사 신청 조회 안내',
      content: message,
    })
    void queryClient
      .invalidateQueries({
        queryKey: geminiVisitingTrainingQueryKeys.approvedInstructorApplications(
          approvedTrainingId
        ),
        refetchType: 'none',
      })
      .finally(onCloseApplicationDetail)
  }, [
    approvedTrainingId,
    onCloseApplicationDetail,
    queryClient,
    selectedApplicationDetailError,
    selectedApplicationId,
    showAlert,
  ])

  const approveButtonLabel = useMemo(() => {
    if (hasApprovedInstructor) return '강사 변경'
    if (selectedRowKeys.length !== 1) return '선택 승인'
    const selected = rows.find(row => row.id === String(selectedRowKeys[0]))
    if (!selected) return '선택 승인'
    const action = resolveGeminiInstructorApprovalAction({
      approvalStatus: selected.approvalStatus,
      instructorAssigned: hasApprovedInstructor,
    })
    return action === 'change' ? '강사 변경' : '선택 승인'
  }, [hasApprovedInstructor, rows, selectedRowKeys])

  const showNoSelectionAlert = useCallback(() => {
    showAlert(NO_SELECTION_ALERT)
  }, [showAlert])

  const handleBulkApprove = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    const assigneeId = String(selectedRowKeys[0])
    const target = rows.find(row => row.id === assigneeId)
    if (!target) return
    if (!canApprove(target.availableActions)) {
      showAlert({
        title: '승인 불가 안내',
        content: '현재 신청 상태에서는 승인할 수 없습니다. 최신 상태를 확인해 주세요.',
      })
      return
    }
    if (target.approvalStatus === 'APPROVED') {
      showAlert({
        title: '안내',
        content: '현재 승인된 강사입니다. 변경할 다른 강사를 선택해 주세요.',
      })
      return
    }
    const action = resolveGeminiInstructorApprovalAction({
      approvalStatus: target.approvalStatus,
      instructorAssigned: hasApprovedInstructor,
    })
    if (action === 'invalid') {
      showAlert({
        title: '안내',
        content:
          '신청 반려된 강사는 선택 승인할 수 없습니다.\n승인 대기 상태의 강사를 선택해 주세요.',
      })
      return
    }
    setConfirmModal({ mode: action, target })
  }, [canWrite, hasApprovedInstructor, rows, selectedRowKeys, showAlert, showNoSelectionAlert])

  const handleConfirmModalOk = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!confirmModal) return
      try {
        await approveMutation.mutateAsync({
          applicationId: confirmModal.target.id,
          timing: payload.notifyTiming === 'manual' ? 'SCHEDULED' : 'IMMEDIATE',
          scheduledAt:
            payload.notifyTiming === 'manual'
              ? (payload.manualNotifyAt?.toISOString() ?? null)
              : null,
        })
        if (confirmModal.mode === 'approve') {
          showAlert({
            title: '승인 완료',
            content: '승인되었습니다.',
          })
        } else {
          showAlert({
            title: '강사 변경 완료',
            content: '강사가 변경되었습니다.',
          })
        }
        setSelectedRowKeys([])
        setConfirmModal(null)
      } catch (error) {
        showAlert({
          title: '처리 실패',
          content: formatGeminiApiError(
            error,
            '강사 승인·변경에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          ),
        })
      }
    },
    [approveMutation, confirmModal, showAlert]
  )

  const createDetailTarget = useCallback(
    (detailRow: ApplicantInstructorRow): GeminiInstructorApplicationRow => ({
      id: detailRow.id,
      approvedTrainingId,
      no: detailRow.no,
      instructorName: detailRow.instructorName,
      homeSido: '',
      homeSigungu: '',
      experienceYears: detailRow.lectureExperienceYears,
      grade: detailRow.evaluationGrade ?? '-',
      contact: detailRow.contact,
      email: detailRow.email,
      monthlyAssignmentCount: 0,
      approvalStatus:
        detailRow.approvalStatus === 'approved'
          ? 'APPROVED'
          : detailRow.approvalStatus === 'rejected'
            ? 'REJECTED'
            : detailRow.approvalStatus === 'pending'
              ? 'PENDING'
              : 'UNKNOWN',
      availableActions: detailRow.availableActions ?? [],
    }),
    [approvedTrainingId]
  )

  const handleDetailApprove = useCallback(
    (applicationId: string) => {
      if (!canWrite || !selectedApplicationDetail) return
      const target =
        rows.find(row => row.id === applicationId) ?? createDetailTarget(selectedApplicationDetail)
      if (!canApprove(target.availableActions)) {
        showAlert({
          title: '승인 불가 안내',
          content: '현재 신청 상태에서는 승인할 수 없습니다. 최신 상태를 확인해 주세요.',
        })
        return
      }
      const action = resolveGeminiInstructorApprovalAction({
        approvalStatus: target.approvalStatus,
        instructorAssigned: hasApprovedInstructor,
      })
      if (action === 'invalid') {
        showAlert({
          title: '안내',
          content:
            target.approvalStatus === 'APPROVED'
              ? '현재 승인된 강사입니다. 변경할 다른 강사를 선택해 주세요.'
              : '신청 반려된 강사는 선택 승인할 수 없습니다.\\n승인 대기 상태의 강사를 선택해 주세요.',
        })
        return
      }
      setConfirmModal({ mode: action, target })
    },
    [
      canWrite,
      createDetailTarget,
      hasApprovedInstructor,
      rows,
      selectedApplicationDetail,
      showAlert,
    ]
  )

  const handleResendNotification = useCallback(async () => {
    if (!canWrite || !selectedApplicationDetail || resendNotificationMutation.isPending) return
    if (!canResendNotification(selectedApplicationDetail.availableActions)) {
      showAlert({
        title: '재발송 불가 안내',
        content: '현재 신청 상태에서는 알림을 재발송할 수 없습니다. 최신 상태를 확인해 주세요.',
      })
      return
    }

    try {
      await resendNotificationMutation.mutateAsync({
        applicationId: selectedApplicationDetail.id,
        payload: { timing: 'IMMEDIATE', scheduledAt: null },
      })
      showAlert({
        title: '알림 재발송 완료',
        content: '승인 알림을 재발송했습니다.',
      })
    } catch (error) {
      showAlert({
        title: '알림 재발송 실패',
        content: formatGeminiApiError(error, '알림을 재발송하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
      })
    }
  }, [canWrite, resendNotificationMutation, selectedApplicationDetail, showAlert])

  const approvalModal = (
    <GeminiInstructorApprovalModal
      open={confirmModal != null}
      mode={confirmModal?.mode ?? 'approve'}
      instructorName={confirmModal?.target.instructorName ?? ''}
      trainingDetail={trainingDetail}
      onCancel={() => setConfirmModal(null)}
      onConfirm={payload => {
        void handleConfirmModalOk(payload)
      }}
      confirmLoading={approveMutation.isPending}
      zIndex={2600}
    />
  )

  const columns = useMemo<ColumnsType<GeminiInstructorApplicationRow>>(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: COL.no,
        align: 'center',
      },
      {
        title: '신청 강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: COL.instructorName,
        align: 'center',
      },
      {
        title: '자택 주소지',
        key: 'homeRegion',
        width: COL.homeRegion,
        align: 'center',
        render: (_: unknown, row) => toHomeRegionText(row),
      },
      {
        title: 'JA 강의 경력',
        dataIndex: 'experienceYears',
        key: 'experienceYears',
        width: COL.experience,
        align: 'center',
        render: (years: number | null) => (years == null ? '-' : `${years}년`),
      },
      {
        title: 'JA 평가 등급',
        dataIndex: 'grade',
        key: 'grade',
        width: COL.grade,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: COL.contact,
        align: 'center',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: COL.email,
        align: 'center',
      },
      {
        title: '배정횟수(연도별)',
        dataIndex: 'monthlyAssignmentCount',
        key: 'monthlyAssignmentCount',
        width: COL.monthlyAssignment,
        align: 'center',
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: COL.approvalStatus,
        align: 'center',
        render: (_: unknown, row: GeminiInstructorApplicationRow) =>
          approvalStatusText(row.approvalStatus),
      },
    ],
    []
  )

  if (selectedApplicationId) {
    if (selectedApplicationDetailLoading) {
      return (
        <>
          <div className="gemini-approved-instructor-application-tab__detail-loading" role="status">
            <Spin size="large" />
          </div>
          {approvalModal}
        </>
      )
    }
    if (selectedApplicationDetailError || !selectedApplicationDetail) {
      return (
        <>
          <div className="gemini-approved-instructor-application-tab__detail-error" role="alert">
            {resolveApplicationDetailErrorMessage(selectedApplicationDetailError)}
            {onCloseApplicationDetail ? (
              <button type="button" onClick={onCloseApplicationDetail}>
                강사 신청 목록으로
              </button>
            ) : null}
          </div>
          {approvalModal}
        </>
      )
    }
    return (
      <>
        <ApplicantsDetailContents
          type="instructors"
          data={selectedApplicationDetail}
          detailVariant="legacy"
          program={trainingDetail.programId ? ({ id: trainingDetail.programId } as Program) : null}
          instructorApplicationInfo={
            {
              officialDocumentRequired: trainingDetail.officialDocumentRequired,
              officialDocumentRequiredInfo: trainingDetail.officialDocumentRequiredInfo,
              institutionName: trainingDetail.institutionName,
              trainingDate: trainingDetail.trainingDate,
              trainingTimeText: trainingDetail.trainingTimeText,
            } satisfies ApplicantInstructorApplicationInfoData
          }
          instructorResumeLayout="application"
          onBack={onCloseApplicationDetail ?? (() => undefined)}
          onApprove={handleDetailApprove}
          onReject={() => undefined}
          onResendNotification={
            canWrite && canResendNotification(selectedApplicationDetail.availableActions)
              ? () => void handleResendNotification()
              : undefined
          }
          hidePendingRejectAction
        />
        {approvalModal}
      </>
    )
  }

  return (
    <>
      <FilterTableLayout
        bordered={false}
        fields={GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          if (key === 'homeSido') {
            setPendingFilters(prev => ({
              ...prev,
              homeSido: value == null ? '' : String(value),
              homeSigungu: '',
            }))
            return
          }
          if (key === 'homeSigungu') {
            setPendingFilters(prev => ({
              ...prev,
              homeSigungu: value == null ? '' : String(value),
            }))
            return
          }
          if (key === 'experienceYears') {
            setPendingFilters(prev => ({
              ...prev,
              experienceYears: value == null ? 'ALL' : String(value),
            }))
            return
          }
          if (key === 'grade') {
            setPendingFilters(prev => ({
              ...prev,
              grade: value == null ? 'ALL' : String(value),
            }))
            return
          }
          if (key === 'approvalStatus') {
            setPendingFilters(prev => ({
              ...prev,
              approvalStatus: (value == null
                ? 'ALL'
                : String(value)) as PendingFilters['approvalStatus'],
            }))
            return
          }
          setPendingFilters(prev => ({
            ...prev,
            [key]: value == null ? '' : String(value),
          }))
        }}
        onSearch={() => setAppliedFilters(pendingFilters)}
        title="교육 신청 강사 목록"
        description={`총 ${totalElements.toLocaleString()}건`}
        actions={
          canWrite && (selectedRowKeys.length === 0 || selectedRowCanApprove) ? (
            <FilterTableToolbarButton variant="secondary" onClick={handleBulkApprove}>
              {approveButtonLabel}
            </FilterTableToolbarButton>
          ) : null
        }
        excelExport={{
          columns,
          data: rows,
          selectedRowKeys: canWrite ? selectedRowKeys : undefined,
          getRowKey: row => row.id,
        }}
      >
        <CmsDataTable<GeminiInstructorApplicationRow>
          rowKey="id"
          className="cms-data-table"
          tableLayout="fixed"
          scroll={{ x: TABLE_SCROLL_X }}
          columns={columns}
          dataSource={rows}
          loading={listQuery.isPending}
          pagination={false}
          onRow={record => ({
            onClick: event => {
              const target = event.target as HTMLElement
              if (
                target.closest('.ant-table-selection-column') ||
                target.closest('.ant-checkbox-wrapper')
              ) {
                return
              }
              onOpenApplicationDetail?.(record.id)
            },
            style: { cursor: onOpenApplicationDetail ? 'pointer' : undefined },
          })}
          rowSelection={
            canWrite
              ? {
                  columnTitle: '선택',
                  type: 'radio',
                  columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys.slice(0, 1).map(k => String(k))),
                  preserveSelectedRowKeys: false,
                }
              : undefined
          }
        />
      </FilterTableLayout>

      {approvalModal}
    </>
  )
}
