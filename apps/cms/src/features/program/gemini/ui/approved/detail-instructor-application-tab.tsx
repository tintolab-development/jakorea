import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { Key } from 'react'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useCmsAlert,
  FilterTableToolbarButton
} from '@/shared/ui'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  useApproveGeminiInstructorApplicationMutation,
  useGeminiApprovedInstructorApplicationsQuery,
  useRejectGeminiInstructorApplicationMutation,
  useResendGeminiInstructorApplicationNotificationMutation,
} from '../../api/visiting-training/hooks'
import { SendNotiButton } from '@/features/program/shared/ui/detail-modal/components/send-noti-button'
import { ApplicantNotificationResendModal } from '@/features/program/shared/ui/detail-modal/components/applicant-notification-resend-modal'
import { toApplicantNotificationResendNotifyOptions } from '@/features/program/general/lib/applicant-notification-resend'
import { toInstructorApplicationNotificationRequest } from '@/features/program/general/lib/instructor-application-notification'
import { showNotificationResendRequestCompletedAlert } from '@/shared/ui'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import {
  buildGeminiInstructorApproveMessageLines,
  buildGeminiInstructorChangeMessageLines,
} from '../../lib/approved/instructor-approve-messages'
import { GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS } from '../../model/approved/instructor-application-filter-fields'
import type {
  GeminiInstructorApplicationApprovalStatus,
  GeminiInstructorApplicationRow,
} from '../../model/approved/instructor-application-types'
import './detail-instructor-application-tab.css'

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
  instructorName: 120,
  homeRegion: 170,
  experience: 120,
  grade: 120,
  contact: 140,
  email: 180,
  monthlyAssignment: 130,
  approvalStatus: 280,
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
  COL.approvalStatus +
  48

function approvalStatusText(status: GeminiInstructorApplicationApprovalStatus) {
  const base = 'gemini-approved-instructor-application-tab__approval'
  const modifier =
    status === 'PENDING'
      ? `${base}--pending`
      : status === 'APPROVED'
        ? `${base}--approved`
        : `${base}--rejected`
  return <span className={`${base} ${modifier}`}>{APPROVAL_STATUS_LABEL[status]}</span>
}

function toInstructorResendApprovalStatus(
  status: GeminiInstructorApplicationApprovalStatus
): 'approved' | 'rejected' | null {
  if (status === 'APPROVED') return 'approved'
  if (status === 'REJECTED') return 'rejected'
  return null
}

function toHomeRegionText(row: GeminiInstructorApplicationRow): string {
  return `${row.homeSido} ${row.homeSigungu}`.trim()
}

