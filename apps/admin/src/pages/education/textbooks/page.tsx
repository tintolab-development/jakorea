/**
 * 교재 관리 목록
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import type { Dayjs } from 'dayjs'
import { Image, Switch, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  EducationTextbook,
  EducationTextbookListFilter,
} from '@/entities/education-textbook/model/types'
import { useEducationBusinessFieldsList } from '@/features/education-business-field/api/hooks'
import { educationBusinessFieldQueryKeys } from '@/features/education-business-field/api/query-keys'
import { EDUCATION_BUSINESS_FIELDS_CHANGED_EVENT } from '@/features/education-business-field/api/store'
import { useEducationTargetsList } from '@/features/education-target/api/hooks'
import { educationTargetQueryKeys } from '@/features/education-target/api/query-keys'
import { EDUCATION_TARGETS_CHANGED_EVENT } from '@/features/education-target/api/store'
import { EducationTargetsModal } from '@/features/education-target/ui/targets-modal'
import {
  useCreateEducationTextbook,
  useEducationTextbooksList,
  useRemoveEducationTextbooks,
  useSetEducationTextbookActive,
  useUpdateEducationTextbook,
} from '@/features/education-textbook/api/hooks'
import { educationTextbookQueryKeys } from '@/features/education-textbook/api/query-keys'
import { EDUCATION_TEXTBOOKS_CHANGED_EVENT } from '@/features/education-textbook/api/store'
import {
  EducationTextbookFormModal,
  type TextbookFormMode,
  type TextbookFormValues,
} from '@/features/education-textbook/ui/form-modal'
import { formatDateTimeDot } from '@/shared/lib/format-display'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, CMS_TABLE_USAGE_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { isTableSelectionClick } from '@/shared/lib/is-table-selection-click'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { useListFilterUrl } from '@/shared/lib/use-list-filter-url'
import type { TableSearchParamRule } from '@/shared/lib/use-table-search'
import {
  applyDateRangeToSearchParams,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type PendingDateRange,
  type UrlDateRangePendingSyncRef,
} from '@/shared/lib/url-date-range-pending-sync'
import {
  CmsButton,
  CmsDateRangePicker,
  CmsInput,
  CmsSelect,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'

import './page.css'

type UsagePending = '' | 'active' | 'inactive'

type TextbookPendingFilters = {
  usage: UsagePending
  title: string
  businessFieldId: string
  educationTargetId: string
  createdRange: PendingDateRange
}

const INITIAL_PENDING: TextbookPendingFilters = {
  usage: '',
  title: '',
  businessFieldId: '',
  educationTargetId: '',
  createdRange: null,
}

/**
 * 고정 열: 체크·No·사용·썸네일 (px)
 * 가변 열: 교재명·사업·대상·효과·등록 — min 기준 + 화면 잔여폭 분배
 * 좁은 뷰포트 가로 스크롤 최소폭 = 합 1220
 */
const TEXTBOOK_COL = {
  checkbox: TABLE_COLUMN_WIDTHS.checkbox,
  no: TABLE_COLUMN_WIDTHS.index,
  usage: TABLE_COLUMN_WIDTHS.usage,
  thumb: 120,
  title: 220,
  field: 140,
  target: 120,
  effect: 200,
  date: 180,
} as const

const TEXTBOOK_TABLE_SCROLL_X =
  TEXTBOOK_COL.checkbox +
  TEXTBOOK_COL.no +
  TEXTBOOK_COL.usage +
  TEXTBOOK_COL.thumb +
  TEXTBOOK_COL.title +
  TEXTBOOK_COL.field +
  TEXTBOOK_COL.target +
  TEXTBOOK_COL.effect +
  TEXTBOOK_COL.date

/** 고정 열 — 잔여폭이 와도 픽셀 유지 */
function fixedCell(width: number) {
  return {
    style: {
      width,
      minWidth: width,
      maxWidth: width,
    } as const,
  }
}

