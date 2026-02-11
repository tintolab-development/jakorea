/**
 * 프로그램 상세 - 프로그램 진행현황 탭
 * 탭(참여 학교 정보 | 강사 정보)과 필터가 같은 레벨 한 줄 배치, 쿼리 파라미터 연동
 */

import { useMemo, useState } from 'react'
import { Card, Table, Button, Tag, Row, Col, Select, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  useProgramProgressParams,
  type ProgressFilters,
} from '../hooks/use-program-progress-params'
import {
  MOCK_PARTICIPATING_SCHOOLS,
  TEXTBOOK_STATUS_LABELS,
  type ParticipatingSchoolRow,
  type TextbookStatusKey,
} from '@/data/mock/participating-schools'
import {
  MOCK_PARTICIPATING_INSTRUCTORS,
  SETTLEMENT_STATUS_LABELS,
  type ParticipatingInstructorRow,
  type SettlementStatusKey,
} from '@/data/mock/participating-instructors'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import {
  AddInstructorModal,
  buildInstructorRowFromForm,
  type AddInstructorFormValues,
} from './add-instructor-modal'
import './program-progress-tab.css'

const PARTICIPATING_SCHOOL_TAB = 'schools'
const INSTRUCTOR_TAB = 'instructors'

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

const LECTURE_ROUND_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '진행 전', value: '진행 전' },
  { label: '1회차', value: '1회차' },
  { label: '2회차', value: '2회차' },
  { label: '진행 완료', value: '진행 완료' },
]

const TEXTBOOK_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: TEXTBOOK_STATUS_LABELS.preparing, value: 'preparing' },
  { label: TEXTBOOK_STATUS_LABELS.shipping, value: 'shipping' },
  { label: TEXTBOOK_STATUS_LABELS.delivered, value: 'delivered' },
]

const SETTLEMENT_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: SETTLEMENT_STATUS_LABELS.pending, value: 'pending' },
  { label: SETTLEMENT_STATUS_LABELS.partial, value: 'partial' },
  { label: SETTLEMENT_STATUS_LABELS.completed, value: 'completed' },
  { label: SETTLEMENT_STATUS_LABELS.na, value: 'na' },
]

interface ProgramProgressTabProps {
  programId: string
}

