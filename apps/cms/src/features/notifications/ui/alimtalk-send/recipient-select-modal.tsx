import { useEffect, useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput, CmsSelect } from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { ALIMTALK_SEND_RECIPIENT_MOCK } from '@/features/notifications/model/alimtalk-send/mock'
import {
  ALIMTALK_SEND_MEMBER_TYPE_OPTIONS,
  ALIMTALK_SEND_PARTICIPATION_TYPE_OPTIONS,
  alimtalkSendRecipientTypeColumnTitle,
  alimtalkSendRecipientTypeLabel,
  filterAlimtalkSendRecipients,
} from '@/features/notifications/model/alimtalk-send/recipients'
import {
  ALIMTALK_SEND_PICKER_PAGE_SIZE,
  type AlimtalkSendRecipient,
  type AlimtalkSendRecipientSearchParams,
  type AlimtalkSendRecipientTypeMode,
} from '@/features/notifications/model/alimtalk-send/types'
import '@/features/notifications/ui/mail-send/recipient-select-modal.css'

const PICKER_Z_INDEX = 1100

/** 유형 열 — 「참여 유형」 헤더가 잘리지 않을 폭. 이름/휴대폰은 남은 폭을 나눔 */
const TYPE_COL_WIDTH = 140

type RecipientSelectModalProps = {
  open: boolean
  /** 원격 조회 결과. 미전달 시 mock + 클라이언트 필터 */
  candidates?: AlimtalkSendRecipient[]
  /** 모달 오픈 시 이미 선택된 수신자(발송 화면 누적분) */
  initialSelected?: AlimtalkSendRecipient[]
  onClose: () => void
  onConfirm: (recipients: AlimtalkSendRecipient[]) => void
  /** 발송 화면 3-1: 미선택/전체=member, 프로그램 선택=participation */
  typeMode: AlimtalkSendRecipientTypeMode
  /**
   * 검색 시 부모에서 recipient-candidates 재조회.
   * 미전달이면 candidates를 클라이언트 필터만 한다.
   */
  onSearch?: (params: AlimtalkSendRecipientSearchParams) => void
  /** 서버 페이지네이션 총 건수. 없으면 현재 목록 길이 */
  totalCount?: number
  /** 서버 페이지네이션 총 페이지(1-based). 없으면 클라이언트 슬라이스 */
  totalPages?: number
  /**
   * 푸터 「전체 선택」용 — 현재 필터의 전 페이지 수신자.
   * 미전달이면 클라이언트 필터 결과로 전체 선택.
   */
  fetchAllCandidates?: () => Promise<AlimtalkSendRecipient[]>
  zIndex?: number
}

export function RecipientSelectModal({
  open,
  candidates = ALIMTALK_SEND_RECIPIENT_MOCK,
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
  const typeColumnTitle = alimtalkSendRecipientTypeColumnTitle(typeMode)
  const typeOptions =
    typeMode === 'member'
      ? ALIMTALK_SEND_MEMBER_TYPE_OPTIONS
      : ALIMTALK_SEND_PARTICIPATION_TYPE_OPTIONS

  const [typeValue, setTypeValue] = useState('')
  const [keyword, setKeyword] = useState('')
  const [appliedType, setAppliedType] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)
  /** id → 수신자 객체. 페이지 이동해도 선택 유지 */
  const [selectedById, setSelectedById] = useState<Record<string, AlimtalkSendRecipient>>({})
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
    // initialSelected는 부모가 매 렌더 새 배열일 수 있어 열림·유형 전환에서만 초기화
  }, [open, typeMode])

  const useServerPaging = Boolean(onSearch)

  const filtered = useMemo(() => {
    if (useServerPaging) return candidates
    return filterAlimtalkSendRecipients(candidates, {
      typeMode,
      typeValue: appliedType,
      keyword: appliedKeyword,
    })
  }, [appliedKeyword, appliedType, candidates, typeMode, useServerPaging])

  /** 페이지에 로드된 수신자를 선택 맵에 보강(이미 선택된 id만) */
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

  const clientTotalPages = Math.ceil(filtered.length / ALIMTALK_SEND_PICKER_PAGE_SIZE)
  const totalPages = useServerPaging
    ? Math.max(serverTotalPages ?? 1, 1)
    : clientTotalPages
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = useServerPaging
    ? filtered
    : filtered.slice(
        (currentPage - 1) * ALIMTALK_SEND_PICKER_PAGE_SIZE,
        currentPage * ALIMTALK_SEND_PICKER_PAGE_SIZE
      )
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

  /** 푸터 「전체 선택」: 필터된 전 인원 토글. 테이블 헤더 체크와 별개 */
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

  const columns: ColumnsType<AlimtalkSendRecipient> = [
    {
      title: typeColumnTitle,
      key: 'type',
      width: TYPE_COL_WIDTH,
      align: 'center',
      render: (_value, record) => alimtalkSendRecipientTypeLabel(record) || '-',
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
          <span className="mail-send-recipient-select-modal__count-selected">{selectedCount}</span>
          명
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
                  /** 헤더·행 체크는 현재 페이지(셀)만 반영. 다른 페이지 선택은 유지 */
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
