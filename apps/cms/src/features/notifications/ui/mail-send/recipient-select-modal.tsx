import { useEffect, useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput, CmsSelect } from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import {
  MAIL_SEND_PARTICIPATION_TYPE_OPTIONS,
  filterMailSendRecipients,
  mailSendRecipientTypeLabel,
} from '@/features/notifications/model/mail-send/recipients'
import {
  MAIL_SEND_PICKER_PAGE_SIZE,
  type MailSendParticipationType,
  type MailSendRecipient,
  type MailSendRecipientSearchParams,
} from '@/features/notifications/model/mail-send/types'
import './recipient-select-modal.css'

const PICKER_Z_INDEX = 1100

type RecipientSelectModalProps = {
  open: boolean
  candidates?: MailSendRecipient[]
  selectedIds: string[]
  onClose: () => void
  onConfirm: (recipients: MailSendRecipient[]) => void
  onSearch?: (params: MailSendRecipientSearchParams) => void
  totalCount?: number
  totalPages?: number
  fetchAllCandidates?: () => Promise<MailSendRecipient[]>
  zIndex?: number
}

export function RecipientSelectModal({
  open,
  candidates = [],
  selectedIds,
  onClose,
  onConfirm,
  onSearch,
  totalCount,
  totalPages: serverTotalPages,
  fetchAllCandidates,
  zIndex = PICKER_Z_INDEX,
}: RecipientSelectModalProps) {
  const [participationType, setParticipationType] = useState<MailSendParticipationType | ''>('')
  const [keyword, setKeyword] = useState('')
  const [appliedType, setAppliedType] = useState<MailSendParticipationType | ''>('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [selectedById, setSelectedById] = useState<Record<string, MailSendRecipient>>({})
  const [selectingAll, setSelectingAll] = useState(false)

  useEffect(() => {
    if (!open) return
    setParticipationType('')
    setKeyword('')
    setAppliedType('')
    setAppliedKeyword('')
    setPage(1)
    setSelectingAll(false)
    setSelectedById(
      Object.fromEntries(
        candidates
          .filter(item => selectedIds.includes(item.id))
          .map(item => [item.id, item])
      )
    )
  }, [open])

  const useServerPaging = Boolean(onSearch)
  const filtered = useMemo(() => {
    if (useServerPaging) return candidates
    return filterMailSendRecipients(candidates, {
      participationType: appliedType,
      keyword: appliedKeyword,
    })
  }, [appliedKeyword, appliedType, candidates, useServerPaging])

  const clientTotalPages = Math.ceil(filtered.length / MAIL_SEND_PICKER_PAGE_SIZE)
  const totalPages = useServerPaging ? Math.max(serverTotalPages ?? 1, 1) : clientTotalPages
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = useServerPaging
    ? filtered
    : filtered.slice(
        (currentPage - 1) * MAIL_SEND_PICKER_PAGE_SIZE,
        currentPage * MAIL_SEND_PICKER_PAGE_SIZE
      )
  const hasResults = filtered.length > 0
  const checkedIds = useMemo(() => Object.keys(selectedById), [selectedById])
  const selectedCount = checkedIds.length
  const displayedTotal = useServerPaging ? (totalCount ?? filtered.length) : filtered.length

  const emitSearch = (
    nextPage: number,
    nextType = appliedType,
    nextKeyword = appliedKeyword
  ) => {
    onSearch?.({
      typeValue: nextType,
      keyword: nextKeyword,
      page: Math.max(nextPage - 1, 0),
    })
  }

  const handleSearch = () => {
    const nextType = participationType
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

  const columns: ColumnsType<MailSendRecipient> = [
    {
      title: '유형',
      key: 'type',
      width: 140,
      align: 'center',
      render: (_value, record) => mailSendRecipientTypeLabel(record) || '-',
    },
    {
      title: '수신자명',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      ellipsis: true,
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
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
            placeholder="참여 유형"
            value={participationType}
            onChange={value =>
              setParticipationType(
                value === 'participant' || value === 'volunteer' || value === 'instructor'
                  ? value
                  : ''
              )
            }
            options={MAIL_SEND_PARTICIPATION_TYPE_OPTIONS}
            style={{ width: 160 }}
          />
          <span className="mail-send-recipient-select-modal__search-input">
            <CmsInput
              icon={<SearchOutlined />}
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              onPressEnter={handleSearch}
              placeholder="수신자명을 입력하세요"
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
          <span className="mail-send-recipient-select-modal__count-selected">{selectedCount}</span>
          명
        </p>

        {hasResults ? (
          <>
            <Table
              className="cms-data-table cms-data-table--skip-auto-no-col mail-send-recipient-select-modal__table"
              columns={columns}
              dataSource={paged}
              rowKey="id"
              pagination={false}
              rowSelection={{
                selectedRowKeys: checkedIds,
                onChange: keys => {
                  const nextIds = new Set(keys.map(String))
                  setSelectedById(prev => {
                    const next = { ...prev }
                    for (const recipient of paged) {
                      if (nextIds.has(recipient.id)) next[recipient.id] = recipient
                      else delete next[recipient.id]
                    }
                    return next
                  })
                },
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
              }}
            />
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
