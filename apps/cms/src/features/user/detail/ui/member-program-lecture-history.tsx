/**
 * 회원 상세 — 프로그램 수강 이력 / 봉사 프로그램 참여 이력
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Key,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Application, UserHistory } from '@/types/domain'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import {
  resolveApplicationEnrollmentDisplayStatus,
  resolveMemberProgramTitle,
  resolveMemberProgramYear,
  resolveVolunteerHistoryDisplayStatus,
} from '@/features/user/detail/lib/member-program-history-display'
import {
  isProgramHistoryDeleteBlockedByDisplayStatus,
} from '@/shared/constants/status'
import { ProgramEnrollmentStatusText } from '@/shared/components/program-enrollment-status-text'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import {
  createMemberProgramLectureTablePageConfig,
  memberProgramEnrollmentStatusFieldOptions,
  type MemberProgramHistoryMode,
} from './member-program-lecture-table.config'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { buildProgressYearSelectOptions, lectureAttendanceHasAtLeastOne } from '@/shared/utils'
import '@/features/program/general/ui/program-list.css'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import './member-program-lecture-history.css'
import {
  CmsButton,
  CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH,
  DeleteGuideModal,
  ProgramHistoryDeleteBlockedModal,
  buildProgramProgressHistoryDeleteGuide,
  type ProgramProgressHistoryDeleteDomain,
} from '@/shared/ui'
import { CertificateBulkIssueReasonModal } from './modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from './modal/certificate-bulk-issue-reason-modal'
import { LectureReportSubmissionHistoryModal } from './modal/lecture-report-submission-history-modal'

function shouldIgnoreTableRowClick(target: HTMLElement): boolean {
  return (
    !!target.closest('.ant-table-selection-column') ||
    !!target.closest('.member-program-lecture-history__action-cell') ||
    !!target.closest('.user-detail-modal__attendance-link')
  )
}

export type { MemberProgramHistoryMode }

export interface MemberProgramLectureHistoryProps {
  /** 수강·강의 이력(Application). volunteerProgram 모드에서는 미사용 */
  applications?: Application[]
  /** 봉사 프로그램 참여 이력(UserHistory). volunteerProgram 모드에서만 사용 */
  volunteerHistories?: UserHistory[]
  loading?: boolean
  /** 강의 이력(기본) vs 수강 이력 vs 봉사 참여 이력 */
  mode?: MemberProgramHistoryMode
  /** 미지정 시 mode에 따라 기본 제목 */
  summaryTitle?: string
  /** 미지정 시 mode에 따라 기본 각주 */
  footnote?: ReactNode
  onRowClick?: (application: Application) => void
  onViewLectureReport?: (application: Application) => void
  onOpenAttendance?: (application: Application) => void
  onOpenAssignment?: (application: Application) => void
  onDownloadCertificate?: (application: Application) => void
  onVolunteerRowClick?: (history: UserHistory) => void
  onVolunteerCertificateDownload?: (history: UserHistory) => void
  onBulkDelete?: (applicationIds: string[]) => void | Promise<void>
  /** false: 교사(일반) 등 — 수료증·참여·활동 인증서 일괄 발급 UI 비노출 */
  showCertificateBulkIssue?: boolean
  /** 활동인증서 일괄 발급 (봉사·강의 이력) */
  onCertificateIssue?: (
    rowIds: readonly string[],
    reason: CertificateIssueReasonValue,
    reasonLabel: string
  ) => void | Promise<void>
  /** 수료증/참여인증서 일괄 발급 (수강·봉사 이력) */
  onStudentCertificateIssue?: (
    rowIds: readonly string[],
    reason: CertificateIssueReasonValue,
    reasonLabel: string
  ) => void | Promise<void>
  /** remote API memberId — 강의보고서 모달 등 */
  memberId?: number
}

const DEFAULT_FOOTNOTE =
  '* 활동보고서는 개인정보 보관 만료 전(회원가입일로부터 5년)까지 자유롭게 발급이 가능합니다.'

function businessAreaFromRecord(record: Application): string {
  const raw = record.customFields?.businessArea
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim()
    if (trimmed === '디지털리터러시') return '디지털 리터러시'
    return trimmed
  }
  return '-'
}

function educationGradeFromRecord(record: Application): string {
  const raw = record.customFields?.educationGrade
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return '-'
}

/** 이력 삭제 모달 — 수강 이력 테이블만 「프로그램 수강 이력」 문구 분기 */
function programHistoryDeleteDomainForMode(mode: MemberProgramHistoryMode): ProgramProgressHistoryDeleteDomain {
  return mode === 'studentEnrollment' || mode === 'schoolProgramParticipation' ? 'enrollment' : 'progress'
}

