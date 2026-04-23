import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ContentModal, DeleteGuideModal } from '@/shared/ui'
import {
  createTextbook,
  deleteTextbooks,
  listTextbooksFromStore,
  updateTextbook,
} from '@/features/textbook/api/textbook-service'
import {
  TextbookRegisterModal,
  type TextbookRegisterPayload,
} from '@/features/textbook/ui/textbook-register-modal'
import {
  TextbookKitQuantityModal,
  type TextbookKitQuantityValues,
} from '@/features/textbook/ui/textbook-kit-quantity-modal'
import { TextbookDetailFullPageModal } from '@/features/textbook/ui/textbook-detail-fullpage-modal'
import { TEXTBOOK_BUSINESS_AREA_SELECT_OPTIONS } from '@/features/textbook/model/textbook-business-areas'
import { TEXTBOOK_EDUCATION_TARGET_SELECT_OPTIONS } from '@/features/textbook/model/textbook-education-targets'
import type { TextbookRow, TextbookUseStatus } from '@/features/textbook/model/textbook.types'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/ui/program-list.css'
import './textbook-page.css'

type TextbookFilters = {
  businessArea: string
  educationTarget: string
  grade: string
  textbookName: string
  useStatus: TextbookUseStatus
}

const TEXTBOOK_TABLE_SCROLL_X = 1280

const TEXTBOOK_COL_WIDTH = {
  no: 80,
  businessArea: 150,
  educationTarget: 150,
  grade: 130,
  textbookName: 260,
  useStatus: 120,
  registrant: 130,
  registeredAt: 200,
} as const

const INITIAL_FILTERS: TextbookFilters = {
  businessArea: 'ALL',
  educationTarget: 'ALL',
  grade: 'ALL',
  textbookName: '',
  useStatus: 'ALL',
}

const DEFAULT_KIT_QUANTITIES: TextbookKitQuantityValues = {
  kindergarten: '24',
  elementary: '24',
  middle: '24',
  high: '32',
  university: '32',
}

const textbookFilterFields: FilterFieldConfig[] = [
  {
    key: 'businessArea',
    type: 'select',
    label: '사업 분야',
    placeholder: '전체',
    width: '16%',
    options: [{ label: '전체', value: 'ALL' }, ...TEXTBOOK_BUSINESS_AREA_SELECT_OPTIONS],
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
    options: [
      { label: '전체', value: 'ALL' },
      { label: '전학년', value: '전학년' },
      { label: '1학년', value: '1학년' },
      { label: '2학년', value: '2학년' },
      { label: '3학년', value: '3학년' },
    ],
  },
  {
    key: 'textbookName',
    type: 'search',
    label: '교재명',
    placeholder: '교재명',
    width: '24%',
  },
  {
    key: 'useStatus',
    type: 'select',
    label: '사용 여부',
    placeholder: '전체',
    width: '16%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '사용', value: 'USED' },
      { label: '미사용', value: 'UNUSED' },
    ],
  },
]

