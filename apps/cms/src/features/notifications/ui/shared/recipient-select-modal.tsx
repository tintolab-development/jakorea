import { useEffect, useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput, CmsSelect } from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { CMS_TABLE_EMPTY_COPY } from '@/shared/ui/cms-table-empty-copy'
import './recipient-select-modal.css'

const PICKER_Z_INDEX = 1100
const TYPE_COL_WIDTH = 140
export const SEND_RECIPIENT_PICKER_PAGE_SIZE = 5

export type SendRecipientPickerSearchParams = {
  typeValue: string
  keyword: string
  page: number
}

export type SendRecipientPickerRow = {
  id: string
  name: string
}

export type RecipientSelectModalProps<T extends SendRecipientPickerRow> = {
  open: boolean
  candidates?: T[]
  initialSelected?: T[]
  onClose: () => void
  onConfirm: (recipients: T[]) => void
  typeColumnTitle: string
  typeOptions: { label: string; value: string }[]
  getTypeLabel: (row: T) => string
  contactColumnTitle: string
  getContact: (row: T) => string
  filterCandidates?: (rows: T[], applied: { typeValue: string; keyword: string }) => T[]
  onSearch?: (params: SendRecipientPickerSearchParams) => void
  totalCount?: number
  totalPages?: number
  fetchAllCandidates?: () => Promise<T[]>
  pageSize?: number
  /** 유형 모드 전환 시 선택·검색 초기화 */
  resetKey?: string
  zIndex?: number
}