export function GeminiApprovedTrainingDetailInstructorApplicationTab({
  approvedTrainingId,
}: {
  approvedTrainingId: string
}) {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [confirmModal, setConfirmModal] = useState<
    { mode: 'approve'; target: GeminiInstructorApplicationRow } | { mode: 'change' } | null
  >(null)
  const [notificationResendTarget, setNotificationResendTarget] =
    useState<GeminiInstructorApplicationRow | null>(null)

  const listQuery = useGeminiApprovedInstructorApplicationsQuery(approvedTrainingId, {
    instructorName: appliedFilters.instructorName,
    homeSido: appliedFilters.homeSido,
    homeSigungu: appliedFilters.homeSigungu,
    experienceYears: appliedFilters.experienceYears,
    grade: appliedFilters.grade,
    approvalStatus: appliedFilters.approvalStatus,
  })
  const approveMutation = useApproveGeminiInstructorApplicationMutation(approvedTrainingId)
  const rejectMutation = useRejectGeminiInstructorApplicationMutation(approvedTrainingId)
  const resendNotificationMutation =
    useResendGeminiInstructorApplicationNotificationMutation(approvedTrainingId)

  const rows = useMemo(
    () => listQuery.data?.pages.flatMap(page => page.rows) ?? [],
    [listQuery.data]
  )
  const totalElements = listQuery.data?.pages[0]?.totalElements ?? rows.length

  useEffect(() => {
    setSelectedRowKeys([])
    setPendingFilters(INITIAL_PENDING_FILTERS)
    setAppliedFilters(INITIAL_PENDING_FILTERS)
  }, [approvedTrainingId])

  const approveButtonLabel = useMemo(() => {
    if (selectedRowKeys.length !== 1) return '선택 승인'
    const selected = rows.find(row => row.id === String(selectedRowKeys[0]))
    return selected?.approvalStatus === 'APPROVED' ? '강사 변경' : '선택 승인'
  }, [rows, selectedRowKeys])

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
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
    if (target.approvalStatus === 'APPROVED') {
      setConfirmModal({ mode: 'change' })
      return
    }
    if (target.approvalStatus !== 'PENDING') {
      showAlert({
        title: '안내',
        content:
          '신청 반려된 강사는 선택 승인할 수 없습니다.\n승인 대기 상태의 강사를 선택해 주세요.',
      })
      return
    }
    setConfirmModal({ mode: 'approve', target })
  }, [canWrite, rows, selectedRowKeys, showAlert, showNoSelectionAlert])

  const handleConfirmModalOk = useCallback(async () => {
    if (!confirmModal) return
    try {
      if (confirmModal.mode === 'approve') {
        await approveMutation.mutateAsync(confirmModal.target.id)
        showAlert({
          title: '승인 완료',
          content: '승인되었습니다.',
        })
      } else {
        const approved = rows.filter(row => row.approvalStatus === 'APPROVED')
        for (const row of approved) {
          await rejectMutation.mutateAsync({
            applicationId: row.id,
            reason: '강사 변경',
          })
        }
        showAlert({
          title: '강사 변경',
          content: '기존 승인 강사를 대기 상태로 되돌렸습니다. 새 강사를 선택해 승인해 주세요.',
        })
      }
      setSelectedRowKeys([])
      setConfirmModal(null)
    } catch {
      showAlert({
        title: '처리 실패',
        content: '강사 승인·변경에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    }
  }, [approveMutation, confirmModal, rejectMutation, rows, showAlert])

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
        render: (years: number) => `${years}년`,
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
        title: '배정횟수(월별)',
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
        render: (_: unknown, row: GeminiInstructorApplicationRow) => {
          const resendStatus = toInstructorResendApprovalStatus(row.approvalStatus)
          return (
            <div className="applicant-institution-basic-info__approval-status-row">
              {approvalStatusText(row.approvalStatus)}
              {canWrite && resendStatus ? (
                <>
                  <span
                    className="applicant-institution-basic-info__approval-status-vbar"
                    aria-hidden
                  />
                  <SendNotiButton
                    mode="resend"
                    onClick={() => setNotificationResendTarget(row)}
                  />
                </>
              ) : null}
            </div>
          )
        },
      },
    ],
    [canWrite]
  )

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
          canWrite ? (
            <FilterTableToolbarButton
              variant="secondary"
              onClick={handleBulkApprove} >
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
          rowSelection={
            canWrite
              ? {
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

      <DeleteGuideModal
        open={confirmModal != null}
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          void handleConfirmModalOk()
        }}
        title={confirmModal?.mode === 'change' ? '강사 변경' : '강사 승인 안내'}
        lines={
          confirmModal?.mode === 'change'
            ? buildGeminiInstructorChangeMessageLines()
            : confirmModal?.mode === 'approve'
              ? buildGeminiInstructorApproveMessageLines(confirmModal.target.instructorName)
              : []
        }
        confirmText={confirmModal?.mode === 'change' ? '변경' : '승인'}
        confirmVariant="primary"
        zIndex={2600}
      />
      <ApplicantNotificationResendModal
        open={notificationResendTarget != null}
        subjectKind="instructor"
        subjectName={notificationResendTarget?.instructorName ?? ''}
        approvalStatus={
          notificationResendTarget?.approvalStatus === 'REJECTED' ? 'rejected' : 'approved'
        }
        confirmLoading={resendNotificationMutation.isPending}
        zIndex={2700}
        onCancel={() => {
          if (resendNotificationMutation.isPending) return
          setNotificationResendTarget(null)
        }}
        onConfirm={payload => {
          if (!notificationResendTarget || resendNotificationMutation.isPending) return
          if (
            payload.notifyTiming === 'manual' &&
            (!payload.manualNotifyAt || !payload.manualNotifyAt.isAfter(new Date()))
          ) {
            void showAlert({
              title: '예약 발송 일시 확인',
              content: '예약 발송 일시는 현재 시각보다 이후로 설정해 주세요.',
            })
            return
          }
          const notifyOptions = toApplicantNotificationResendNotifyOptions(payload)
          const notification = toInstructorApplicationNotificationRequest(
            notifyOptions.notifyTiming,
            notifyOptions.manualNotifyAt
          )
          void resendNotificationMutation
            .mutateAsync({
              applicationId: notificationResendTarget.id,
              payload: {
                timing: notification.timing === 'SCHEDULED' ? 'SCHEDULED' : 'IMMEDIATE',
                scheduledAt: notification.scheduledAt ?? null,
              },
            })
            .then(() => {
              setNotificationResendTarget(null)
              showNotificationResendRequestCompletedAlert()
            })
            .catch(() => {
              showAlert({
                title: '알림 재발송 실패',
                content: '알림 재발송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
              })
            })
        }}
      />
    </>
  )
}
