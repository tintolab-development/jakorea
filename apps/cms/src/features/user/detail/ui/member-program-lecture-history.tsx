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
import type { Application, Program, UserHistory } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import {
  getEffectiveEnrollmentDisplayStatus,
  isProgramHistoryDeleteBlockedByDisplayStatus,
  type ProgramEnrollmentDisplayStatus,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/components/status-badge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import {
  createMemberProgramLectureTablePageConfig,
  memberProgramEnrollmentStatusFieldOptions,
  type MemberProgramHistoryMode,
} from './member-program-lecture-table.config'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
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
  DeleteGuideModal,
  ProgramHistoryDeleteBlockedModal,
  buildProgramProgressHistoryDeleteGuide,
  type ProgramProgressHistoryDeleteDomain,
} from '@/shared/ui'
import { CertificateBulkIssueReasonModal } from './modal/certificate-bulk-issue-reason-modal'
import { LectureReportSubmissionHistoryModal } from './modal/lecture-report-submission-history-modal'

function programYear(programId: string): number | null {
  const p = programService.getByIdSync(programId)
  if (!p) return null
  return new Date(p.startDate).getFullYear()
}

function programTitle(programId: string): string {
  const p = programService.getByIdSync(programId)
  return p?.title ?? programId
}

/** 프로그램 진행 현황 — `StatusBadge` 글자색 전용(`variant="text"`) */
function ProgramEnrollmentStatusTextBadge({ status }: { status: ProgramEnrollmentDisplayStatus }) {
  return <StatusBadge domain="programEnrollment" status={status} variant="text" />
}

function enrollmentDisplayStatusForApplication(
  record: Application
): ProgramEnrollmentDisplayStatus {
  const program = programService.getByIdSync(record.programId)
  return getEffectiveEnrollmentDisplayStatus(
    record.status,
    record.progressStatus,
    program?.lifecycleStatus,
    record.rejectionKind
  )
}

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
  onDownloadActivityReport?: (application: Application) => void
  onOpenAttendance?: (application: Application) => void
  onOpenAssignment?: (application: Application) => void
  onDownloadCertificate?: (application: Application) => void
  onVolunteerRowClick?: (history: UserHistory) => void
  onVolunteerCertificateDownload?: (history: UserHistory) => void
  onBulkDelete?: (applicationIds: string[]) => void
  /** false: 교사(일반) 등 — 수료증·참여·활동 인증서 일괄 발급 UI 비노출 */
  showCertificateBulkIssue?: boolean
}

const DEFAULT_FOOTNOTE =
  '* 활동보고서는 개인정보 보관 만료 전(회원가입일로부터 5년)까지 자유롭게 발급이 가능합니다.'

const DEFAULT_STUDENT_FOOTNOTE =
  '* 수료증은 개인정보 보관 만료 전(회원가입일로부터 5년)까지 자유롭게 발급이 가능합니다.'

/** 봉사 참여 이력: 수강 이력과 동일 각주 자리(레이아웃 정렬) */
const DEFAULT_VOLUNTEER_FOOTNOTE = DEFAULT_STUDENT_FOOTNOTE

/** 학교 참여 이력 테이블: 교육 학년 표시 (신청 건별 안정적 매핑) */
const SCHOOL_GRADE_LABELS = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

function businessAreaLabel(program: Program | undefined): string {
  const raw = program?.businessArea?.trim()
  if (!raw) return '-'
  if (raw === '디지털리터러시') return '디지털 리터러시'
  return raw
}

function schoolEducationGrade(record: Application, sourceApplications: Application[]): string {
  const idx = sourceApplications.findIndex(a => a.id === record.id)
  if (idx < 0) return '-'
  return SCHOOL_GRADE_LABELS[idx % SCHOOL_GRADE_LABELS.length]
}