/** 가변 열 — min만 잡고 화면 너비에 맞춰 확장 */
function fluidCell(minWidth: number) {
  return {
    style: {
      minWidth,
    } as const,
  }
}

const createdSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseUsage(raw: string | null): UsagePending {
  if (raw === 'active' || raw === 'inactive') return raw
  return ''
}

function parseApplied(searchParams: URLSearchParams): EducationTextbookListFilter {
  const filter: EducationTextbookListFilter = {}
  const usage = parseUsage(searchParams.get('tb_usage'))
  if (usage === 'active' || usage === 'inactive') {
    filter.usage = usage
  }
  const title = (searchParams.get('tb_title') ?? '').trim()
  if (title) filter.title = title
  const businessFieldId = (searchParams.get('tb_field') ?? '').trim()
  if (businessFieldId) filter.businessFieldId = businessFieldId
  const educationTargetId = (searchParams.get('tb_target') ?? '').trim()
  if (educationTargetId) filter.educationTargetId = educationTargetId
  const createdFrom = searchParams.get('tb_cre_from')
  const createdTo = searchParams.get('tb_cre_to')
  if (createdFrom) filter.createdFrom = createdFrom
  if (createdTo) filter.createdTo = createdTo
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<TextbookPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'usage',
    paramKey: 'tb_usage',
    condition: f => f.usage === 'active' || f.usage === 'inactive',
  },
  {
    kind: 'param',
    filterKey: 'title',
    paramKey: 'tb_title',
    condition: f => f.title.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'businessFieldId',
    paramKey: 'tb_field',
    condition: f => f.businessFieldId.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'educationTargetId',
    paramKey: 'tb_target',
    condition: f => f.educationTargetId.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.createdRange, 'tb_cre_from', 'tb_cre_to')
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

function formatDateTime(iso: string): string {
  return formatDateTimeDot(iso)
}

