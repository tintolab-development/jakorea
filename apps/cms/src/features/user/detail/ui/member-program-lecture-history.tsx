/**
 * 회원 상세 — 프로그램 수강 이력 / 봉사 프로그램 참여 이력
 */

import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
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
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Application, UserHistory } from '@/types/domain'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import {
  resolveApplicationEnrollmentDisplayStatus,
  resolveMemberProgramTitle,
  resolveMemberProgramYear,
  resolveVolunteerHistoryDisplayStatus,
} from '@/features/user/detail/lib/member-program-history-display'
import { isProgramHistoryDeleteBlockedByDisplayStatus } from '@/shared/constants/status'
import { ProgramEnrollmentStatusText } from '@/shared/components/program-enrollment-status-text'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import {
  createMemberProgramLectureTablePageConfig,
  memberProgramEnrollmentStatusFieldOptions,
  type MemberProgramHistoryMode,
} from './member-program-lecture-table.config'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS, TABLE_CONFIG } from '@/shared/constants/table'
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
  useCmsAlert,
  type ProgramProgressHistoryDeleteDomain,
  FilterTableToolbarButton,
} from '@/shared/ui'
import { CertificateBulkIssueReasonModal } from './modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from './modal/certificate-bulk-issue-reason-modal'
import { LectureReportSubmissionHistoryModal } from './modal/lecture-report-submission-history-modal'

import { ensureProgramWriteAllowed } from '@/features/program/shared/lib/program-role-action-check'

function shouldIgnoreTableRowClick(target: HTMLElement): boolean {
  return (
    !!target.closest('.ant-table-selection-column') ||
    !!target.closest('.member-program-lecture-history__action-cell') ||
    !!target.closest('.user-detail-modal__attendance-link')
  )
}

/** 테이블 표시 순 기준 No. — 상단 행이 큰 번호(내림차순) */
function descendingTableRowNo(totalRows: number, rowIndex: number): number {
  return Math.max(1, totalRows - rowIndex)
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
  /** 수료증/참가인증서 일괄 발급 (수강·봉사 이력) */
  onStudentCertificateIssue?: (
    rowIds: readonly string[],
    reason: CertificateIssueReasonValue,
    reasonLabel: string
  ) => void | Promise<void>
  /** remote API memberId — 강의보고서 모달 등 */
  memberId?: number
  /** 강의보고서 미리보기 「강사 정보 > 이름」 */
  memberName?: string
}

/** 임시: 이력 삭제 UI 비노출. true로 되돌리면 버튼·삭제용 선택이 다시 보인다. */
const SHOW_PROGRAM_HISTORY_DELETE = false

