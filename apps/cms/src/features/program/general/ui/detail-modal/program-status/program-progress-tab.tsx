/**
 * 프로그램 상세 - 프로그램 진행현황 탭
 * 탭(참여 학교 정보 | 강사 정보)과 필터가 같은 레벨 한 줄 배치, 쿼리 파라미터 연동
 */

import { useMemo, useState, useEffect } from 'react'
import { Card, Table, Row, Col, Select } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton, FilterSearchButton } from '@/shared/ui'
import { ACTIVITY_CERTIFICATE_ISSUE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import type { ColumnsType } from 'antd/es/table'
import {
  useProgramProgressParams,
  type ProgressFilters,
} from '../../../hooks/use-program-progress-params'
import {
  TEXTBOOK_STATUS_LABELS,
  TEXTBOOK_STATUS_OPTION_KEYS,
  type ParticipatingSchoolRow,
  type TextbookStatusKey,
} from '@/data/mock/participating-schools'
import {
  MOCK_PARTICIPATING_INSTRUCTORS,
  type ParticipatingInstructorRow,
  type SettlementStatusKey,
} from '@/data/mock/participating-instructors'
import {
  INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS,
  INSTRUCTOR_SETTLEMENT_STATUS_ORDER,
} from '@/shared/constants/instructor-settlement-status'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import { SettlementStatusBadge } from '@/shared/components/settlement-status-badge'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import { SegmentedTab } from '@/shared/ui'
import { AddInstructorModal } from '../../add-instructor-modal'
import { SchoolDetailModal } from './school-detail-modal'
import { ApplicantInstructorDetailModal } from '../../applicant-instructor-detail-modal'
import {
  DeleteGuideModal,
  buildSchoolMessageLines,
  buildInstructorMessageLines,
} from '../../manager-delete-guide-modal'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { getSchoolDetailByRow, getInstructorRowsForSchool } from '../../../lib/school-detail-mock'
import { useProgressSchoolList } from '../../../hooks/use-progress-school-list'
import { useProgressInstructorList } from '../../../hooks/use-progress-instructor-list'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { Divider } from '@/shared/components/divider'
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
  ...TEXTBOOK_STATUS_OPTION_KEYS.map(key => ({
    label: TEXTBOOK_STATUS_LABELS[key],
    value: key,
  })),
]

const SETTLEMENT_OPTIONS = INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

interface ProgramProgressTabProps {
  programId: string
}

