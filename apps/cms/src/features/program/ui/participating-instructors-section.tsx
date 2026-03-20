/**
 * 참여 강사 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여 강사)
 * 필터(쿼리 파라미터 연동) + 테이블(교육 참여 강사 목록, 정산현황 텍스트 컬러) + 액션 버튼
 */

import { useMemo, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { Table, Row, Col, Select, Input, Checkbox } from 'antd'
import {
  CalendarOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { AppButton } from '@/shared/ui/app-button'
import type { ColumnsType } from 'antd/es/table'
import { message } from 'antd'
import {
  SETTLEMENT_STATUS_LABELS,
  type ParticipatingInstructorRow,
  type SettlementStatusKey,
  MOCK_PARTICIPATING_INSTRUCTORS,
} from '@/data/mock/participating-instructors'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { useParticipatingInstructorsParams } from '../hooks/use-participating-instructors-params'
import type { ProgressFilters } from '../hooks/use-program-progress-params'
import { useProgressInstructorList } from '../hooks/use-progress-instructor-list'
import { DeleteGuideModal, buildInstructorMessageLines } from './manager-delete-guide-modal'
import { AddInstructorModal, type AddInstructorFormValues } from './add-instructor-modal'
import { ApplicantInstructorDetailModal } from './applicant-instructor-detail-modal'
import { MOCK_PARTICIPATING_SCHOOLS } from '@/data/mock/participating-schools'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import { ParticipatingInstitutionsCalendarView } from './participating-institutions-calendar-view'
import './participating-institutions-section.css'
import './program-progress-tab.css'
import './participating-instructors-section.css'

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

const JA_LECTURE_EXPERIENCE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '1년', value: '1' },
  { label: '2년', value: '2' },
  { label: '3년', value: '3' },
  { label: '5년', value: '5' },
]

const JA_EVALUATION_GRADE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: 'A등급', value: 'A등급' },
  { label: 'B등급', value: 'B등급' },
  { label: 'C등급', value: 'C등급' },
]

const EDUCATION_ASSIGNMENT_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '진행 전', value: '진행 전' },
  { label: '1회차', value: '1회차' },
  { label: '2회차', value: '2회차' },
  { label: '진행 완료', value: '진행 완료' },
]

/** 해당 날짜에 교육 일정이 있는 참여 학교명 목록 (캘린더 셀 클릭 시 우측 강사 목록 필터용) */
function getSchoolNamesForDate(schools: ParticipatingSchoolRow[], date: Dayjs): string[] {
  const names = new Set<string>()
  for (const school of schools) {
    const sessions = school.sessions ?? []
    for (const session of sessions) {
      const normalized = session.date.replace(/\s/g, '').replace(/\./g, '-')
      const sessionDate = dayjs(normalized)
      if (sessionDate.isSame(date, 'day')) {
        names.add(school.schoolName)
        break
      }
    }
  }
  return Array.from(names)
}

export interface ParticipatingInstructorsSectionProps {
  programId?: string
}

/** 참여 강사 행 → 상세 모달용 ApplicantInstructorRow 변환 */
function participatingToApplicantRow(row: ParticipatingInstructorRow): ApplicantInstructorRow {
  const extended = MOCK_PARTICIPATING_INSTRUCTORS.find(m => m.id === row.id) ?? null
  const r: ParticipatingInstructorRow = extended ? { ...row, ...extended } : row
  return {
    id: r.id,
    no: r.no,
    instructorName: r.instructorName,
    schoolName: r.schoolName,
    contact: r.contact ?? '-',
    email: r.email ?? '-',
    address: r.address ?? '-',
    approvalStatus: 'approved',
    lectureExperienceYears: r.lectureExperienceYears ?? 0,
    educationLevel: r.educationLevel ?? '-',
    educationSchoolName: r.educationSchoolName ?? '-',
    nameHanja: r.nameHanja,
    nameEnglish: r.nameEnglish,
    birthDate: r.birthDate,
    age: r.age,
    gender: r.gender,
    militaryStatus: r.militaryStatus,
    bankName: r.bankName,
    accountNumber: r.accountNumber,
    accountHolder: r.accountHolder,
    profileImageUrl: r.profileImageUrl,
    oneLineIntro: r.oneLineIntro,
    careerDetails: r.careerDetails,
    qualifications: r.qualifications,
    awards: r.awards,
    educations: r.educations,
    freeWriting1: r.freeWriting1,
    freeWriting2: r.freeWriting2,
    freeWriting3: r.freeWriting3,
    freeWriting4: r.freeWriting4,
  }
}