export default function TextbookPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rows, setRows] = useState<TextbookRow[]>(() => listTextbooksFromStore())
  const [pendingFilters, setPendingFilters] = useState<TextbookFilters>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<TextbookFilters>(INITIAL_FILTERS)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [selectedTextbook, setSelectedTextbook] = useState<TextbookRow | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [kitQuantityModalOpen, setKitQuantityModalOpen] = useState(false)
  const [kitQuantityChangeConfirmOpen, setKitQuantityChangeConfirmOpen] = useState(false)
  const [kitQuantities, setKitQuantities] =
    useState<TextbookKitQuantityValues>(DEFAULT_KIT_QUANTITIES)
  const [pendingKitQuantities, setPendingKitQuantities] =
    useState<TextbookKitQuantityValues | null>(null)

  const detailTextbookId = searchParams.get('textbookId')
  const detailMode = searchParams.get('textbookMode') === 'edit' ? 'edit' : 'view'

  useEffect(() => {
    if (!detailTextbookId) {
      setDetailModalOpen(false)
      return
    }
    const target = rows.find(row => row.id === detailTextbookId) ?? null
    setSelectedTextbook(target)
    setDetailModalOpen(target != null)
  }, [detailTextbookId, rows])

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

  const filteredRows = useMemo(() => {
    const keyword = appliedFilters.textbookName.trim().toLowerCase()
    return rows.filter(row => {
      if (
        appliedFilters.businessArea !== 'ALL' &&
        row.businessArea !== appliedFilters.businessArea
      ) {
        return false
      }
      if (
        appliedFilters.educationTarget !== 'ALL' &&
        row.educationTarget !== appliedFilters.educationTarget
      ) {
        return false
      }
      if (appliedFilters.grade !== 'ALL' && row.grade !== appliedFilters.grade) {
        return false
      }
      if (appliedFilters.useStatus !== 'ALL' && row.useStatus !== appliedFilters.useStatus) {
        return false
      }
      if (keyword.length > 0 && !row.textbookName.toLowerCase().includes(keyword)) {
        return false
      }
      return true
    })
  }, [appliedFilters, rows])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({
      ...prev,
      [key]: (value ?? (key === 'textbookName' ? '' : 'ALL')) as string,
    }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters(pendingFilters)
  }, [pendingFilters])

  const handleDeleteSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) return
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys.length])

  const handleConfirmDeleteSelected = useCallback(async () => {
    const selectedIds = new Set(selectedRowKeys.map(key => String(key)))
    if (selectedIds.size === 0) return
    try {
      await deleteTextbooks(Array.from(selectedIds))
      setRows(listTextbooksFromStore())
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
      message.success(`선택한 ${selectedIds.size}건의 교재가 삭제되었습니다.`)
    } catch {
      message.error('교재 삭제에 실패했습니다.')
    }
  }, [selectedRowKeys])

  const handleRegisterSubmit = useCallback(async (payload: TextbookRegisterPayload) => {
    try {
      await createTextbook(payload)
      message.success('교재가 등록되었습니다.')
      setRows(listTextbooksFromStore())
      setRegisterModalOpen(false)
    } catch {
      message.error('교재 등록에 실패했습니다.')
    }
  }, [])

  const handleKitQuantityConfirm = useCallback((nextValues: TextbookKitQuantityValues) => {
    setPendingKitQuantities(nextValues)
    setKitQuantityChangeConfirmOpen(true)
  }, [])

  const handleConfirmKitQuantityChange = useCallback(() => {
    if (pendingKitQuantities == null) return
    setKitQuantities(pendingKitQuantities)
    setPendingKitQuantities(null)
    setKitQuantityChangeConfirmOpen(false)
    setKitQuantityModalOpen(false)
    message.success('키트 수량이 변경되었습니다.')
  }, [pendingKitQuantities])

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
        width: TEXTBOOK_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: TextbookRow, index: number) =>
          filteredRows.length === 0 ? '—' : filteredRows.length - index,
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
        title: '교재명',
        dataIndex: 'textbookName',
        key: 'textbookName',
        width: TEXTBOOK_COL_WIDTH.textbookName,
        align: 'center',
        ellipsis: { showTitle: true },
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
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
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
      <TextbookDetailFullPageModal
        open={detailModalOpen}
        textbook={selectedTextbook}
        mode={detailMode}
        onClose={() => {
          setDetailRoute(null)
        }}
        onEdit={() => {
          if (!selectedTextbook) return
          setDetailRoute(selectedTextbook.id, 'edit')
        }}
        onSave={async payload => {
          if (!selectedTextbook) return
          if (
            !payload.textbookName.trim() ||
            !payload.textbookNameEn?.trim() ||
            !payload.businessArea
          ) {
            message.warning('필수 항목을 모두 입력해 주세요.')
            return
          }
          try {
            const updated = await updateTextbook(selectedTextbook.id, payload)
            setRows(listTextbooksFromStore())
            setSelectedTextbook(updated)
            setDetailRoute(updated.id, 'view')
            message.success('교재 정보가 수정되었습니다.')
          } catch {
            message.error('교재 수정에 실패했습니다.')
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
            <CmsButton variant="primary" type="button" onClick={handleConfirmKitQuantityChange}>
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
      </ContentModal>
      <FilterTableLayout
        bordered={false}
        fields={textbookFilterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="교재 목록"
        description={`총 ${filteredRows.length.toLocaleString()}건`}
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
      >
        <Table<TextbookRow>
          rowKey="id"
          className="cms-data-table textbook-page__table"
          tableLayout="fixed"
          scroll={{ x: TEXTBOOK_TABLE_SCROLL_X }}
          columns={columns}
          dataSource={filteredRows}
          pagination={false}
          rowSelection={{
            columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys.map(key => String(key))),
            preserveSelectedRowKeys: false,
          }}
          onRow={record => ({
            onClick: event => {
              const target = event.target as HTMLElement
              if (
                target.closest('.ant-checkbox-wrapper') ||
                target.closest('.ant-table-selection-column')
              ) {
                return
              }
              setDetailRoute(record.id, 'view')
            },
          })}
          rowClassName="textbook-page__row"
        />
      </FilterTableLayout>
    </div>
  )
}
