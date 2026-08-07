/**
 * 수입&지출 항목 패널 (요약 · 툴바 · 정렬 테이블 · 등록 모달)
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { TableProps } from 'antd/es/table'
import {
  EXPENSE_CATEGORY_LABEL,
  GraphItemLimitError,
  MAX_GRAPH_ITEMS,
  type ExpenseCategory,
  type FinanceItem,
  type FinanceItemCreateInput,
  type FinanceSection,
  type FinanceViewKind,
} from '@/entities/income-expense/model/types'
import {
  useCreateFinanceItem,
  useFinanceItemsList,
  useRemoveFinanceItems,
  useReorderFinanceItems,
  useUpdateFinanceItems,
} from '@/features/income-expense/api/hooks'
import { incomeExpenseQueryKeys } from '@/features/income-expense/api/query-keys'
import { INCOME_EXPENSE_CHANGED_EVENT } from '@/features/income-expense/api/store'
import {
  formatAmount,
  formatRatioDisplay,
  parseAmountInput,
  parseRatioInput,
} from '@/features/income-expense/lib/format'
import { ItemFormModal } from '@/features/income-expense/ui/item-form-modal'
import {
  FinanceItemDragHandle,
  FinanceItemsSortableTable,
} from '@/features/income-expense/ui/sortable-table'
import { SummaryBar } from '@/features/income-expense/ui/summary-bar'
import { CMS_TABLE_NO_COL_CLASS, CMS_TABLE_SORT_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import {
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'

import './items-panel.css'

/**
 * 시안 열 비율
 * 수입(·지출 그래프): 체크5 · 순서5 · No.5 · 항목명40 · 비율15 · 금액30
 * 지출 테이블: +구분(~15) · 항목명(~35) · 비율(~10) · 금액(~20)
 */
const COL_WIDTH = {
  sort: TABLE_COLUMN_WIDTHS.sort,
  no: TABLE_COLUMN_WIDTHS.index,
  name: 480,
  ratio: 160,
  amount: 280,
  /** 지출 테이블 전용 */
  expense: {
    category: 160,
    name: 400,
    ratio: 120,
    amount: 220,
  },
} as const

type DraftRow = {
  name: string
  ratio: string
  amount: string
  category?: ExpenseCategory
}

type DraftMap = Record<string, DraftRow>

function itemsTitle(section: FinanceSection, view: FinanceViewKind): string {
  if (section === 'income' && view === 'graph') return '그래프 수입 항목'
  if (section === 'income' && view === 'table') return '테이블 수입 항목'
  if (section === 'expense' && view === 'graph') return '지출 그래프 항목'
  return '테이블 지출 항목'
}

function buildDraftMap(rows: FinanceItem[]): DraftMap {
  return Object.fromEntries(
    rows.map(row => [
      row.id,
      {
        name: row.name,
        ratio: String(row.ratio),
        amount: String(row.amount),
        ...(row.category ? { category: row.category } : {}),
      },
    ])
  )
}

type ItemsPanelProps = {
  section: FinanceSection
  view: FinanceViewKind
}