export function EducationTextbooksPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
  } = useListFilterUrl<TextbookPendingFilters, EducationTextbookListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const usage = parseUsage(searchParams.get('tb_usage'))
      const title = searchParams.get('tb_title') ?? ''
      const businessFieldId = searchParams.get('tb_field') ?? ''
      const educationTargetId = searchParams.get('tb_target') ?? ''
      const creFrom = searchParams.get('tb_cre_from')
      const creTo = searchParams.get('tb_cre_to')

      setPending(prev => {
        const createdRange = resolvePendingDateRangeFromUrl({
          ref: createdSyncRef,
          from: creFrom,
          to: creTo,
          prev: prev.createdRange,
        }) as PendingDateRange

        const next: TextbookPendingFilters = {
          usage,
          title,
          businessFieldId,
          educationTargetId,
          createdRange,
        }
        if (
          prev.usage === next.usage &&
          prev.title === next.title &&
          prev.businessFieldId === next.businessFieldId &&
          prev.educationTargetId === next.educationTargetId &&
          pendingDateRangeTupleEqual(prev.createdRange, next.createdRange)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const fieldsQuery = useEducationBusinessFieldsList()
  const targetsQuery = useEducationTargetsList()
  const listQuery = useEducationTextbooksList(appliedFilter)
  const createMutation = useCreateEducationTextbook()
  const updateMutation = useUpdateEducationTextbook()
  const removeMutation = useRemoveEducationTextbooks()
  const setActiveMutation = useSetEducationTextbookActive()

  useInvalidateOnWindowEvent(
    EDUCATION_TEXTBOOKS_CHANGED_EVENT,
    educationTextbookQueryKeys.all
  )
  useInvalidateOnWindowEvent(
    EDUCATION_BUSINESS_FIELDS_CHANGED_EVENT,
    educationBusinessFieldQueryKeys.all
  )
  useInvalidateOnWindowEvent(
    EDUCATION_TARGETS_CHANGED_EVENT,
    educationTargetQueryKeys.all
  )

  const businessFields = useMemo(() => fieldsQuery.data ?? [], [fieldsQuery.data])
  const educationTargets = useMemo(() => targetsQuery.data ?? [], [targetsQuery.data])
  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])

  const fieldNameById = useMemo(
    () => new Map(businessFields.map(f => [f.id, f.name])),
    [businessFields]
  )
  const targetNameById = useMemo(
    () => new Map(educationTargets.map(t => [t.id, t.name])),
    [educationTargets]
  )

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [targetsOpen, setTargetsOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<TextbookFormMode>('create')
  const [editing, setEditing] = useState<EducationTextbook | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const rowNoMap = useMemo(() => {
    const map = new Map<string, number>()
    const total = rows.length
    rows.forEach((row, index) => {
      map.set(row.id, total - index)
    })
    return map
  }, [rows])

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  const openCreate = useCallback(() => {
    setFormMode('create')
    setEditing(null)
    setFormOpen(true)
  }, [])

  const openDetail = useCallback((row: EducationTextbook) => {
    setFormMode('view')
    setEditing(row)
    setFormOpen(true)
  }, [])

  const handleRequestEdit = useCallback(() => {
    setFormMode('edit')
  }, [])

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      void setActiveMutation.mutateAsync({ id, isActive }).catch(() => {
        showAlert({
          title: '사용 여부 변경 실패',
          content: '사용 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, setActiveMutation, showAlert]
  )

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({
        title: '항목 선택',
        content: '선택된 항목이 없습니다.',
      })
      return
    }
    setBulkDeleteOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleBulkDeleteConfirm = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setBulkDeleteOpen(false)
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '교재 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
      void listQuery.refetch()
    }
  }, [listQuery, removeMutation, selectedRowKeys, showAlert])

  const handleFormSubmit = useCallback(
    async (values: TextbookFormValues) => {
      try {
        if ((formMode === 'edit' || formMode === 'view') && editing) {
          await updateMutation.mutateAsync({ ...values, id: editing.id })
        } else {
          await createMutation.mutateAsync(values)
        }
        setFormOpen(false)
        setEditing(null)
        setFormMode('create')
      } catch {
        showAlert({
          title: formMode === 'create' ? '등록 실패' : '저장 실패',
          content: '요청을 처리하지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [createMutation, editing, formMode, showAlert, updateMutation]
  )

  const handleFormDelete = useCallback(async () => {
    if (!editing) return
    try {
      await removeMutation.mutateAsync([editing.id])
      setFormOpen(false)
      setEditing(null)
      setFormMode('create')
      setSelectedRowKeys(prev => prev.filter(k => k !== editing.id))
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '교재 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [editing, removeMutation, showAlert])

  const formLoading = createMutation.isPending || updateMutation.isPending

  const fieldFilterOptions = useMemo(
    () => businessFields.map(f => ({ value: f.id, label: f.name })),
    [businessFields]
  )

  const targetFilterOptions = useMemo(
    () => educationTargets.map(t => ({ value: t.id, label: t.name })),
    [educationTargets]
  )

  const columns: ColumnsType<EducationTextbook> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TEXTBOOK_COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        onHeaderCell: () => fixedCell(TEXTBOOK_COL.no),
        onCell: () => fixedCell(TEXTBOOK_COL.no),
        render: (_, row) => rowNoMap.get(row.id) ?? '-',
      },
      {
        title: '사용 여부',
        dataIndex: 'isActive',
        key: 'isActive',
        width: TEXTBOOK_COL.usage,
        align: 'center',
        className: `${CMS_TABLE_USAGE_COL_CLASS} education-textbooks-page__active-col`,
        onHeaderCell: () => fixedCell(TEXTBOOK_COL.usage),
        onCell: () => fixedCell(TEXTBOOK_COL.usage),
        render: (value: boolean, row) => (
          <Switch
            checked={value}
            onClick={(_, e) => e.stopPropagation()}
            onChange={checked => {
              handleToggleActive(row.id, checked)
            }}
          />
        ),
      },
      {
        title: '썸네일',
        key: 'thumbnail',
        width: TEXTBOOK_COL.thumb,
        align: 'center',
        className: 'education-textbooks-page__thumb-col',
        onHeaderCell: () => fixedCell(TEXTBOOK_COL.thumb),
        onCell: () => fixedCell(TEXTBOOK_COL.thumb),
        render: (_, row) => (
          <div className="education-textbooks-page__thumb-cell">
            <div className="education-textbooks-page__thumb-wrap">
              {row.thumbnailUrl ? (
                <Image
                  className="education-textbooks-page__thumb"
                  src={row.thumbnailUrl}
                  alt=""
                  preview={false}
                />
              ) : (
                <span className="education-textbooks-page__thumb-empty">-</span>
              )}
            </div>
          </div>
        ),
      },
      {
        title: '교재명',
        dataIndex: 'title',
        key: 'title',
        width: TEXTBOOK_COL.title,
        ellipsis: true,
        align: 'center',
        className: 'education-textbooks-page__title-col',
        onHeaderCell: () => fluidCell(TEXTBOOK_COL.title),
        onCell: () => fluidCell(TEXTBOOK_COL.title),
        render: (value: string) => value || '-',
      },
      {
        title: '사업 분야',
        key: 'businessField',
        width: TEXTBOOK_COL.field,
        align: 'center',
        ellipsis: true,
        className: 'education-textbooks-page__field-col',
        onHeaderCell: () => fluidCell(TEXTBOOK_COL.field),
        onCell: () => fluidCell(TEXTBOOK_COL.field),
        render: (_, row) => fieldNameById.get(row.businessFieldId) ?? '-',
      },
      {
        title: '교육 대상',
        key: 'educationTargets',
        width: TEXTBOOK_COL.target,
        align: 'center',
        ellipsis: true,
        className: 'education-textbooks-page__target-col',
        onHeaderCell: () => fluidCell(TEXTBOOK_COL.target),
        onCell: () => fluidCell(TEXTBOOK_COL.target),
        render: (_, row) =>
          row.educationTargetIds.length > 0
            ? row.educationTargetIds
                .map(id => targetNameById.get(id) ?? id)
                .join(', ')
            : '-',
      },
      {
        title: '교육 효과',
        dataIndex: 'educationEffect',
        key: 'educationEffect',
        width: TEXTBOOK_COL.effect,
        ellipsis: true,
        align: 'center',
        className: 'education-textbooks-page__effect-col',
        onHeaderCell: () => fluidCell(TEXTBOOK_COL.effect),
        onCell: () => fluidCell(TEXTBOOK_COL.effect),
        render: (value: string) => value || '-',
      },
      {
        title: '등록일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: TEXTBOOK_COL.date,
        align: 'center',
        className: 'education-textbooks-page__date-col',
        onHeaderCell: () => fluidCell(TEXTBOOK_COL.date),
        onCell: () => fluidCell(TEXTBOOK_COL.date),
        render: (value: string) => formatDateTime(value),
      },
    ],
    [fieldNameById, handleToggleActive, rowNoMap, targetNameById]
  )

  return (
    <div className="education-textbooks-page">
      <div className="admin-list-card education-textbooks-page__filter-card">
        {/*
          1행 필터: 필드 + 조회를 동일 flex 행에 두고 flex-end 정렬
          (split bottom만 두고 조회를 두면 빈 행에 버튼이 떨어져 얼라인이 깨짐)
        */}
        <div className="admin-filter-area education-textbooks-page__filter">
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">사용 여부</p>
            <CmsSelect
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              withAllOption
              value={pendingFilters.usage}
              placeholder="전체"
              options={[
                { value: 'active', label: '사용' },
                { value: 'inactive', label: '미사용' },
              ]}
              onChange={v =>
                setPendingFilters(prev => ({
                  ...prev,
                  usage: (v === 'active' || v === 'inactive' ? v : '') as UsagePending,
                }))
              }
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">교재명</p>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              value={pendingFilters.title}
              placeholder="교재명을 입력하세요"
              onChange={e =>
                setPendingFilters(prev => ({ ...prev, title: e.target.value }))
              }
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">사업 분야</p>
            <CmsSelect
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              withAllOption
              value={pendingFilters.businessFieldId}
              placeholder="전체"
              options={fieldFilterOptions}
              onChange={v =>
                setPendingFilters(prev => ({
                  ...prev,
                  businessFieldId: v == null ? '' : String(v),
                }))
              }
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">교육 대상</p>
            <CmsSelect
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              withAllOption
              value={pendingFilters.educationTargetId}
              placeholder="전체"
              options={targetFilterOptions}
              onChange={v =>
                setPendingFilters(prev => ({
                  ...prev,
                  educationTargetId: v == null ? '' : String(v),
                }))
              }
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <p className="admin-filter-area__label">등록일</p>
            <CmsDateRangePicker
              inputSize="large"
              width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
              value={rangeAsPicker(pendingFilters.createdRange)}
              placeholder={['시작일', '종료일']}
              allowClear
              onChange={dates => {
                if (!dates || (!dates[0] && !dates[1])) {
                  setPendingFilters(prev => ({ ...prev, createdRange: null }))
                  return
                }
                setPendingFilters(prev => ({
                  ...prev,
                  createdRange: [dates[0] ?? null, dates[1] ?? null],
                }))
              }}
            />
          </div>
          <div className="admin-filter-area__actions">
            <CmsButton
              className="admin-filter-area__search-button"
              variant="primary"
              size="large"
              type="button"
              width={FILTER_SEARCH_BUTTON_WIDTH_PX}
              onClick={handleSearch}
            >
              조회
            </CmsButton>
          </div>
        </div>
      </div>

      <div className="admin-list-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">교재 목록</span>
            <span className="table-description">
              총 {rows.length.toLocaleString('ko-KR')}건
            </span>
          </div>
          <div className="table-header-actions--wrapper">
            <CmsButton
              variant="delete"
              size="large"
              type="button"
              onClick={handleBulkDeleteClick}
              disabled={removeMutation.isPending}
            >
              선택 삭제
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              className="cms-button--toolbar-auto"
              onClick={() => setTargetsOpen(true)}
            >
              교육 대상 관리
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              type="button"
              onClick={openCreate}
            >
              교재 등록
            </CmsButton>
          </div>
        </div>

        <div className="education-textbooks-page__table-scroll">
          <Table<EducationTextbook>
            className="ant-table-wrapper cms-data-table education-textbooks-table"
            rowKey="id"
            loading={listQuery.isLoading}
            dataSource={rows}
            columns={columns}
            pagination={false}
            tableLayout="fixed"
            scroll={{ x: TEXTBOOK_TABLE_SCROLL_X }}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
              columnWidth: TEXTBOOK_COL.checkbox,
            }}
            onRow={record => ({
              onClick: e => {
                if (isTableSelectionClick(e)) return
                openDetail(record)
              },
              style: { cursor: 'pointer' },
            })}
          />
        </div>
      </div>

      <EducationTargetsModal
        open={targetsOpen}
        onCancel={() => setTargetsOpen(false)}
        onSaved={() => {
          void targetsQuery.refetch()
        }}
      />

      <EducationTextbookFormModal
        open={formOpen}
        mode={formMode}
        initial={editing}
        businessFields={businessFields}
        educationTargets={educationTargets}
        confirmLoading={formLoading}
        deleteLoading={removeMutation.isPending}
        onCancel={() => {
          setFormOpen(false)
          setEditing(null)
          setFormMode('create')
        }}
        onSubmit={values => {
          void handleFormSubmit(values)
        }}
        onRequestEdit={handleRequestEdit}
        onDelete={() => {
          void handleFormDelete()
        }}
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        title="교재 삭제"
        content={`선택한 교재 ${selectedRowKeys.length}건을 삭제하시겠습니까?`}
        warningMessage="삭제된 항목은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          void handleBulkDeleteConfirm()
        }}
      />
    </div>
  )
}