export function ProgramProgressTab({ programId: _programId }: ProgramProgressTabProps) {
  const { subTab, filters, setSubTab, setFilter } = useProgramProgressParams()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  /** 조회 버튼 클릭 시에만 반영되는 필터 (테이블 필터링에 사용) */
  const [appliedFilters, setAppliedFilters] = useState<ProgressFilters>(filters)
  /** 강사 목록 (초기 mock, 추가/삭제 반영) */
  const [instructorList, setInstructorList] = useState<ParticipatingInstructorRow[]>(
    () => MOCK_PARTICIPATING_INSTRUCTORS
  )
  const [addInstructorModalOpen, setAddInstructorModalOpen] = useState(false)

  const filteredSchools = useMemo(() => {
    return MOCK_PARTICIPATING_SCHOOLS.filter(row => {
      if (
        appliedFilters.region &&
        appliedFilters.region !== 'all' &&
        !row.region.includes(appliedFilters.region)
      )
        return false
      if (
        appliedFilters.educationGrade &&
        appliedFilters.educationGrade !== 'all' &&
        row.educationGrade !== appliedFilters.educationGrade
      )
        return false
      if (
        appliedFilters.lectureRound &&
        appliedFilters.lectureRound !== 'all' &&
        row.lectureRound !== appliedFilters.lectureRound
      )
        return false
      if (
        appliedFilters.textbookStatus &&
        appliedFilters.textbookStatus !== 'all' &&
        row.textbookStatus !== appliedFilters.textbookStatus
      )
        return false
      const keyword = (appliedFilters.teacherName || '').trim()
      if (keyword) {
        const lower = keyword.toLowerCase()
        if (
          !row.teacherName.toLowerCase().includes(lower) &&
          !row.instructors.toLowerCase().includes(lower)
        )
          return false
      }
      return true
    })
  }, [appliedFilters])

  const filteredInstructors = useMemo(() => {
    return instructorList.filter(row => {
      if (
        appliedFilters.educationGrade &&
        appliedFilters.educationGrade !== 'all' &&
        row.educationGrade !== appliedFilters.educationGrade
      )
        return false
      if (
        appliedFilters.lectureRound &&
        appliedFilters.lectureRound !== 'all' &&
        row.lectureRound !== appliedFilters.lectureRound
      )
        return false
      if (
        appliedFilters.settlementStatus &&
        appliedFilters.settlementStatus !== 'all' &&
        row.settlementStatus !== appliedFilters.settlementStatus
      )
        return false
      const keyword = (appliedFilters.teacherName || '').trim()
      if (keyword) {
        const lower = keyword.toLowerCase()
        if (
          !row.instructorName.toLowerCase().includes(lower) &&
          !row.teacherName.toLowerCase().includes(lower)
        )
          return false
      }
      return true
    })
  }, [instructorList, appliedFilters])

  const handleAddInstructor = (values: AddInstructorFormValues) => {
    const nextNo = instructorList.length > 0 ? Math.max(...instructorList.map(r => r.no)) + 1 : 1
    const nextId = `instructor-new-${Date.now()}`
    const newRow = buildInstructorRowFromForm(values, nextNo, nextId)
    setInstructorList(prev => [newRow, ...prev])
    message.success('강사가 추가되었습니다.')
  }

  const handleSearch = () => {
    setAppliedFilters(filters)
  }

  const handleSchoolDelete = () => {
    if (selectedRowKeys.length === 0) return
    setSelectedRowKeys([])
  }

  const handleInstructorDelete = () => {
    if (selectedRowKeys.length === 0) return
    setInstructorList(prev => prev.filter(row => !selectedRowKeys.includes(row.id)))
    setSelectedRowKeys([])
  }

  const columns: ColumnsType<ParticipatingSchoolRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center' },
      {
        title: '참여 학교명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 180,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '지역',
        dataIndex: 'region',
        key: 'region',
        width: 140,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '교육 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 90,
        align: 'center',
      },
      {
        title: '교육 학급 수',
        dataIndex: 'classCount',
        key: 'classCount',
        width: 90,
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
        title: '강의 진행 회차',
        dataIndex: 'lectureRound',
        key: 'lectureRound',
        width: 120,
        align: 'center',
      },
      {
        title: '교재 현황',
        dataIndex: 'textbookStatus',
        key: 'textbookStatus',
        width: 140,
        align: 'center',
        render: (status: TextbookStatusKey) => (
          <Tag
            className={`program-progress-tab__textbook-tag program-progress-tab__textbook-tag--${status}`}
            style={{ margin: 0 }}
          >
            {TEXTBOOK_STATUS_LABELS[status]}
          </Tag>
        ),
      },
      {
        title: '담당 교사',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 110,
        align: 'center',
      },
      {
        title: '담당 강사진',
        dataIndex: 'instructors',
        key: 'instructors',
        width: 160,
        align: 'center',
        ellipsis: true,
      },
    ],
    []
  )

  const instructorColumns: ColumnsType<ParticipatingInstructorRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center' },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 110,
        align: 'center',
      },
      {
        title: '참여 학교명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 180,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '교육 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 90,
        align: 'center',
      },
      {
        title: '교육 학급 수',
        dataIndex: 'classCount',
        key: 'classCount',
        width: 90,
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
        title: '강의 진행 회차',
        dataIndex: 'lectureRound',
        key: 'lectureRound',
        width: 120,
        align: 'center',
      },
      {
        title: '정산 현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 160,
        align: 'center',
        render: (status: SettlementStatusKey) => (
          <Tag
            className={`program-progress-tab__settlement-tag program-progress-tab__settlement-tag--${status}`}
            style={{ margin: 0 }}
          >
            {SETTLEMENT_STATUS_LABELS[status]}
          </Tag>
        ),
      },
      {
        title: '담당 교사',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 110,
        align: 'center',
      },
    ],
    []
  )

  return (
    <div className="program-progress-tab">
      {/* 전체(탭·필터·테이블)를 배경 #fff 카드 래퍼 하나로 감쌈. 탭/필터는 카드가 아닌 카드 내부 상단. 디바이더로 테이블과 구분 */}
      <Card className="program-progress-tab__card" bordered={false}>
        <div className="program-progress-tab__top">
          <div className="program-progress-tab__bar-inner">
            <div className="program-progress-tab__tabs">
              <button
                type="button"
                className={`program-progress-tab__tab-btn ${subTab === PARTICIPATING_SCHOOL_TAB ? 'program-progress-tab__tab-btn--active' : ''}`}
                onClick={() => setSubTab(PARTICIPATING_SCHOOL_TAB)}
              >
                참여 학교 정보
              </button>
              <button
                type="button"
                className={`program-progress-tab__tab-btn ${subTab === INSTRUCTOR_TAB ? 'program-progress-tab__tab-btn--active' : ''}`}
                onClick={() => setSubTab(INSTRUCTOR_TAB)}
              >
                강사 정보
              </button>
            </div>
            <div className="program-progress-tab__filters">
              <Row
                gutter={[16, 16]}
                align="middle"
                wrap={false}
                className="program-progress-tab__filter-row"
              >
                {subTab === PARTICIPATING_SCHOOL_TAB && (
                  <Col flex="0 1 auto" className="program-progress-tab__filter-col">
                    <div className="program-progress-tab__filter-field">
                      <span className="program-progress-tab__filter-label">지역</span>
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
                )}
                <Col flex="0 1 auto" className="program-progress-tab__filter-col">
                  <div className="program-progress-tab__filter-field">
                    <span className="program-progress-tab__filter-label">교육 학년</span>
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
                <Col flex="0 1 auto" className="program-progress-tab__filter-col">
                  <div className="program-progress-tab__filter-field">
                    <span className="program-progress-tab__filter-label">강의 진행 회차</span>
                    <Select
                      placeholder="전체"
                      value={filters.lectureRound || undefined}
                      onChange={v => setFilter('lectureRound', v ?? 'all')}
                      allowClear
                      options={LECTURE_ROUND_OPTIONS}
                      getPopupContainer={() => document.body}
                    />
                  </div>
                </Col>
                {subTab === PARTICIPATING_SCHOOL_TAB && (
                  <Col flex="0 1 auto" className="program-progress-tab__filter-col">
                    <div className="program-progress-tab__filter-field">
                      <span className="program-progress-tab__filter-label">교재 현황</span>
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
                {subTab === INSTRUCTOR_TAB && (
                  <Col flex="0 1 auto" className="program-progress-tab__filter-col">
                    <div className="program-progress-tab__filter-field">
                      <span className="program-progress-tab__filter-label">정산 현황</span>
                      <Select
                        placeholder="전체"
                        value={filters.settlementStatus || undefined}
                        onChange={v => setFilter('settlementStatus', v ?? 'all')}
                        allowClear
                        options={SETTLEMENT_OPTIONS}
                        getPopupContainer={() => document.body}
                      />
                    </div>
                  </Col>
                )}
                <Col
                  flex="0 1 auto"
                  className="program-progress-tab__filter-col program-progress-tab__filter-col--search"
                >
                  <LabeledSearchInput
                    label="교사/강사명"
                    placeholder="전체"
                    value={filters.teacherName ?? ''}
                    onChange={v => setFilter('teacherName', v)}
                    width="100%"
                    showPrefixIcon={false}
                  />
                </Col>
                <Col flex="none" className="program-progress-tab__filter-col--btn">
                  <Button
                    type="default"
                    className="program-progress-tab__btn-search"
                    onClick={handleSearch}
                  >
                    조회
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </div>

        {subTab === PARTICIPATING_SCHOOL_TAB && (
          <>
            <div className="program-progress-tab__divider" />
            <div className="program-progress-tab__below-divider">
              <div className="program-progress-tab__table-header">
                <div className="program-progress-tab__table-heading">
                  <span className="program-progress-tab__table-title">수강 참여 학교 목록</span>
                  <span className="program-progress-tab__table-description">
                    총 {filteredSchools.length}건
                  </span>
                </div>
                <Button
                  danger
                  onClick={handleSchoolDelete}
                  disabled={selectedRowKeys.length === 0}
                  className="program-progress-tab__btn-delete-school"
                >
                  학교 삭제
                </Button>
              </div>
              <Table<ParticipatingSchoolRow>
                className="program-progress-tab__table"
                rowKey="id"
                size="middle"
                pagination={false}
                rowSelection={{
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys as string[]),
                }}
                columns={columns}
                dataSource={filteredSchools}
              />
            </div>
          </>
        )}

        {subTab === INSTRUCTOR_TAB && (
          <>
            <div className="program-progress-tab__divider" />
            <div className="program-progress-tab__below-divider">
              <div className="program-progress-tab__table-header">
                <div className="program-progress-tab__table-heading">
                  <span className="program-progress-tab__table-title">참여 강사진 목록</span>
                  <span className="program-progress-tab__table-description">
                    총 {filteredInstructors.length}건
                  </span>
                </div>
                <div className="program-progress-tab__table-actions">
                  <Button
                    danger
                    onClick={handleInstructorDelete}
                    disabled={selectedRowKeys.length === 0}
                    className="program-progress-tab__btn-delete-instructor"
                  >
                    강사 삭제
                  </Button>
                  <Button
                    type="primary"
                    className="program-progress-tab__btn-add-instructor"
                    onClick={() => setAddInstructorModalOpen(true)}
                  >
                    강사 추가
                  </Button>
                </div>
              </div>
              <Table<ParticipatingInstructorRow>
                className="program-progress-tab__table"
                rowKey="id"
                size="middle"
                pagination={false}
                rowSelection={{
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys as string[]),
                }}
                columns={instructorColumns}
                dataSource={filteredInstructors}
              />
            </div>
          </>
        )}
      </Card>

      <AddInstructorModal
        open={addInstructorModalOpen}
        onCancel={() => setAddInstructorModalOpen(false)}
        onAdd={handleAddInstructor}
      />
    </div>
  )
}