export function ProgramProgressTab({ programId: _programId }: ProgramProgressTabProps) {
  const { subTab, filters, setSubTab, setFilter } = useProgramProgressParams()
  const [openTextbookDropdownSchoolId, setOpenTextbookDropdownSchoolId] = useState<string | null>(
    null
  )
  const [openSettlementDropdownInstructorId, setOpenSettlementDropdownInstructorId] = useState<
    string | null
  >(null)
  /** 교사/강사명은 로컬 state로 두고 blur/조회 시에만 URL 동기화 (한글 IME 조합 깨짐 방지) */
  const [localTeacherName, setLocalTeacherName] = useState(() => filters.teacherName ?? '')
  /** 조회 버튼 클릭 시에만 반영되는 필터 (테이블 필터링에 사용) */
  const [appliedFilters, setAppliedFilters] = useState<ProgressFilters>(filters)

  useEffect(() => {
    setLocalTeacherName(filters.teacherName ?? '')
  }, [filters.teacherName])

  const instructorHook = useProgressInstructorList({ appliedFilters })
  const schoolHook = useProgressSchoolList({
    appliedFilters,
    instructorList: instructorHook.instructorList,
  })

  const {
    schoolList: _schoolList,
    selectedSchoolRowKeys,
    setSelectedSchoolRowKeys,
    selectedSchoolForDetail,
    setSelectedSchoolForDetail,
    schoolDetailModalOpen,
    setSchoolDetailModalOpen,
    schoolDeleteGuideOpen,
    setSchoolDeleteGuideOpen,
    savedBasicPatches,
    setSavedBasicPatches,
    savedInstructorPatches,
    setSavedInstructorPatches,
    filteredSchools,
    schoolNamesToDelete,
    handleTextbookStatusChange,
    handleSchoolDeleteClick,
    handleSchoolDeleteConfirm,
    handleSchoolApprovalCancel,
    getInstructorDisplayForSchool,
  } = schoolHook

  const {
    instructorList,
    selectedInstructorRowKeys,
    setSelectedInstructorRowKeys,
    selectedInstructorForDetail,
    setSelectedInstructorForDetail,
    instructorDetailModalOpen,
    setInstructorDetailModalOpen,
    addInstructorModalOpen,
    setAddInstructorModalOpen,
    instructorDeleteGuideOpen,
    setInstructorDeleteGuideOpen,
    filteredInstructors,
    instructorNamesToDelete,
    handleAddInstructor,
    handleSettlementStatusChange,
    handleInstructorDeleteClick,
    handleInstructorDeleteConfirm,
  } = instructorHook

  const handleSearch = () => {
    setFilter('teacherName', localTeacherName)
    setAppliedFilters({ ...filters, teacherName: localTeacherName })
  }

  /** 진행현황 참여 강사 → 모달용 ApplicantInstructorRow 형태로 변환. 목록이 localStorage 기반이면 상세 필드가 없을 수 있으므로 mock에서 같은 id로 보강 */
  const participatingToApplicantRow = (row: ParticipatingInstructorRow): ApplicantInstructorRow => {
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

  const textbookStatusKeys = TEXTBOOK_STATUS_OPTION_KEYS

  const settlementStatusKeys: SettlementStatusKey[] = useMemo(
    () => [...INSTRUCTOR_SETTLEMENT_STATUS_ORDER],
    []
  )

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
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: TextbookStatusKey, record: ParticipatingSchoolRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<TextbookStatusKey>
              status={status}
              statusOptions={textbookStatusKeys}
              renderBadge={s => <TextbookStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={key => handleTextbookStatusChange(record.id, key)}
              isOpen={openTextbookDropdownSchoolId === record.id}
              onOpenChange={open => setOpenTextbookDropdownSchoolId(open ? record.id : null)}
            />
          </div>
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
        key: 'instructors',
        width: 160,
        align: 'center',
        ellipsis: true,
        render: (_: unknown, record: ParticipatingSchoolRow) =>
          getInstructorDisplayForSchool(record.id, record.schoolName),
      },
    ],
    [
      handleTextbookStatusChange,
      textbookStatusKeys,
      getInstructorDisplayForSchool,
      openTextbookDropdownSchoolId,
    ]
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
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: SettlementStatusKey, record: ParticipatingInstructorRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<SettlementStatusKey>
              status={status}
              statusOptions={settlementStatusKeys}
              renderBadge={s => <SettlementStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={key => handleSettlementStatusChange(record.id, key)}
              isOpen={openSettlementDropdownInstructorId === record.id}
              onOpenChange={open => setOpenSettlementDropdownInstructorId(open ? record.id : null)}
            />
          </div>
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
    [handleSettlementStatusChange, settlementStatusKeys, openSettlementDropdownInstructorId]
  )

  return (
    <div className="program-progress-tab">
      {/* 전체(탭·필터·테이블)를 배경 #fff 카드 래퍼 하나로 감쌈. 탭/필터는 카드가 아닌 카드 내부 상단. 디바이더로 테이블과 구분 */}
      <Card className="program-progress-tab__card" bordered={false}>
        <div className="program-progress-tab__top">
          <div className="program-progress-tab__bar-inner">
            <SegmentedTab
              options={[
                { label: '참여 학교 정보', value: PARTICIPATING_SCHOOL_TAB },
                { label: '강사 정보', value: INSTRUCTOR_TAB },
              ]}
              value={subTab}
              onChange={v =>
                setSubTab(v as typeof PARTICIPATING_SCHOOL_TAB | typeof INSTRUCTOR_TAB)
              }
              size="mediumCompact"
            />
            <div className="program-progress-tab__filters">
              <Row gutter={[12, 12]} align="middle" className="program-progress-tab__filter-row">
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
                    value={localTeacherName}
                    onChange={setLocalTeacherName}
                    onBlur={() => setFilter('teacherName', localTeacherName)}
                    width="100%"
                    showPrefixIcon={false}
                  />
                </Col>
                <Col flex="none" className="program-progress-tab__filter-col--btn">
                  <FilterSearchButton onClick={handleSearch} />
                </Col>
              </Row>
            </div>
          </div>
        </div>

        {subTab === PARTICIPATING_SCHOOL_TAB && (
          <>
            <Divider className="program-progress-tab__divider" />
            <div className="program-progress-tab__below-divider">
              <div className="program-progress-tab__table-header">
                <div className="program-progress-tab__table-heading">
                  <span className="program-progress-tab__table-title">수강 참여 학교 목록</span>
                  <span className="program-progress-tab__table-description">
                    총 {filteredSchools.length}건
                  </span>
                </div>
                <CmsButton
                  variant="delete"
                  size="large"
                  disabled={selectedSchoolRowKeys.length === 0}
                  onClick={handleSchoolDeleteClick}
                >
                  학교 삭제
                </CmsButton>
              </div>
              <Table<ParticipatingSchoolRow>
                className="program-progress-tab__table cms-data-table"
                rowKey="id"
                size="middle"
                pagination={false}
                rowSelection={{
                  selectedRowKeys: selectedSchoolRowKeys,
                  onChange: keys => setSelectedSchoolRowKeys(keys as string[]),
                }}
                columns={columns}
                dataSource={filteredSchools}
                onRow={record => ({
                  onClick: e => {
                    const target = e.target as HTMLElement
                    if (target.closest('.ant-table-selection-column')) return
                    if (
                      target.closest('.status-dropdown-cell__cell-status') ||
                      target.closest('.status-dropdown-cell__status-trigger')
                    )
                      return
                    setSelectedSchoolForDetail(record)
                    setSchoolDetailModalOpen(true)
                  },
                  style: { cursor: 'pointer' },
                })}
              />
            </div>
          </>
        )}

        {subTab === INSTRUCTOR_TAB && (
          <>
            <Divider className="program-progress-tab__divider" />
            <div className="program-progress-tab__below-divider">
              <div className="program-progress-tab__table-header">
                <div className="program-progress-tab__table-heading">
                  <span className="program-progress-tab__table-title">참여 강사진 목록</span>
                  <span className="program-progress-tab__table-description">
                    총 {filteredInstructors.length}건
                  </span>
                </div>
                <div className="program-progress-tab__table-actions">
                  <CmsButton
                    variant="secondary"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      window.alert(ACTIVITY_CERTIFICATE_ISSUE_COMING_SOON_ALERT_MESSAGE)
                    }
                  >
                    활동확인서 발급
                  </CmsButton>
                  <CmsButton
                    variant="delete"
                    size="large"
                    disabled={selectedInstructorRowKeys.length === 0}
                    onClick={handleInstructorDeleteClick}
                  >
                    강사 삭제
                  </CmsButton>
                  <CmsButton
                    variant="primary"
                    size="large"
                    onClick={() => setAddInstructorModalOpen(true)}
                  >
                    강사 등록
                  </CmsButton>
                </div>
              </div>
              <Table<ParticipatingInstructorRow>
                className="program-progress-tab__table program-progress-tab__table--clickable cms-data-table"
                rowKey="id"
                size="middle"
                pagination={false}
                rowSelection={{
                  selectedRowKeys: selectedInstructorRowKeys,
                  onChange: keys => setSelectedInstructorRowKeys(keys as string[]),
                }}
                columns={instructorColumns}
                dataSource={filteredInstructors}
                onRow={record => ({
                  onClick: e => {
                    const target = e.target as HTMLElement
                    if (target.closest('.ant-table-selection-column')) return
                    if (
                      target.closest('.status-dropdown-cell__cell-status') ||
                      target.closest('.status-dropdown-cell__status-trigger')
                    )
                      return
                    setSelectedInstructorForDetail(record)
                    setInstructorDetailModalOpen(true)
                  },
                  style: { cursor: 'pointer' },
                })}
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

      <DeleteGuideModal
        open={schoolDeleteGuideOpen}
        onCancel={() => setSchoolDeleteGuideOpen(false)}
        onConfirm={handleSchoolDeleteConfirm}
        title="학교 삭제 안내"
        lines={buildSchoolMessageLines(schoolNamesToDelete)}
      />

      <DeleteGuideModal
        open={instructorDeleteGuideOpen}
        onCancel={() => setInstructorDeleteGuideOpen(false)}
        onConfirm={handleInstructorDeleteConfirm}
        title="강사 삭제 안내"
        lines={buildInstructorMessageLines(instructorNamesToDelete)}
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
                        settlementStatus: 'awaiting_confirmation' as SettlementStatusKey,
                      }))
                    : getInstructorRowsForSchool(schoolName, instructorList)
                return {
                  ...base,
                  ...savedBasicPatches[schoolId],
                  instructors,
                }
              })()
            : null
        }
        participatingRow={selectedSchoolForDetail}
        onCancelApproval={handleSchoolApprovalCancel}
        onSaveBasicInfo={patch => {
          setSavedBasicPatches(prev => ({ ...prev, [patch.id]: patch }))
        }}
        onSaveInstructorInfo={(schoolId, instructors) => {
          setSavedInstructorPatches(prev => ({ ...prev, [schoolId]: instructors }))
        }}
      />
    </div>
  )
}
