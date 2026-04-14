/**
 * 회원 상세 — 프로그램 강의 이력 / 개인 회원 프로그램 수강 이력
 * FilterTableLayout + user-list-table 스타일, 프로그램 진행 현황은 StatusBadge text
 */

import { useMemo, useState, type Key, type MouseEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table, message } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Application, Program, UserHistory } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import {
  getEffectiveEnrollmentDisplayStatus,
  type ProgramEnrollmentDisplayStatus,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/components/status-badge'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import {
  createMemberProgramLectureTablePageConfig,
  memberProgramEnrollmentStatusFieldOptions,
  type MemberProgramHistoryMode,
} from './member-program-lecture-table.config'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { AppButton } from '@/shared/ui/app-button'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { buildProgressYearSelectOptions, lectureAttendanceHasAtLeastOne } from '@/shared/utils'
import '@/features/program/ui/program-list.css'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import './member-program-lecture-history.css'
import { CmsButton } from '@/shared/ui'

function programYear(programId: string): number | null {
  const p = programService.getByIdSync(programId)
  if (!p) return null
  return new Date(p.startDate).getFullYear()
}

function programTitle(programId: string): string {
  const p = programService.getByIdSync(programId)
  return p?.title ?? programId
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

function volunteerCertificateEnabled(history: UserHistory): boolean {
  if (history.finalStatus === 'CANCELLED') return false
  return (
    (history.finalStatus === 'COMPLETED' || history.finalStatus === 'CONFIRMED') &&
    (history.certificates?.length ?? 0) > 0
  )
}

export function MemberProgramLectureHistory({
  applications = [],
  volunteerHistories = [],
  loading = false,
  mode = 'instructorLecture',
  summaryTitle: summaryTitleProp,
  footnote: footnoteProp,
  onRowClick,
  onViewLectureReport,
  onDownloadActivityReport,
  onOpenAttendance,
  onOpenAssignment,
  onDownloadCertificate,
  onVolunteerRowClick,
  onVolunteerCertificateDownload,
  onBulkDelete,
}: MemberProgramLectureHistoryProps) {
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
            <StatusBadge
              domain="programEnrollment"
              status={deriveVolunteerDisplayStatus(record)}
              variant="text"
            />
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
            <span
              className="member-program-lecture-history__action-cell"
              onClick={e => e.stopPropagation()}
            >
              <AppButton variant="viewDetails" size="large" disabled>
                내역 보기
              </AppButton>
            </span>
          ),
        },
        {
          title: '수료증 발급',
          key: 'certificate',
          align: 'center',
          render: (_: unknown, record: UserHistory) => {
            const canDownload = volunteerCertificateEnabled(record)
            return (
              <span
                className="member-program-lecture-history__action-cell"
                onClick={e => e.stopPropagation()}
              >
                <AppButton
                  variant="primary"
                  size="large"
                  disabled={!canDownload}
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (onVolunteerCertificateDownload) onVolunteerCertificateDownload(record)
                    else window.alert('준비 중입니다.')
                  }}
                >
                  다운로드
                </AppButton>
              </span>
            )
          },
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
        render: (_: unknown, record: Application) => {
          const program = programService.getByIdSync(record.programId)
          const displayStatus = getEffectiveEnrollmentDisplayStatus(
            record.status,
            record.progressStatus,
            program?.lifecycleStatus,
            record.rejectionKind
          )
          return <StatusBadge domain="programEnrollment" status={displayStatus} variant="text" />
        },
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
                    else message.info('강의 출석 내역은 추후 연결됩니다.')
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
              <AppButton
                variant="viewDetails"
                size="large"
                disabled={!record.hasAssignmentSubmission}
                onClick={() => {
                  if (onOpenAssignment) onOpenAssignment(record)
                  else message.info('과제 제출 내역은 추후 연결됩니다.')
                }}
              >
                내역 보기
              </AppButton>
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
              <AppButton
                variant="viewDetails"
                size="large"
                disabled={!canView}
                onClick={() => {
                  window.alert('준비 중입니다.')
                  if (onViewLectureReport) onViewLectureReport(record)
                  else message.info('강의보고서 내역은 추후 연결됩니다.')
                }}
              >
                내역 보기
              </AppButton>
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
              <AppButton
                variant="primary"
                size="large"
                disabled={!canDownload}
                icon={<DownloadOutlined />}
                onClick={() => {
                  if (onDownloadActivityReport) onDownloadActivityReport(record)
                  else message.info('활동보고서 다운로드는 추후 연결됩니다.')
                }}
              >
                다운로드
              </AppButton>
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

  const isVolunteerMode = mode === 'volunteerProgram'
  const tableDataSource: (Application | UserHistory)[] = tableData as (Application | UserHistory)[]
  const hasTableRowClick = isVolunteerMode ? onVolunteerRowClick != null : onRowClick != null

  const tableOnRow = useMemo((): TableProps<Application | UserHistory>['onRow'] => {
    if (!hasTableRowClick) return undefined
    return record => ({
      onClick: (e: MouseEvent<HTMLElement>) => {
        if (shouldIgnoreTableRowClick(e.target as HTMLElement)) return
        if (mode === 'volunteerProgram' && onVolunteerRowClick) {
          onVolunteerRowClick(record as UserHistory)
        } else if (onRowClick) {
          onRowClick(record as Application)
        }
      },
      style: { cursor: 'pointer' },
    })
  }, [hasTableRowClick, mode, onVolunteerRowClick, onRowClick])

  return (
    <FilterTableLayout
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
        <>
          총 {displayRowCount}건{footnote ? <span> | {footnote}</span> : null}
        </>
      }
      actions={
        <CmsButton
          variant="delete"
          disabled={selectedRowKeys.length === 0}
          onClick={() => {
            if (onBulkDelete) {
              onBulkDelete(selectedRowKeys.map(String))
            } else {
              message.info('이력 삭제는 추후 연결됩니다.')
            }
          }}
        >
          이력 삭제
        </CmsButton>
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
  )
}
