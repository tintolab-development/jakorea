/**
 * 인재채용 관리 목록
 * 행 클릭은 신청 상세 모달. 주소·학력·경력 본문은 상세 GET으로만 채운다.
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import { applyKoreanPhoneInputChange } from '@jakorea/domain/shared/korean-phone'
import type {
  RecruitApplicant,
  RecruitApplicantListFilter,
  RecruitApplicantStatus,
  RecruitCareerType,
  RecruitJobInterest,
} from '@/entities/recruit-applicant/model/types'
import {
  useConfirmRecruitApplicants,
  useRecruitApplicantDetail,
  useRecruitApplicantsList,
  useRemoveRecruitApplicants,
} from '@/features/recruit-applicant/api/hooks'
import { shouldUseRecruitApplicantRemoteApi } from '@/features/recruit-applicant/api/capabilities'
import { isRecruitApplicantNotFoundError } from '@/features/recruit-applicant/api/service'
import { isAdminForbidden } from '@/features/system-inbox/lib/http-status'
import { RecruitApplicantDetailModal } from '@/features/recruit-applicant/ui/detail-modal'
import { recruitApplicantQueryKeys } from '@/features/recruit-applicant/api/query-keys'
import { RECRUIT_APPLICANTS_CHANGED_EVENT } from '@/features/recruit-applicant/api/store'
import { displayServerPiiAsIs } from '@/shared/lib/homepage-pii-display'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { formatDateTimeDot, formatNumberDisplay } from '@/shared/lib/format-display'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { isTableSelectionClick } from '@/shared/lib/is-table-selection-click'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { useListFilterUrl } from '@/shared/lib/use-list-filter-url'
import { useUrlDetailId } from '@/shared/lib/use-url-detail-id'
import type { TableSearchParamRule } from '@/shared/lib/use-table-search'
import {
  applyDateRangeToSearchParams,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type PendingDateRange,
  type UrlDateRangePendingSyncRef,
  ymdFromParam,
} from '@/shared/lib/url-date-range-pending-sync'
import {
  AdminFilterTextInput,
  AdminInfiniteTableFooter,
  CmsButton,
  CmsDateRangePicker,
  CmsInput,
  CmsSelect,
  ConfirmModal,
  NO_SELECTION_ALERT,
  showChangeCompletedAlert,
  showDeleteCompletedAlert,
  useCmsAlert,
  FilterTableLayout,
} from '@/shared/ui'

import './page.css'

type StatusPending = '' | RecruitApplicantStatus
type JobPending = '' | RecruitJobInterest
type CareerPending = '' | RecruitCareerType

type ApplicantPendingFilters = {
  status: StatusPending
  jobInterest: JobPending
  applicantName: string
  phone: string
  email: string
  careerType: CareerPending
  appliedRange: PendingDateRange
  confirmedRange: PendingDateRange
}

const INITIAL_PENDING: ApplicantPendingFilters = {
  status: '',
  jobInterest: '',
  applicantName: '',
  phone: '',
  email: '',
  careerType: '',
  appliedRange: null,
  confirmedRange: null,
}

const appliedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
const confirmedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
const DETAIL_QUERY_KEYS = ['applicationId'] as const

const JOB_OPTIONS: Array<{ value: RecruitJobInterest; label: string }> = [
  { value: 'managementPlanning', label: '경영/기획' },
  { value: 'prDesign', label: '홍보/디자인' },
  { value: 'accounting', label: '회계' },
  { value: 'hrAdmin', label: '인사/총무' },
  { value: 'educationOps', label: '교육운영' },
  { value: 'other', label: '기타' },
]

const CAREER_OPTIONS: Array<{ value: RecruitCareerType; label: string }> = [
  { value: 'newbie', label: '신입' },
  { value: 'experienced', label: '경력' },
]

function jobLabel(value: RecruitJobInterest): string {
  return JOB_OPTIONS.find(item => item.value === value)?.label ?? '-'
}

function careerLabel(value: RecruitCareerType): string {
  return CAREER_OPTIONS.find(item => item.value === value)?.label ?? '-'
}

function statusLabel(status: RecruitApplicantStatus): string {
  return status === 'confirmed' ? '확인 완료' : '확인 대기'
}

function parseStatus(raw: string | null): StatusPending {
  if (raw === 'pending' || raw === 'confirmed') return raw
  return ''
}

function parseJob(raw: string | null): JobPending {
  if (JOB_OPTIONS.some(item => item.value === raw)) return raw as RecruitJobInterest
  return ''
}

function parseCareer(raw: string | null): CareerPending {
  if (raw === 'newbie' || raw === 'experienced') return raw
  return ''
}

function parseApplied(searchParams: URLSearchParams): RecruitApplicantListFilter {
  const filter: RecruitApplicantListFilter = {}
  const status = parseStatus(searchParams.get('ra_status'))
  if (status) filter.status = status
  const jobInterest = parseJob(searchParams.get('ra_job'))
  if (jobInterest) filter.jobInterest = jobInterest
  const applicantName = (searchParams.get('ra_name') ?? '').trim()
  if (applicantName) filter.applicantName = applicantName
  const phone = (searchParams.get('ra_phone') ?? '').trim()
  if (phone) filter.phone = phone
  const email = (searchParams.get('ra_email') ?? '').trim()
  if (email) filter.email = email
  const careerType = parseCareer(searchParams.get('ra_career'))
  if (careerType) filter.careerType = careerType
  const appliedFrom = ymdFromParam(searchParams.get('ra_applied_from'))
  const appliedTo = ymdFromParam(searchParams.get('ra_applied_to'))
  if (appliedFrom) filter.appliedFrom = appliedFrom
  if (appliedTo) filter.appliedTo = appliedTo
  const confirmedFrom = ymdFromParam(searchParams.get('ra_confirmed_from'))
  const confirmedTo = ymdFromParam(searchParams.get('ra_confirmed_to'))
  if (confirmedFrom) filter.confirmedFrom = confirmedFrom
  if (confirmedTo) filter.confirmedTo = confirmedTo
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<ApplicantPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'status',
    paramKey: 'ra_status',
    condition: f => f.status === 'pending' || f.status === 'confirmed',
  },
  {
    kind: 'param',
    filterKey: 'jobInterest',
    paramKey: 'ra_job',
    condition: f => JOB_OPTIONS.some(item => item.value === f.jobInterest),
  },
  {
    kind: 'param',
    filterKey: 'applicantName',
    paramKey: 'ra_name',
    condition: f => f.applicantName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'phone',
    paramKey: 'ra_phone',
    condition: f => f.phone.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'email',
    paramKey: 'ra_email',
    condition: f => f.email.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'careerType',
    paramKey: 'ra_career',
    condition: f => f.careerType === 'newbie' || f.careerType === 'experienced',
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.appliedRange, 'ra_applied_from', 'ra_applied_to')
      applyDateRangeToSearchParams(
        nextParams,
        f.confirmedRange,
        'ra_confirmed_from',
        'ra_confirmed_to'
      )
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

export function RecruitApplicantsPage() {
  const { showAlert } = useCmsAlert()
  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    searchParams,
    patchSearchParams,
    hasActiveFilters,
  } = useListFilterUrl<ApplicantPendingFilters, RecruitApplicantListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      setPending(prev => {
        const appliedRange = resolvePendingDateRangeFromUrl({
          ref: appliedSyncRef,
          from: searchParams.get('ra_applied_from'),
          to: searchParams.get('ra_applied_to'),
          prev: prev.appliedRange,
        }) as PendingDateRange
        const confirmedRange = resolvePendingDateRangeFromUrl({
          ref: confirmedSyncRef,
          from: searchParams.get('ra_confirmed_from'),
          to: searchParams.get('ra_confirmed_to'),
          prev: prev.confirmedRange,
        }) as PendingDateRange
        const next: ApplicantPendingFilters = {
          status: parseStatus(searchParams.get('ra_status')),
          jobInterest: parseJob(searchParams.get('ra_job')),
          applicantName: searchParams.get('ra_name') ?? '',
          phone: searchParams.get('ra_phone') ?? '',
          email: searchParams.get('ra_email') ?? '',
          careerType: parseCareer(searchParams.get('ra_career')),
          appliedRange,
          confirmedRange,
        }
        if (
          prev.status === next.status &&
          prev.jobInterest === next.jobInterest &&
          prev.applicantName === next.applicantName &&
          prev.phone === next.phone &&
          prev.email === next.email &&
          prev.careerType === next.careerType &&
          pendingDateRangeTupleEqual(prev.appliedRange, next.appliedRange) &&
          pendingDateRangeTupleEqual(prev.confirmedRange, next.confirmedRange)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useRecruitApplicantsList(appliedFilter)
  const confirmMutation = useConfirmRecruitApplicants()
  const removeMutation = useRemoveRecruitApplicants()

  const { sentinelRef } = useGatedInfiniteScroll({
    hasNextPage: listQuery.hasNextPage,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    resetKey: JSON.stringify(appliedFilter),
  })

  useInvalidateOnWindowEvent(RECRUIT_APPLICANTS_CHANGED_EVENT, recruitApplicantQueryKeys.all)

  const rows = listQuery.rows
  const totalCount = listQuery.totalCount
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const { detailId, openDetail, closeDetail } = useUrlDetailId(
    searchParams,
    patchSearchParams,
    DETAIL_QUERY_KEYS
  )
  const detailQuery = useRecruitApplicantDetail(detailId)
  const remoteDetail = shouldUseRecruitApplicantRemoteApi()

  const rowNoMap = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((row, index) => {
      map.set(row.id, totalCount - index)
    })
    return map
  }, [rows, totalCount])

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  const requireSelection = useCallback(() => {
    if (selectedRowKeys.length > 0) return true
    showAlert(NO_SELECTION_ALERT)
    return false
  }, [selectedRowKeys.length, showAlert])

  const handleBulkDeleteConfirm = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setBulkDeleteOpen(false)
      showDeleteCompletedAlert()
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '인재채용 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
      void listQuery.refetch()
    }
  }, [listQuery, removeMutation, selectedRowKeys, showAlert])

  const detailRow =
    detailId && detailQuery.data?.id === detailId ? detailQuery.data : null
  const detailLoading = Boolean(detailId) && !detailRow

  useEffect(() => {
    if (!remoteDetail || !detailId || !detailQuery.isError) return
    const notFound = isRecruitApplicantNotFoundError(detailQuery.error)
    const forbidden = isAdminForbidden(detailQuery.error)
    showAlert({
      title: forbidden ? '권한 없음' : notFound ? '신청을 찾을 수 없음' : '조회 실패',
      content: forbidden
        ? '해당 신청을 조회할 권한이 없습니다.'
        : notFound
          ? '신청 정보를 찾을 수 없습니다.'
          : '신청 상세를 불러오지 못했습니다. 다시 시도해 주세요.',
    })
    closeDetail()
  }, [closeDetail, detailId, detailQuery.error, detailQuery.isError, remoteDetail, showAlert])

  const handleDetailConfirm = useCallback(async () => {
    if (!detailRow) return
    try {
      await confirmMutation.mutateAsync([{ id: detailRow.id, version: detailRow.version }])
      showChangeCompletedAlert()
    } catch {
      showAlert({
        title: '확인 실패',
        content: '신청 확인에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [confirmMutation, detailRow, showAlert])

  const handleDetailDelete = useCallback(async () => {
    if (!detailRow) return
    try {
      await removeMutation.mutateAsync([detailRow.id])
      setSelectedRowKeys(prev => prev.filter(key => key !== detailRow.id))
      closeDetail()
      showDeleteCompletedAlert()
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '신청 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [closeDetail, detailRow, removeMutation, showAlert])

  const handleBulkConfirm = useCallback(async () => {
    try {
      const selected = rows.filter(row => selectedRowKeys.includes(row.id))
      await confirmMutation.mutateAsync(selected.map(row => ({ id: row.id, version: row.version })))
      setSelectedRowKeys([])
      setBulkConfirmOpen(false)
      showChangeCompletedAlert()
    } catch {
      showAlert({
        title: '확인 실패',
        content: '선택 확인에 실패했습니다. 다시 시도해 주세요.',
      })
      void listQuery.refetch()
    }
  }, [confirmMutation, listQuery, rows, selectedRowKeys, showAlert])

  const columns: ColumnsType<RecruitApplicant> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_, row) => rowNoMap.get(row.id) ?? '-',
      },
      {
        title: '처리 상태',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        align: 'center',
        render: (value: RecruitApplicantStatus) => (
          <span
            className={
              value === 'pending'
                ? 'recruit-applicants-page__status recruit-applicants-page__status--pending'
                : 'recruit-applicants-page__status recruit-applicants-page__status--confirmed'
            }
          >
            {statusLabel(value)}
          </span>
        ),
      },
      {
        title: '관심 직무',
        dataIndex: 'jobInterest',
        key: 'jobInterest',
        width: 140,
        align: 'center',
        render: (value: RecruitJobInterest) => jobLabel(value),
      },
      {
        title: '지원자',
        dataIndex: 'applicantName',
        key: 'applicantName',
        width: TABLE_COLUMN_WIDTHS.name,
        align: 'center',
        ellipsis: true,
        render: (value: string | null) => displayServerPiiAsIs(value),
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: TABLE_COLUMN_WIDTHS.phone,
        align: 'center',
        render: (value: string | null) => displayServerPiiAsIs(value),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: TABLE_COLUMN_WIDTHS.email,
        align: 'center',
        ellipsis: true,
        render: (value: string | null) => displayServerPiiAsIs(value),
      },
      {
        title: '경력',
        dataIndex: 'careerType',
        key: 'careerType',
        width: 100,
        align: 'center',
        render: (value: RecruitCareerType) => careerLabel(value),
      },
      {
        title: '신청일시',
        dataIndex: 'appliedAt',
        key: 'appliedAt',
        width: 160,
        align: 'center',
        render: (value: string) => formatDateTimeDot(value),
      },
      {
        title: '확인일시',
        dataIndex: 'confirmedAt',
        key: 'confirmedAt',
        width: 160,
        align: 'center',
        render: (value: string | null) => formatDateTimeDot(value),
      },
    ],
    [rowNoMap]
  )

  return (
    <div className="recruit-applicants-page">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        filter={
          <div className="admin-filter-area admin-filter-area--split recruit-applicants-page__filter">
            <div className="admin-filter-area__head">
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">처리 상태</p>
                <CmsSelect
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  withAllOption
                  value={pendingFilters.status}
                  placeholder="전체"
                  options={[
                    { value: 'pending', label: '확인 대기' },
                    { value: 'confirmed', label: '확인 완료' },
                  ]}
                  onChange={value =>
                    setPendingFilters(prev => ({
                      ...prev,
                      status: (value as StatusPending) || '',
                    }))
                  }
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">관심 직무</p>
                <CmsSelect
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  withAllOption
                  value={pendingFilters.jobInterest}
                  placeholder="전체"
                  options={JOB_OPTIONS}
                  onChange={value =>
                    setPendingFilters(prev => ({
                      ...prev,
                      jobInterest: (value as JobPending) || '',
                    }))
                  }
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">지원자</p>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  value={pendingFilters.applicantName}
                  placeholder="지원자명을 입력해 주세요"
                  onChange={value =>
                    patchPendingFilters(prev => ({ ...prev, applicantName: value }))
                  }
                  onPressEnter={handleSearch}
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">연락처</p>
                <CmsInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={pendingFilters.phone}
                  placeholder="연락처를 입력해 주세요"
                  onChange={event => {
                    const result = applyKoreanPhoneInputChange(
                      pendingFilters.phone,
                      event.target.value,
                      event.target.selectionStart
                    )
                    event.target.value = result.formatted
                    setPendingFilters(prev => ({ ...prev, phone: result.formatted }))
                    requestAnimationFrame(() => {
                      event.target.setSelectionRange(result.caret, result.caret)
                    })
                  }}
                  onPressEnter={handleSearch}
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">이메일</p>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  value={pendingFilters.email}
                  placeholder="이메일을 입력해 주세요"
                  onChange={value => patchPendingFilters(prev => ({ ...prev, email: value }))}
                  onPressEnter={handleSearch}
                />
              </div>
            </div>
            <div className="admin-filter-area__bottom">
              <div className="admin-filter-area__bottom-fields">
                <div className="admin-filter-area__field admin-filter-area__field--control">
                  <p className="admin-filter-area__label">경력</p>
                  <CmsSelect
                    inputSize="medium"
                    width={FILTER_CONTROL_MAX_WIDTH_PX}
                    withAllOption
                    value={pendingFilters.careerType}
                    placeholder="전체"
                    options={CAREER_OPTIONS}
                    onChange={value =>
                      setPendingFilters(prev => ({
                        ...prev,
                        careerType: (value as CareerPending) || '',
                      }))
                    }
                  />
                </div>
                <div className="admin-filter-area__field admin-filter-area__field--date-range">
                  <p className="admin-filter-area__label">신청일</p>
                  <CmsDateRangePicker
                    inputSize="medium"
                    width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                    value={rangeAsPicker(pendingFilters.appliedRange)}
                    placeholder={['시작일', '종료일']}
                    allowClear
                    onChange={dates => {
                      if (!dates || (!dates[0] && !dates[1])) {
                        setPendingFilters(prev => ({ ...prev, appliedRange: null }))
                        return
                      }
                      setPendingFilters(prev => ({
                        ...prev,
                        appliedRange: [dates[0] ?? null, dates[1] ?? null],
                      }))
                    }}
                  />
                </div>
                <div className="admin-filter-area__field admin-filter-area__field--date-range">
                  <p className="admin-filter-area__label">확인일</p>
                  <CmsDateRangePicker
                    inputSize="medium"
                    width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                    value={rangeAsPicker(pendingFilters.confirmedRange)}
                    placeholder={['시작일', '종료일']}
                    allowClear
                    onChange={dates => {
                      if (!dates || (!dates[0] && !dates[1])) {
                        setPendingFilters(prev => ({ ...prev, confirmedRange: null }))
                        return
                      }
                      setPendingFilters(prev => ({
                        ...prev,
                        confirmedRange: [dates[0] ?? null, dates[1] ?? null],
                      }))
                    }}
                  />
                </div>
              </div>
              <div className="admin-filter-area__actions">
                <CmsButton
                  className="admin-filter-area__search-button"
                  variant="primary"
                  size="medium"
                  type="button"
                  onClick={handleSearch}
                >
                  조회
                </CmsButton>
              </div>
            </div>
          </div>
        }
        title="인재채용 신청 목록"
        description={`총 ${formatNumberDisplay(totalCount)}건`}
        actions={
          <>
            <CmsButton
              variant="delete"
              size="h40"
              type="button"
              loading={removeMutation.isPending}
              onClick={() => {
                if (requireSelection()) setBulkDeleteOpen(true)
              }}
            >
              선택 삭제
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="h40"
              type="button"
              loading={confirmMutation.isPending}
              onClick={() => {
                if (requireSelection()) setBulkConfirmOpen(true)
              }}
            >
              선택 확인
            </CmsButton>
          </>
        }
      >
        <div className="recruit-applicants-page__table-scroll">
          <CmsDataTable<RecruitApplicant>
            className="cms-data-table recruit-applicants-page__table"
            rowKey="id"
            loading={listQuery.isLoading}
            dataSource={rows}
            columns={columns}
            pagination={false}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            }}
            onRow={record => ({
              onClick: event => {
                if (isTableSelectionClick(event)) return
                openDetail(record.id)
              },
              style: { cursor: 'pointer' },
            })}
          />
          <AdminInfiniteTableFooter
            sentinelRef={sentinelRef}
            isFetchingNextPage={listQuery.isFetchingNextPage}
          />
        </div>
      </FilterTableLayout>

      <RecruitApplicantDetailModal
        open={detailId != null}
        loading={detailLoading}
        data={detailRow}
        confirmLoading={confirmMutation.isPending && detailId != null}
        deleteLoading={removeMutation.isPending && detailId != null}
        onCancel={closeDetail}
        onConfirm={() => {
          void handleDetailConfirm()
        }}
        onDelete={() => {
          void handleDetailDelete()
        }}
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        title="인재채용 삭제"
        content={`선택한 신청 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          void handleBulkDeleteConfirm()
        }}
      />
      <ConfirmModal
        open={bulkConfirmOpen}
        title="선택 확인"
        content={`선택한 신청 ${selectedRowKeys.length}건을 확인 완료로 변경하시겠습니까?`}
        confirmText="확인"
        cancelText="취소"
        confirmLoading={confirmMutation.isPending}
        onCancel={() => setBulkConfirmOpen(false)}
        onConfirm={() => {
          void handleBulkConfirm()
        }}
      />
    </div>
  )
}