export function ItemsPanel({ section, view }: ItemsPanelProps) {
  const { showAlert } = useCmsAlert()
  const listQuery = useFinanceItemsList(section, view)
  const createMutation = useCreateFinanceItem(section, view)
  const updateMutation = useUpdateFinanceItems(section, view)
  const removeMutation = useRemoveFinanceItems(section, view)
  const reorderMutation = useReorderFinanceItems(section, view)

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const showCategory = section === 'expense' && view === 'table'

  const [isEditing, setIsEditing] = useState(false)
  const [drafts, setDrafts] = useState<DraftMap>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useInvalidateOnWindowEvent(INCOME_EXPENSE_CHANGED_EVENT, incomeExpenseQueryKeys.lists())

  const handleRowsReorder = useCallback(
    (reorderedRows: FinanceItem[]) => {
      void reorderMutation.mutateAsync(reorderedRows.map(row => row.id)).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '항목 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, reorderMutation, showAlert]
  )

  const handleStartEdit = useCallback(() => {
    setDrafts(buildDraftMap(rows))
    setIsEditing(true)
  }, [rows])

  const handleCancelEdit = useCallback(() => {
    setDrafts({})
    setIsEditing(false)
  }, [])

  const handleDraftChange = useCallback(
    (id: string, patch: Partial<DraftRow>) => {
      setDrafts(prev => ({
        ...prev,
        [id]: {
          name: prev[id]?.name ?? '',
          ratio: prev[id]?.ratio ?? '',
          amount: prev[id]?.amount ?? '',
          category: prev[id]?.category,
          ...patch,
        },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    try {
      const patches = rows.map(row => {
        const d = drafts[row.id]
        const name = (d?.name ?? row.name).trim()
        if (!name) {
          throw new Error('EMPTY_NAME')
        }
        const ratio = parseRatioInput(d?.ratio ?? String(row.ratio))
        if (ratio === null) {
          throw new Error('BAD_RATIO')
        }
        const amount = parseAmountInput(d?.amount ?? String(row.amount))
        if (amount === null) {
          throw new Error('BAD_AMOUNT')
        }
        const category = d?.category ?? row.category
        if (showCategory && !category) {
          throw new Error('BAD_CATEGORY')
        }
        return {
          id: row.id,
          name,
          ratio,
          amount,
          ...(category ? { category } : {}),
        }
      })

      await updateMutation.mutateAsync(patches)
      setDrafts({})
      setIsEditing(false)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'EMPTY_NAME') {
          showAlert({ title: '입력 확인', content: '항목명을 입력해 주세요.' })
          return
        }
        if (err.message === 'BAD_RATIO') {
          showAlert({ title: '입력 확인', content: '비율을 숫자로 입력해 주세요.' })
          return
        }
        if (err.message === 'BAD_AMOUNT') {
          showAlert({ title: '입력 확인', content: '금액을 숫자로 입력해 주세요.' })
          return
        }
        if (err.message === 'BAD_CATEGORY') {
          showAlert({ title: '입력 확인', content: '구분을 선택해 주세요.' })
          return
        }
      }
      showAlert({
        title: '저장 실패',
        content: '항목 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [drafts, rows, showAlert, showCategory, updateMutation])

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({
        title: '항목 선택',
        content: '삭제할 항목을 선택해 주세요.',
      })
      return
    }
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleConfirmDelete = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '항목 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const handleOpenCreate = useCallback(() => {
    if (view === 'graph' && rows.length >= MAX_GRAPH_ITEMS) {
      showAlert({
        title: '등록 제한',
        content: `그래프 항목은 최대 ${MAX_GRAPH_ITEMS}개까지 등록할 수 있습니다.`,
      })
      return
    }
    setCreateOpen(true)
  }, [rows.length, showAlert, view])

  const handleCreateSubmit = useCallback(
    async (values: FinanceItemCreateInput) => {
      try {
        await createMutation.mutateAsync(values)
        setCreateOpen(false)
      } catch (err) {
        if (err instanceof GraphItemLimitError) {
          showAlert({
            title: '등록 제한',
            content: err.message,
          })
          return
        }
        showAlert({
          title: '등록 실패',
          content: err instanceof Error ? err.message : '항목 등록에 실패했습니다.',
        })
      }
    },
    [createMutation, showAlert]
  )

  const rowSelection = useMemo<TableProps<FinanceItem>['rowSelection']>(
    () =>
      isEditing
        ? undefined
        : {
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys),
            columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
          },
    [isEditing, selectedRowKeys]
  )

  const columns = useMemo<ColumnsType<FinanceItem>>(() => {
    const dataCols = showCategory
      ? {
          category: COL_WIDTH.expense.category,
          name: COL_WIDTH.expense.name,
          ratio: COL_WIDTH.expense.ratio,
          amount: COL_WIDTH.expense.amount,
        }
      : {
          category: 0,
          name: COL_WIDTH.name,
          ratio: COL_WIDTH.ratio,
          amount: COL_WIDTH.amount,
        }

    const cols: ColumnsType<FinanceItem> = [
      {
        title: '순서',
        key: 'sort',
        width: COL_WIDTH.sort,
        align: 'center',
        className: `${CMS_TABLE_SORT_COL_CLASS} income-expense-table__col--sort`,
        render: () => <FinanceItemDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: COL_WIDTH.no,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_value, _record, index) => index + 1,
      },
    ]

    if (showCategory) {
      cols.push({
        title: '구분',
        key: 'category',
        width: dataCols.category,
        align: 'center',
        className: 'income-expense-table__col--category',
        render: (_value, record) => {
          const category = drafts[record.id]?.category ?? record.category
          if (isEditing) {
            return (
              <CmsRadioGroup
                size="medium"
                value={category ?? 'direct'}
                onChange={e =>
                  handleDraftChange(record.id, {
                    category: e.target.value as ExpenseCategory,
                  })
                }
              >
                <CmsRadio size="medium" value="direct">
                  {EXPENSE_CATEGORY_LABEL.direct}
                </CmsRadio>
                <CmsRadio size="medium" value="indirect">
                  {EXPENSE_CATEGORY_LABEL.indirect}
                </CmsRadio>
              </CmsRadioGroup>
            )
          }
          return (
            <span className="income-expense-panel__category-text">
              {category ? EXPENSE_CATEGORY_LABEL[category] : '-'}
            </span>
          )
        },
      })
    }

    cols.push(
      {
        title: '항목명',
        key: 'name',
        width: dataCols.name,
        className: 'income-expense-table__col--name',
        render: (_value, record) => {
          const value = drafts[record.id]?.name ?? record.name
          if (isEditing) {
            return (
              <CmsInput
                inputSize="medium"
                width="100%"
                value={value}
                onChange={e => handleDraftChange(record.id, { name: e.target.value })}
                placeholder="항목명"
                aria-label={`항목명 ${record.sortOrder}`}
              />
            )
          }
          return (
            <span className="income-expense-panel__cell-text" title={value || undefined}>
              {value || '-'}
            </span>
          )
        },
      },
      {
        title: '비율',
        key: 'ratio',
        width: dataCols.ratio,
        align: 'center',
        className: 'income-expense-table__col--ratio',
        render: (_value, record) => {
          const raw = drafts[record.id]?.ratio ?? String(record.ratio)
          if (isEditing) {
            return (
              <div className="income-expense-panel__input-suffix income-expense-panel__input-suffix--ratio">
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={raw}
                  onChange={e => handleDraftChange(record.id, { ratio: e.target.value })}
                  placeholder="0"
                  inputMode="decimal"
                  aria-label={`비율 ${record.sortOrder}`}
                />
                <span className="income-expense-panel__suffix">%</span>
              </div>
            )
          }
          return formatRatioDisplay(record.ratio)
        },
      },
      {
        title: '금액',
        key: 'amount',
        width: dataCols.amount,
        align: 'right',
        className: 'income-expense-table__col--amount',
        render: (_value, record) => {
          const raw = drafts[record.id]?.amount ?? String(record.amount)
          if (isEditing) {
            return (
              <div className="income-expense-panel__input-suffix income-expense-panel__input-suffix--amount">
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={raw}
                  onChange={e => handleDraftChange(record.id, { amount: e.target.value })}
                  placeholder="0"
                  inputMode="numeric"
                  aria-label={`금액 ${record.sortOrder}`}
                />
                <span className="income-expense-panel__suffix">원</span>
              </div>
            )
          }
          return formatAmount(record.amount)
        },
      }
    )

    return cols
  }, [drafts, handleDraftChange, isEditing, showCategory])

  const countLabel =
    view === 'graph'
      ? `총 ${rows.length.toLocaleString()}건 / ${MAX_GRAPH_ITEMS}건`
      : `총 ${rows.length.toLocaleString()}건`

  return (
    <div className="income-expense-panel">
      <SummaryBar section={section} view={view} items={rows} />

      <div className="income-expense-panel__list">
        <div className="admin-list-toolbar income-expense-panel__toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">■ {itemsTitle(section, view)}</span>
            <span className="table-description">{countLabel}</span>
          </div>
          <div className="table-header-actions--wrapper">
            {isEditing ? (
              <>
                <CmsButton
                  variant="secondary"
                  size="large"
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                >
                  취소
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
                  type="button"
                  loading={updateMutation.isPending}
                  onClick={() => void handleSave()}
                >
                  저장
                </CmsButton>
              </>
            ) : (
              <>
                <CmsButton
                  variant="delete"
                  size="large"
                  type="button"
                  onClick={handleDeleteClick}
                  loading={removeMutation.isPending}
                >
                  선택 삭제
                </CmsButton>
                <CmsButton
                  variant="secondary"
                  size="large"
                  type="button"
                  onClick={handleStartEdit}
                  disabled={rows.length === 0}
                >
                  항목 수정
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
                  type="button"
                  onClick={handleOpenCreate}
                >
                  항목 등록
                </CmsButton>
              </>
            )}
          </div>
        </div>

        <div className="income-expense-panel__table-scroll">
          <FinanceItemsSortableTable
            rows={rows}
            columns={columns}
            loading={listQuery.isLoading}
            rowSelection={rowSelection}
            onRowsReorder={handleRowsReorder}
            withCategory={showCategory}
          />
        </div>
      </div>

      <ItemFormModal
        open={createOpen}
        section={section}
        view={view}
        confirmLoading={createMutation.isPending}
        onCancel={() => setCreateOpen(false)}
        onSubmit={values => void handleCreateSubmit(values)}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="항목 삭제"
        content={`선택한 항목 ${selectedRowKeys.length}건을 삭제하시겠습니까?`}
        warningMessage="삭제된 항목은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
