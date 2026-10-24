/**
 * 참여 기관 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여 기관)
 * FilterTableLayout + 테이블(교육 참여 기관 목록, 캘린더 뷰), 교재 배송 현황 StatusDropdownCell
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { Spin } from 'antd'
import { FilterTableLayout, FilterTableToolbarButton } from '@/shared/ui'
import type { ColumnsType } from 'antd/es/table'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  type ParticipatingSchoolRow,
  type TextbookStatusKey,
  PARTICIPATING_INSTITUTION_TEXTBOOK_STATUS_LABELS,
  TEXTBOOK_STATUS_OPTION_KEYS,
} from '@/features/program/general/model/participating-schools'
import { EditableStatusBadge } from '@/shared/components/editable-status-badge'
import { getTextbookStatusBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
} from '@/shared/components'
import { useParticipatingInstitutionsParams } from '../../../hooks/use-participating-institutions-params'
import { useProgressSchoolList } from '../../../hooks/use-progress-school-list'
import { useProgressInstructorList } from '../../../hooks/use-progress-instructor-list'
import type { ProgressFilters } from '../../../hooks/use-program-progress-params'
import { SchoolDetailModal } from './school-detail-modal'
import {
  GeneralParticipatingInstitutionDetailView,
  type SchoolDetailTabKey,
} from './general-participating-institution-detail-view'
import {
  PARTICIPATING_INSTITUTIONS_ASSIGNED_INSTRUCTOR_COLUMN_WIDTH,
  PARTICIPATING_INSTITUTIONS_CLASS_COUNT_COLUMN_WIDTH,
  PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
  PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_COLUMN_WIDTH,
  PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_DROPDOWN_STYLE,
  participatingScheduleTableColumnLayout,
} from '../../../lib/participating-institutions-table'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import { formatInstitutionRegionForTableDisplay } from '@/shared/lib/format-institution-region-display'
import { getSchoolDetailByRow } from '../../../lib/school-detail'
import type { SettlementStatusKey } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'
import type { ParticipatingInstitutionsFilters } from '../../../hooks/use-participating-institutions-params'
import { participatingInstitutionsFilterFields } from '../../../lib/participating-institutions-filter-fields'
import { programUsesTextbook } from '../../../lib/participating-institution-textbook'
import { resolveInstitutionApplicationProgramBridge } from '../../../lib/institution-application-program-bridge'
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'
import { CMS_TABLE_NO_COL_CLASS, CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { ParticipatingInstitutionsCalendarView } from './participating-institutions-calendar-view'
import {
  buildParticipatingSchoolPreferredScheduleLines,
  formatGeneralEducationScheduleLine,
  prepareGeneralEducationScheduleSessions,
  readCurriculumSessionLabels,
  readProgramEducationScheduleLines,
  resolveScheduleDetailTimeSpan,
} from '../../../lib/participating-school-session-display'
import { generalEducationScheduleShapeFromBridge } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import {
  useIsTrainedTeachersProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { useOrganizationMergeGroups } from '@/features/program/general/hooks/use-organization-merge-groups'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { shouldUseOrganizationMergeGroupsRemoteApi } from '@/features/program/general/api/organization-merge-groups-remote-capabilities'
import type { GeneralProgramNavigationCapabilities } from '@/features/program/general/hooks/use-general-program-navigation'
import { applyCombinedClassMergeToSchoolDetailWithList } from '@/features/program/general/lib/apply-combined-class-merge-state'
import {
  isCombinedClassNonLeadMember,
  resolveCombinedClassMergeViewState,
} from '@/features/program/general/lib/organization-merge-groups-mapper'
import { isGeneralOrganizationProgram } from '@/features/program/general/lib/organization-merge-program-type'
import { resolveParticipatingProgressAssignedSessions } from '@/features/program/general/lib/organization-education-schedule-sources'
import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import './participating-institutions-section.css'

function ParticipatingInstitutionTextbookStatusBadge({ status }: { status: TextbookStatusKey }) {
  if (status === 'not_applicable') return <>-</>
  return (
    <EditableStatusBadge
      label={PARTICIPATING_INSTITUTION_TEXTBOOK_STATUS_LABELS[status]}
      tone={getTextbookStatusBadgeTone(status)}
    />
  )
}

export interface ParticipatingInstitutionsSectionProps {
  programId?: string
  /** 프로그램 정보. 교재 배송 현황 필터는 program에 교재 필드(textbookName 등)가 있을 때만 노출 */
  program?: Program | null
  navigationCapabilities?: GeneralProgramNavigationCapabilities
  navigationCapabilitiesLoading?: boolean
  /** URL의 schoolId. 있으면 해당 학교 상세 인라인 뷰 표시 */
  schoolIdFromUrl?: string | null
  /** URL의 학교 상세 탭(application | students | instructors | posts | journal). 쿼리 파라미터 연동용 */
  schoolTabFromUrl?: SchoolDetailTabKey | null
  /** 학교 상세 뷰 내 탭 변경 시 호출 (쿼리 파라미터 갱신용) */
  onSchoolTabChange?: (tab: SchoolDetailTabKey) => void
  /** 행 클릭 시 호출 (풀페이지 인라인 뷰용). 있으면 모달 대신 schoolId로 전환 */
  onSchoolRowClick?: (row: ParticipatingSchoolRow) => void
  /** 상세 뷰 닫기(목록으로) 시 호출 */
  onClearSchoolId?: () => void
  /** 상세 뷰 진입 시 제목용으로 학교명 전달 */
  onSchoolDetailOpen?: (schoolName: string) => void
  /** 상세 뷰 종료 시 호출 */
  onSchoolDetailClose?: () => void
}

