import { useCallback, useMemo, useState, type Key } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import {
  INSTITUTION_SIDO_FILTER_OPTIONS,
  getInstitutionSigunguSelectOptions,
} from '@/shared/config/institution-address-region-data'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import './institution-application-tab.css'

type GeminiInstitutionApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type GeminiInstitutionApplicationRow = {
  id: string
  no: number
  institutionName: string
  institutionSido: string
  institutionSigungu: string
  approvalStatus: GeminiInstitutionApprovalStatus
  preferredLectureSchedule: string
  studentCount: number
  teacherName: string
}

type PendingFilters = {
  institutionName: string
  institutionSido: string
  institutionSigungu: string
  approvalStatus: GeminiInstitutionApprovalStatus | 'ALL'
  teacherName: string
}

const APPROVAL_STATUS_LABEL: Record<GeminiInstitutionApprovalStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인 완료',
  REJECTED: '신청 반려',
}

const FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'institutionName',
    type: 'search',
    label: '신청 기관명',
    placeholder: '기관명을 입력하세요',
    width: '25%',
  },
  {
    key: 'institutionAddress',
    type: 'addressRegion',
    label: '기관 소재지',
    width: '25%',
    addressRegion: {
      sidoKey: 'institutionSido',
      sigunguKey: 'institutionSigungu',
      sidoOptions: INSTITUTION_SIDO_FILTER_OPTIONS,
      getSigunguOptions: getInstitutionSigunguSelectOptions,
      sidoPlaceholder: '시/도',
      sigunguPlaceholder: '시/군/구',
    },
  },
  {
    key: 'approvalStatus',
    type: 'select',
    label: '승인 현황',
    placeholder: '전체',
    width: '25%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '승인 대기', value: 'PENDING' },
      { label: '승인 완료', value: 'APPROVED' },
      { label: '신청 반려', value: 'REJECTED' },
    ],
  },
  {
    key: 'teacherName',
    type: 'search',
    label: '담당 교사명',
    placeholder: '교사명을 입력하세요',
    width: '25%',
  },
]

const INITIAL_PENDING_FILTERS: PendingFilters = {
  institutionName: '',
  institutionSido: '',
  institutionSigungu: '',
  approvalStatus: 'ALL',
  teacherName: '',
}

const MOCK_ROWS: GeminiInstitutionApplicationRow[] = [
  {
    id: 'gia-30',
    no: 30,
    institutionName: '강서초등학교',
    institutionSido: '서울특별시',
    institutionSigungu: '강서구',
    approvalStatus: 'PENDING',
    preferredLectureSchedule:
      '1지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)\n2지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)\n3지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)',
    studentCount: 15,
    teacherName: '홍길동',
  },
  {
    id: 'gia-29',
    no: 29,
    institutionName: '푸른솔초등학교',
    institutionSido: '경기도',
    institutionSigungu: '성남시 분당구',
    approvalStatus: 'APPROVED',
    preferredLectureSchedule:
      '1지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)\n2지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)\n3지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)',
    studentCount: 15,
    teacherName: '홍길동',
  },
  {
    id: 'gia-28',
    no: 28,
    institutionName: '하늘빛초등학교',
    institutionSido: '인천광역시',
    institutionSigungu: '연수구',
    approvalStatus: 'REJECTED',
    preferredLectureSchedule:
      '1지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)\n2지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)\n3지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)',
    studentCount: 15,
    teacherName: '홍길동',
  },
]

const TABLE_SCROLL_X = TABLE_COLUMN_WIDTHS.checkbox + 72 + 150 + 170 + 120 + 420 + 100 + 120 + 48

function approvalStatusText(status: GeminiInstitutionApprovalStatus) {
  const base = 'gemini-institution-application-tab__approval'
  const modifier =
    status === 'PENDING'
      ? `${base}--pending`
      : status === 'APPROVED'
        ? `${base}--approved`
        : `${base}--rejected`
  return <span className={`${base} ${modifier}`}>{APPROVAL_STATUS_LABEL[status]}</span>
}

function toRegionText(row: GeminiInstitutionApplicationRow): string {
  return `${row.institutionSido} ${row.institutionSigungu}`.trim()
}

