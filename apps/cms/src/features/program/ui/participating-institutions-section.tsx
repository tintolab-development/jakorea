/**
 * 참여 기관 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여 기관)
 * 필터 + 테이블(교육 참여 기관 목록, 선택 반려/승인, 캘린더 뷰), 교재 배송 현황 StatusDropdownCell
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { Table, Row, Col, Select, Input } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { AppButton } from '@/shared/ui/app-button'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import {
  DeleteGuideModal,
  buildSchoolRejectMessageLines,
  buildSchoolApproveMessageLines,
} from './manager-delete-guide-modal'
import {
  TEXTBOOK_STATUS_LABELS,
  type ParticipatingSchoolRow,
  type TextbookStatusKey,
  type ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { useParticipatingInstitutionsParams } from '../hooks/use-participating-institutions-params'
import { useProgressSchoolList } from '../hooks/use-progress-school-list'
import { useProgressInstructorList } from '../hooks/use-progress-instructor-list'
import type { ProgressFilters } from '../hooks/use-program-progress-params'
import { SchoolDetailModal } from './school-detail-modal'
import { SchoolDetailFullpageView } from './school-detail-fullpage-view'
import { getSchoolDetailByRow } from '../lib/school-detail-mock'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'
import type { Program } from '@/types/domain'
import './participating-institutions-section.css'
import './program-progress-tab.css'

const REGION_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '서울', value: '서울' },
  { label: '부산', value: '부산' },
  { label: '대구', value: '대구' },
  { label: '인천', value: '인천' },
  { label: '광주', value: '광주' },
  { label: '대전', value: '대전' },
  { label: '울산', value: '울산' },
  { label: '세종', value: '세종' },
  { label: '경기', value: '경기' },
  { label: '강원', value: '강원' },
  { label: '충북', value: '충북' },
  { label: '충남', value: '충남' },
  { label: '전북', value: '전북' },
  { label: '전남', value: '전남' },
  { label: '경북', value: '경북' },
  { label: '경남', value: '경남' },
  { label: '제주', value: '제주' },
]

const GRADE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '1학년', value: '1학년' },
  { label: '2학년', value: '2학년' },
  { label: '3학년', value: '3학년' },
  { label: '4학년', value: '4학년' },
  { label: '5학년', value: '5학년' },
  { label: '6학년', value: '6학년' },
]

const TEXTBOOK_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: TEXTBOOK_STATUS_LABELS.preparing, value: 'preparing' },
  { label: TEXTBOOK_STATUS_LABELS.shipping, value: 'shipping' },
  { label: TEXTBOOK_STATUS_LABELS.delivered, value: 'delivered' },
]

const textbookStatusKeys: TextbookStatusKey[] = ['preparing', 'shipping', 'delivered']

/** 날짜·시간·교시 구간 텍스트 (디바이더는 JSX로 삽입) */
function getSessionLineParts(s: ParticipatingSchoolSession) {
  const datePart = `${s.date.replace(/\./g, '. ')}(${s.dayOfWeek})`
  const durationPart = `${s.duration} (${s.format})`
  const periodPart = `${s.classNum} (${s.timeRange.replace('~', ' ~ ')})`
  return { datePart, durationPart, periodPart }
}

