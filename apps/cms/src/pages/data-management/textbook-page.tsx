import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ContentModal, DeleteGuideModal } from '@/shared/ui'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { isDataManagementListLoading } from '@/features/data-management/lib/is-list-query-loading'
import { useTextbookListQuery } from '@/features/textbook/hooks/use-textbook-list-query'
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

type TextbookFilters = TextbookListFilters

const DEFAULT_TB_USE = 'USED' as const
const TB_USE_PARAM = 'tb_use'

const TEXTBOOK_TABLE_SCROLL_X = 1280

const TEXTBOOK_COL_WIDTH = {
  businessArea: 150,
  educationTarget: 150,
  grade: 130,
  textbookName: 260,
  useStatus: 120,
  registrant: 130,
  registeredAt: 200,
} as const

const INITIAL_FILTERS: TextbookFilters = {
  useStatus: DEFAULT_TB_USE,
  textbookName: '',
  businessArea: 'ALL',
  educationTarget: 'ALL',
  grade: 'ALL',
}

export default function TextbookPage() {
  const queryClient = useQueryClient()
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
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [kitQuantityModalOpen, setKitQuantityModalOpen] = useState(false)
  const [businessAreaModalOpen, setBusinessAreaModalOpen] = useState(false)
  const [kitQuantityChangeConfirmOpen, setKitQuantityChangeConfirmOpen] = useState(false)
  const { options: businessAreaSelectOptions } = useTextbookBusinessAreaSelectOptions()
  const remoteKitEnabled = useDataManagementRemoteEnabled('textbooks', true)
  const kitQuantitiesQuery = useMaterialKitQuantitiesQuery(
    remoteKitEnabled && kitQuantityModalOpen
  )
  const kitQuantitiesMutation = useMaterialKitQuantitiesMutation()
  const [localKitQuantities, setLocalKitQuantities] =
    useState<TextbookKitQuantityValues>(DEFAULT_KIT_QUANTITIES)
  const kitQuantities = remoteKitEnabled
    ? (kitQuantitiesQuery.data ?? DEFAULT_KIT_QUANTITIES)
    : localKitQuantities
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

  const listQuery = useTextbookListQuery(appliedFilters, true)
  const isInitialListLoading = isDataManagementListLoading(listQuery)
  const isListFetching = listQuery.isFetching
  const { createMutation, updateMutation, deleteMutation } = useTextbookMutations()
  const rows = listQuery.data ?? []

  const gradeOptions = useMemo(
    () => textbookFilterGradeOptions(pendingFilters.educationTarget),
    [pendingFilters.educationTarget]
  )

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
        placeholder: '교재명',
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
        placeholder: '전체',
        width: '16%',
        withAllOption: false,
        options: gradeOptions,
      },
    ],
    [businessAreaSelectOptions, gradeOptions]
  )

  const detailTextbookId = searchParams.get('textbookId')
  const detailMode = searchParams.get('textbookMode') === 'edit' ? 'edit' : 'view'
  const prefetchTextbookDetail = usePrefetchTextbookDetail()
  const listTextbook = useMemo(
    () => (detailTextbookId ? (rows.find(row => row.id === detailTextbookId) ?? null) : null),
    [detailTextbookId, rows]
  )

  const setDetailRoute = useCallback(
    (id: string | null, mode: 'view' | 'edit' = 'view') => {
      const next = new URLSearchParams(searchParams)
      if (!id) {
        next.delete('textbookId')
        next.delete('textbookMode')
      } else {
        next.set('textbookId', id)
        next.set('textbookMode', mode)
      }
      setSearchParams(next)
    },
    [searchParams, setSearchParams]
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
        const nextGradeOptions = textbookFilterGradeOptions(nextValue).map(opt => opt.value)
        const nextGrade = nextGradeOptions.includes(prev.grade) ? prev.grade : 'ALL'
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
    if (selectedRowKeys.length === 0) return
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys.length])

  const handleConfirmDeleteSelected = useCallback(async () => {
    const selectedIds = new Set(selectedRowKeys.map(key => String(key)))
    if (selectedIds.size === 0) return
    try {
      await deleteMutation.mutateAsync(Array.from(selectedIds))
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.debug(
        'textbookPage bulkDelete failed',
        getDataManagementApiErrorMessage(error, '삭제에 실패했습니다.')
      )
    }
  }, [deleteMutation, selectedRowKeys])

  const handleRegisterSubmit = useCallback(async (payload: TextbookRegisterPayload) => {
    try {
      await createMutation.mutateAsync(payload)
      setRegisterModalOpen(false)
    } catch (error) {
      console.debug(
        'textbookPage register failed',
        getDataManagementApiErrorMessage(error, '등록에 실패했습니다.')
      )
    }
  }, [createMutation])

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
        setKitSaveError(
          getDataManagementApiErrorMessage(error, '키트 수량 저장에 실패했습니다.')
        )
        return
      }
    } else {
      setLocalKitQuantities(pendingKitQuantities)
    }
    setPendingKitQuantities(null)
    setKitQuantityChangeConfirmOpen(false)
    setKitQuantityModalOpen(false)
  }, [kitQuantitiesMutation, pendingKitQuantities, remoteKitEnabled])

  const { deleteGuideTitle, deleteGuideLines } = useMemo(() => {
    const n = selectedRowKeys.length
    if (n === 1) {
      const id = String(selectedRowKeys[0])
      const row = rows.find(r => r.id === id)
      const name = row?.textbookName?.trim() || '해당 교재'
      return {
        deleteGuideTitle: '교재 삭제 안내',
        deleteGuideLines: [
          `[${name}] 교재를 삭제하시겠습니까?`,
          '삭제된 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
        ],
      }
    }
    return {
      deleteGuideTitle: '교재 일괄 삭제 안내',
      deleteGuideLines: [
        `**선택한 ${n}개의 교재**를 목록에서 모두 삭제하시겠습니까?`,
        '삭제된 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
      ],
    }
  }, [rows, selectedRowKeys])

  const columns: ColumnsType<TextbookRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_: unknown, __: TextbookRow, index: number) =>
          filteredRows.length === 0 ? '—' : filteredRows.length - index,
      },
      {
        title: '사용 여부',
        dataIndex: 'useStatus',
        key: 'useStatus',
        width: TEXTBOOK_COL_WIDTH.useStatus,
        align: 'center',
        render: (status: TextbookRow['useStatus']) => (status === 'USED' ? '사용' : '미사용'),
      },
      {
        title: '교재명',
        dataIndex: 'textbookName',
        key: 'textbookName',
        width: TEXTBOOK_COL_WIDTH.textbookName,
        align: 'center',
        ellipsis: { showTitle: true },
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
        title: '등록자',
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
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm'),
      },
    ],
    [filteredRows.length]
  )

  return (
    <div className="textbook-page">
      <DeleteGuideModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteSelected}
        title={deleteGuideTitle}
        lines={deleteGuideLines}
        confirmText="삭제"
        confirmVariant="delete"
        requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
        confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
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
        onSaved={() => {
          void queryClient.invalidateQueries({
            queryKey: dataManagementQueryKeys.textbooks.businessAreas(),
          })
          void queryClient.invalidateQueries({
            queryKey: dataManagementQueryKeys.textbooks.lists(),
          })
        }}
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
        onCancel={() => setKitQuantityModalOpen(false)}
        values={pendingKitQuantities ?? kitQuantities}
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
        description={`총 ${filteredRows.length.toLocaleString()}건`}
        contentLoading={isInitialListLoading}
        actions={
          <>
            <CmsButton
              variant="delete"
              onClick={handleDeleteSelected}
              disabled={selectedRowKeys.length === 0}
            >
              교재 삭제
            </CmsButton>
            <CmsButton variant="secondary" onClick={() => setKitQuantityModalOpen(true)}>
              키트 수량 관리
            </CmsButton>
            <CmsButton variant="secondary" onClick={() => setBusinessAreaModalOpen(true)}>
              사업 분야 관리
            </CmsButton>
            <CmsButton
              variant="primary"
              onClick={() => {
                setRegisterModalOpen(true)
              }}
            >
              교재 등록
            </CmsButton>
          </>
        }
        excelExport={{
          columns,
          data: filteredRows,
        }}
      >
        <Table<TextbookRow>
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
            onMouseEnter: () => prefetchTextbookDetail(record.id),
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
      </FilterTableLayout>
    </div>
  )
}
