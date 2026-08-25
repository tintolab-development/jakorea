/**
 * 과제·설문 제출 내역 모달
 * 학교 상세 > 학생 명단, 회원 상세 등에서 "내역 보기" 시 노출
 */

import { useCallback, useMemo, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { AssignmentPreviewModal } from './assignment-preview-modal'
import type { Application } from '@/types/domain'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import {
  type AssignmentSubmissionDetail,
  type AssignmentSubmissionTableRow,
  type AssignmentTeamRoleKey,
} from '../model/school-detail-types'
import {
  getAssignmentSubmissionDetail,
  getAssignmentSubmissionDetailForApplication,
  updateAssignmentSubmissionTeamRole,
} from '../lib/school-detail-mock'
import { downloadFormSubmissionFileRemote } from '@/features/user/api/member-program-history-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  AssignmentSubmissionHistoryTable,
  mapAssignmentSubmissionRowsWithNo,
  useAssignmentSubmissionHistoryColumns,
} from './assignment-submission-history-table'
import './assignment-submission-modal.css'

export interface AssignmentSubmissionModalProps {
  open: boolean
  onCancel: () => void
  programTitle?: string
  student?: SchoolDetailStudentRow | null
  schoolId?: string
  application?: Application | null
  userName?: string
  /** remote API 상세 — 지정 시 mock 미사용 */
  remoteDetail?: AssignmentSubmissionDetail | null
  remoteDetailLoading?: boolean
  onBulkDownload?: () => void | Promise<void>
  bulkDownloadLoading?: boolean
}

const DEFAULT_PROGRAM_TITLE = '프로그램'

export function AssignmentSubmissionModal({
  open,
  onCancel,
  programTitle = DEFAULT_PROGRAM_TITLE,
  student = null,
  schoolId = '',
  application = null,
  userName = '',
  remoteDetail = undefined,
  remoteDetailLoading = false,
  onBulkDownload,
  bulkDownloadLoading = false,
}: AssignmentSubmissionModalProps) {
  const { showAlert } = useCmsAlert()
  const isRemoteDetail = remoteDetail !== undefined
  const [assignmentRoleRevision, setAssignmentRoleRevision] = useState(0)
  const detail: AssignmentSubmissionDetail | null = useMemo(() => {
    if (remoteDetail !== undefined) return remoteDetail
    void assignmentRoleRevision
    if (!open) return null
    const title = programTitle.trim() || DEFAULT_PROGRAM_TITLE
    if (application && userName) {
      return getAssignmentSubmissionDetailForApplication(application, userName, title)
    }
    if (student && schoolId) {
      return getAssignmentSubmissionDetail(student, schoolId, title)
    }
    return null
  }, [open, student, schoolId, application, userName, programTitle, assignmentRoleRevision, remoteDetail])

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewRound, setPreviewRound] = useState<number>(1)
  const [previewFileIds, setPreviewFileIds] = useState<number[]>([])
  const [previewDownloading, setPreviewDownloading] = useState(false)
  const [openTeamRoleDropdownRowId, setOpenTeamRoleDropdownRowId] = useState<string | null>(null)

  const handleModalCancel = useCallback(() => {
    setOpenTeamRoleDropdownRowId(null)
    onCancel()
  }, [onCancel])

  const openPreview = useCallback((record: AssignmentSubmissionTableRow) => {
    setPreviewRound(record.roundNumber)
    setPreviewFileIds(record.submissionFileIds ?? [])
    setPreviewOpen(true)
  }, [])

  const handlePreviewDownload = useCallback(async () => {
    const fileId = previewFileIds[0]
    if (fileId == null) {
      showAlert({
        title: '안내',
        content: '다운로드할 과제 파일 정보가 없습니다.',
      })
      return
    }
    setPreviewDownloading(true)
    try {
      await downloadFormSubmissionFileRemote(fileId, `과제_${previewRound}회차`)
    } catch (error) {
      showAlert({
        title: '안내',
        content: getMemberApiErrorMessage(error, '과제 파일 다운로드에 실패했습니다.'),
      })
    } finally {
      setPreviewDownloading(false)
    }
  }, [previewFileIds, previewRound, showAlert])

  const handleAssignmentTeamRoleChange = useCallback(
    (rowId: string, newRole: AssignmentTeamRoleKey) => {
      updateAssignmentSubmissionTeamRole(rowId, newRole)
      setAssignmentRoleRevision(n => n + 1)
    },
    []
  )

  const handleTeamRoleDropdownOpenChange = useCallback((rowId: string, openDropdown: boolean) => {
    setOpenTeamRoleDropdownRowId(openDropdown ? rowId : null)
  }, [])

  const columns = useAssignmentSubmissionHistoryColumns({
    isRemoteDetail,
    openTeamRoleDropdownRowId,
    onTeamRoleDropdownOpenChange: handleTeamRoleDropdownOpenChange,
    onTeamRoleChange: handleAssignmentTeamRoleChange,
    onOpenPreview: openPreview,
  })

  const tableRows = useMemo(
    () => (detail?.rows ? mapAssignmentSubmissionRowsWithNo(detail.rows) : []),
    [detail?.rows]
  )

  const footer = (
    <>
      <CmsButton
        variant="secondary"
        size="medium"
        width={120}
        className="cms-button--footer-auto assignment-submission-modal__footer-btn assignment-submission-modal__footer-btn--close"
        onClick={handleModalCancel}
      >
        닫기
      </CmsButton>
      <CmsButton
        variant="primary"
        size="medium"
        width={160}
        className="cms-button--footer-auto assignment-submission-modal__footer-btn assignment-submission-modal__footer-btn--bulk"
        icon={<DownloadOutlined />}
        loading={bulkDownloadLoading}
        disabled={onBulkDownload == null}
        onClick={() => {
          if (onBulkDownload) void onBulkDownload()
        }}
      >
        과제 일괄 다운로드
      </CmsButton>
    </>
  )

  const headerDescription =
    detail != null
      ? `**[${detail.programTitle}]** 프로그램의 과제 및 설문 제출 내역입니다.`
      : undefined

  return (
    <>
      <ContentModal
        open={open}
        onCancel={handleModalCancel}
        title="과제 및 설문 제출 내역"
        description={headerDescription}
        footer={footer}
        size="large"
        className="assignment-submission-modal"
      >
        <div className="assignment-submission-modal__body">
          {detail != null || remoteDetailLoading ? (
            <FilterTableLayout
              className="assignment-submission-modal__table-layout"
              showFilter={false}
              bordered={false}
              fields={[]}
              filters={{}}
              onFilterChange={() => {}}
              onSearch={() => {}}
              title="과제 및 설문 제출 목록"
              description={detail != null ? `총 ${detail.rows.length}건` : undefined}
              hideExcelDownload
              contentLoading={remoteDetailLoading}
            >
              {detail != null ? (
                <AssignmentSubmissionHistoryTable
                  rows={tableRows}
                  columns={columns}
                />
              ) : null}
            </FilterTableLayout>
          ) : null}
        </div>
      </ContentModal>
      {detail && (
        <AssignmentPreviewModal
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          studentName={detail.studentName}
          roundNumber={previewRound}
          onDownload={
            previewFileIds.length > 0 ? () => void handlePreviewDownload() : undefined
          }
          downloadLoading={previewDownloading}
        />
      )}
    </>
  )
}
