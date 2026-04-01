/**
 * 회원 상세 — 프로그램 강의 이력 / 개인 회원 프로그램 수강 이력
 * FilterListLayout + user-list-table 스타일, 프로그램 진행 현황은 경제 교육 목록 톤(ProgramEnrollmentStatusBadge economyList)
 */

import { useCallback, useMemo, useState, type Key, type MouseEvent, type ReactNode } from 'react'
import { Card, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Application, Program, UserHistory } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import {
  getEffectiveEnrollmentDisplayStatus,
  programEnrollmentEconomyListLabels,
  type ProgramEnrollmentDisplayStatus,
} from '@/shared/constants/status'
import { ProgramEnrollmentStatusBadge } from '@/shared/components/program-enrollment-status-badge'
import { FilterListLayout } from '@/shared/ui/filter-list-layout'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { AppButton } from '@/shared/ui/app-button'
import { Divider } from '@/shared/components/divider'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { lectureAttendanceHasAtLeastOne } from '@/shared/utils'
import '@/features/program/ui/program-list.css'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import './member-program-lecture-history.css'

const ALL = ''

const ENROLLMENT_STATUS_ORDER: ProgramEnrollmentDisplayStatus[] = [
  'WAITING_RESULT',
  'REJECTED',
  'EDUCATION_SCHEDULED',
  'EDUCATION_IN_PROGRESS',
  'PROGRAM_ENDED',
]

type PendingFilters = {
  title: string
  year: string
  enrollmentStatus: string
  managerName: string
}

function programYear(programId: string): number | null {
  const p = programService.getByIdSync(programId)
  if (!p) return null
  return new Date(p.startDate).getFullYear()
}

function programTitle(programId: string): string {
  const p = programService.getByIdSync(programId)
  return p?.title ?? programId
}

export type MemberProgramHistoryMode =
  | 'instructorLecture'
  | 'studentEnrollment'
  | 'volunteerProgram'
  /** 학교 회원 — 프로그램명·진행년도·진행현황·교육분야·교육 학년·담당자 (출석/과제/수료증 열 없음) */
  | 'schoolProgramParticipation'

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

