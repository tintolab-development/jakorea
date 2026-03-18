import { useState, useMemo, useEffect } from 'react'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { AppButton } from '@/shared/ui/app-button'
import { ApprovalStatusBadge } from '@/shared/components/approval-status-badge'
import type { TabKey } from './detail-modal-sidebar'
import {
  participantFilterFields,
  instructorFilterFields,
  volunteerFilterFields,
} from '../table/applicant-filter-fields'
import { MOCK_APPLICANT_SCHOOLS, type ApplicantSchoolRow } from '@/data/mock/applicant-schools'
import {
  MOCK_APPLICANT_INSTRUCTORS,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import { ApplicantCalendarView } from './applicant-calendar-view'
import { ApplicantsDetailContents } from './applicants-detail-contents'
import './applicants-detail.css'

export interface ApplicantDetailsProps {
  menu: TabKey | ''
}

export function ApplicantDetails({ menu }: ApplicantDetailsProps) {
  // 필터 상태 관리
  const [pendingFilters, setPendingFilters] = useState<Record<string, any>>({})
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({})

  // 데이터 상태 관리
  const [schoolList] = useState<ApplicantSchoolRow[]>(() => [...MOCK_APPLICANT_SCHOOLS])
  const [instructorList] = useState<ApplicantInstructorRow[]>(() => [
    ...MOCK_APPLICANT_INSTRUCTORS,
  ])

  // 상세 보기 상태 관리
  const [selectedItem, setSelectedItem] = useState<ApplicantSchoolRow | ApplicantInstructorRow | null>(null)

  // 뷰 모드 상태 관리
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  // 선택 상태 관리
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 메뉴 변경 시 상태 초기화
  useEffect(() => {
    setPendingFilters({})
    setAppliedFilters({})
    setSelectedRowKeys([])
    setSelectedItem(null)
  }, [menu])

  // 현재 메뉴에 따른 필터 필드 설정
  const fields = useMemo(() => {
    switch (menu) {
      case 'participants':
        return participantFilterFields
      case 'instructors':
        return instructorFilterFields
      case 'volunteers':
        return volunteerFilterFields
      default:
        return []
    }
  }, [menu])

  // 참여 기관(학교) 컬럼 정의
  const participantColumns: ColumnsType<ApplicantSchoolRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center' },
      {
        title: '참여 기관명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 160,
        align: 'center',
        ellipsis: true,
        render: (text: string, record) => (
          <a onClick={() => setSelectedItem(record)} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
            {text}
          </a>
        ),
      },
      {
        title: '기관 지역',
        dataIndex: 'region',
        key: 'region',
        width: 150,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 120,
        align: 'center',
        render: (status: any) => <ApprovalStatusBadge status={status} />,
      },
      {
        title: '강의 회차 별 희망 교육 날짜 및 시간',
        dataIndex: 'desiredEducationPeriod',
        key: 'desiredEducationPeriod',
        width: 280,
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
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 110,
        align: 'center',
      },
    ],
    []
  )

  // 신청 강사 컬럼 정의
  const instructorColumns: ColumnsType<ApplicantInstructorRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center' },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 110,
        align: 'center',
        render: (text: string, record) => (
          <a onClick={() => setSelectedItem(record)} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
            {text}
          </a>
        ),
      },
      {
        title: '거주 지역',
        dataIndex: 'address',
        key: 'address',
        width: 150,
        align: 'center',
        ellipsis: true,
      },
      {
        title: 'JA 강의 경력',
        dataIndex: 'teachingExperience',
        key: 'teachingExperience',
        width: 120,
        align: 'center',
      },
      {
        title: 'JA 평가 등급',
        dataIndex: 'evaluationGrade',
        key: 'evaluationGrade',
        width: 110,
        align: 'center',
        render: (v: string) => (v ? `${v}등급` : '-'),
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
        width: 160,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 120,
        align: 'center',
        render: (status: any) => <ApprovalStatusBadge status={status} />,
      },
    ],
    []
  )

  const handleFilterChange = (key: string, value: any) => {
    setPendingFilters(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSearch = () => {
    setAppliedFilters({ ...pendingFilters })
  }

  const handleBulkReject = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('반려할 항목을 선택해 주세요.')
      return
    }
    console.log('Bulk Reject:', selectedRowKeys)
    message.success(`${selectedRowKeys.length}건이 반려 처리되었습니다.`)
  }

  const handleBulkApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('승인할 항목을 선택해 주세요.')
      return
    }
    console.log('Bulk Approve:', selectedRowKeys)
    message.success(`${selectedRowKeys.length}건이 승인 처리되었습니다.`)
  }

  const handleViewCalendar = () => {
    setViewMode('calendar')
  }

  const title = useMemo(() => {
    switch (menu) {
      case 'participants':
        return '수강 신청 기관 목록'
      case 'instructors':
        return '강의 신청 강사 목록'
      case 'volunteers':
        return '신청 봉사자 목록'
      default:
        return ''
    }
  }, [menu])

  const tableData = useMemo(() => {
    if (menu === 'participants') {
      return schoolList.filter(item => {
        const { organizationName, region, grade, teacherName, approvalStatus } = appliedFilters
        if (organizationName && organizationName.trim() !== '' && !item.schoolName.includes(organizationName)) return false
        if (region && region !== 'all' && !item.region.includes(region)) return false
        if (grade && grade !== 'all' && item.educationGrade !== grade)
          return false
        if (teacherName && teacherName.trim() !== '' && !item.teacherName.includes(teacherName))
          return false
        if (approvalStatus && approvalStatus !== 'all' && item.approvalStatus !== approvalStatus)
          return false
        return true
      })
    }
    if (menu === 'instructors') {
      return instructorList.filter(item => {
        const { instructorName, residenceRegion, evaluationGrade, teachingExperience, approvalStatus } = appliedFilters
        if (instructorName && instructorName.trim() !== '' && !item.instructorName.includes(instructorName))
          return false
        if (residenceRegion && residenceRegion !== 'all' && !item.address.includes(residenceRegion))
          return false
        if (evaluationGrade && evaluationGrade !== 'all' && item.evaluationGrade !== evaluationGrade)
          return false
        if (teachingExperience && teachingExperience !== 'all' && item.teachingExperience !== teachingExperience)
          return false
        if (approvalStatus && approvalStatus !== 'all' && item.approvalStatus !== approvalStatus)
          return false
        return true
      })
    }
    return []
  }, [menu, schoolList, instructorList, appliedFilters])

  const columns = useMemo(() => {
    if (menu === 'participants') return participantColumns
    if (menu === 'instructors') return instructorColumns
    return []
  }, [menu, participantColumns, instructorColumns])

  // Helper function to map applicant data to calendar event format
  const mapApplicantDataToCalendarEvents = (
    data: ApplicantSchoolRow[] | ApplicantInstructorRow[],
    currentMenu: TabKey | ''
  ): any[] => {
    return data.map((item, index) => {
      let title = ''
      let startDate = null
      let endDate = null
      // Use a unique ID for each event. Fallback to index if 'id' or 'no' is not available.
      const id = item.id || item.no || index;

      if (currentMenu === 'participants' && 'schoolName' in item && 'desiredEducationPeriod' in item) {
        const applicant = item as ApplicantSchoolRow
        title = `[참여기관] ${applicant.schoolName}`
        if (applicant.desiredEducationPeriod) {
          const period = applicant.desiredEducationPeriod.trim()
          // Regex to capture YYYY-MM-DD and HH:MM - HH:MM
          const dateTimeMatch = period.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/)

          if (dateTimeMatch) {
            const datePart = dateTimeMatch[1] // "YYYY-MM-DD"
            const startTime = dateTimeMatch[2] // "HH:MM"
            const endTime = dateTimeMatch[3]   // "HH:MM"
            startDate = `${datePart}T${startTime}:00`
            endDate = `${datePart}T${endTime}:00`
          } else {
            // Try matching YY.MM.DD(요일)~YY.MM.DD(요일)
            const rangeMatch = period.match(/^(\d{2})\.(\d{2})\.(\d{2})\(.*\)\s*~\s*(\d{2})\.(\d{2})\.(\d{2})\(.*\)/)
            if (rangeMatch) {
              startDate = `20${rangeMatch[1]}-${rangeMatch[2]}-${rangeMatch[3]}T00:00:00`
              endDate = `20${rangeMatch[4]}-${rangeMatch[5]}-${rangeMatch[6]}T23:59:59`
            }
          }
        }
      } else if (currentMenu === 'instructors' && 'instructorName' in item) {
        const applicant = item as ApplicantInstructorRow
        title = `[강사] ${applicant.instructorName}`
        // For instructors, use the first preferred school's dateRange
        const dateRange = applicant.preferredSchools?.[0]?.dateRange
        if (dateRange) {
          const period = dateRange.trim()
          // Regex to capture YYYY.MM.DD and handle optional (요일)
          // Format: 2026.01.09 (금) ~ 2026.01.30 (금)
          const dateMatch = period.match(/^(\d{4})\.(\d{2})\.(\d{2}).*~\s*(\d{4})\.(\d{2})\.(\d{2})/)

          if (dateMatch) {
            startDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00`
            endDate = `${dateMatch[4]}-${dateMatch[5]}-${dateMatch[6]}T23:59:59`
          }
        }
      }
      // Add other menus if needed

      return {
        id,
        title,
        startDate,
        endDate,
        // Pass original item for potential use in click handler or calendar events
        originalItem: item,
      } as any
    })
  }

  return (
    <div className="applicant-details">
      {selectedItem ? (
        <ApplicantsDetailContents
          type={menu as ApplicantType}
          data={selectedItem}
          onBack={() => setSelectedItem(null)}
          onApprove={(id) => {
            message.success('승인되었습니다.')
            setSelectedItem(null)
          }}
          onReject={(id) => {
            message.success('반려되었습니다.')
            setSelectedItem(null)
          }}
        />
      ) : (
        <>
          {fields.length > 0 && (
            <UnifiedFilterCard
              fields={fields}
              filters={pendingFilters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              bordered={false}
              cardStyle={{
                padding: '24px 24px 0 24px',
                marginBottom: 0,
                background: 'transparent',
              }}
            />
          )}

          {menu && (
            <div style={{ padding: '0 24px 24px 24px' }}>
              <div
                className="applicant-details__table-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div
                  className="applicant-details__table-title"
                  style={{ fontSize: '16px', fontWeight: 600 }}
                >
                  {title} <span style={{ fontWeight: 400, fontSize: '14px', marginLeft: '8px' }}>총 {tableData.length}건</span>
                </div>
                <div className="applicant-details__table-actions">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <AppButton variant="danger" size="large" onClick={handleBulkReject}>
                      선택 반려
                    </AppButton>
                    <AppButton variant="primary" size="large" onClick={handleBulkApprove}>
                      선택 승인
                    </AppButton>
                    {viewMode === 'table' && (
                      <AppButton variant="cancel" size="large" onClick={handleViewCalendar}>
                        캘린더 뷰로 보기
                      </AppButton>
                    )}
                    {viewMode === 'calendar' && (
                      <AppButton variant="cancel" size="large" onClick={() => setViewMode('table')}>
                        리스트로 보기
                      </AppButton>
                    )}
                  </div>
                </div>
              </div>

              {viewMode === 'table' ? (
                <Table<any>
                  rowKey="id"
                  columns={columns}
                  dataSource={tableData}
                  size="middle"
                  className="clickable-table"
                  onRow={(record) => ({
                    onClick: () => setSelectedItem(record),
                  })}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: total => `총 ${total}건`,
                  }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: keys => setSelectedRowKeys(keys),
                  }}
                />
              ) : ( // This is the correct structure for the else part of the ternary
                <div className="applicant-calendar-view-container">
                  <ApplicantCalendarView
                    events={mapApplicantDataToCalendarEvents(tableData, menu)} // Map data for calendar
                    loading={false} // Assuming loading state can be managed
                    selectedRowKeys={selectedRowKeys}
                    onSelectionChange={setSelectedRowKeys}
                    onItemClick={setSelectedItem}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