export interface ParticipatingInstitutionsSectionProps {
  programId?: string
  /** 프로그램 정보. 교재 배송 현황 필터는 program에 교재 필드(textbookName 등)가 있을 때만 노출 */
  program?: Program | null
  /** URL의 schoolId. 있으면 해당 학교 상세 인라인 뷰 표시 */
  schoolIdFromUrl?: string | null
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
  onSchoolRowClick,
  onClearSchoolId,
  onSchoolDetailOpen,
  onSchoolDetailClose,
}: ParticipatingInstitutionsSectionProps) {
  const navigate = useNavigate()
  const prevSchoolIdFromUrl = useRef<string | null>(null)
  const { filters, appliedFilters, setFilter, applyFilters } = useParticipatingInstitutionsParams()
  const [localSchoolName, setLocalSchoolName] = useState(() => filters.schoolName)
  const [localTeacherName, setLocalTeacherName] = useState(() => filters.teacherName)
  const [openTextbookDropdownId, setOpenTextbookDropdownId] = useState<string | null>(null)
  const [bulkConfirmModal, setBulkConfirmModal] = useState<'reject' | 'approve' | null>(null)

  /** 쿼리 파라미터(URL)와 로컬 입력 동기화 */
  useEffect(() => {
    setLocalSchoolName(filters.schoolName)
    setLocalTeacherName(filters.teacherName)
  }, [filters.schoolName, filters.teacherName])

  /** 프로그램에 교재 배송 현황 필드가 있을 때만 교재 배송 현황 필터 노출 */
  const showTextbookFilter = useMemo(
    () => !!(program?.textbookName ?? program?.textbookNameEn),
    [program?.textbookName, program?.textbookNameEn]
  )

  const progressFilters: ProgressFilters = useMemo(
    () => ({
      schoolName: appliedFilters.schoolName,
      region: appliedFilters.region,
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
    filteredSchools,
    selectedSchoolRowKeys,
    setSelectedSchoolRowKeys,
    selectedSchoolForDetail,
    setSelectedSchoolForDetail,
    schoolDetailModalOpen,
    setSchoolDetailModalOpen,
    handleTextbookStatusChange,
    handleBulkRejectConfirm: hookBulkRejectConfirm,
    handleBulkApproveConfirm: hookBulkApproveConfirm,
    getInstructorDisplayForSchool,
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

  const handleSearch = () => {
    applyFilters({ schoolName: localSchoolName, teacherName: localTeacherName })
  }

  const handleBulkReject = () => {
    if (selectedSchoolRowKeys.length === 0) {
      message.warning('반려할 기관을 선택해 주세요.')
      return
    }
    setBulkConfirmModal('reject')
  }

  const handleBulkApprove = () => {
    if (selectedSchoolRowKeys.length === 0) {
      message.warning('승인할 기관을 선택해 주세요.')
      return
    }
    setBulkConfirmModal('approve')
  }

  const handleBulkRejectConfirm = () => {
    hookBulkRejectConfirm()
    setBulkConfirmModal(null)
  }

  const handleBulkApproveConfirm = () => {
    hookBulkApproveConfirm()
    setBulkConfirmModal(null)
  }

  const handleCalendarView = () => {
    navigate('/programs/education/schedule')
  }

  /** 컬럼 너비 합(체크박스 48 + 나머지): 강의 회차 컬럼은 내용 너비만 사용(1px로 예약) */
  const tableScrollX = 48 + 64 + 180 + 200 + 1 + 96 + 100 + 100 + 152 + 120 + 180

  const columns: ColumnsType<ParticipatingSchoolRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '참여 기관명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 180,
      },
      {
        title: '기관 지역',
        dataIndex: 'region',
        key: 'region',
        width: 200,
      },
      {
        title: '강의 회차 별 교육 진행 날짜',
        key: 'sessions',
        width: 1,
        onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
        render: (_: unknown, record: ParticipatingSchoolRow) => {
          const sessions = record.sessions ?? []
          const total = sessions.length
          const showCount = total <= 3 ? total : 2
          const displaySessions = sessions.slice(0, showCount)
          const restCount = total - showCount
          return (
            <div className="participating-institutions-section__sessions-cell">
              {displaySessions.map(s => {
                const { datePart, durationPart, periodPart } = getSessionLineParts(s)
                return (
                  <div key={s.round} className="participating-institutions-section__session-line">
                    <span className="participating-institutions-section__session-round-tag">
                      {s.round}차시
                    </span>
                    {datePart}
                    <span className="participating-institutions-section__session-divider" aria-hidden />
                    {durationPart}
                    <span className="participating-institutions-section__session-divider" aria-hidden />
                    {periodPart}
                  </div>
                )
              })}
              {restCount > 0 && (
                <div className="participating-institutions-section__session-more">
                  외 {restCount}개의 교육 일정
                </div>
              )}
            </div>
          )
        },
      },
      {
        title: '대상 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 96,
        align: 'center',
      },
      {
        title: '대상 학급수',
        dataIndex: 'classCount',
        key: 'classCount',
        width: 100,
        align: 'center',
        render: (v: number) => (v != null ? `${v}개` : '-'),
      },
      {
        title: '총 학생수',
        dataIndex: 'studentCount',
        key: 'studentCount',
        width: 100,
        align: 'center',
        render: (v: number) => (v != null ? `${v}명` : '-'),
      },
      {
        title: '교재 배송 현황',
        dataIndex: 'textbookStatus',
        key: 'textbookStatus',
        width: 152,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
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
          />
        ),
      },
      {
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 120,
        align: 'center',
      },
      {
        title: '담당 강사',
        key: 'instructors',
        width: 180,
        align: 'center',
        render: (_: unknown, record: ParticipatingSchoolRow) =>
          getInstructorDisplayForSchool(record.id, record.schoolName),
      },
    ],
    [handleTextbookStatusChange, getInstructorDisplayForSchool, openTextbookDropdownId]
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
      <div className="participating-institutions-section">
        <SchoolDetailFullpageView
          program={program}
          detail={mergedDetail}
          row={selectedRowFromUrl}
          onClearSchoolId={onClearSchoolId ?? (() => {})}
          onSaveBasicInfo={patch => {
            setSavedBasicPatches(prev => ({ ...prev, [patch.id]: patch }))
          }}
          onSaveInstructorInfo={(id, instructors) => {
            setSavedInstructorPatches(prev => ({ ...prev, [id]: instructors }))
          }}
          savedBasicPatches={savedBasicPatches}
          savedInstructorPatches={savedInstructorPatches}
          instructorList={instructorHook.instructorList}
        />
      </div>
    )
  }

  return (
    <div className="participating-institutions-section">
      <div className="participating-institutions-section__filters program-progress-tab__filters">
        <Row gutter={[0, 0]} align="bottom" wrap={false} className="program-progress-tab__filter-row">
          <Col flex="0 0 auto" className="program-progress-tab__filter-col">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">기관명</span>
              <Input
                placeholder="기관명을 입력하세요"
                value={localSchoolName}
                onChange={e => setLocalSchoolName(e.target.value)}
                allowClear
                className="participating-institutions-section__filter-input"
              />
            </div>
          </Col>
          <Col flex="0 0 auto" className="program-progress-tab__filter-col">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">기관 지역</span>
              <Select
                placeholder="전체"
                value={filters.region || undefined}
                onChange={v => setFilter('region', v ?? 'all')}
                allowClear
                options={REGION_OPTIONS}
                getPopupContainer={() => document.body}
              />
            </div>
          </Col>
          <Col flex="0 0 auto" className="program-progress-tab__filter-col">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">대상 학년</span>
              <Select
                placeholder="전체"
                value={filters.educationGrade || undefined}
                onChange={v => setFilter('educationGrade', v ?? 'all')}
                allowClear
                options={GRADE_OPTIONS}
                getPopupContainer={() => document.body}
              />
            </div>
          </Col>
          {showTextbookFilter && (
            <Col flex="0 0 auto" className="program-progress-tab__filter-col">
              <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
                <span className="program-progress-tab__filter-label">교재 배송 현황</span>
                <Select
                  placeholder="전체"
                  value={filters.textbookStatus || undefined}
                  onChange={v => setFilter('textbookStatus', v ?? 'all')}
                  allowClear
                  options={TEXTBOOK_OPTIONS}
                  getPopupContainer={() => document.body}
                />
              </div>
            </Col>
          )}
          <Col flex="0 0 auto" className="program-progress-tab__filter-col">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">담당 교사/강사명</span>
              <Input
                placeholder="교사/강사명을 입력하세요"
                value={localTeacherName}
                onChange={e => setLocalTeacherName(e.target.value)}
                allowClear
                className="participating-institutions-section__filter-input"
              />
            </div>
          </Col>
          <Col flex="none" className="program-progress-tab__filter-col--btn">
            <AppButton variant="primary" size="filter" onClick={handleSearch}>
              조회
            </AppButton>
          </Col>
        </Row>
      </div>

      <div className="participating-institutions-section__divider" />

      <div className="participating-institutions-section__below-divider">
        <div className="participating-institutions-section__table-header">
          <div className="participating-institutions-section__table-heading">
            <span className="participating-institutions-section__table-title">교육 참여 기관 목록</span>
            <span className="participating-institutions-section__table-description">
              {filteredSchools.length}건
            </span>
          </div>
          <div className="participating-institutions-section__table-actions">
            <AppButton variant="danger" size="large" onClick={handleBulkReject}>
              선택 반려
            </AppButton>
            <AppButton
              variant="primary"
              size="large"
              onClick={handleBulkApprove}
              className="participating-institutions-section__btn-approve"
            >
              선택 승인
            </AppButton>
            <AppButton
              variant="cancel"
              size="large"
              icon={<CalendarOutlined />}
              onClick={handleCalendarView}
            >
              캘린더 뷰로 보기
            </AppButton>
          </div>
        </div>

        <div className="participating-institutions-section__table-wrap">
          <Table<ParticipatingSchoolRow>
            className="participating-institutions-section__table participating-institutions-section__table--clickable"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: tableScrollX }}
            columns={columns}
            dataSource={filteredSchools}
            rowSelection={{
              selectedRowKeys: selectedSchoolRowKeys,
              onChange: keys => setSelectedSchoolRowKeys(keys as string[]),
            }}
            onRow={record => ({
              onClick: e => {
                const target = e.target as HTMLElement
                if (
                  target.closest('.ant-table-selection-column') ||
                  target.closest('.ant-checkbox-wrapper') ||
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
      </div>

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
        />
      )}

      {bulkConfirmModal === 'reject' && (
        <DeleteGuideModal
          open
          onCancel={() => setBulkConfirmModal(null)}
          onConfirm={handleBulkRejectConfirm}
          title="선택 반려 안내"
          lines={buildSchoolRejectMessageLines(selectedSchoolRowKeys.length)}
          confirmText="반려"
          confirmVariant="danger"
        />
      )}
      {bulkConfirmModal === 'approve' && (
        <DeleteGuideModal
          open
          onCancel={() => setBulkConfirmModal(null)}
          onConfirm={handleBulkApproveConfirm}
          title="선택 승인 안내"
          lines={buildSchoolApproveMessageLines(selectedSchoolRowKeys.length)}
          confirmText="승인"
          confirmVariant="primary"
        />
      )}
    </div>
  )
}
