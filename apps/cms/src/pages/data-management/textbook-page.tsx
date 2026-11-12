import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { useNavigateToAncestor } from '@/shared/hooks/use-history-ancestor-navigation'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  CMS_TABLE_NO_COL_CLASS,
  CMS_TABLE_USAGE_COL_CLASS,
  TABLE_COLUMN_WIDTHS,
} from '@/shared/constants/table'
import {
  CmsButton,
  ContentModal,
  showDeleteCompletedAlert,
  showRegisterCompletedAlert,
  showUpdateCompletedAlert,
  useCmsAlert,
  FilterTableToolbarButton,
} from '@/shared/ui'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { resolveTextbookDeleteConfirmCopy } from '@/features/textbook/lib/textbook-delete-confirm-copy'
import {
  isTextbookInUseDeleteError,
  TEXTBOOK_DELETE_BLOCKED_REASON,
} from '@/features/textbook/lib/is-textbook-in-use-delete-error'
import { resolveDeleteBlockedGuideCopy } from '@/shared/lib/delete-blocked-guide-copy'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { isDataManagementListLoading } from '@/features/data-management/lib/is-list-query-loading'
import { getTextbookListFilterKey } from '@/features/textbook/api/admin-textbooks-service'
import { useTextbookListQuery } from '@/features/textbook/hooks/use-textbook-list-query'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { usePrefetchTextbookDetail } from '@/features/textbook/hooks/use-textbook-detail-query'
import { useTextbookMutations } from '@/features/textbook/hooks/use-textbook-mutations'
import { useMaterialKitQuantitiesQuery } from '@/features/textbook/hooks/use-material-kit-quantities-query'
import { useMaterialKitQuantitiesMutation } from '@/features/textbook/hooks/use-material-kit-quantities-mutation'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import {
  TextbookRegisterModal,
  type TextbookRegisterPayload,
} from '@/features/textbook/ui/textbook-register-modal'
import {
  TextbookKitQuantityModal,
  DEFAULT_KIT_QUANTITIES,
  EMPTY_KIT_QUANTITIES,
  type TextbookKitQuantityValues,
} from '@/features/textbook/ui/textbook-kit-quantity-modal'
import { TextbookDetailFullPageModal } from '@/features/textbook/ui/textbook-detail-fullpage-modal'
import { BusinessAreaManagementModal } from '@/features/textbook/ui/business-area-management-modal'
import { useTextbookBusinessAreaSelectOptions } from '@/features/textbook/hooks/use-business-areas-query'
import { TEXTBOOK_EDUCATION_TARGET_SELECT_OPTIONS } from '@/features/textbook/model/textbook-education-targets'
import { textbookFilterGradeOptions } from '@/features/textbook/model/textbook-grade-options'
import {
  parseTextbookUseStatus,
  type TextbookListFilters,
} from '@/features/textbook/api/textbook-filter-params'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import './textbook-page.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

type TextbookFilters = TextbookListFilters

const DEFAULT_TB_USE = 'USED' as const
const TB_USE_PARAM = 'tb_use'

const TEXTBOOK_TABLE_SCROLL_X = 1260

const TEXTBOOK_COL_WIDTH = {
  businessArea: 150,
  educationTarget: 150,
  grade: 130,
  textbookName: 260,
  useStatus: TABLE_COLUMN_WIDTHS.usage,
  registrant: 130,
  registeredAt: 200,
} as const

const INITIAL_FILTERS: TextbookFilters = {
  useStatus: DEFAULT_TB_USE,
  textbookName: '',
  businessArea: 'ALL',
  educationTarget: 'ALL',
  grade: '',
}

