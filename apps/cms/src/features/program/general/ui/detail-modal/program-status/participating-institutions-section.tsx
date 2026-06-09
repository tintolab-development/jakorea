/**
 * 참여 기관 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여 기관)
 * FilterTableLayout + 테이블(교육 참여 기관 목록, 캘린더 뷰), 교재 배송 현황 StatusDropdownCell
 */

import { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { CmsButton, FilterTableLayout } from '@/shared/ui'
import type { ColumnsType } from 'antd/es/table'
import {
  type ParticipatingSchoolRow,
  type TextbookStatusKey,
  type ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
} from '@/shared/components'
import { useParticipatingInstitutionsParams } from '../../../hooks/use-participating-institutions-params'
import { useProgressSchoolList } from '../../../hooks/use-progress-school-list'
import { useProgressInstructorList } from '../../../hooks/use-progress-instructor-list'
import type { ProgressFilters } from '../../../hooks/use-program-progress-params'
import { SchoolDetailModal } from './school-detail-modal'
import {
  GeneralParticipatingInstitutionDetailView,
  type GeneralParticipatingInstitutionDetailTabKey,
} from './general-participating-institution-detail-view'
import {
  PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
  PARTICIPATING_INSTITUTIONS_TABLE_MIN_SCROLL_X,
  PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_COLUMN_WIDTH,
  PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_DROPDOWN_STYLE,
} from '../../../lib/participating-institutions-table'
import { formatInstitutionRegionForTableDisplay } from '@/shared/lib/format-institution-region-display'
import { getSchoolDetailByRow } from '../../../lib/school-detail-mock'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'
import type { Program } from '@/types/domain'
import type { ParticipatingInstitutionsFilters } from '../../../hooks/use-participating-institutions-params'
import { participatingInstitutionsFilterFields } from '../../../lib/participating-institutions-filter-fields'
import { programUsesTextbook } from '../../../lib/participating-institution-textbook'
import { CMS_TABLE_NO_COL_CLASS } from '@/shared/constants/table'
import { ParticipatingInstitutionsCalendarView } from './participating-institutions-calendar-view'
import './participating-institutions-section.css'

const textbookStatusKeys: TextbookStatusKey[] = ['preparing', 'shipping', 'delivered']

function padTimePart(part: string): string {
  const trimmed = part.trim()
  const [h, m = '00'] = trimmed.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

/** 스크린샷 형식: YYYY. MM. DD(요일) HH:mm ~ HH:mm | N차시 */
function formatSessionLine(s: ParticipatingSchoolSession): string {
  const datePart = s.date.replace(/\./g, '. ')
  const [startRaw, endRaw] = s.timeRange.split('~')
  const timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
  return `${datePart}(${s.dayOfWeek}) ${timePart} | ${s.round}차시`
}

export interface ParticipatingInstitutionsSectionProps {
  programId?: string
  /** 프로그램 정보. 교재 배송 현황 필터는 program에 교재 필드(textbookName 등)가 있을 때만 노출 */
  program?: Program | null
  /** URL의 schoolId. 있으면 해당 학교 상세 인라인 뷰 표시 */
  schoolIdFromUrl?: string | null
  /** URL의 학교 상세 탭(application | students | instructors | posts). 쿼리 파라미터 연동용 */
  schoolTabFromUrl?: GeneralParticipatingInstitutionDetailTabKey | null
  /** 학교 상세 뷰 내 탭 변경 시 호출 (쿼리 파라미터 갱신용) */
  onSchoolTabChange?: (tab: GeneralParticipatingInstitutionDetailTabKey) => void
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
  programId: _programId,
  program,
  schoolIdFromUrl,
  schoolTabFromUrl,
  onSchoolTabChange,
  onSchoolRowClick,
  onClearSchoolId,
  onSchoolDetailOpen,
  onSchoolDetailClose,
}: ParticipatingInstitutionsSectionProps) {
  const prevSchoolIdFromUrl = useRef<string | null>(null)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollX, setTableScrollX] = useState(PARTICIPATING_INSTITUTIONS_TABLE_MIN_SCROLL_X)
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

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const minW = PARTICIPATING_INSTITUTIONS_TABLE_MIN_SCROLL_X
    const update = () => {
      const w = el.getBoundingClientRect().width
      setTableScrollX(Math.max(minW, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewMode])

  const filterTableValues = useMemo(
    () => ({
      schoolName: pendingFilters.schoolName,
      institutionSido: pendingFilters.institutionSido,
      institutionSigungu: pendingFilters.institutionSigungu,
      educationGrade:
        pendingFilters.educationGrade === 'all' ? '' : pendingFilters.educationGrade,
      textbookStatus:
        pendingFilters.textbookStatus === 'all' ? '' : pendingFilters.textbookStatus,
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

  const progressFilters: ProgressFilters = useMemo(
    () => ({
      schoolName: appliedFilters.schoolName,
      region: 'all',
      institutionSido: appliedFilters.institutionSido,
      institutionSigungu: appliedFilters.institutionSigungu,
      educationGrade: appliedFilters.educationGrade,
      lectureRound: 'all',
      textbookStatus: appliedFilters.textbookStatus,
      settlementStatus: 'all',
      teacherName: appliedFilters.teacherName,
    }),
    [appliedFilters]
  )

  const instructorHook = useProgressInstructorList({ appliedFilters: progressFilters })
  const schoolHook = useProgressSchoolList({
    appliedFilters: progressFilters,
    instructorList: instructorHook.instructorList,
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
  } = schoolHook

  /** URL schoolId로 선택된 학교 행 (인라인 상세 뷰용) */
  const selectedRowFromUrl = useMemo(() => {
    if (!schoolIdFromUrl) return null
    return filteredSchools.find(r => r.id === schoolIdFromUrl) ?? null
  }, [schoolIdFromUrl, filteredSchools])

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

  const showTextbookFeatures = program ? programUsesTextbook(program) : true

  const filterFields = useMemo(
    () =>
      showTextbookFeatures
        ? participatingInstitutionsFilterFields
        : participatingInstitutionsFilterFields.filter(field => field.key !== 'textbookStatus'),
    [showTextbookFeatures]
  )

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
        render: (region: string | undefined) => formatInstitutionRegionForTableDisplay(region),
      },
      {
        title: '교육 진행 일정',
        key: 'sessions',
        width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        className: 'participating-institutions-section__th-sessions',
        onHeaderCell: () => ({
          className: 'participating-institutions-section__th-sessions',
        }),
        onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
        render: (_: unknown, record: ParticipatingSchoolRow) => {
          const sessions = record.sessions ?? []
          const total = sessions.length
          const showCount = total <= 3 ? total : 2
          const displaySessions = sessions.slice(0, showCount)
          const restCount = total - showCount
          return (
            <div className="participating-institutions-section__sessions-cell">
              {displaySessions.map((s, index) => (
                <div
                  key={`${record.id}-session-${s.round}-${index}`}
                  className="participating-institutions-section__session-line"
                >
                  {formatSessionLine(s)}
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
      ...(showTextbookFeatures
        ? [
            {
              title: '교재 배송 현황',
              dataIndex: 'textbookStatus',
              key: 'textbookStatus',
              width: PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_COLUMN_WIDTH,
              align: 'center' as const,
              onCell: () => ({
                className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME}`,
              }),
              render: (status: TextbookStatusKey, record: ParticipatingSchoolRow) => (
                <StatusDropdownCell<TextbookStatusKey>
                  status={status ?? null}
                  statusOptions={textbookStatusKeys}
                  renderBadge={s => <TextbookStatusBadge status={s} />}
                  isItemDisabled={(cur, opt) => cur === opt}
                  onChange={key => handleTextbookStatusChange(record.id, key)}
                  isOpen={openTextbookDropdownId === record.id}
                  onOpenChange={open => setOpenTextbookDropdownId(open ? record.id : null)}
                  emptyPlaceholder="-"
                  style={PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_DROPDOWN_STYLE}
                  tagLayout="tag100"
                />
              ),
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
        title: '대상 학급 수',
        dataIndex: 'classCount',
        key: 'classCount',
        width: 100,
        align: 'center',
        render: (v: number) => (v != null ? `${v}개` : '-'),
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
    ],
    [handleTextbookStatusChange, openTextbookDropdownId, showTextbookFeatures]
  )

  if (selectedRowFromUrl && program) {
    const baseDetail = getSchoolDetailByRow(selectedRowFromUrl)
    const schoolId = selectedRowFromUrl.id
    const mergedDetail = {
      ...baseDetail,
      ...savedBasicPatches[schoolId],
      instructors:
        savedInstructorPatches[schoolId] !== undefined
          ? savedInstructorPatches[schoolId].map(inv => ({
              ...inv,
              settlementStatus: 'pending' as SettlementStatusKey,
            }))
          : getInstructorRowsForSchool(
              selectedRowFromUrl.schoolName,
              instructorHook.instructorList
            ),
    }
    return (
      <div className="program-status-participating participating-institutions-section">
        <GeneralParticipatingInstitutionDetailView
          program={program}
          detail={mergedDetail}
          row={selectedRowFromUrl}
          participatingSchoolList={schoolList}
          activeTab={schoolTabFromUrl ?? undefined}
          onTabChange={onSchoolTabChange}
          onClearSchoolId={onClearSchoolId ?? (() => {})}
          onSaveBasicInfo={patch => {
            setSavedBasicPatches(prev => ({
              ...prev,
              [patch.id]: { ...prev[patch.id], ...patch },
            }))
          }}
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
    <div className="program-status-participating participating-institutions-section">
      <FilterTableLayout
        className="participating-institutions-section__filter-layout"
        bordered={false}
        fields={filterFields}
        filters={filterTableValues}
        onFilterChange={handleFilterChange}
        onSearch={handleFilterSearch}
        title="교육 참여 기관 목록"
        description={`${filteredSchools.length}건`}
        actions={
          viewMode === 'list' ? (
            <CmsButton
              variant="secondary"
              size="large"
              style={{ minWidth: 180 }}
              icon={<CalendarOutlined />}
              onClick={handleCalendarView}
            >
              캘린더 뷰로 보기
            </CmsButton>
          ) : (
            <CmsButton
              variant="secondary"
              size="large"
              style={{ minWidth: 180 }}
              icon={<UnorderedListOutlined />}
              onClick={handleListView}
            >
              리스트 뷰로 보기
            </CmsButton>
          )
        }
        excelExport={{
          columns,
          data: filteredSchools,
        }}
      >
        {viewMode === 'list' ? (
          <div ref={tableWrapRef} className="participating-institutions-section__table-wrap">
            <Table<ParticipatingSchoolRow>
              className="cms-data-table participating-institutions-section__table participating-institutions-section__table--textbook-dropdown"
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: tableScrollX }}
              columns={columns}
              dataSource={filteredSchools}
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
            />
          </div>
        )}
      </FilterTableLayout>

      {viewMode === 'calendar' ? (
        <div className="participating-institutions-section__page-bottom-spacer" aria-hidden />
      ) : null}

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
                  const instructors =
                    savedInstructors !== undefined
                      ? savedInstructors.map(inv => ({
                          ...inv,
                          settlementStatus: 'pending' as SettlementStatusKey,
                        }))
                      : getInstructorRowsForSchool(schoolName, instructorHook.instructorList)
                  return {
                    ...base,
                    ...savedBasicPatches[schoolId],
                    instructors,
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
          onCancelApproval={handleSchoolApprovalCancel}
        />
      )}

    </div>
  )
}