function filterRows(rows: GeminiInstitutionApplicationRow[], filters: PendingFilters) {
  const institutionNameQ = filters.institutionName.trim().toLowerCase()
  const teacherNameQ = filters.teacherName.trim().toLowerCase()

  return rows.filter(row => {
    if (institutionNameQ && !row.institutionName.toLowerCase().includes(institutionNameQ)) {
      return false
    }
    if (filters.institutionSido && row.institutionSido !== filters.institutionSido) {
      return false
    }
    if (filters.institutionSigungu && row.institutionSigungu !== filters.institutionSigungu) {
      return false
    }
    if (filters.approvalStatus !== 'ALL' && row.approvalStatus !== filters.approvalStatus) {
      return false
    }
    if (teacherNameQ && !row.teacherName.toLowerCase().includes(teacherNameQ)) {
      return false
    }
    return true
  })
}

export function GeminiInstitutionApplicationTab() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)

  const filteredRows = useMemo(() => filterRows(MOCK_ROWS, appliedFilters), [appliedFilters])

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const handleBulkReject = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    // TODO: 참여 기관 신청 선택 반려 확인 모달·API 연동
  }, [canWrite, selectedRowKeys.length, showNoSelectionAlert])

  const handleBulkApprove = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    // TODO: 참여 기관 신청 선택 승인 확인 모달·API 연동
  }, [canWrite, selectedRowKeys.length, showNoSelectionAlert])

  const columns = useMemo<ColumnsType<GeminiInstitutionApplicationRow>>(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 72,
        align: 'center',
      },
      {
        title: '신청 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: 150,
        align: 'center',
      },
      {
        title: '기관 소재지',
        key: 'region',
        width: 170,
        align: 'center',
        render: (_: unknown, row) => toRegionText(row),
      },
      {
        title: '승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 120,
        align: 'center',
        render: (status: GeminiInstitutionApprovalStatus) => approvalStatusText(status),
      },
      {
        title: '강의 진행 희망 교육 날짜 및 시간',
        dataIndex: 'preferredLectureSchedule',
        key: 'preferredLectureSchedule',
        width: 420,
        align: 'center',
        onCell: () => ({ className: 'gemini-institution-application-tab__schedule-cell' }),
        render: (value: string) => (
          <div className="gemini-institution-application-tab__schedule">{value}</div>
        ),
      },
      {
        title: '수강 인원',
        dataIndex: 'studentCount',
        key: 'studentCount',
        width: 100,
        align: 'center',
        render: (count: number) => `${count}명`,
      },
      {
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 120,
        align: 'center',
      },
    ],
    []
  )

  return (
    <FilterTableLayout
      bordered={false}
      fields={FILTER_FIELDS}
      filters={pendingFilters}
      onFilterChange={(key, value) => {
        if (key === 'institutionSido') {
          setPendingFilters(prev => ({
            ...prev,
            institutionSido: value == null ? '' : String(value),
            institutionSigungu: '',
          }))
          return
        }
        if (key === 'institutionSigungu') {
          setPendingFilters(prev => ({
            ...prev,
            institutionSigungu: value == null ? '' : String(value),
          }))
          return
        }
        if (key === 'approvalStatus') {
          setPendingFilters(prev => ({
            ...prev,
            approvalStatus: (value == null
              ? 'ALL'
              : String(value)) as PendingFilters['approvalStatus'],
          }))
          return
        }
        setPendingFilters(prev => ({
          ...prev,
          [key]: value == null ? '' : String(value),
        }))
      }}
      onSearch={() => setAppliedFilters(pendingFilters)}
      title="참여 기관 신청 목록"
      description={`총 ${filteredRows.length.toLocaleString()}건`}
      actions={
        canWrite ? (
          <>
            <CmsButton variant="delete" size="medium" onClick={handleBulkReject}>
              선택 반려
            </CmsButton>
            <CmsButton variant="secondary" size="medium" onClick={handleBulkApprove}>
              선택 승인
            </CmsButton>
          </>
        ) : null
      }
    >
      <Table<GeminiInstitutionApplicationRow>
        rowKey="id"
        className="cms-data-table"
        tableLayout="fixed"
        scroll={{ x: TABLE_SCROLL_X }}
        columns={columns}
        dataSource={filteredRows}
        pagination={false}
        rowSelection={
          canWrite
            ? {
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
                preserveSelectedRowKeys: false,
              }
            : undefined
        }
      />
    </FilterTableLayout>
  )
}
