import { useEffect, useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput, CmsSelect } from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { SMS_SEND_RECIPIENT_MOCK } from '@/features/notifications/model/sms-send/mock'
import {
  SMS_SEND_MEMBER_TYPE_OPTIONS,
  SMS_SEND_PARTICIPATION_TYPE_OPTIONS,
  filterSmsSendRecipients,
  smsSendRecipientTypeColumnTitle,
  smsSendRecipientTypeLabel,
} from '@/features/notifications/model/sms-send/recipients'
import type {
  SmsSendRecipient,
  SmsSendRecipientSearchParams,
  SmsSendRecipientTypeMode,
} from '@/features/notifications/model/sms-send/types'
import { SMS_SEND_PICKER_PAGE_SIZE } from '@/features/notifications/model/sms-send/types'
import '@/features/notifications/ui/mail-send/recipient-select-modal.css'

const PICKER_Z_INDEX = 1100
const TYPE_COL_WIDTH = 140

type RecipientSelectModalProps = {
  open: boolean
  candidates?: SmsSendRecipient[]
  initialSelected?: SmsSendRecipient[]
  onClose: () => void
  onConfirm: (recipients: SmsSendRecipient[]) => void
  typeMode: SmsSendRecipientTypeMode
  onSearch?: (params: SmsSendRecipientSearchParams) => void
  totalCount?: number
  totalPages?: number
  fetchAllCandidates?: () => Promise<SmsSendRecipient[]>
  zIndex?: number
}

export function RecipientSelectModal({
  open,
  candidates = SMS_SEND_RECIPIENT_MOCK,
  initialSelected = [],
  onClose,
  onConfirm,
  typeMode,
  onSearch,
  totalCount,
  totalPages: serverTotalPages,
  fetchAllCandidates,
  zIndex = PICKER_Z_INDEX,
}: RecipientSelectModalProps) {
  const typeColumnTitle = smsSendRecipientTypeColumnTitle(typeMode)
  const typeOptions =
    typeMode === 'member' ? SMS_SEND_MEMBER_TYPE_OPTIONS : SMS_SEND_PARTICIPATION_TYPE_OPTIONS

  const [typeValue, setTypeValue] = useState('')
  const [keyword, setKeyword] = useState('')
  const [appliedType, setAppliedType] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [selectedById, setSelectedById] = useState<Record<string, SmsSendRecipient>>({})
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
  }, [open, typeMode])

  const useServerPaging = Boolean(onSearch)

  const filtered = useMemo(() => {
    if (useServerPaging) return candidates
    return filterSmsSendRecipients(candidates, {
      typeMode,
      typeValue: appliedType,
      keyword: appliedKeyword,
    })
  }, [appliedKeyword, appliedType, candidates, typeMode, useServerPaging])

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

  const clientTotalPages = Math.ceil(filtered.length / SMS_SEND_PICKER_PAGE_SIZE)
  const totalPages = useServerPaging ? Math.max(serverTotalPages ?? 1, 1) : clientTotalPages
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = useServerPaging
    ? filtered
    : filtered.slice(
        (currentPage - 1) * SMS_SEND_PICKER_PAGE_SIZE,
        currentPage * SMS_SEND_PICKER_PAGE_SIZE
      )
  const hasResults = filtered.length > 0
  const checkedIds = useMemo(() => Object.keys(selectedById), [selectedById])
  const selectedCount = checkedIds.length
  const displayedTotal = useServerPaging ? (totalCount ?? filtered.length) : filtered.length
  const allSelected = displayedTotal > 0 && selectedCount >= displayedTotal

  function emitSearch(nextPage: number, nextType = appliedType, nextKeyword = appliedKeyword) {
    onSearch?.({
      typeValue: nextType,
      keyword: nextKeyword,
      page: Math.max(nextPage - 1, 0),
    })
  }

  function handleSearch() {
    const nextType = typeValue
    const nextKeyword = keyword.trim()
    setAppliedType(nextType)
    setAppliedKeyword(nextKeyword)
    setPage(1)
    setSelectedById({})
    emitSearch(1, nextType, nextKeyword)
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
    if (useServerPaging) emitSearch(nextPage)
  }

  async function handleSelectAll() {
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

  function handleConfirm() {
    onConfirm(Object.values(selectedById))
  }

  const columns: ColumnsType<SmsSendRecipient> = [
    {
      title: typeColumnTitle,
      key: 'type',
      width: TYPE_COL_WIDTH,
      align: 'center',
      render: (_value, record) => smsSendRecipientTypeLabel(record) || '-',
    },
    {
      title: '수신자명',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      ellipsis: true,
    },
    {
      title: '휴대폰 번호',
      dataIndex: 'phone',
      key: 'phone',
      align: 'center',
      ellipsis: true,
    },
  ]

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="수신자 설정"
      size="default"
      className="mail-send-recipient-select-modal"
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
      <div className="mail-send-recipient-select-modal__body">
        <div className="mail-send-recipient-select-modal__search">
          <CmsSelect
            inputSize="large"
            placeholder={typeColumnTitle}
            value={typeValue || undefined}
            onChange={value => setTypeValue(typeof value === 'string' ? value : '')}
            options={typeOptions}
            allowClear
            style={{ width: 180 }}
          />
          <span className="mail-send-recipient-select-modal__search-input">
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

        <p className="mail-send-recipient-select-modal__count">
          총 {displayedTotal}명 / 선택{' '}
          <span className="mail-send-recipient-select-modal__count-selected">{selectedCount}</span>명
        </p>

        {hasResults ? (
          <>
            <div className="mail-send-recipient-select-modal__table-wrap">
              <Table
                className="cms-data-table cms-data-table--skip-auto-no-col mail-send-recipient-select-modal__table"
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
            <div className="mail-send-recipient-select-modal__pagination">
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
          <div className="mail-send-recipient-select-modal__empty" role="status">
            {'검색 결과가 없습니다.\n검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.'}
          </div>
        )}
      </div>
    </ContentModal>
  )
}
