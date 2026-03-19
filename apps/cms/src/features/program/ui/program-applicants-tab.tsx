/**
 * 프로그램 상세 - 신청자 목록 탭
 * 서브 탭(신청 학교 | 신청 강사) + 필터 + 조회 + 테이블 (진행 현황 탭 패턴 재사용)
 */

import { useMemo, useState, useCallback, useEffect } from 'react'
import { Card, Table, Row, Col, Select, message } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import type { ColumnsType } from 'antd/es/table'
import { useApplicantsTabParams, type ApplicantsFilters } from '../hooks/use-applicants-tab-params'
import {
  MOCK_APPLICANT_INSTITUTIONS,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import { getApplicantSchoolDetail } from '../lib/school-detail-mock'
import { SchoolDetailModal } from './school-detail-modal'
import { ApplicantInstructorDetailModal } from './applicant-instructor-detail-modal'
import {
  DeleteGuideModal,
  buildSchoolRejectMessageLines,
  buildSchoolApproveMessageLines,
  buildInstructorRejectMessageLines,
  buildInstructorApproveMessageLines,
} from './manager-delete-guide-modal'
import {
  MOCK_APPLICANT_INSTRUCTORS,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import {
  ApprovalStatusBadge,
  APPROVAL_STATUS_LABELS,
  type ApprovalStatusKey,
} from '@/shared/components/approval-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import './program-applicants-tab.css'

const SUB_TAB_SCHOOLS = 'schools'
const SUB_TAB_INSTRUCTORS = 'instructors'

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

const SCHOOL_OPTIONS = [
  { label: '전체', value: 'all' },
  ...Array.from(new Set(MOCK_APPLICANT_INSTITUTIONS.map(s => s.schoolName))).map(name => ({
    label: name,
    value: name,
  })),
]

const TEACHER_OPTIONS = [
  { label: '전체', value: 'all' },
  ...Array.from(new Set(MOCK_APPLICANT_INSTITUTIONS.map(s => s.teacherName))).map(name => ({
    label: name,
    value: name,
  })),
]

const INSTRUCTOR_SCHOOL_OPTIONS = [
  { label: '전체', value: 'all' },
  ...Array.from(new Set(MOCK_APPLICANT_INSTRUCTORS.map(s => s.schoolName))).map(name => ({
    label: name,
    value: name,
  })),
]

const INSTRUCTOR_NAME_OPTIONS = [
  { label: '전체', value: 'all' },
  ...Array.from(new Set(MOCK_APPLICANT_INSTRUCTORS.map(s => s.instructorName))).map(name => ({
    label: name,
    value: name,
  })),
]

export type ProgramApplicantsTabMode = 'all' | 'institutions' | 'instructors'

interface ProgramApplicantsTabProps {
  programId: string
  /** 풀페이지 모달 등에서 단일 카테고리만 노출 시 사용 (institutions=신청 학교만, instructors=신청 강사만) */
  mode?: ProgramApplicantsTabMode
}

export function ProgramApplicantsTab({
  programId: _programId,
  mode = 'all',
}: ProgramApplicantsTabProps) {
  const { subTab, filters, setSubTab, setFilter } = useApplicantsTabParams()
  const effectiveSubTab =
    mode === 'institutions'
      ? SUB_TAB_SCHOOLS
      : mode === 'instructors'
        ? SUB_TAB_INSTRUCTORS
        : subTab
  const showSubTabSwitcher = mode === 'all'
  const [appliedFilters, setAppliedFilters] = useState<ApplicantsFilters>(filters)
  const [schoolList, setSchoolList] = useState<ApplicantSchoolRow[]>(() => [
    ...MOCK_APPLICANT_INSTITUTIONS,
  ])
  const [instructorList, setInstructorList] = useState<ApplicantInstructorRow[]>(() => [
    ...MOCK_APPLICANT_INSTRUCTORS,
  ])
  const [schoolDetailModalOpen, setSchoolDetailModalOpen] = useState(false)
  const [selectedApplicantSchool, setSelectedApplicantSchool] = useState<ApplicantSchoolRow | null>(
    null
  )
  const [instructorDetailModalOpen, setInstructorDetailModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<ApplicantInstructorRow | null>(null)
  const [selectedSchoolRowKeys, setSelectedSchoolRowKeys] = useState<React.Key[]>([])
  const [schoolConfirmModal, setSchoolConfirmModal] = useState<'reject' | 'approve' | null>(null)
  const [selectedInstructorRowKeys, setSelectedInstructorRowKeys] = useState<React.Key[]>([])
  const [instructorConfirmModal, setInstructorConfirmModal] = useState<'reject' | 'approve' | null>(
    null
  )
  const [openApprovalDropdownId, setOpenApprovalDropdownId] = useState<string | null>(null)

  useEffect(() => {
    setOpenApprovalDropdownId(null)
  }, [effectiveSubTab])

  const approvalOptions = useMemo<{ label: string; value: string }[]>(
    () => [
      { label: '전체', value: 'all' },
      { label: APPROVAL_STATUS_LABELS.pending, value: 'pending' },
      { label: APPROVAL_STATUS_LABELS.rejected, value: 'rejected' },
      { label: APPROVAL_STATUS_LABELS.approved, value: 'approved' },
    ],
    []
  )

  const approvalStatusKeys = useMemo<ApprovalStatusKey[]>(
    () => Object.keys(APPROVAL_STATUS_LABELS) as ApprovalStatusKey[],
    []
  )

  const handleSchoolApprovalStatusChange = useCallback(
    (recordId: string, status: ApprovalStatusKey) => {
      setSchoolList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, approvalStatus: status } : row))
      )
      message.success('결재 현황이 변경되었습니다.')
    },
    []
  )

  const handleSchoolBulkRejectClick = useCallback(() => {
    if (selectedSchoolRowKeys.length === 0) {
      message.warning('반려할 항목을 선택해 주세요.')
      return
    }
    setSchoolConfirmModal('reject')
  }, [selectedSchoolRowKeys.length])

  const handleSchoolBulkApproveClick = useCallback(() => {
    if (selectedSchoolRowKeys.length === 0) {
      message.warning('승인할 항목을 선택해 주세요.')
      return
    }
    setSchoolConfirmModal('approve')
  }, [selectedSchoolRowKeys.length])

  const handleSchoolRejectConfirm = useCallback(() => {
    setSchoolList(prev =>
      prev.map(row =>
        selectedSchoolRowKeys.includes(row.id)
          ? { ...row, approvalStatus: 'rejected' as ApprovalStatusKey }
          : row
      )
    )
    setSelectedSchoolRowKeys([])
    setSchoolConfirmModal(null)
    message.success('선택한 학교 신청이 반려되었습니다.')
  }, [selectedSchoolRowKeys])

  const handleSchoolApproveConfirm = useCallback(() => {
    setSchoolList(prev =>
      prev.map(row =>
        selectedSchoolRowKeys.includes(row.id)
          ? { ...row, approvalStatus: 'approved' as ApprovalStatusKey }
          : row
      )
    )
    setSelectedSchoolRowKeys([])
    setSchoolConfirmModal(null)
    message.success('선택한 학교 신청이 승인되었습니다.')
  }, [selectedSchoolRowKeys])

  const handleInstructorApprovalStatusChange = useCallback(
    (recordId: string, status: ApprovalStatusKey) => {
      setInstructorList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, approvalStatus: status } : row))
      )
      message.success('결재 현황이 변경되었습니다.')
    },
    []
  )

  const handleInstructorBulkRejectClick = useCallback(() => {
    if (selectedInstructorRowKeys.length === 0) {
      message.warning('반려할 항목을 선택해 주세요.')
      return
    }
    setInstructorConfirmModal('reject')
  }, [selectedInstructorRowKeys.length])

  const handleInstructorBulkApproveClick = useCallback(() => {
    if (selectedInstructorRowKeys.length === 0) {
      message.warning('승인할 항목을 선택해 주세요.')
      return
    }
    setInstructorConfirmModal('approve')
  }, [selectedInstructorRowKeys.length])

  const handleInstructorRejectConfirm = useCallback(() => {
    setInstructorList(prev =>
      prev.map(row =>
        selectedInstructorRowKeys.includes(row.id)
          ? { ...row, approvalStatus: 'rejected' as ApprovalStatusKey }
          : row
      )
    )
    setSelectedInstructorRowKeys([])
    setInstructorConfirmModal(null)
    message.success('선택한 강사 신청이 반려되었습니다.')
  }, [selectedInstructorRowKeys])

  const handleInstructorApproveConfirm = useCallback(() => {
    setInstructorList(prev =>
      prev.map(row =>
        selectedInstructorRowKeys.includes(row.id)
          ? { ...row, approvalStatus: 'approved' as ApprovalStatusKey }
          : row
      )
    )
    setSelectedInstructorRowKeys([])
    setInstructorConfirmModal(null)
    message.success('선택한 강사 신청이 승인되었습니다.')
  }, [selectedInstructorRowKeys])

  const handleInstructorDetailReject = useCallback((instructor: ApplicantInstructorRow) => {
    setInstructorList(prev =>
      prev.map(row =>
        row.id === instructor.id ? { ...row, approvalStatus: 'rejected' as ApprovalStatusKey } : row
      )
    )
    setInstructorDetailModalOpen(false)
    setSelectedInstructor(null)
    message.success('강사 신청이 반려되었습니다.')
  }, [])

  const handleInstructorDetailApprove = useCallback(
    (instructor: ApplicantInstructorRow, _selectedSchoolId: string) => {
      setInstructorList(prev =>
        prev.map(row =>
          row.id === instructor.id
            ? { ...row, approvalStatus: 'approved' as ApprovalStatusKey }
            : row
        )
      )
      setInstructorDetailModalOpen(false)
      setSelectedInstructor(null)
      message.success('강사 신청이 승인되었습니다.')
    },
    []
  )

  const filteredSchools = useMemo(() => {
    return schoolList.filter(row => {
      if (
        appliedFilters.schoolName &&
        appliedFilters.schoolName !== 'all' &&
        row.schoolName !== appliedFilters.schoolName
      )
        return false
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
        appliedFilters.teacherName &&
        appliedFilters.teacherName !== 'all' &&
        row.teacherName !== appliedFilters.teacherName
      )
        return false
      if (
        appliedFilters.approvalStatus &&
        appliedFilters.approvalStatus !== 'all' &&
        row.approvalStatus !== appliedFilters.approvalStatus
      )
        return false
      return true
    })
  }, [schoolList, appliedFilters])

  const filteredInstructors = useMemo(() => {
    return instructorList.filter(row => {
      if (
        appliedFilters.schoolName &&
        appliedFilters.schoolName !== 'all' &&
        row.schoolName !== appliedFilters.schoolName
      )
        return false
      if (
        appliedFilters.instructorName &&
        appliedFilters.instructorName !== 'all' &&
        row.instructorName !== appliedFilters.instructorName
      )
        return false
      if (
        appliedFilters.approvalStatus &&
        appliedFilters.approvalStatus !== 'all' &&
        row.approvalStatus !== appliedFilters.approvalStatus
      )
        return false
      return true
    })
  }, [instructorList, appliedFilters])

  const handleSearch = () => {
    setAppliedFilters(filters)
  }

  const applicantSchoolDetail = useMemo(
    () => (selectedApplicantSchool ? getApplicantSchoolDetail(selectedApplicantSchool) : null),
    [selectedApplicantSchool]
  )

  const openSchoolDetail = (record: ApplicantSchoolRow) => {
    setSelectedApplicantSchool(record)
    setSchoolDetailModalOpen(true)
  }

  const closeSchoolDetail = () => {
    setSchoolDetailModalOpen(false)
    setSelectedApplicantSchool(null)
  }

  const columns: ColumnsType<ApplicantSchoolRow> = useMemo(
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
        title: '대상 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 90,
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
        title: '담당 교사',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 110,
        align: 'center',
      },
      {
        title: '결재 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 152,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApprovalStatusKey, record: ApplicantSchoolRow) => (
          <StatusDropdownCell<ApprovalStatusKey>
            status={status ?? null}
            statusOptions={approvalStatusKeys}
            renderBadge={s => <ApprovalStatusBadge status={s} />}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={newStatus => handleSchoolApprovalStatusChange(record.id, newStatus)}
            isOpen={openApprovalDropdownId === record.id}
            onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
            emptyPlaceholder="-"
          />
        ),
      },
    ],
    [approvalStatusKeys, handleSchoolApprovalStatusChange, openApprovalDropdownId]
  )

  const instructorColumns: ColumnsType<ApplicantInstructorRow> = useMemo(
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
        title: '강의 경력',
        dataIndex: 'lectureExperienceYears',
        key: 'lectureExperienceYears',
        width: 100,
        align: 'center',
        render: (v: number) => (v != null ? `${v}년` : '-'),
      },
      {
        title: '최종 학력',
        key: 'education',
        width: 200,
        align: 'center',
        ellipsis: true,
        render: (_: unknown, row: ApplicantInstructorRow) =>
          `${row.educationLevel} | ${row.educationSchoolName}`,
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 130,
        align: 'center',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 140,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '주소',
        dataIndex: 'address',
        key: 'address',
        width: 140,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '결재 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 152,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApprovalStatusKey, record: ApplicantInstructorRow) => (
          <StatusDropdownCell<ApprovalStatusKey>
            status={status ?? null}
            statusOptions={approvalStatusKeys}
            renderBadge={s => <ApprovalStatusBadge status={s} />}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={newStatus => handleInstructorApprovalStatusChange(record.id, newStatus)}
            isOpen={openApprovalDropdownId === record.id}
            onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
            emptyPlaceholder="-"
          />
        ),
      },
    ],
    [approvalStatusKeys, handleInstructorApprovalStatusChange, openApprovalDropdownId]
  )

  return (
    <div className="program-applicants-tab">
      <Card className="program-applicants-tab__card" bordered={false}>
        <div className="program-applicants-tab__top">
          <div className="program-applicants-tab__bar-inner">
            {showSubTabSwitcher && (
              <div className="program-applicants-tab__tabs">
                <button
                  type="button"
                  className={`program-applicants-tab__tab-btn ${effectiveSubTab === SUB_TAB_SCHOOLS ? 'program-applicants-tab__tab-btn--active' : ''}`}
                  onClick={() => setSubTab(SUB_TAB_SCHOOLS)}
                >
                  신청 학교
                </button>
                <button
                  type="button"
                  className={`program-applicants-tab__tab-btn ${effectiveSubTab === SUB_TAB_INSTRUCTORS ? 'program-applicants-tab__tab-btn--active' : ''}`}
                  onClick={() => setSubTab(SUB_TAB_INSTRUCTORS)}
                >
                  신청 강사
                </button>
              </div>
            )}
            <div className="program-applicants-tab__filters">
              <Row
                gutter={[12, 12]}
                align="middle"
                wrap={false}
                className="program-applicants-tab__filter-row"
              >
                {effectiveSubTab === SUB_TAB_SCHOOLS && (
                  <>
                    <Col flex="0 1 auto" className="program-applicants-tab__filter-col">
                      <div className="program-applicants-tab__filter-field">
                        <span className="program-applicants-tab__filter-label">학교명</span>
                        <Select
                          placeholder="전체"
                          value={filters.schoolName === 'all' ? undefined : filters.schoolName}
                          onChange={v => setFilter('schoolName', v ?? 'all')}
                          allowClear
                          options={SCHOOL_OPTIONS}
                          getPopupContainer={() => document.body}
                        />
                      </div>
                    </Col>
                    <Col flex="0 1 auto" className="program-applicants-tab__filter-col">
                      <div className="program-applicants-tab__filter-field">
                        <span className="program-applicants-tab__filter-label">지역</span>
                        <Select
                          placeholder="전체"
                          value={filters.region === 'all' ? undefined : filters.region}
                          onChange={v => setFilter('region', v ?? 'all')}
                          allowClear
                          options={REGION_OPTIONS}
                          getPopupContainer={() => document.body}
                        />
                      </div>
                    </Col>
                    <Col flex="0 1 auto" className="program-applicants-tab__filter-col">
                      <div className="program-applicants-tab__filter-field">
                        <span className="program-applicants-tab__filter-label">대상 학년</span>
                        <Select
                          placeholder="전체"
                          value={
                            filters.educationGrade === 'all' ? undefined : filters.educationGrade
                          }
                          onChange={v => setFilter('educationGrade', v ?? 'all')}
                          allowClear
                          options={GRADE_OPTIONS}
                          getPopupContainer={() => document.body}
                        />
                      </div>
                    </Col>
                    <Col flex="0 1 auto" className="program-applicants-tab__filter-col">
                      <div className="program-applicants-tab__filter-field">
                        <span className="program-applicants-tab__filter-label">담당 교사명</span>
                        <Select
                          placeholder="전체"
                          value={filters.teacherName === 'all' ? undefined : filters.teacherName}
                          onChange={v => setFilter('teacherName', v ?? 'all')}
                          allowClear
                          options={TEACHER_OPTIONS}
                          getPopupContainer={() => document.body}
                        />
                      </div>
                    </Col>
                    <Col flex="0 1 auto" className="program-applicants-tab__filter-col">
                      <div className="program-applicants-tab__filter-field">
                        <span className="program-applicants-tab__filter-label">결재 현황</span>
                        <Select
                          placeholder="전체"
                          value={
                            filters.approvalStatus === 'all' ? undefined : filters.approvalStatus
                          }
                          onChange={v => setFilter('approvalStatus', v ?? 'all')}
                          allowClear
                          options={approvalOptions}
                          getPopupContainer={() => document.body}
                        />
                      </div>
                    </Col>
                  </>
                )}
                {effectiveSubTab === SUB_TAB_INSTRUCTORS && (
                  <>
                    <Col flex="0 1 auto" className="program-applicants-tab__filter-col">
                      <div className="program-applicants-tab__filter-field">
                        <span className="program-applicants-tab__filter-label">학교명</span>
                        <Select
                          placeholder="전체"
                          value={filters.schoolName === 'all' ? undefined : filters.schoolName}
                          onChange={v => setFilter('schoolName', v ?? 'all')}
                          allowClear
                          options={INSTRUCTOR_SCHOOL_OPTIONS}
                          getPopupContainer={() => document.body}
                        />
                      </div>
                    </Col>
                    <Col flex="0 1 auto" className="program-applicants-tab__filter-col">
                      <div className="program-applicants-tab__filter-field">
                        <span className="program-applicants-tab__filter-label">강사명</span>
                        <Select
                          placeholder="전체"
                          value={
                            filters.instructorName === 'all' ? undefined : filters.instructorName
                          }
                          onChange={v => setFilter('instructorName', v ?? 'all')}
                          allowClear
                          options={INSTRUCTOR_NAME_OPTIONS}
                          getPopupContainer={() => document.body}
                        />
                      </div>
                    </Col>
                    <Col flex="0 1 auto" className="program-applicants-tab__filter-col">
                      <div className="program-applicants-tab__filter-field">
                        <span className="program-applicants-tab__filter-label">결재 현황</span>
                        <Select
                          placeholder="전체"
                          value={
                            filters.approvalStatus === 'all' ? undefined : filters.approvalStatus
                          }
                          onChange={v => setFilter('approvalStatus', v ?? 'all')}
                          allowClear
                          options={approvalOptions}
                          getPopupContainer={() => document.body}
                        />
                      </div>
                    </Col>
                  </>
                )}
                <Col flex="none" className="program-applicants-tab__filter-col--btn">
                  <AppButton variant="primary" size="filter" onClick={handleSearch}>
                    조회
                  </AppButton>
                </Col>
              </Row>
            </div>
          </div>
        </div>

        {effectiveSubTab === SUB_TAB_SCHOOLS && (
          <>
            <div className="program-applicants-tab__divider" />
            <div className="program-applicants-tab__below-divider">
              <div className="program-applicants-tab__table-header">
                <div className="program-applicants-tab__table-heading">
                  <span className="program-applicants-tab__table-title">수강 신청 학교 목록</span>
                  <span className="program-applicants-tab__table-description">
                    총 {filteredSchools.length}건
                  </span>
                </div>
                <div className="program-applicants-tab__table-actions">
                  <AppButton variant="danger" size="large" onClick={handleSchoolBulkRejectClick}>
                    선택 반려
                  </AppButton>
                  <AppButton variant="primary" size="large" onClick={handleSchoolBulkApproveClick}>
                    선택 승인
                  </AppButton>
                </div>
              </div>
              <Table<ApplicantSchoolRow>
                className="program-applicants-tab__table program-applicants-tab__table--clickable"
                rowKey="id"
                size="middle"
                pagination={false}
                columns={columns}
                dataSource={filteredSchools}
                rowSelection={{
                  selectedRowKeys: selectedSchoolRowKeys,
                  onChange: keys => setSelectedSchoolRowKeys(keys),
                }}
                onRow={record => ({
                  onClick: e => {
                    const target = e.target as HTMLElement
                    if (
                      target.closest('.status-dropdown-cell__cell-status') ||
                      target.closest('.status-dropdown-cell__status-trigger') ||
                      target.closest('.ant-table-selection-column') ||
                      target.closest('.ant-checkbox-wrapper')
                    )
                      return
                    openSchoolDetail(record)
                  },
                  style: { cursor: 'pointer' },
                })}
              />
            </div>
          </>
        )}

        {effectiveSubTab === SUB_TAB_INSTRUCTORS && (
          <>
            <div className="program-applicants-tab__divider" />
            <div className="program-applicants-tab__below-divider">
              <div className="program-applicants-tab__table-header">
                <div className="program-applicants-tab__table-heading">
                  <span className="program-applicants-tab__table-title">강의 신청 강사 목록</span>
                  <span className="program-applicants-tab__table-description">
                    총 {filteredInstructors.length}건
                  </span>
                </div>
                <div className="program-applicants-tab__table-actions">
                  <AppButton
                    variant="danger"
                    size="large"
                    onClick={handleInstructorBulkRejectClick}
                  >
                    선택 반려
                  </AppButton>
                  <AppButton
                    variant="primary"
                    size="large"
                    onClick={handleInstructorBulkApproveClick}
                  >
                    선택 승인
                  </AppButton>
                </div>
              </div>
              <Table<ApplicantInstructorRow>
                className="program-applicants-tab__table program-applicants-tab__table--clickable"
                rowKey="id"
                size="middle"
                pagination={false}
                columns={instructorColumns}
                dataSource={filteredInstructors}
                rowSelection={{
                  selectedRowKeys: selectedInstructorRowKeys,
                  onChange: keys => setSelectedInstructorRowKeys(keys),
                }}
                locale={{ emptyText: '신청 강사 데이터가 없습니다.' }}
                onRow={record => ({
                  onClick: e => {
                    const target = e.target as HTMLElement
                    if (
                      target.closest('.status-dropdown-cell__cell-status') ||
                      target.closest('.status-dropdown-cell__status-trigger') ||
                      target.closest('.ant-table-selection-column') ||
                      target.closest('.ant-checkbox-wrapper')
                    )
                      return
                    setSelectedInstructor(record)
                    setInstructorDetailModalOpen(true)
                  },
                  style: { cursor: 'pointer' },
                })}
              />
            </div>
          </>
        )}

        <SchoolDetailModal
          open={schoolDetailModalOpen}
          onCancel={closeSchoolDetail}
          detail={applicantSchoolDetail}
          title="수강 신청 학교 상세 정보"
          variant="applicant"
        />
        <ApplicantInstructorDetailModal
          open={instructorDetailModalOpen}
          onCancel={() => {
            setInstructorDetailModalOpen(false)
            setSelectedInstructor(null)
          }}
          instructor={selectedInstructor}
          onReject={handleInstructorDetailReject}
          onApprove={handleInstructorDetailApprove}
        />

        {schoolConfirmModal === 'reject' && (
          <DeleteGuideModal
            open
            onCancel={() => setSchoolConfirmModal(null)}
            onConfirm={handleSchoolRejectConfirm}
            title="선택 반려 안내"
            lines={buildSchoolRejectMessageLines(selectedSchoolRowKeys.length)}
            confirmText="반려"
            confirmVariant="danger"
          />
        )}
        {schoolConfirmModal === 'approve' && (
          <DeleteGuideModal
            open
            onCancel={() => setSchoolConfirmModal(null)}
            onConfirm={handleSchoolApproveConfirm}
            title="선택 승인 안내"
            lines={buildSchoolApproveMessageLines(selectedSchoolRowKeys.length)}
            confirmText="승인"
            confirmVariant="primary"
          />
        )}

        {instructorConfirmModal === 'reject' && (
          <DeleteGuideModal
            open
            onCancel={() => setInstructorConfirmModal(null)}
            onConfirm={handleInstructorRejectConfirm}
            title="선택 반려 안내"
            lines={buildInstructorRejectMessageLines(selectedInstructorRowKeys.length)}
            confirmText="반려"
            confirmVariant="danger"
          />
        )}
        {instructorConfirmModal === 'approve' && (
          <DeleteGuideModal
            open
            onCancel={() => setInstructorConfirmModal(null)}
            onConfirm={handleInstructorApproveConfirm}
            title="선택 승인 안내"
            lines={buildInstructorApproveMessageLines(selectedInstructorRowKeys.length)}
            confirmText="승인"
            confirmVariant="primary"
          />
        )}
      </Card>
    </div>
  )
}