function getSettlementTextClass(status: SettlementStatusKey): string {
  const base = 'participating-instructors-section__settlement-text'
  return `${base} ${base}--${status}`
}

export function ParticipatingInstructorsSection({
  programId: _programId,
}: ParticipatingInstructorsSectionProps) {
  const { filters, appliedFilters, setFilter, applyFilters } = useParticipatingInstructorsParams()
  const [localInstructorName, setLocalInstructorName] = useState(() => filters.instructorName)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Dayjs>(() => dayjs())

  useEffect(() => {
    setLocalInstructorName(filters.instructorName)
  }, [filters.instructorName])

  const progressFilters: ProgressFilters = useMemo(
    () => ({
      schoolName: '',
      region: 'all',
      educationGrade: 'all',
      lectureRound: appliedFilters.educationAssignmentStatus || 'all',
      textbookStatus: 'all',
      settlementStatus: 'all',
      teacherName: appliedFilters.instructorName,
    }),
    [appliedFilters.educationAssignmentStatus, appliedFilters.instructorName]
  )

  const {
    filteredInstructors: baseFiltered,
    selectedInstructorRowKeys,
    setSelectedInstructorRowKeys,
    selectedInstructorForDetail,
    setSelectedInstructorForDetail,
    instructorDetailModalOpen,
    setInstructorDetailModalOpen,
    addInstructorModalOpen,
    setAddInstructorModalOpen,
    handleAddInstructor,
    handleInstructorDeleteClick,
    handleInstructorDeleteConfirm,
    instructorNamesToDelete,
    instructorDeleteGuideOpen,
    setInstructorDeleteGuideOpen,
  } = useProgressInstructorList({
    appliedFilters: progressFilters,
    preferMock: true,
  })

  const filteredInstructors = useMemo(() => {
    return baseFiltered.filter(row => {
      if (
        appliedFilters.region &&
        appliedFilters.region !== 'all' &&
        !(row.region ?? row.address ?? '').includes(appliedFilters.region)
      )
        return false
      if (appliedFilters.jaLectureExperience && appliedFilters.jaLectureExperience !== 'all') {
        const years = row.lectureExperienceYears ?? 0
        if (String(years) !== appliedFilters.jaLectureExperience) return false
      }
      if (
        appliedFilters.jaEvaluationGrade &&
        appliedFilters.jaEvaluationGrade !== 'all' &&
        row.jaEvaluationGrade !== appliedFilters.jaEvaluationGrade
      )
        return false
      return true
    })
  }, [
    baseFiltered,
    appliedFilters.region,
    appliedFilters.jaLectureExperience,
    appliedFilters.jaEvaluationGrade,
  ])

  /** 캘린더에서 선택한 날짜에 교육이 있는 학교에 배정된 강사만 우측 카드에 표시 */
  const instructorsForCalendarDate = useMemo(() => {
    const schoolNamesOnDate = getSchoolNamesForDate(
      MOCK_PARTICIPATING_SCHOOLS,
      calendarSelectedDate
    )
    if (schoolNamesOnDate.length === 0) return []
    return filteredInstructors.filter(row => schoolNamesOnDate.includes(row.schoolName))
  }, [filteredInstructors, calendarSelectedDate])

  const handleSearch = () => {
    applyFilters({ instructorName: localInstructorName })
  }

  const handleCalendarView = () => setViewMode('calendar')
  const handleListView = () => setViewMode('list')

  const handleInfoDetailClick = () => {
    if (selectedInstructorRowKeys.length !== 1) {
      message.warning('정보 상세 보기를 하려면 강사를 1명 선택해 주세요.')
      return
    }
    const row = filteredInstructors.find(r => r.id === selectedInstructorRowKeys[0])
    if (row) {
      setSelectedInstructorForDetail(row)
      setInstructorDetailModalOpen(true)
    }
  }

  const tableScrollX = 48 + 64 + 100 + 140 + 160 + 100 + 100 + 120 + 140 + 120

  const columns: ColumnsType<ParticipatingInstructorRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 100,
      },
      {
        title: '거주 지역',
        key: 'region',
        width: 140,
        render: (_: unknown, record: ParticipatingInstructorRow) =>
          record.region ?? record.address ?? '-',
      },
      {
        title: '참여 학교',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 160,
        ellipsis: true,
      },
      {
        title: 'JA 강의 경력',
        key: 'lectureExperienceYears',
        width: 100,
        align: 'center',
        render: (_: unknown, record: ParticipatingInstructorRow) =>
          record.lectureExperienceYears != null ? `${record.lectureExperienceYears}년` : '-',
      },
      {
        title: 'JA 평가 등급',
        dataIndex: 'jaEvaluationGrade',
        key: 'jaEvaluationGrade',
        width: 100,
        align: 'center',
        render: (v: string) => v ?? '-',
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 120,
        render: (v: string) => v ?? '-',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 140,
        ellipsis: true,
        render: (v: string) => v ?? '-',
      },
      {
        title: '정산현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 120,
        align: 'center',
        render: (status: SettlementStatusKey) => (
          <span className={getSettlementTextClass(status)}>{SETTLEMENT_STATUS_LABELS[status]}</span>
        ),
      },
    ],
    []
  )

  return (
    <div className="participating-instructors-section participating-institutions-section">
      <div className="participating-institutions-section__filters program-progress-tab__filters">
        <Row
          gutter={[0, 0]}
          align="bottom"
          wrap={false}
          className="program-progress-tab__filter-row"
        >
          <Col flex="0 0 auto" className="program-progress-tab__filter-col">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">강사명</span>
              <Input
                placeholder="강사명을 입력하세요"
                value={localInstructorName}
                onChange={e => setLocalInstructorName(e.target.value)}
                allowClear
                className="participating-institutions-section__filter-input"
              />
            </div>
          </Col>
          <Col flex="0 0 auto" className="program-progress-tab__filter-col">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">거주 지역</span>
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
              <span className="program-progress-tab__filter-label">JA 강의 이력</span>
              <Select
                placeholder="전체"
                value={filters.jaLectureExperience || undefined}
                onChange={v => setFilter('jaLectureExperience', v ?? 'all')}
                allowClear
                options={JA_LECTURE_EXPERIENCE_OPTIONS}
                getPopupContainer={() => document.body}
              />
            </div>
          </Col>
          <Col flex="0 0 auto" className="program-progress-tab__filter-col">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">JA 평가 등급</span>
              <Select
                placeholder="전체"
                value={filters.jaEvaluationGrade || undefined}
                onChange={v => setFilter('jaEvaluationGrade', v ?? 'all')}
                allowClear
                options={JA_EVALUATION_GRADE_OPTIONS}
                getPopupContainer={() => document.body}
              />
            </div>
          </Col>
          <Col flex="0 0 auto" className="program-progress-tab__filter-col">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">교육 예정 현황</span>
              <Select
                placeholder="전체"
                value={filters.educationAssignmentStatus || undefined}
                onChange={v => setFilter('educationAssignmentStatus', v ?? 'all')}
                allowClear
                options={EDUCATION_ASSIGNMENT_OPTIONS}
                getPopupContainer={() => document.body}
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
            <span className="participating-institutions-section__table-title">
              교육 참여 강사 목록
            </span>
            <span className="participating-institutions-section__table-description">
              {filteredInstructors.length}건
            </span>
          </div>
          <div className="participating-institutions-section__table-actions">
            {viewMode === 'list' ? (
              <AppButton
                variant="cancel"
                size="filter-wide"
                icon={<CalendarOutlined />}
                onClick={handleCalendarView}
              >
                캘린더 뷰로 보기
              </AppButton>
            ) : (
              <AppButton
                variant="cancel"
                size="filter-wide"
                icon={<UnorderedListOutlined />}
                onClick={handleListView}
              >
                리스트 뷰로 보기
              </AppButton>
            )}
            <AppButton
              variant="cancel"
              size="filter-wide"
              icon={<DownloadOutlined />}
              onClick={() => message.info('활동확인서 발급 기능 준비 중입니다.')}
            >
              활동확인서 발급
            </AppButton>
            <AppButton variant="danger" size="filter" onClick={handleInstructorDeleteClick}>
              강사 삭제
            </AppButton>
            <AppButton
              variant="primary"
              size="filter"
              onClick={() => setAddInstructorModalOpen(true)}
              className="participating-institutions-section__btn-approve"
            >
              강사 등록
            </AppButton>
            {viewMode === 'list' && (
              <AppButton
                variant="primary"
                size="filter"
                icon={<InfoCircleOutlined />}
                onClick={handleInfoDetailClick}
                disabled={selectedInstructorRowKeys.length !== 1}
              >
                정보 상세 보기
              </AppButton>
            )}
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="participating-institutions-section__table-wrap">
            <Table<ParticipatingInstructorRow>
              className="participating-institutions-section__table participating-institutions-section__table--clickable"
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: tableScrollX }}
              columns={columns}
              dataSource={filteredInstructors}
              rowSelection={{
                selectedRowKeys: selectedInstructorRowKeys,
                onChange: keys => setSelectedInstructorRowKeys(keys as string[]),
              }}
              onRow={record => ({
                onClick: e => {
                  const target = e.target as HTMLElement
                  if (
                    target.closest('.ant-table-selection-column') ||
                    target.closest('.ant-checkbox-wrapper')
                  )
                    return
                  setSelectedInstructorForDetail(record)
                  setInstructorDetailModalOpen(true)
                },
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        ) : (
          <ParticipatingInstitutionsCalendarView
            schools={MOCK_PARTICIPATING_SCHOOLS}
            selectedRowKeys={[]}
            onSelectionChange={() => {}}
            onSchoolClick={() => {}}
            onDateSelect={setCalendarSelectedDate}
            rightContent={
              <div className="participating-instructors-section__calendar-right-cards">
                {instructorsForCalendarDate.map(row => (
                  <div
                    key={row.id}
                    className="participating-instructors-section__calendar-card"
                    role="button"
                    tabIndex={0}
                    onClick={e => {
                      const target = e.target as HTMLElement
                      if (target.closest('.ant-checkbox-wrapper')) return
                      setSelectedInstructorForDetail(row)
                      setInstructorDetailModalOpen(true)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedInstructorForDetail(row)
                        setInstructorDetailModalOpen(true)
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedInstructorRowKeys.includes(row.id)}
                      onChange={e => {
                        e.stopPropagation()
                        const next = e.target.checked
                          ? [...selectedInstructorRowKeys, row.id]
                          : selectedInstructorRowKeys.filter(k => k !== row.id)
                        setSelectedInstructorRowKeys(next)
                      }}
                      onClick={e => e.stopPropagation()}
                      className="participating-instructors-section__calendar-card-checkbox"
                    />
                    <div className="participating-instructors-section__calendar-card-body">
                      <div className="participating-instructors-section__calendar-card-header">
                        <span className="participating-instructors-section__calendar-card-name">
                          {row.instructorName}
                        </span>
                        <span className="participating-instructors-section__calendar-card-divider">
                          |
                        </span>
                        <span className="participating-instructors-section__calendar-card-region">
                          {row.region ?? row.address ?? '-'}
                        </span>
                      </div>
                      <div className="participating-instructors-section__calendar-card-tags">
                        <span className="participating-instructors-section__calendar-card-tag">
                          경력 :{' '}
                          {row.lectureExperienceYears != null
                            ? `${row.lectureExperienceYears}년`
                            : '-'}
                        </span>
                        <span className="participating-instructors-section__calendar-card-tag">
                          등급 : {row.jaEvaluationGrade ?? '-'}
                        </span>
                        <span
                          className={
                            'participating-instructors-section__calendar-card-tag participating-instructors-section__calendar-card-tag--settlement participating-instructors-section__calendar-card-tag--' +
                            row.settlementStatus
                          }
                        >
                          {SETTLEMENT_STATUS_LABELS[row.settlementStatus]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }
          />
        )}
      </div>

      <AddInstructorModal
        open={addInstructorModalOpen}
        onCancel={() => setAddInstructorModalOpen(false)}
        onAdd={(values: AddInstructorFormValues) => {
          handleAddInstructor(values)
          setAddInstructorModalOpen(false)
        }}
      />

      <DeleteGuideModal
        open={instructorDeleteGuideOpen}
        onCancel={() => setInstructorDeleteGuideOpen(false)}
        onConfirm={handleInstructorDeleteConfirm}
        title="강사 삭제 안내"
        lines={buildInstructorMessageLines(instructorNamesToDelete)}
        confirmText="삭제"
        confirmVariant="danger"
      />

      <ApplicantInstructorDetailModal
        open={instructorDetailModalOpen}
        onCancel={() => {
          setInstructorDetailModalOpen(false)
          setSelectedInstructorForDetail(null)
        }}
        instructor={
          selectedInstructorForDetail
            ? participatingToApplicantRow(selectedInstructorForDetail)
            : null
        }
        title="참여 강사 상세 정보"
        showApprovalButtons={false}
      />
    </div>
  )
}