export default function TextbookPage() {
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const tbUseParam = searchParams.get(TB_USE_PARAM)
  const initialUseStatus = parseTextbookUseStatus(tbUseParam)

  const [pendingFilters, setPendingFilters] = useState<TextbookFilters>(() => ({
    ...INITIAL_FILTERS,
    useStatus: initialUseStatus,
  }))
  const [appliedFilters, setAppliedFilters] = useState<TextbookFilters>(() => ({
    ...INITIAL_FILTERS,
    useStatus: initialUseStatus,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteBlockedSelectedCount, setDeleteBlockedSelectedCount] = useState(1)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [kitQuantityModalOpen, setKitQuantityModalOpen] = useState(false)
  const [businessAreaModalOpen, setBusinessAreaModalOpen] = useState(false)
  const [kitQuantityChangeConfirmOpen, setKitQuantityChangeConfirmOpen] = useState(false)
  const { options: businessAreaSelectOptions } = useTextbookBusinessAreaSelectOptions()
  const remoteKitEnabled = useDataManagementRemoteEnabled('textbooks', true)
  const kitQuantitiesQuery = useMaterialKitQuantitiesQuery(remoteKitEnabled && kitQuantityModalOpen)
  const kitQuantitiesMutation = useMaterialKitQuantitiesMutation()
  const [localKitQuantities, setLocalKitQuantities] =
    useState<TextbookKitQuantityValues>(DEFAULT_KIT_QUANTITIES)
  const kitQuantities = remoteKitEnabled
    ? (kitQuantitiesQuery.data ?? EMPTY_KIT_QUANTITIES)
    : localKitQuantities
  const kitQuantityLoadError = remoteKitEnabled
    ? kitQuantitiesQuery.error
      ? getDataManagementApiErrorMessage(
          kitQuantitiesQuery.error,
          '키트 수량을 불러오지 못했습니다.'
        )
      : null
    : null
  const [pendingKitQuantities, setPendingKitQuantities] =
    useState<TextbookKitQuantityValues | null>(null)
  const [kitSaveError, setKitSaveError] = useState<string | null>(null)
  /** 최초 진입 시 `tb_use` 없으면 사용(USED)으로 URL 고정 */
  useEffect(() => {
    if (tbUseParam === 'USED' || tbUseParam === 'UNUSED') return
    setSearchParams(
      prev => {
        if (prev.get(TB_USE_PARAM) === 'USED' || prev.get(TB_USE_PARAM) === 'UNUSED') return prev
        const next = new URLSearchParams(prev)
        next.set(TB_USE_PARAM, DEFAULT_TB_USE)
        return next
      },
      { replace: true }
    )
  }, [tbUseParam, setSearchParams])

  useEffect(() => {
    const useStatus = parseTextbookUseStatus(tbUseParam)
    setPendingFilters(prev => (prev.useStatus === useStatus ? prev : { ...prev, useStatus }))
    setAppliedFilters(prev => (prev.useStatus === useStatus ? prev : { ...prev, useStatus }))
  }, [tbUseParam])

  const listFilterKey = getTextbookListFilterKey(appliedFilters)
  const {
    rows,
    totalElements,
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTextbookListQuery(appliedFilters, true)
  const isInitialListLoading = isDataManagementListLoading({
    data: isListLoading ? undefined : rows,
    isError: isListError,
    isPending: isListLoading,
  })
  const { createMutation, updateMutation, deleteMutation } = useTextbookMutations()

  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: listFilterKey,
  })

  const gradeOptions = useMemo(
    () => textbookFilterGradeOptions(pendingFilters.educationTarget),
    [pendingFilters.educationTarget]
  )
  const isGradeFilterEnabled = pendingFilters.educationTarget !== 'ALL'

  const textbookFilterFields: FilterFieldConfig[] = useMemo(
    () => [
      {
        key: 'useStatus',
        type: 'radio',
        label: '사용 여부',
        width: '16%',
        defaultValue: DEFAULT_TB_USE,
        options: [
          { label: '사용', value: 'USED' },
          { label: '미사용', value: 'UNUSED' },
        ],
      },
      {
        key: 'textbookName',
        type: 'search',
        label: '교재명',
        placeholder: '교재명을 입력해 주세요',
        width: '20%',
      },
      {
        key: 'businessArea',
        type: 'select',
        label: '사업 분야',
        placeholder: '전체',
        width: '16%',
        options: [{ label: '전체', value: 'ALL' }, ...businessAreaSelectOptions],
      },
      {
        key: 'educationTarget',
        type: 'select',
        label: '교육 대상',
        placeholder: '전체',
        width: '16%',
        options: [{ label: '전체', value: 'ALL' }, ...TEXTBOOK_EDUCATION_TARGET_SELECT_OPTIONS],
      },
      {
        key: 'grade',
        type: 'select',
        label: '대상 학년',
        placeholder: isGradeFilterEnabled ? '전체' : '교육 대상을 선택해 주세요',
        width: '16%',
        withAllOption: false,
        disabled: !isGradeFilterEnabled,
        options: gradeOptions,
      },
    ],
    [businessAreaSelectOptions, gradeOptions, isGradeFilterEnabled]
  )

  const detailTextbookId = searchParams.get('textbookId')
  const detailMode = searchParams.get('textbookMode') === 'edit' ? 'edit' : 'view'
  const prefetchTextbookDetail = usePrefetchTextbookDetail()
  const listTextbook = useMemo(
    () => (detailTextbookId ? (rows.find(row => row.id === detailTextbookId) ?? null) : null),
    [detailTextbookId, rows]
  )

  const { toSearch: navigateToAncestorSearch } = useNavigateToAncestor()

  /**
   * 상세 열기·수정 진입은 push.
   * 닫기·같은 교재의 수정 취소·저장 후 보기 복귀는 지나온 엔트리로 뒤로(없으면 replace) — 앞쪽에 수정 엔트리를 남기지 않는다.
   */
  const setDetailRoute = useCallback(
    (id: string | null, mode: 'view' | 'edit' = 'view') => {
      const apply = (prev: URLSearchParams) => {
        const next = new URLSearchParams(prev)
        if (!id) {
          next.delete('textbookId')
          next.delete('textbookMode')
        } else {
          next.set('textbookId', id)
          next.set('textbookMode', mode)
        }
        return next
      }
      // 같은 교재 안에서 보기로 돌아가거나 닫을 때만 되돌아가기
      const isReturn = !id || (mode === 'view' && id === searchParams.get('textbookId'))
      if (isReturn) {
        navigateToAncestorSearch(apply)
        return
      }
      setSearchParams(apply(new URLSearchParams(searchParams)))
    },
    [navigateToAncestorSearch, searchParams, setSearchParams]
  )

  const filteredRows = rows

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => {
      if (key === 'useStatus') {
        const useStatus = value === 'UNUSED' ? 'UNUSED' : 'USED'
        return { ...prev, useStatus }
      }
      const nextValue = (value ?? (key === 'textbookName' ? '' : 'ALL')) as string
      if (key === 'educationTarget') {
        if (nextValue === 'ALL') {
          return {
            ...prev,
            educationTarget: nextValue,
            grade: '',
          }
        }
        const nextGradeOptions = textbookFilterGradeOptions(nextValue).map(opt => opt.value)
        const normalizedPrevGrade = prev.grade === 'ALL' || !prev.grade.trim() ? '' : prev.grade
        const nextGrade = nextGradeOptions.includes(normalizedPrevGrade)
          ? normalizedPrevGrade
          : (nextGradeOptions[0] ?? '')
        return {
          ...prev,
          educationTarget: nextValue,
          grade: nextGrade,
        }
      }
      return {
        ...prev,
        [key]: nextValue,
      }
    })
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters(pendingFilters)
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set(TB_USE_PARAM, pendingFilters.useStatus)
        return next
      },
      { replace: true }
    )
  }, [pendingFilters, setSearchParams])

  const handleDeleteSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleConfirmDeleteSelected = useCallback(async () => {
    const selectedIds = new Set(selectedRowKeys.map(key => String(key)))
    if (selectedIds.size === 0) return
    try {
      await deleteMutation.mutateAsync(Array.from(selectedIds))
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
      if (detailTextbookId && selectedIds.has(detailTextbookId)) {
        setDetailRoute(null)
      }
      showDeleteCompletedAlert()
    } catch (error) {
      if (isTextbookInUseDeleteError(error)) {
        setDeleteConfirmOpen(false)
        setDeleteBlockedSelectedCount(selectedIds.size)
        setDeleteBlockedOpen(true)
        return
      }
      console.debug(
        'textbookPage bulkDelete failed',
        getDataManagementApiErrorMessage(error, '삭제에 실패했습니다.')
      )
    }
  }, [deleteMutation, detailTextbookId, selectedRowKeys, setDetailRoute])

  const handleRegisterSubmit = useCallback(
    async (payload: TextbookRegisterPayload) => {
      try {
        await createMutation.mutateAsync(payload)
        setRegisterModalOpen(false)
        showRegisterCompletedAlert()
      } catch (error) {
        console.debug(
          'textbookPage register failed',
          getDataManagementApiErrorMessage(error, '등록에 실패했습니다.')
        )
      }
    },
    [createMutation]
  )

  const handleKitQuantityConfirm = useCallback((nextValues: TextbookKitQuantityValues) => {
    setPendingKitQuantities(nextValues)
    setKitQuantityChangeConfirmOpen(true)
  }, [])

  const handleConfirmKitQuantityChange = useCallback(async () => {
    if (pendingKitQuantities == null) return
    setKitSaveError(null)
    if (remoteKitEnabled) {
      try {
        await kitQuantitiesMutation.mutateAsync(pendingKitQuantities)
      } catch (error) {
        setKitSaveError(getDataManagementApiErrorMessage(error, '키트 수량 저장에 실패했습니다.'))
        return
      }
      try {
        await kitQuantitiesQuery.refetch()
      } catch {
        // 저장은 완료됨. 다음 팝업 오픈 시 GET으로 재조회한다.
      }
    } else {
      setLocalKitQuantities(pendingKitQuantities)
    }
    setPendingKitQuantities(null)
    setKitQuantityChangeConfirmOpen(false)
    setKitQuantityModalOpen(false)
    showUpdateCompletedAlert()
  }, [kitQuantitiesMutation, kitQuantitiesQuery, pendingKitQuantities, remoteKitEnabled])

  const deleteConfirmCopy = useMemo(() => {
    const n = selectedRowKeys.length
    if (n <= 1) {
      return resolveTextbookDeleteConfirmCopy('single')
    }
    return resolveTextbookDeleteConfirmCopy('bulk', n)
  }, [selectedRowKeys.length])

  const deleteBlockedCopy = useMemo(
    () =>
      resolveDeleteBlockedGuideCopy({
        entityLabel: '교재',
        reasonLine: TEXTBOOK_DELETE_BLOCKED_REASON,
        selectedCount: deleteBlockedSelectedCount,
      }),
    [deleteBlockedSelectedCount]
  )

  const columns: ColumnsType<TextbookRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_: unknown, __: TextbookRow, index: number) =>
          totalElements === 0 ? '—' : totalElements - index,
      },
      {
        title: '사용 여부',
        dataIndex: 'useStatus',
        key: 'useStatus',
        width: TEXTBOOK_COL_WIDTH.useStatus,
        className: CMS_TABLE_USAGE_COL_CLASS,
        align: 'center',
        render: (status: TextbookRow['useStatus']) => (status === 'USED' ? '사용' : '미사용'),
      },
      {
        title: '교재명',
        dataIndex: 'textbookName',
        key: 'textbookName',
        width: TEXTBOOK_COL_WIDTH.textbookName,
        align: 'center',
        // QA-0364: 말줄임 대신 줄바꿈으로 교재명 전체를 보인다
        className: 'textbook-page__col-name',
      },
      {
        title: '사업 분야',
        dataIndex: 'businessArea',
        key: 'businessArea',
        width: TEXTBOOK_COL_WIDTH.businessArea,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '교육 대상',
        dataIndex: 'educationTarget',
        key: 'educationTarget',
        width: TEXTBOOK_COL_WIDTH.educationTarget,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '대상 학년',
        dataIndex: 'grade',
        key: 'grade',
        width: TEXTBOOK_COL_WIDTH.grade,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '등록자명',
        dataIndex: 'registrant',
        key: 'registrant',
        width: TEXTBOOK_COL_WIDTH.registrant,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '등록일시',
        dataIndex: 'registeredAt',
        key: 'registeredAt',
        width: TEXTBOOK_COL_WIDTH.registeredAt,
        align: 'center',
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
      },
    ],
    [totalElements]
  )

  return (
    <div className="textbook-page">
      <NoticeDeleteConfirmModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteSelected}
        confirmLoading={deleteMutation.isPending}
        {...deleteConfirmCopy}
      />
      <DeleteBlockedGuideModal
        open={deleteBlockedOpen}
        onClose={() => setDeleteBlockedOpen(false)}
        title={deleteBlockedCopy.title}
        description={deleteBlockedCopy.description}
      />
      <TextbookRegisterModal
        open={registerModalOpen}
        onCancel={() => {
          setRegisterModalOpen(false)
        }}
        onSubmit={handleRegisterSubmit}
      />
      <BusinessAreaManagementModal
        open={businessAreaModalOpen}
        onCancel={() => setBusinessAreaModalOpen(false)}
      />
      <TextbookDetailFullPageModal
        open={Boolean(detailTextbookId)}
        textbookId={detailTextbookId}
        listTextbook={listTextbook}
        mode={detailMode}
        onClose={() => {
          setDetailRoute(null)
        }}
        onEdit={() => {
          if (!detailTextbookId) return
          setDetailRoute(detailTextbookId, 'edit')
        }}
        onCancel={() => {
          if (!detailTextbookId) return
          setDetailRoute(detailTextbookId, 'view')
        }}
        onSave={async payload => {
          if (!detailTextbookId) return
          if (
            !payload.textbookName.trim() ||
            !payload.textbookNameEn?.trim() ||
            !payload.businessArea
          ) {
            return
          }
          try {
            const updated = await updateMutation.mutateAsync({
              id: detailTextbookId,
              input: payload,
            })
            setDetailRoute(updated.id, 'view')
            showUpdateCompletedAlert()
          } catch (error) {
            console.debug(
              'textbookPage detail update failed',
              getDataManagementApiErrorMessage(error, '수정에 실패했습니다.')
            )
          }
        }}
      />
      <TextbookKitQuantityModal
        open={kitQuantityModalOpen}
        onCancel={() => {
          setKitQuantityModalOpen(false)
          setPendingKitQuantities(null)
        }}
        values={pendingKitQuantities ?? kitQuantities}
        loading={remoteKitEnabled && kitQuantitiesQuery.isPending}
        loadError={kitQuantityLoadError}
        onConfirm={handleKitQuantityConfirm}
      />
      <ContentModal
        open={kitQuantityChangeConfirmOpen}
        onCancel={() => {
          setKitQuantityChangeConfirmOpen(false)
          setPendingKitQuantities(null)
          setKitSaveError(null)
        }}
        title="키트수량 변경"
        width={600}
        className="textbook-kit-quantity-change-modal"
        wrapClassName="textbook-kit-quantity-change-modal-wrap"
        zIndex={1300}
        footer={
          <div className="textbook-kit-quantity-change-modal__footer">
            <CmsButton
              variant="secondary"
              type="button"
              onClick={() => {
                setKitQuantityChangeConfirmOpen(false)
                setPendingKitQuantities(null)
              }}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              type="button"
              onClick={handleConfirmKitQuantityChange}
              disabled={kitQuantitiesMutation.isPending}
            >
              확인
            </CmsButton>
          </div>
        }
      >
        <p className="textbook-kit-quantity-change-modal__description">
          키트 수량을 변경하더라도 기존에 진행된 프로그램에는 반영되지 않으며,
          <br />
          <strong>신규로 진행되는 프로그램부터 적용됩니다.</strong>
        </p>
        {kitSaveError ? (
          <p className="textbook-kit-quantity-change-modal__error">{kitSaveError}</p>
        ) : null}
      </ContentModal>
      <FilterTableLayout
        bordered={false}
        fields={textbookFilterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="교재 목록"
        description={`총 ${totalElements.toLocaleString()}건`}
        contentLoading={isInitialListLoading}
        actions={
          <>
            <FilterTableToolbarButton variant="delete" onClick={handleDeleteSelected}>
              교재 삭제
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              variant="secondary"
              onClick={() => setKitQuantityModalOpen(true)}
            >
              키트 수량 관리
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              variant="secondary"
              onClick={() => setBusinessAreaModalOpen(true)}
            >
              사업 분야 관리
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              variant="primary"
              onClick={() => {
                setRegisterModalOpen(true)
              }}
            >
              교재 등록
            </FilterTableToolbarButton>
          </>
        }
        excelExport={{
          accessLog: { downloadKind: 'TEXTBOOK_LIST_EXPORT', containedPiiTypes: ['NAME'] },
          columns,
          data: filteredRows,
          selectedRowKeys,
        }}
      >
        <CmsDataTable<TextbookRow>
          rowKey="id"
          className="cms-data-table textbook-page__table"
          tableLayout="fixed"
          scroll={{ x: TEXTBOOK_TABLE_SCROLL_X }}
          columns={columns}
          dataSource={filteredRows}
          loading={isListFetching && !isInitialListLoading}
          pagination={false}
          rowSelection={{
            columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys.map(key => String(key))),
            preserveSelectedRowKeys: false,
          }}
          onRow={record => ({
            // hover prefetch 금지: 등록 후 목록 remount 시 커서 아래 행마다
            // GET /textbooks/{id} N건이 동시에 나가는 과호출이 발생함. 클릭 시에만 prefetch.
            onClick: event => {
              const target = event.target as HTMLElement
              if (
                target.closest('.ant-checkbox-wrapper') ||
                target.closest('.ant-table-selection-column')
              ) {
                return
              }
              prefetchTextbookDetail(record.id)
              setDetailRoute(record.id, 'view')
            },
            style: { cursor: 'pointer' },
          })}
        />
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>
    </div>
  )
}