export function RecipientSelectModal<T extends SendRecipientPickerRow>({
  open,
  candidates = [],
  initialSelected = [],
  onClose,
  onConfirm,
  typeColumnTitle,
  typeOptions,
  getTypeLabel,
  contactColumnTitle,
  getContact,
  filterCandidates,
  onSearch,
  totalCount,
  totalPages: serverTotalPages,
  fetchAllCandidates,
  pageSize = SEND_RECIPIENT_PICKER_PAGE_SIZE,
  resetKey,
  zIndex = PICKER_Z_INDEX,
}: RecipientSelectModalProps<T>) {
  const [typeValue, setTypeValue] = useState('')
  const [keyword, setKeyword] = useState('')
  const [appliedType, setAppliedType] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [selectedById, setSelectedById] = useState<Record<string, T>>({})
  const [selectingAll, setSelectingAll] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedById(Object.fromEntries(initialSelected.map(item => [item.id, item])))
    setTypeValue('')
    setKeyword('')
    setAppliedType('')
    setAppliedKeyword('')
    setPage(1)
    setSelectingAll(false)
  }, [open, resetKey])

  const useServerPaging = Boolean(onSearch)

  const filtered = useMemo(() => {
    if (useServerPaging) return candidates
    if (filterCandidates) {
      return filterCandidates(candidates, { typeValue: appliedType, keyword: appliedKeyword })
    }
    return candidates
  }, [appliedKeyword, appliedType, candidates, filterCandidates, useServerPaging])

  useEffect(() => {
    if (!open || filtered.length === 0) return
    setSelectedById(prev => {
      let changed = false
      const next = { ...prev }
      for (const recipient of filtered) {
        if (next[recipient.id] && next[recipient.id] !== recipient) {
          next[recipient.id] = recipient
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [filtered, open])

  const clientTotalPages = Math.ceil(filtered.length / pageSize)
  const totalPages = useServerPaging ? Math.max(serverTotalPages ?? 1, 1) : clientTotalPages
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = useServerPaging
    ? filtered
    : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasResults = filtered.length > 0
  const checkedIds = useMemo(() => Object.keys(selectedById), [selectedById])
  const selectedCount = checkedIds.length
  const displayedTotal = useServerPaging ? (totalCount ?? filtered.length) : filtered.length
  const allSelected = displayedTotal > 0 && selectedCount >= displayedTotal

  const emitSearch = (nextPage: number, nextType = appliedType, nextKeyword = appliedKeyword) => {
    onSearch?.({
      typeValue: nextType,
      keyword: nextKeyword,
      page: Math.max(nextPage - 1, 0),
    })
  }

  const handleSearch = () => {
    const nextType = typeValue
    const nextKeyword = keyword.trim()
    setAppliedType(nextType)
    setAppliedKeyword(nextKeyword)
    setPage(1)
    setSelectedById({})
    emitSearch(1, nextType, nextKeyword)
  }

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    if (useServerPaging) emitSearch(nextPage)
  }

  const handleSelectAll = async () => {
    if (allSelected) {
      setSelectedById({})
      return
    }

    if (fetchAllCandidates) {
      setSelectingAll(true)
      try {
        const all = await fetchAllCandidates()
        setSelectedById(Object.fromEntries(all.map(item => [item.id, item])))
      } finally {
        setSelectingAll(false)
      }
      return
    }

    setSelectedById(Object.fromEntries(filtered.map(item => [item.id, item])))
  }

  const handleConfirm = () => {
    onConfirm(Object.values(selectedById))
  }

  const columns: ColumnsType<T> = [
    {
      title: typeColumnTitle,
      key: 'type',
      width: TYPE_COL_WIDTH,
      align: 'center',
      render: (_value, record) => getTypeLabel(record) || '-',
    },
    {
      title: '수신자명',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      ellipsis: true,
    },
    {
      title: contactColumnTitle,
      key: 'contact',
      align: 'center',
      ellipsis: true,
      render: (_value, record) => getContact(record) || '-',
    },
  ]

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="수신자 설정"
      size="default"
      className="send-recipient-select-modal"
      titleBodyGap="always"
      zIndex={zIndex}
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            loading={selectingAll}
            disabled={selectingAll || !hasResults}
            onClick={() => void handleSelectAll()}
          >
            전체 선택
          </CmsButton>
          <CmsButton variant="primary" size="large" type="button" onClick={handleConfirm}>
            수신자 설정
          </CmsButton>
        </>
      }
    >
      <div className="send-recipient-select-modal__body">
        <div className="send-recipient-select-modal__search">
          <CmsSelect
            inputSize="large"
            placeholder={typeColumnTitle}
            value={typeValue || undefined}
            onChange={value => setTypeValue(typeof value === 'string' ? value : '')}
            options={typeOptions}
            allowClear
            style={{ width: 180 }}
          />
          <span className="send-recipient-select-modal__search-input">
            <CmsInput
              icon={<SearchOutlined />}
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              onPressEnter={handleSearch}
              placeholder="수신자명을 검색하세요"
              inputSize="large"
              width="100%"
              allowClear
            />
          </span>
          <CmsButton type="button" variant="primary" size="large" onClick={handleSearch}>
            검색
          </CmsButton>
        </div>

        <p className="send-recipient-select-modal__count">
          총 {displayedTotal}명 / 선택{' '}
          <span className="send-recipient-select-modal__count-selected">{selectedCount}</span>명
        </p>

        {hasResults ? (
          <>
            <div className="send-recipient-select-modal__table-wrap">
              <CmsDataTable
                className="cms-data-table cms-data-table--skip-auto-no-col send-recipient-select-modal__table"
                columns={columns}
                dataSource={paged}
                rowKey="id"
                pagination={false}
                tableLayout="fixed"
                rowSelection={{
                  selectedRowKeys: checkedIds,
                  columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                  onChange: (_keys, selectedRows) => {
                    const pageIds = new Set(paged.map(item => item.id))
                    setSelectedById(prev => {
                      const next = { ...prev }
                      for (const id of pageIds) delete next[id]
                      for (const row of selectedRows) next[row.id] = row
                      return next
                    })
                  },
                }}
              />
            </div>
            <div className="send-recipient-select-modal__pagination">
              <CmsCompactPagination
                variant="modal"
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                onPageChange={handlePageChange}
                ariaLabel="수신자 설정 페이지 이동"
              />
            </div>
          </>
        ) : (
          <div className="send-recipient-select-modal__empty" role="status">
            <p className="send-recipient-select-modal__empty-title">
              {CMS_TABLE_EMPTY_COPY['no-search'].title}
            </p>
            <p className="send-recipient-select-modal__empty-description">
              {CMS_TABLE_EMPTY_COPY['no-search'].description}
            </p>
          </div>
        )}
      </div>
    </ContentModal>
  )
}