function educationFieldLabel(program: Program | undefined): string {
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
  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    const source =
      mode === 'volunteerProgram'
        ? volunteerHistories.map(h => h.programId)
        : applications.map(a => a.programId)
    source.forEach(programId => {
      const y = programYear(programId)
      if (y != null) years.add(y)
    })
    const sorted = [...years].sort((a, b) => b - a)
    return [
      { label: '전체', value: ALL },
      ...sorted.map(y => ({ label: `${y}년`, value: String(y) })),
    ]
  }, [applications, volunteerHistories, mode])

  const enrollmentStatusOptions = useMemo(
    () => [
      { label: '전체', value: ALL },
      ...ENROLLMENT_STATUS_ORDER.map(value => ({
        label: programEnrollmentEconomyListLabels[value],
        value,
      })),
    ],
    []
  )

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

  const [pendingFilters, setPendingFilters] = useState<PendingFilters>({
    title: '',
    year: ALL,
    enrollmentStatus: ALL,
    managerName: '',
  })

  const [activeFilters, setActiveFilters] = useState<PendingFilters>(pendingFilters)

  const handleSearch = useCallback(() => {
    setActiveFilters({ ...pendingFilters })
  }, [pendingFilters])

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const title = programTitle(app.programId)
      if (activeFilters.title.trim() && !title.includes(activeFilters.title.trim())) {
        return false
      }
      const y = programYear(app.programId)
      if (activeFilters.year && (y == null || String(y) !== activeFilters.year)) {
        return false
      }
      const program = programService.getByIdSync(app.programId)
      const displayStatus = getEffectiveEnrollmentDisplayStatus(
        app.status,
        app.progressStatus,
        program?.lifecycleStatus
      )
      if (activeFilters.enrollmentStatus && displayStatus !== activeFilters.enrollmentStatus) {
        return false
      }
      const mgr = (app.managerName ?? '').trim()
      if (activeFilters.managerName.trim() && !mgr.includes(activeFilters.managerName.trim())) {
        return false
      }
      return true
    })
  }, [applications, activeFilters])

  const filteredVolunteerHistories = useMemo(() => {
    if (mode !== 'volunteerProgram') return [] as UserHistory[]
    return volunteerHistories.filter(h => {
      const title = programTitle(h.programId)
      if (activeFilters.title.trim() && !title.includes(activeFilters.title.trim())) {
        return false
      }
      const y = programYear(h.programId)
      if (activeFilters.year && (y == null || String(y) !== activeFilters.year)) {
        return false
      }
      const displayStatus = deriveVolunteerDisplayStatus(h)
      if (activeFilters.enrollmentStatus && displayStatus !== activeFilters.enrollmentStatus) {
        return false
      }
      const mgr = (h.managerName ?? '').trim()
      if (activeFilters.managerName.trim() && !mgr.includes(activeFilters.managerName.trim())) {
        return false
      }
      return true
    })
  }, [mode, volunteerHistories, activeFilters])

  const displayRowCount =
    mode === 'volunteerProgram' ? filteredVolunteerHistories.length : filteredApplications.length

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
            <ProgramEnrollmentStatusBadge
              status={deriveVolunteerDisplayStatus(record)}
              variant="economyList"
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
                    else message.info('수료증·확인서 다운로드는 추후 연결됩니다.')
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
            program?.lifecycleStatus
          )
          return <ProgramEnrollmentStatusBadge status={displayStatus} variant="economyList" />
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
        {
          title: '수료증 발급',
          key: 'certificate',
          align: 'center',
          render: (_: unknown, record: Application) => {
            const program = programService.getByIdSync(record.programId)
            const displayStatus = getEffectiveEnrollmentDisplayStatus(
              record.status,
              record.progressStatus,
              program?.lifecycleStatus
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
                    if (onDownloadCertificate) onDownloadCertificate(record)
                    else message.info('수료증 다운로드는 추후 연결됩니다.')
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
    }

    if (mode === 'schoolProgramParticipation') {
      return [
        ...sharedStart,
        {
          title: '교육분야',
          key: 'educationField',
          ellipsis: true,
          align: 'center',
          render: (_: unknown, record: Application) =>
            educationFieldLabel(programService.getByIdSync(record.programId)),
        },
        {
          title: '교육 학년',
          key: 'educationGrade',
          align: 'center',
          render: (_: unknown, record: Application) =>
            schoolEducationGrade(record, applications),
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
            program?.lifecycleStatus
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
            program?.lifecycleStatus
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
        ? '프로그램 참여 이력이 없습니다.'
        : mode === 'volunteerProgram'
          ? '봉사 프로그램 참여 이력이 없습니다.'
          : '프로그램 강의 이력이 없습니다.'

  const listHeader = (
    <>
      <div className="program-list-page__divider-wrapper">
        <Divider />
      </div>
      <div className="program-list-page__filter-info">
        <div className="member-program-lecture-history__summary">
          <div className="program-list-page__filter-info-texts">
            <div className="program-list-page__filter-info-title">{summaryTitle}</div>
            <div className="program-list-page__filter-info-count">
              총 {displayRowCount}건
              {footnote ? (
                <p className="member-program-lecture-history__footnote"> | {footnote}</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="program-list-page__widget-header-actions">
          <AppButton
            variant="danger"
            size="filter"
            dangerFillOnHover
            className="program-list-page__bulk-delete-button"
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
          </AppButton>
        </div>
      </div>
    </>
  )

  return (
    <div className="member-program-lecture-history admin-managed-program-history">
      <div className="user-list-page__filter-wrap">
        <FilterListLayout
          className="program-list-content-wrapper admin-managed-program-history__layout"
          bordered={false}
          fields={filterFields}
          filters={{
            title: pendingFilters.title,
            year: pendingFilters.year || undefined,
            enrollmentStatus: pendingFilters.enrollmentStatus || undefined,
            managerName: pendingFilters.managerName,
          }}
          onFilterChange={(key, value) => {
            setPendingFilters(prev => ({ ...prev, [key]: value ?? ALL }))
          }}
          onSearch={handleSearch}
          listHeader={listHeader}
        >
          <div className="program-list-content-wrapper__table">
            <Card
              className="program-list-card program-list-card--in-wrapper program-list-card--no-border"
              style={{ border: 'none', boxShadow: 'none' }}
            >
              <div className="program-list-table-wrapper program-list-table-wrapper--scroll-x member-program-lecture-history__table-wrap">
                {mode === 'volunteerProgram' ? (
                  <Table<UserHistory>
                    className="cms-data-table cms-data-table--fluid user-list-table"
                    loading={loading}
                    rowSelection={{
                      columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                      selectedRowKeys,
                      onChange: keys => setSelectedRowKeys(keys),
                    }}
                    dataSource={filteredVolunteerHistories}
                    columns={columns as ColumnsType<UserHistory>}
                    rowKey="id"
                    pagination={false}
                    scroll={{ y: 'calc(100vh - 480px)' }}
                    locale={{
                      emptyText: loading ? undefined : emptyTableText,
                    }}
                    onRow={
                      onVolunteerRowClick
                        ? record => ({
                            onClick: (e: MouseEvent<HTMLElement>) => {
                              const el = e.target as HTMLElement
                              if (
                                el.closest('.ant-table-selection-column') ||
                                el.closest('.member-program-lecture-history__action-cell') ||
                                el.closest('.user-detail-modal__attendance-link')
                              ) {
                                return
                              }
                              onVolunteerRowClick(record)
                            },
                            style: { cursor: 'pointer' },
                          })
                        : undefined
                    }
                  />
                ) : (
                  <Table<Application>
                    className="cms-data-table cms-data-table--fluid user-list-table"
                    loading={loading}
                    rowSelection={{
                      columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                      selectedRowKeys,
                      onChange: keys => setSelectedRowKeys(keys),
                    }}
                    dataSource={filteredApplications}
                    columns={columns as ColumnsType<Application>}
                    rowKey="id"
                    pagination={false}
                    scroll={{ y: 'calc(100vh - 480px)' }}
                    locale={{
                      emptyText: loading ? undefined : emptyTableText,
                    }}
                    onRow={
                      onRowClick
                        ? record => ({
                            onClick: (e: MouseEvent<HTMLElement>) => {
                              const el = e.target as HTMLElement
                              if (
                                el.closest('.ant-table-selection-column') ||
                                el.closest('.member-program-lecture-history__action-cell') ||
                                el.closest('.user-detail-modal__attendance-link')
                              ) {
                                return
                              }
                              onRowClick(record)
                            },
                            style: { cursor: 'pointer' },
                          })
                        : undefined
                    }
                  />
                )}
              </div>
            </Card>
          </div>
        </FilterListLayout>
      </div>
    </div>
  )
}