function deriveVolunteerDisplayStatus(history: UserHistory): ProgramEnrollmentDisplayStatus {
  /** 봉사 이력 취소는 신청 반려 톤으로 통일(면접 단계 구분 없음) */
  if (history.finalStatus === 'CANCELLED') return 'REJECTED'
  if (history.finalStatus === 'COMPLETED') return 'PROGRAM_ENDED'
  if (history.finalStatus === 'CONFIRMED') return 'EDUCATION_IN_PROGRESS'
  const program = programService.getByIdSync(history.programId)
  return getEffectiveEnrollmentDisplayStatus('submitted', undefined, program?.lifecycleStatus)
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
  onDownloadActivityReport,
  onOpenAttendance,
  onOpenAssignment,
  onDownloadCertificate,
  onVolunteerRowClick: _onVolunteerRowClick,
  onVolunteerCertificateDownload,
  onBulkDelete,
  showCertificateBulkIssue = true,
}: MemberProgramLectureHistoryProps) {
  const historyDeleteDomain = useMemo(() => programHistoryDeleteDomainForMode(mode), [mode])

  const summaryTitle =
    summaryTitleProp ??
    (mode === 'studentEnrollment' || mode === 'schoolProgramParticipation'
      ? '프로그램 수강 이력'
      : mode === 'volunteerProgram'
        ? '봉사 프로그램 참여 이력'
        : '프로그램 강의 이력')
  const footnote =
    footnoteProp ??
    (mode === 'schoolProgramParticipation'
      ? undefined
      : mode === 'studentEnrollment' || mode === 'volunteerProgram'
        ? DEFAULT_VOLUNTEER_FOOTNOTE
        : DEFAULT_FOOTNOTE)
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
  const [lectureReportHistoryModalOpen, setLectureReportHistoryModalOpen] = useState(false)
  const [lectureReportHistoryTarget, setLectureReportHistoryTarget] = useState<Application | null>(
    null
  )

  useEffect(() => {
    if (!certificateIssueModalOpen) {
      setCertificateIssueTargetIds([])
    }
  }, [certificateIssueModalOpen])

  const historyDeleteGuide = useMemo(() => {
    if (selectedRowKeys.length === 0) return null
    const keySet = new Set(selectedRowKeys.map(String))
    const titles = tableData
      .filter(row => keySet.has(String(row.id)))
      .map(row => programTitle(row.programId))
    return buildProgramProgressHistoryDeleteGuide(titles, historyDeleteDomain)
  }, [tableData, selectedRowKeys, historyDeleteDomain])

  const handleOpenHistoryDeleteModal = useCallback(() => {
    if (selectedRowKeys.length === 0) return
    const keySet = new Set(selectedRowKeys.map(String))
    const titles = tableData
      .filter(row => keySet.has(String(row.id)))
      .map(row => programTitle(row.programId))
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
            isProgramHistoryDeleteBlockedByDisplayStatus(deriveVolunteerDisplayStatus(h))
          )
        : (selectedRecords as Application[]).some(a => {
            const program = programService.getByIdSync(a.programId)
            const status = getEffectiveEnrollmentDisplayStatus(
              a.status,
              a.progressStatus,
              program?.lifecycleStatus,
              a.rejectionKind
            )
            return isProgramHistoryDeleteBlockedByDisplayStatus(status)
          })

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
          render: (_: unknown, record: UserHistory) => programTitle(record.programId),
        },
        {
          title: '진행년도',
          key: 'year',
          align: 'center',
          render: (_: unknown, record: UserHistory) => {
            const y = programYear(record.programId)
            return y != null ? `${y}년` : '-'
          },
        },
        {
          title: '프로그램 진행 현황',
          key: 'enrollmentDisplay',
          align: 'center',
          render: (_: unknown, record: UserHistory) => (
            <ProgramEnrollmentStatusTextBadge status={deriveVolunteerDisplayStatus(record)} />
          ),
        },
        {
          title: '강의 출석 내역',
          key: 'lectureAttendance',
          align: 'center',
          render: () => '0 / 0',
        },
        {
          title: '과제 제출 내역',
          key: 'assignment',
          align: 'center',
          render: () => (
            <div
              className="member-program-lecture-history__action-cell"
              onClick={e => e.stopPropagation()}
            >
              <CmsButton variant="default" size="medium" width={120} disabled>
                내역 보기
              </CmsButton>
            </div>
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
        render: (_: unknown, record: Application) => programTitle(record.programId),
      },
      {
        title: '진행년도',
        key: 'year',
        align: 'center',
        render: (_: unknown, record: Application) => {
          const y = programYear(record.programId)
          return y != null ? `${y}년` : '-'
        },
      },
      {
        title: '프로그램 진행 현황',
        key: 'enrollmentDisplay',
        align: 'center',
        render: (_: unknown, record: Application) => (
          <ProgramEnrollmentStatusTextBadge
            status={enrollmentDisplayStatusForApplication(record)}
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
          render: (_: unknown, record: Application) =>
            businessAreaLabel(programService.getByIdSync(record.programId)),
        },
        {
          title: '교육 학년',
          key: 'educationGrade',
          align: 'center',
          render: (_: unknown, record: Application) => schoolEducationGrade(record, applications),
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
          const program = programService.getByIdSync(record.programId)
          const displayStatus = getEffectiveEnrollmentDisplayStatus(
            record.status,
            record.progressStatus,
            program?.lifecycleStatus,
            record.rejectionKind
          )
          const ended = displayStatus === 'PROGRAM_ENDED'
          const canView = ended && (record.hasLectureReportSubmission ?? true)
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
      {
        title: '활동보고서 발급',
        key: 'activityReport',
        align: 'center',
        render: (_: unknown, record: Application) => {
          const program = programService.getByIdSync(record.programId)
          const displayStatus = getEffectiveEnrollmentDisplayStatus(
            record.status,
            record.progressStatus,
            program?.lifecycleStatus,
            record.rejectionKind
          )
          const canDownload = displayStatus === 'PROGRAM_ENDED'
          return (
            <span
              className="member-program-lecture-history__action-cell"
              onClick={e => e.stopPropagation()}
            >
              <CmsButton
                variant="primary"
                size="large"
                disabled={!canDownload}
                icon={<DownloadOutlined />}
                onClick={() => {
                  if (onDownloadActivityReport) onDownloadActivityReport(record)
                }}
              >
                다운로드
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
    onDownloadActivityReport,
    onOpenAttendance,
    onOpenAssignment,
    onDownloadCertificate,
    onVolunteerCertificateDownload,
    applications,
  ])

  const emptyTableText =
    mode === 'studentEnrollment'
      ? '프로그램 수강 이력이 없습니다.'
      : mode === 'schoolProgramParticipation'
        ? '프로그램 수강 이력이 없습니다.'
        : mode === 'volunteerProgram'
          ? '봉사 프로그램 참여 이력이 없습니다.'
          : '프로그램 강의 이력이 없습니다.'

  const tableDataSource: (Application | UserHistory)[] = tableData as (Application | UserHistory)[]

  const tableOnRow = useMemo((): TableProps<Application | UserHistory>['onRow'] => {
    return _record => ({
      onClick: (e: MouseEvent<HTMLElement>) => {
        if (shouldIgnoreTableRowClick(e.target as HTMLElement)) return
        // TODO(program-detail): 행 클릭 시 프로그램 상세 페이지 연결 — 임시 비활성화
        // if (mode === 'volunteerProgram' && _onVolunteerRowClick) {
        //   _onVolunteerRowClick(_record as UserHistory)
        // } else if (_onRowClick) {
        //   _onRowClick(_record as Application)
        // }
        window.alert('준비 중입니다.')
      },
      style: { cursor: 'pointer' },
    })
    // 복구 시 onRowClick·onVolunteerRowClick·mode를 의존성에 포함할 것
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 임시: 상세 이동 비활성화로 핸들러 미사용
  }, [])

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
              {(mode === 'studentEnrollment' || mode === 'schoolProgramParticipation') &&
                showCertificateBulkIssue && (
                  <CmsButton
                    variant="secondary"
                    size="large"
                    width={240}
                    icon={<DownloadOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() => {
                      const ids = selectedRowKeys.map(String)
                      if (ids.length === 0) return
                      setCertificateIssueTargetIds(ids)
                      setCertificateIssueModalOpen(true)
                    }}
                  >
                    수료증/참여인증서 발급
                  </CmsButton>
                )}
              {mode === 'volunteerProgram' && showCertificateBulkIssue && (
                <CmsButton
                  variant="secondary"
                  width={180}
                  disabled={selectedRowKeys.length === 0}
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const ids = selectedRowKeys.map(String)
                    if (ids.length === 0) return
                    setCertificateIssueTargetIds(ids)
                    setCertificateIssueModalOpen(true)
                  }}
                >
                  활동인증서 발급
                </CmsButton>
              )}
              {mode === 'instructorLecture' && showCertificateBulkIssue && (
                <CmsButton
                  variant="secondary"
                  width={180}
                  disabled={selectedRowKeys.length === 0}
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const ids = selectedRowKeys.map(String)
                    if (ids.length === 0) return
                    setCertificateIssueTargetIds(ids)
                    setCertificateIssueModalOpen(true)
                  }}
                >
                  활동인증서 발급
                </CmsButton>
              )}
              <CmsButton
                variant="delete"
                disabled={selectedRowKeys.length === 0}
                onClick={handleOpenHistoryDeleteModal}
              >
                이력 삭제
              </CmsButton>
            </div>
          </div>
        }
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
              mode === 'volunteerProgram' || mode === 'instructorLecture'
                ? '활동인증서'
                : '수료증/참여인증서'
            }
          />
        )}
      <LectureReportSubmissionHistoryModal
        open={lectureReportHistoryModalOpen}
        application={lectureReportHistoryTarget}
        onCancel={() => {
          setLectureReportHistoryModalOpen(false)
          setLectureReportHistoryTarget(null)
        }}
      />
    </>
  )
}