const DEFAULT_FOOTNOTE = '활동인증서는 프로그램 참여 동의일로부터 3년간 다운로드할 수 있습니다.'

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
function programHistoryDeleteDomainForMode(
  mode: MemberProgramHistoryMode
): ProgramProgressHistoryDeleteDomain {
  return mode === 'studentEnrollment' || mode === 'schoolProgramParticipation'
    ? 'enrollment'
    : 'progress'
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
  memberName,
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
  const footnote = footnoteProp ?? (mode === 'instructorLecture' ? DEFAULT_FOOTNOTE : undefined)
  const [searchParams, setSearchParams] = useSearchParams()

  const yearOptions = useMemo(() => buildProgressYearSelectOptions(''), [])

  const enrollmentStatusOptions = useMemo(() => memberProgramEnrollmentStatusFieldOptions(), [])

  const filterFields = useMemo((): FilterFieldConfig[] => {
    return [
      {
        key: 'title',
        type: 'search',
        label: '프로그램명',
        placeholder: '프로그램명을 입력해 주세요',
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'year',
        type: 'select',
        label: '진행년도',
        placeholder: '전체',
        options: yearOptions,
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'enrollmentStatus',
        type: 'select',
        label: '프로그램 진행 현황',
        placeholder: '전체',
        options: enrollmentStatusOptions,
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'managerName',
        type: 'search',
        label: '담당자명',
        placeholder: '담당자명을 입력해 주세요',
        width: FILTER_CONTROL_MAX_WIDTH_PX,
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
    hasActiveFilters,
  } = useTablePage(tablePageConfig, {
    data: listData,
    searchParams,
    setSearchParams,
    context: tableContext,
    /** 회원 상세 lnb/id 쿼리와 테이블 sync 충돌·navigate 레이스 방지 */
    disableUrlSync: true,
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
  const { showAlert } = useCmsAlert()
  /** 선택 행이 필요한 버튼 — 비활성 대신 누를 때 공통 안내 */
  const withSelection = (action: () => void) => {
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    action()
  }
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
      const idSet = new Set(ids)
      const programIds = tableData
        .filter(row => idSet.has(String(row.id)))
        .map(row => row.programId)
      void (async () => {
        // 권한 설정 V1.2: 수료증·참가인증서·활동인증서 발급은 역할 연동(Program Owner·Program Assistant).
        // 선택 이력의 프로그램 역할을 사유 입력 전에 확인한다.
        if (!(await ensureProgramWriteAllowed(programIds))) return
        setCertificateIssueTargetIds(ids)
        setCertificateIssueKind(kind)
        setCertificateIssueModalOpen(true)
      })()
    },
    [tableData]
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
    if (
      titles.length === 0 ||
      !buildProgramProgressHistoryDeleteGuide(titles, historyDeleteDomain)
    ) {
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
            isProgramHistoryDeleteBlockedByDisplayStatus(
              resolveApplicationEnrollmentDisplayStatus(a)
            )
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

  const rowCount = tableData.length

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
          width: TABLE_COLUMN_WIDTHS.index,
          className: CMS_TABLE_NO_COL_CLASS,
          align: 'center',
          render: (_: unknown, __: UserHistory, index: number) =>
            descendingTableRowNo(rowCount, index),
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
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_: unknown, __: Application, index: number) =>
          descendingTableRowNo(rowCount, index),
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
          <ProgramEnrollmentStatusText status={resolveApplicationEnrollmentDisplayStatus(record)} />
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
            /** 시안: 「0 / 4」 — API가 「0/4」·「0 / 4」 어느 쪽이어도 공백 1칸 */
            const text = (record.lectureAttendance ?? '0/0').replace(/\s*\/\s*/, ' / ')
            const showLink = lectureAttendanceHasAtLeastOne(record.lectureAttendance)
            if (!showLink) {
              return text
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
                  {text}
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
              {/* 시안 4427:28004: 회색 136×32, 제출 내역이 없으면 비활성 */}
              <CmsButton
                variant="default"
                size="small"
                className="member-program-lecture-history__history-view-btn"
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
          // 시안 4427:60361: 강의보고서를 제출하지 않았으면 비활성(클릭 불가·안내 팝업 없음), 제출했으면 활성.
          // 활성 조건은 응답 `hasLectureReportSubmission`(memberEnrollmentSummary) — mock만 종료 여부로 보완
          const canView = isMembersRemoteEnabled()
            ? record.hasLectureReportSubmission === true
            : resolveApplicationEnrollmentDisplayStatus(record) === 'PROGRAM_ENDED' &&
              (record.hasLectureReportSubmission ?? true)
          return (
            <span
              className="member-program-lecture-history__action-cell"
              onClick={e => e.stopPropagation()}
            >
              {/* 시안 4427:60361: 중립(흰 배경·회색 테두리) 버튼, 칼럼 폭 fill */}
              <CmsButton
                variant="default"
                size="small"
                className="member-program-lecture-history__history-view-btn"
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
    rowCount,
    onViewLectureReport,
    onOpenAttendance,
    onOpenAssignment,
    onDownloadCertificate,
    onVolunteerCertificateDownload,
  ])

  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    {
      includeSelection: SHOW_PROGRAM_HISTORY_DELETE || showCertificateBulkIssue,
      selectionWidth: TABLE_COLUMN_WIDTHS.checkbox,
    }
  )

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
        hasActiveFilters={hasActiveFilters}
        className={[
          'member-program-lecture-history',
          mode === 'instructorLecture' ? 'member-program-lecture-history--instructor-lecture' : '',
          mode === 'schoolProgramParticipation'
            ? 'member-program-lecture-history--school-participation'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
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
              {SHOW_PROGRAM_HISTORY_DELETE ? (
                <FilterTableToolbarButton
                  variant="delete"
                  onClick={() => withSelection(handleOpenHistoryDeleteModal)}
                >
                  이력 삭제
                </FilterTableToolbarButton>
              ) : null}
              {(mode === 'studentEnrollment' || mode === 'schoolProgramParticipation') &&
                showCertificateBulkIssue && (
                  /* 시안 4427:28004: 청록 채움 180×40, 아이콘 없음 */
                  <FilterTableToolbarButton
                    variant="primary"
                    className="member-program-lecture-history__completion-certificate-btn"
                    onClick={() =>
                      withSelection(() =>
                        openCertificateIssueModal(selectedRowKeys.map(String), 'completion')
                      )
                    }
                  >
                    수료증/참가인증서 발급
                  </FilterTableToolbarButton>
                )}
              {mode === 'volunteerProgram' && showCertificateBulkIssue && (
                /* 시안 4427:28498: [활동인증서 발급] 청록 채움 160×40, 아이콘 없음 + [엑셀 다운로드] */
                <FilterTableToolbarButton
                  variant="primary"
                  className="member-program-lecture-history__activity-certificate-btn"
                  onClick={() =>
                    withSelection(() =>
                      openCertificateIssueModal(selectedRowKeys.map(String), 'activity')
                    )
                  }
                >
                  활동인증서 발급
                </FilterTableToolbarButton>
              )}
              {mode === 'instructorLecture' && showCertificateBulkIssue && (
                /* 시안 4427:60361: 아이콘 없이 텍스트만 160×40 */
                <FilterTableToolbarButton
                  variant="primary"
                  className="member-program-lecture-history__activity-certificate-btn"
                  onClick={() =>
                    withSelection(() =>
                      openCertificateIssueModal(selectedRowKeys.map(String), 'activity')
                    )
                  }
                >
                  활동인증서 발급
                </FilterTableToolbarButton>
              )}
            </div>
          </div>
        }
        excelExport={{
          accessLog: { downloadKind: 'MEMBER_PROGRAM_HISTORY_EXPORT', containedPiiTypes: ['NAME'] },
          columns,
          data: tableDataSource,
          selectedRowKeys:
            SHOW_PROGRAM_HISTORY_DELETE || showCertificateBulkIssue ? selectedRowKeys : undefined,
        }}
      >
        <div ref={tableWrapRef} className="cms-data-table-fit-scroll-wrap">
          <CmsDataTable<Application | UserHistory>
            className="cms-data-table cms-data-table--fit-scroll"
            size={TABLE_CONFIG.size}
            scroll={tableScrollX != null ? { x: tableScrollX } : undefined}
            loading={loading}
            rowSelection={
              SHOW_PROGRAM_HISTORY_DELETE || showCertificateBulkIssue
                ? {
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys,
                    onChange: keys => setSelectedRowKeys(keys),
                  }
                : undefined
            }
            dataSource={tableDataSource}
            columns={columns as ColumnsType<Application | UserHistory>}
            rowKey="id"
            pagination={false}
            onRow={tableOnRow}
          />
        </div>
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
              certificateIssueKind === 'activity' ? '활동인증서' : '수료증/참가인증서'
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
        instructorName={memberName}
        onCancel={() => {
          setLectureReportHistoryModalOpen(false)
          setLectureReportHistoryTarget(null)
        }}
      />
    </>
  )
}