export function ParticipatingInstitutionsSection({
  programId,
  program,
  navigationCapabilities,
  navigationCapabilitiesLoading,
  schoolIdFromUrl,
  schoolTabFromUrl,
  onSchoolTabChange,
  onSchoolRowClick,
  onClearSchoolId,
  onSchoolDetailOpen,
  onSchoolDetailClose,
}: ParticipatingInstitutionsSectionProps) {
  const prevSchoolIdFromUrl = useRef<string | null>(null)
  const {
    filters,
    appliedFilters,
    applyFilters,
    progressCalendarGranularity,
    setProgressCalendarGranularity,
  } = useParticipatingInstitutionsParams()
  const [pendingFilters, setPendingFilters] = useState<ParticipatingInstitutionsFilters>(() => ({
    ...filters,
  }))
  const [openTextbookDropdownId, setOpenTextbookDropdownId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    setPendingFilters({ ...filters })
  }, [filters])

  const filterTableValues = useMemo(
    () => ({
      schoolName: pendingFilters.schoolName,
      institutionSido: pendingFilters.institutionSido,
      institutionSigungu: pendingFilters.institutionSigungu,
      educationGrade: pendingFilters.educationGrade === 'all' ? '' : pendingFilters.educationGrade,
      textbookStatus: pendingFilters.textbookStatus === 'all' ? '' : pendingFilters.textbookStatus,
      teacherName: pendingFilters.teacherName,
    }),
    [pendingFilters]
  )

  const handleFilterChange = (key: string, value: unknown) => {
    if (key === 'schoolName' || key === 'teacherName') {
      setPendingFilters(prev => ({ ...prev, [key]: String(value ?? '') }))
      return
    }
    if (key === 'institutionSido') {
      setPendingFilters(prev => ({
        ...prev,
        institutionSido: value == null || value === '' ? '' : String(value),
        institutionSigungu: '',
      }))
      return
    }
    if (key === 'institutionSigungu') {
      setPendingFilters(prev => ({
        ...prev,
        institutionSigungu: value == null || value === '' ? '' : String(value),
      }))
      return
    }
    if (key === 'educationGrade' || key === 'textbookStatus') {
      const v = value == null || value === '' || value === 'all' ? 'all' : String(value)
      setPendingFilters(prev => ({ ...prev, [key]: v }))
    }
  }

  const handleFilterSearch = () => {
    applyFilters(pendingFilters)
  }

  const resolvedProgramId = programId ?? program?.id
  const isTrainedTeachersSurface = useIsTrainedTeachersProgramsSurface()

  const progressFilters: ProgressFilters = useMemo(
    () => ({
      schoolName: appliedFilters.schoolName,
      region: 'all',
      institutionSido: appliedFilters.institutionSido,
      institutionSigungu: appliedFilters.institutionSigungu,
      educationGrade: appliedFilters.educationGrade,
      lectureRound: 'all',
      // TT는 배송 원장 없음 — URL에 남은 textbookStatus로 0건 필터 방지
      textbookStatus: isTrainedTeachersSurface ? 'all' : appliedFilters.textbookStatus,
      settlementStatus: 'all',
      teacherName: appliedFilters.teacherName,
    }),
    [appliedFilters, isTrainedTeachersSurface]
  )

  const instructorHook = useProgressInstructorList({
    appliedFilters: progressFilters,
    programId: resolvedProgramId,
    program,
  })
  const schoolHook = useProgressSchoolList({
    appliedFilters: progressFilters,
    instructorList: isTrainedTeachersSurface ? [] : instructorHook.instructorList,
    programId: resolvedProgramId,
    program,
  })

  const {
    schoolList,
    filteredSchools,
    selectedSchoolForDetail,
    setSelectedSchoolForDetail,
    schoolDetailModalOpen,
    setSchoolDetailModalOpen,
    handleTextbookStatusChange,
    handleSchoolApprovalCancel,
    savedBasicPatches,
    setSavedBasicPatches,
    savedInstructorPatches,
    setSavedInstructorPatches,
    getInstructorRowsForSchool,
    getInstructorDisplayForSchool,
    applicationsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = schoolHook
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: `${resolvedProgramId ?? ''}:${viewMode}:${JSON.stringify(progressFilters)}`,
  })

  const isCompanySchool = isCompanySchoolProgram(program)
  const mergeGroupsAllowed = isGeneralOrganizationProgram(program)
  const progressRemoteEnabled = useProgramProgressRemoteEnabledForSurface(resolvedProgramId)
  const mergeGroupsQuery = useOrganizationMergeGroups(
    resolvedProgramId,
    program?.backendProgramType,
    mergeGroupsAllowed && progressRemoteEnabled && shouldUseOrganizationMergeGroupsRemoteApi()
  )

  /** URL schoolId로 선택된 학교 행 (인라인 상세 뷰용) */
  const selectedRowFromUrl = useMemo(() => {
    if (!schoolIdFromUrl) return null
    return filteredSchools.find(r => r.id === schoolIdFromUrl) ?? null
  }, [schoolIdFromUrl, filteredSchools])

  const selectedRowMergeView = useMemo(() => {
    if (!selectedRowFromUrl || !mergeGroupsQuery.data?.length) return null
    return resolveCombinedClassMergeViewState(mergeGroupsQuery.data, selectedRowFromUrl, schoolList)
  }, [mergeGroupsQuery.data, schoolList, selectedRowFromUrl])

  /** 상세 뷰 진입/종료 시 부모에 제목용 학교명 알림 */
  useEffect(() => {
    if (selectedRowFromUrl) {
      onSchoolDetailOpen?.(selectedRowFromUrl.schoolName)
      prevSchoolIdFromUrl.current = schoolIdFromUrl ?? null
    } else {
      if (prevSchoolIdFromUrl.current != null) onSchoolDetailClose?.()
      prevSchoolIdFromUrl.current = null
    }
  }, [selectedRowFromUrl, schoolIdFromUrl, onSchoolDetailOpen, onSchoolDetailClose])

  const handleCalendarView = () => {
    setViewMode('calendar')
  }

  const handleListView = () => {
    setViewMode('list')
  }

  const { catalog: textbookCatalog, isLoading: isTextbookCatalogLoading } =
    useProgramTextbookCatalog(program)

  const programBridge = useMemo(
    () => resolveInstitutionApplicationProgramBridge(program),
    [program]
  )
  const educationScheduleShape = useMemo(() => {
    const shape = generalEducationScheduleShapeFromBridge(programBridge)
    if (!shape) return null
    return { ...shape, curriculumSessionLabels: readCurriculumSessionLabels(program) }
  }, [program, programBridge])
  const detailScheduleTimeSpan = useMemo(
    () => resolveScheduleDetailTimeSpan(program?.generalCommonInfo?.scheduleDetails),
    [program]
  )
  const educationScheduleLines = useMemo(
    () => readProgramEducationScheduleLines(program),
    [program]
  )
  const maxClassCount = isCompanySchool ? programBridge.maxClassCount : undefined
  const showTextbookFeatures = program
    ? isTextbookCatalogLoading || programUsesTextbook(program, textbookCatalog)
    : true
  /** TT는 배송 원장 없음 — 행이 전부 `not_applicable`. 필터/컬럼 노출 시 조회하면 0건이 됨 */
  const showTextbookStatusColumn =
    !isTrainedTeachersSurface && (isCompanySchool || showTextbookFeatures)

  const filterFields = useMemo(
    () =>
      showTextbookStatusColumn
        ? participatingInstitutionsFilterFields
        : participatingInstitutionsFilterFields.filter(field => field.key !== 'textbookStatus'),
    [showTextbookStatusColumn]
  )

  const showAssignedEducationSchedule = !isCompanySchool && !isTrainedTeachersSurface
  const educationScheduleColumnTitle = showAssignedEducationSchedule
    ? '교육 진행 일정'
    : programBridge.educationStructure === 'schedule' && programBridge.sessionRound === 'multi'
      ? '교육 진행 일정'
      : '진행 희망 교육 일정'

  const columns: ColumnsType<ParticipatingSchoolRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        onCell: () => ({ className: CMS_TABLE_NO_COL_CLASS }),
      },
      {
        title: '참여 기관명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 180,
      },
      {
        title: '기관 소재지',
        dataIndex: 'region',
        key: 'region',
        width: 200,
        minWidth: 190,
        render: (region: string | undefined) => formatInstitutionRegionForTableDisplay(region),
      },
      {
        title: educationScheduleColumnTitle,
        key: 'sessions',
        width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        ...participatingScheduleTableColumnLayout(),
        render: (_: unknown, record: ParticipatingSchoolRow) => {
          const assignedSessions = resolveParticipatingProgressAssignedSessions(record.sessions)
          const sessionLines = showAssignedEducationSchedule
            ? prepareGeneralEducationScheduleSessions(assignedSessions, educationScheduleShape, {
                detailScheduleTimeSpan,
                educationScheduleLines:
                  assignedSessions.length === 0 ? educationScheduleLines : [],
              })
                .map(session =>
                  formatGeneralEducationScheduleLine(session, educationScheduleShape, {
                    detailScheduleTimeSpan,
                  })
                )
                .filter(Boolean)
            : buildParticipatingSchoolPreferredScheduleLines(record.sessions)
          if (showAssignedEducationSchedule && sessionLines.length === 0) return '-'
          const total = sessionLines.length
          const showCount = total <= 3 ? total : 2
          const displaySessions = sessionLines.slice(0, showCount)
          const restCount = total - showCount
          return (
            <div className="participating-institutions-section__sessions-cell">
              {displaySessions.map((line, index) => (
                <div
                  key={`${record.id}-session-${index}`}
                  className="participating-institutions-section__session-line"
                >
                  {renderProgramDetailPipeSeparated(line)}
                </div>
              ))}
              {restCount > 0 && (
                <div className="participating-institutions-section__session-more">
                  외 {restCount}개의 교육 일정
                </div>
              )}
            </div>
          )
        },
      },
      ...(showTextbookStatusColumn
        ? [
            {
              title: '교재 배송 현황',
              dataIndex: 'textbookStatus',
              key: 'textbookStatus',
              width: PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_COLUMN_WIDTH,
              minWidth: PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_COLUMN_WIDTH,
              align: 'center' as const,
              onHeaderCell: () => ({
                className: STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
              }),
              onCell: (record: ParticipatingSchoolRow) =>
                record.textbookStatus === 'not_applicable'
                  ? {}
                  : {
                      className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME}`,
                    },
              render: (status: TextbookStatusKey, record: ParticipatingSchoolRow) => {
                const hasTextbook = Boolean(
                  record.textbookId?.trim() || record.textbookName?.trim()
                )
                if (!hasTextbook)
                  return <ParticipatingInstitutionTextbookStatusBadge status="not_applicable" />
                return (
                  <StatusDropdownCell<TextbookStatusKey>
                    status={status ?? null}
                    statusOptions={TEXTBOOK_STATUS_OPTION_KEYS.filter(
                      key => key !== 'not_applicable'
                    )}
                    renderBadge={s => <ParticipatingInstitutionTextbookStatusBadge status={s} />}
                    isItemDisabled={(cur, opt) => cur === opt}
                    onChange={key => handleTextbookStatusChange(record.id, key)}
                    isOpen={openTextbookDropdownId === record.id}
                    onOpenChange={open => setOpenTextbookDropdownId(open ? record.id : null)}
                    emptyPlaceholder="-"
                    style={PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_DROPDOWN_STYLE}
                    tagLayout="tag100"
                  />
                )
              },
            },
          ]
        : []),
      {
        title: '교육 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 96,
        align: 'center',
      },
      {
        title: '교육 학급 수',
        dataIndex: 'classCount',
        key: 'classCount',
        width: PARTICIPATING_INSTITUTIONS_CLASS_COUNT_COLUMN_WIDTH,
        minWidth: PARTICIPATING_INSTITUTIONS_CLASS_COUNT_COLUMN_WIDTH,
        align: 'center',
        className: 'participating-institutions-section__th-class-count',
        onHeaderCell: () => ({
          className: 'participating-institutions-section__th-class-count',
        }),
        onCell: () => ({ className: 'participating-institutions-section__td-class-count' }),
        render: (v: number) => {
          if (v == null) return '-'
          const limited = maxClassCount != null ? Math.min(v, maxClassCount) : v
          return `${limited}개`
        },
      },
      {
        title: '총 학생 수',
        dataIndex: 'studentCount',
        key: 'studentCount',
        width: 100,
        align: 'center',
        render: (v: number) => (v != null ? `${v}명` : '-'),
      },
      {
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 120,
        align: 'center',
      },
      // TT Primary — 강사 Relation 없음. 배정 강사 열·일반 instructor list 미사용
      ...(isTrainedTeachersSurface
        ? []
        : [
            {
              title: '배정 강사',
              key: 'assignedInstructors',
              width: PARTICIPATING_INSTITUTIONS_ASSIGNED_INSTRUCTOR_COLUMN_WIDTH,
              align: 'center' as const,
              ellipsis: true,
              render: (_: unknown, record: ParticipatingSchoolRow) =>
                getInstructorDisplayForSchool(record.id, record.schoolName),
            },
          ]),
    ],
    [
      detailScheduleTimeSpan,
      educationScheduleColumnTitle,
      educationScheduleLines,
      educationScheduleShape,
      showAssignedEducationSchedule,
      getInstructorDisplayForSchool,
      handleTextbookStatusChange,
      isCompanySchool,
      isTrainedTeachersSurface,
      maxClassCount,
      openTextbookDropdownId,
      showTextbookStatusColumn,
    ]
  )

  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    {
      includeSelection: false,
      enabled: viewMode === 'list',
    }
  )

  if (applicationsLoading && schoolList.length === 0) {
    return (
      <div className="detail-fullpage-modal__loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  if (selectedRowFromUrl && program) {
    const baseDetail = getSchoolDetailByRow(selectedRowFromUrl)
    const schoolId = selectedRowFromUrl.id
    const detailWithMerge = applyCombinedClassMergeToSchoolDetailWithList(
      baseDetail,
      mergeGroupsQuery.data,
      selectedRowFromUrl,
      schoolList
    )
    const mergedDetail = {
      ...detailWithMerge,
      ...savedBasicPatches[schoolId],
      instructors:
        savedInstructorPatches[schoolId] !== undefined
          ? savedInstructorPatches[schoolId].map(inv => ({
              ...inv,
              settlementStatus: 'awaiting_confirmation' as SettlementStatusKey,
            }))
          : (() => {
              return getInstructorRowsForSchool(
                selectedRowFromUrl.schoolName,
                instructorHook.instructorList
              )
            })(),
    }
    return (
      <div className="program-status-participating participating-institutions-section">
        <GeneralParticipatingInstitutionDetailView
          program={program}
          detail={mergedDetail}
          row={selectedRowFromUrl}
          navigationCapabilities={navigationCapabilities}
          navigationCapabilitiesLoading={navigationCapabilitiesLoading}
          participatingSchoolList={schoolList}
          activeTab={schoolTabFromUrl ?? undefined}
          onTabChange={onSchoolTabChange}
          onClearSchoolId={onClearSchoolId ?? (() => {})}
          onSaveBasicInfo={patch => {
            setSavedBasicPatches(prev => {
              const previous = { ...prev[patch.id] }
              delete previous.combinedClassApplication
              delete previous.combinedClassPartnerSchoolIds
              delete previous.combinedClassPartnerGrades
              return {
                ...prev,
                [patch.id]: { ...previous, ...patch },
              }
            })
          }}
          combinedClassReadOnly={isCombinedClassNonLeadMember(selectedRowMergeView)}
          onSaveInstructorInfo={(id, instructors) => {
            setSavedInstructorPatches(prev => ({ ...prev, [id]: instructors }))
          }}
          savedBasicPatches={savedBasicPatches}
          savedInstructorPatches={savedInstructorPatches}
          instructorList={instructorHook.instructorList}
          onCancelApproval={handleSchoolApprovalCancel}
          onTextbookStatusChange={handleTextbookStatusChange}
        />
      </div>
    )
  }

  return (
    <div
      className={[
        'program-status-participating participating-institutions-section',
        viewMode === 'calendar' ? 'general-program-detail--calendar-view' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FilterTableLayout
        className="participating-institutions-section__filter-layout"
        bordered={false}
        contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
        fields={filterFields}
        filters={filterTableValues}
        onFilterChange={handleFilterChange}
        onSearch={handleFilterSearch}
        title="교육 참여 기관 목록"
        description={`${filteredSchools.length}건`}
        actions={
          <div className="program-application-list-toolbar">
            {viewMode === 'list' ? (
              <FilterTableToolbarButton
                variant="secondary"
                icon={<ButtonCalendarIcon />}
                onClick={handleCalendarView}
              >
                캘린더 뷰로 보기
              </FilterTableToolbarButton>
            ) : (
              <FilterTableToolbarButton
                variant="secondary"
                icon={<ButtonListIcon />}
                onClick={handleListView}
              >
                리스트 뷰로 보기
              </FilterTableToolbarButton>
            )}
          </div>
        }
        excelExport={{
          columns,
          data: filteredSchools,
        }}
      >
        {viewMode === 'list' ? (
          <div ref={tableWrapRef} className="participating-institutions-section__table-wrap">
            <CmsDataTable<ParticipatingSchoolRow>
              className="cms-data-table participating-institutions-section__table participating-institutions-section__table--textbook-dropdown participating-institutions-section__table--clickable"
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              scroll={tableScrollX != null ? { x: tableScrollX } : undefined}
              columns={columns}
              dataSource={filteredSchools}
              rowClassName={record =>
                record.activityWithdrawn ? CMS_DATA_TABLE_ROW_DISABLED_CLASS : ''
              }
              onRow={record => ({
                onClick: e => {
                  const target = e.target as HTMLElement
                  if (
                    target.closest('.status-dropdown-cell__cell-status') ||
                    target.closest('.status-dropdown-cell__status-trigger')
                  )
                    return
                  if (onSchoolRowClick) {
                    onSchoolRowClick(record)
                  } else {
                    setSelectedSchoolForDetail(record)
                    setSchoolDetailModalOpen(true)
                  }
                },
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        ) : (
          <div className="participating-institutions-section__calendar-wrap">
            <ParticipatingInstitutionsCalendarView
              schools={filteredSchools}
              selectedRowKeys={[]}
              onSelectionChange={() => {}}
              onSchoolClick={row => {
                if (onSchoolRowClick) {
                  onSchoolRowClick(row)
                } else {
                  setSelectedSchoolForDetail(row)
                  setSchoolDetailModalOpen(true)
                }
              }}
              calendarGranularity={progressCalendarGranularity}
              onCalendarGranularityChange={setProgressCalendarGranularity}
              usePreferredScheduleFormat={isCompanySchool}
            />
          </div>
        )}
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>

      <div className="participating-institutions-section__page-bottom-spacer" aria-hidden />

      {!schoolIdFromUrl && (
        <SchoolDetailModal
          open={schoolDetailModalOpen}
          onCancel={() => {
            setSchoolDetailModalOpen(false)
            setSelectedSchoolForDetail(null)
          }}
          detail={
            selectedSchoolForDetail
              ? (() => {
                  const base = getSchoolDetailByRow(selectedSchoolForDetail)
                  const schoolId = selectedSchoolForDetail.id
                  const schoolName = selectedSchoolForDetail.schoolName
                  const savedInstructors = savedInstructorPatches[schoolId]
                  const remoteInstructors =
                    savedInstructors !== undefined
                      ? savedInstructors.map(inv => ({
                          ...inv,
                          settlementStatus: 'awaiting_confirmation' as SettlementStatusKey,
                        }))
                      : getInstructorRowsForSchool(schoolName, instructorHook.instructorList)
                  return {
                    ...base,
                    ...savedBasicPatches[schoolId],
                    instructors: remoteInstructors,
                  }
                })()
              : null
          }
          onSaveBasicInfo={patch => {
            setSavedBasicPatches(prev => ({ ...prev, [patch.id]: patch }))
          }}
          onSaveInstructorInfo={(schoolId, instructors) => {
            setSavedInstructorPatches(prev => ({ ...prev, [schoolId]: instructors }))
          }}
          participatingRow={selectedSchoolForDetail}
          programId={resolvedProgramId}
          participatingInstructorList={instructorHook.instructorList}
          onCancelApproval={handleSchoolApprovalCancel}
        />
      )}
    </div>
  )
}