export function MemberProgramLectureHistory({
  applications = [],
  volunteerHistories = [],
  loading = false,
  mode = 'instructorLecture',
  summaryTitle: summaryTitleProp,
  footnote: footnoteProp,
  onRowClick: _onRowClick,
  onViewLectureReport,
  onOpenAttendance,
  onOpenAssignment,
  onDownloadCertificate,
  onVolunteerRowClick: _onVolunteerRowClick,
  onVolunteerCertificateDownload,
  onBulkDelete,
  showCertificateBulkIssue = true,
  onCertificateIssue,
  onStudentCertificateIssue,
  memberId,
}: MemberProgramLectureHistoryProps) {
  const historyDeleteDomain = useMemo(() => programHistoryDeleteDomainForMode(mode), [mode])

  const summaryTitle =
    summaryTitleProp ??
    (mode === 'schoolProgramParticipation'
      ? '프로젝트 수강 이력'
      : mode === 'studentEnrollment'
        ? '프로그램 수강 이력'
        : mode === 'volunteerProgram'
          ? '봉사 프로그램 참여 이력'
          : '프로그램 강의 이력')
  const footnote =
    footnoteProp ??
    (mode === 'instructorLecture' ? DEFAULT_FOOTNOTE : undefined)
  const [searchParams, setSearchParams] = useSearchParams()

  const yearOptions = useMemo(() => buildProgressYearSelectOptions(''), [])

  const enrollmentStatusOptions = useMemo(() => memberProgramEnrollmentStatusFieldOptions(), [])

  const filterFields = useMemo((): FilterFieldConfig[] => {
    return [
      {
        key: 'title',
        type: 'search',
        label: '프로그램명',
        placeholder: '프로그램명을 입력하세요',
        width: '25%',
      },
      {
        key: 'year',
        type: 'select',
        label: '진행년도',
        placeholder: '전체',
        options: yearOptions,
        width: '25%',
      },
      {
        key: 'enrollmentStatus',
        type: 'select',
        label: '프로그램 진행 현황',
        placeholder: '전체',
        options: enrollmentStatusOptions,
        width: '25%',
      },
      {
        key: 'managerName',
        type: 'search',
        label: '담당자명',
        placeholder: '담당자명을 입력하세요',
        width: '25%',
      },
    ]
  }, [yearOptions, enrollmentStatusOptions])

  const tablePageConfig = useMemo(() => createMemberProgramLectureTablePageConfig(mode), [mode])

  const tableContext = useMemo(() => ({ mode }), [mode])

  const listData = useMemo(
    () =>
      (mode === 'volunteerProgram' ? volunteerHistories : applications) as
        | Application[]
        | UserHistory[],
    [mode, volunteerHistories, applications]
  )

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
  } = useTablePage(tablePageConfig, {
    data: listData,
    searchParams,
    setSearchParams,
    context: tableContext,
  })

  const displayRowCount = displayedCount

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [deleteHistoryModalOpen, setDeleteHistoryModalOpen] = useState(false)
  const [historyDeleteBlockedModalOpen, setHistoryDeleteBlockedModalOpen] = useState(false)
  const [certificateIssueModalOpen, setCertificateIssueModalOpen] = useState(false)
  const [certificateIssueTargetIds, setCertificateIssueTargetIds] = useState<string[]>([])
  const [certificateIssueKind, setCertificateIssueKind] = useState<'activity' | 'completion'>(
    'completion'
  )
  const [lectureReportHistoryModalOpen, setLectureReportHistoryModalOpen] = useState(false)
  const [lectureReportHistoryTarget, setLectureReportHistoryTarget] = useState<Application | null>(
    null
  )

  useEffect(() => {
    if (!certificateIssueModalOpen) {
      setCertificateIssueTargetIds([])
    }
  }, [certificateIssueModalOpen])

  const openCertificateIssueModal = useCallback(
    (ids: string[], kind: 'activity' | 'completion') => {
      if (ids.length === 0) return
      setCertificateIssueTargetIds(ids)
      setCertificateIssueKind(kind)
      setCertificateIssueModalOpen(true)
    },
    []
  )

  const historyDeleteGuide = useMemo(() => {
    if (selectedRowKeys.length === 0) return null
    const keySet = new Set(selectedRowKeys.map(String))
    const titles = tableData
      .filter(row => keySet.has(String(row.id)))
      .map(row => resolveMemberProgramTitle(row.programId, row))
    return buildProgramProgressHistoryDeleteGuide(titles, historyDeleteDomain)
  }, [tableData, selectedRowKeys, historyDeleteDomain])

  const handleOpenHistoryDeleteModal = useCallback(() => {
    if (selectedRowKeys.length === 0) return
    const keySet = new Set(selectedRowKeys.map(String))
    const titles = tableData
      .filter(row => keySet.has(String(row.id)))
      .map(row => resolveMemberProgramTitle(row.programId, row))
    if (titles.length === 0 || !buildProgramProgressHistoryDeleteGuide(titles, historyDeleteDomain)) {
      return
    }
    setDeleteHistoryModalOpen(true)
  }, [selectedRowKeys, tableData, historyDeleteDomain])

  const handleHistoryDeleteCancel = useCallback(() => {
    setDeleteHistoryModalOpen(false)
  }, [])

  const handleHistoryDeleteConfirm = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    if (ids.length === 0) return

    const keySet = new Set(ids)
    const selectedRecords = tableData.filter(row => keySet.has(String(row.id)))
    const hasInProgress =
      mode === 'volunteerProgram'
        ? (selectedRecords as UserHistory[]).some(h =>
            isProgramHistoryDeleteBlockedByDisplayStatus(resolveVolunteerHistoryDisplayStatus(h))
          )
        : (selectedRecords as Application[]).some(a =>
            isProgramHistoryDeleteBlockedByDisplayStatus(resolveApplicationEnrollmentDisplayStatus(a))
          )

    if (hasInProgress) {
      setDeleteHistoryModalOpen(false)
      setHistoryDeleteBlockedModalOpen(true)
      return
    }

    if (onBulkDelete) {
      onBulkDelete(ids)
    } else {
      console.debug('memberProgramLectureHistory onBulkDelete not provided')
    }
    setSelectedRowKeys([])
    setDeleteHistoryModalOpen(false)
  }, [mode, onBulkDelete, selectedRowKeys, tableData])

  const columns: ColumnsType<Application> | ColumnsType<UserHistory> = useMemo(() => {
    if (mode === 'volunteerProgram') {
      const managerCol: ColumnsType<UserHistory>[0] = {
        title: '담당자',
        key: 'managerName',
        ellipsis: true,
        align: 'center',
        render: (_: unknown, record: UserHistory) => record.managerName?.trim() || '-',
      }
      return [
        {
          title: 'No.',
          key: 'no',
          align: 'center',
          render: (_: unknown, __: UserHistory, index: number) => index + 1,
        },
        {
          title: '프로그램명',
          key: 'programTitle',
          ellipsis: true,
          minWidth: 300,
          align: 'center',
          render: (_: unknown, record: UserHistory) =>
            resolveMemberProgramTitle(record.programId, record),
        },
        {
          title: '진행년도',
          key: 'year',
          align: 'center',
          render: (_: unknown, record: UserHistory) => {
            const y = resolveMemberProgramYear(record.programId, record)
            return y != null ? `${y}년` : '-'
          },
        },
        {
          title: '프로그램 진행 현황',
          key: 'enrollmentDisplay',
          align: 'center',
          render: (_: unknown, record: UserHistory) => (
            <ProgramEnrollmentStatusText status={resolveVolunteerHistoryDisplayStatus(record)} />
          ),
        },
        managerCol,
      ]
    }

    const sharedStart: ColumnsType<Application> = [
      {
        title: 'No.',
        key: 'no',
        align: 'center',
        render: (_: unknown, __: Application, index: number) => index + 1,
      },
      {
        title: '프로그램명',
        key: 'programTitle',
        ellipsis: true,
        align: 'center',
        render: (_: unknown, record: Application) =>
          resolveMemberProgramTitle(record.programId, record),
      },
      {
        title: '진행년도',
        key: 'year',
        align: 'center',
        render: (_: unknown, record: Application) => {
          const y = resolveMemberProgramYear(record.programId, record)
          return y != null ? `${y}년` : '-'
        },
      },
      {
        title: '프로그램 진행 현황',
        key: 'enrollmentDisplay',
        align: 'center',
        render: (_: unknown, record: Application) => (
          <ProgramEnrollmentStatusText
            status={resolveApplicationEnrollmentDisplayStatus(record)}
          />
        ),
      },
    ]

    const managerColumn: ColumnsType<Application>[0] = {
      title: '담당자',
      dataIndex: 'managerName',
      key: 'managerName',
      ellipsis: true,
      align: 'center',
      render: (v: string | undefined) => v?.trim() || '-',
    }

    if (mode === 'studentEnrollment') {
      return [
        ...sharedStart,
        {
          title: '강의 출석 내역',
          dataIndex: 'lectureAttendance',
          key: 'lectureAttendance',
          align: 'center',
          render: (_: string | undefined, record: Application) => {
            const text = record.lectureAttendance ?? '0 / 0'
            const showLink = lectureAttendanceHasAtLeastOne(record.lectureAttendance)
            if (!showLink) {
              return text.replace('/', ' / ')
            }
            return (
              <span
                className="member-program-lecture-history__action-cell"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="user-detail-modal__attendance-link"
                  onClick={() => {
                    if (onOpenAttendance) onOpenAttendance(record)
                  }}
                >
                  {text.replace('/', ' / ')}
                </button>
              </span>
            )
          },
        },
        {
          title: '과제 제출 내역',
          key: 'assignment',
          align: 'center',
          render: (_: unknown, record: Application) => (
            <span
              className="member-program-lecture-history__action-cell"
              onClick={e => e.stopPropagation()}
            >
              <CmsButton
                variant="default"
                size="medium"
                disabled={!record.hasAssignmentSubmission}
                onClick={() => {
                  if (onOpenAssignment) onOpenAssignment(record)
                }}
              >
                내역 보기
              </CmsButton>
            </span>
          ),
        },
        managerColumn,
      ]
    }

    if (mode === 'schoolProgramParticipation') {
      return [
        ...sharedStart,
        {
          title: '사업 분야',
          key: 'businessArea',
          ellipsis: true,
          align: 'center',
          render: (_: unknown, record: Application) => businessAreaFromRecord(record),
        },
        {
          title: '교육 학년',
          key: 'educationGrade',
          align: 'center',
          render: (_: unknown, record: Application) => educationGradeFromRecord(record),
        },
        managerColumn,
      ]
    }

    return [
      ...sharedStart,
      {
        title: '강의보고서 제출 내역',
        key: 'lectureReport',
        align: 'center',
        render: (_: unknown, record: Application) => {
          const displayStatus = resolveApplicationEnrollmentDisplayStatus(record)
          const ended = displayStatus === 'PROGRAM_ENDED'
          const canView =
            ended &&
            (isMembersRemoteEnabled()
              ? record.hasLectureReportSubmission === true
              : (record.hasLectureReportSubmission ?? true))
          return (
            <span
              className="member-program-lecture-history__action-cell"
              onClick={e => e.stopPropagation()}
            >
              <CmsButton
                variant="default"
                size="medium"
                disabled={!canView}
                onClick={() => {
                  if (onViewLectureReport) onViewLectureReport(record)
                  setLectureReportHistoryTarget(record)
                  setLectureReportHistoryModalOpen(true)
                }}
              >
                내역 보기
              </CmsButton>
            </span>
          )
        },
      },
      managerColumn,
    ]
  }, [
    mode,
    onViewLectureReport,
    onOpenAttendance,
    onOpenAssignment,
    onDownloadCertificate,
    onVolunteerCertificateDownload,
  ])

  const emptyTableText =
    mode === 'schoolProgramParticipation'
      ? '프로젝트 수강 이력이 없습니다.'
      : mode === 'studentEnrollment'
        ? '프로그램 수강 이력이 없습니다.'
        : mode === 'volunteerProgram'
          ? '봉사 프로그램 참여 이력이 없습니다.'
          : '프로그램 강의 이력이 없습니다.'

  const tableDataSource: (Application | UserHistory)[] = tableData as (Application | UserHistory)[]

  const tableOnRow = useMemo((): TableProps<Application | UserHistory>['onRow'] => {
    return record => ({
      onClick: (e: MouseEvent<HTMLElement>) => {
        if (shouldIgnoreTableRowClick(e.target as HTMLElement)) return
        if (mode === 'volunteerProgram' && _onVolunteerRowClick) {
          _onVolunteerRowClick(record as UserHistory)
        } else if (_onRowClick) {
          _onRowClick(record as Application)
        }
      },
      style: { cursor: 'pointer' },
    })
  }, [mode, _onRowClick, _onVolunteerRowClick])

  return (
    <>
      <FilterTableLayout
        className="member-program-lecture-history"
        bordered={false}
        fields={filterFields}
        filters={{
          title: pendingFilters.title,
          year: pendingFilters.year || undefined,
          enrollmentStatus: pendingFilters.enrollmentStatus || undefined,
          managerName: pendingFilters.managerName,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={summaryTitle}
        description={
          footnote ? (
            <span className="member-program-lecture-history__table-description">
              <span>총 {displayRowCount}건</span>
              <DetailInfoForm.TdDivider />
              <span>{footnote}</span>
            </span>
          ) : (
            `총 ${displayRowCount}건`
          )
        }
        actions={
          <div className="member-program-lecture-history__toolbar-actions-inner">
            <div className="member-program-lecture-history__toolbar-actions-buttons">
              <CmsButton
                variant="delete"
                disabled={selectedRowKeys.length === 0}
                onClick={handleOpenHistoryDeleteModal}
              >
                이력 삭제
              </CmsButton>
              {(mode === 'studentEnrollment' || mode === 'schoolProgramParticipation') &&
                showCertificateBulkIssue && (
                  <CmsButton
                    variant="secondary"
                    size="large"
                    width={CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH}
                    icon={<DownloadOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() =>
                      openCertificateIssueModal(selectedRowKeys.map(String), 'completion')
                    }
                  >
                    수료증/참여인증서 발급
                  </CmsButton>
                )}
              {mode === 'volunteerProgram' && showCertificateBulkIssue && (
                <>
                  <CmsButton
                    variant="secondary"
                    width={180}
                    disabled={selectedRowKeys.length === 0}
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      openCertificateIssueModal(selectedRowKeys.map(String), 'activity')
                    }
                  >
                    활동인증서 발급
                  </CmsButton>
                  <CmsButton
                    variant="secondary"
                    size="large"
                    width={CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH}
                    icon={<DownloadOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() =>
                      openCertificateIssueModal(selectedRowKeys.map(String), 'completion')
                    }
                  >
                    수료증/참여인증서 발급
                  </CmsButton>
                </>
              )}
              {mode === 'instructorLecture' && showCertificateBulkIssue && (
                <CmsButton
                  variant="secondary"
                  width={180}
                  disabled={selectedRowKeys.length === 0}
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    openCertificateIssueModal(selectedRowKeys.map(String), 'activity')
                  }
                >
                  활동인증서 발급
                </CmsButton>
              )}
            </div>
          </div>
        }
        excelExport={{
          columns,
          data: tableDataSource,
        }}
      >
        <Table<Application | UserHistory>
          className="cms-data-table"
          scroll={{ x: 'max-content' }}
          loading={loading}
          rowSelection={{
            columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys),
          }}
          dataSource={tableDataSource}
          columns={columns as ColumnsType<Application | UserHistory>}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: loading ? undefined : emptyTableText,
          }}
          onRow={tableOnRow}
        />
      </FilterTableLayout>
      {deleteHistoryModalOpen && historyDeleteGuide ? (
        <DeleteGuideModal
          open
          onCancel={handleHistoryDeleteCancel}
          onConfirm={handleHistoryDeleteConfirm}
          title={historyDeleteGuide.title}
          lines={historyDeleteGuide.lines}
          confirmText="삭제"
          confirmVariant="delete"
          requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
          confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
        />
      ) : null}
      {historyDeleteBlockedModalOpen ? (
        <ProgramHistoryDeleteBlockedModal
          open
          onClose={() => setHistoryDeleteBlockedModalOpen(false)}
        />
      ) : null}
      {showCertificateBulkIssue &&
        (mode === 'studentEnrollment' ||
          mode === 'instructorLecture' ||
          mode === 'schoolProgramParticipation' ||
          mode === 'volunteerProgram') && (
          <CertificateBulkIssueReasonModal
            open={certificateIssueModalOpen}
            onCancel={() => setCertificateIssueModalOpen(false)}
            applicationIds={certificateIssueTargetIds}
            certificateDocumentLabel={
              certificateIssueKind === 'activity' ? '활동인증서' : '수료증/참여인증서'
            }
            onIssue={(reason, reasonLabel) => {
              const handler =
                certificateIssueKind === 'activity'
                  ? onCertificateIssue
                  : (onStudentCertificateIssue ?? onCertificateIssue)
              if (handler) {
                void handler(certificateIssueTargetIds, reason, reasonLabel)
              }
            }}
          />
        )}
      <LectureReportSubmissionHistoryModal
        open={lectureReportHistoryModalOpen}
        application={lectureReportHistoryTarget}
        memberId={memberId}
        onCancel={() => {
          setLectureReportHistoryModalOpen(false)
          setLectureReportHistoryTarget(null)
        }}
      />
    </>
  )
}
