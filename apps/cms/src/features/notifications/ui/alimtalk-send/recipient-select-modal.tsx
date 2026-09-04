import { useEffect, useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput, CmsSelect } from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { ALIMTALK_SEND_RECIPIENT_MOCK } from '@/features/notifications/model/alimtalk-send/mock'
import {
  ALIMTALK_SEND_PARTICIPATION_TYPE_OPTIONS,
  alimtalkSendParticipationTypeLabel,
  filterAlimtalkSendRecipients,
} from '@/features/notifications/model/alimtalk-send/recipients'
import {
  ALIMTALK_SEND_PICKER_PAGE_SIZE,
  type AlimtalkSendParticipationType,
  type AlimtalkSendRecipient,
} from '@/features/notifications/model/alimtalk-send/types'
import '@/features/notifications/ui/mail-send/recipient-select-modal.css'

const PICKER_Z_INDEX = 1100

/** 시안(800px 모달) 기준 컬럼 폭 — 체크 좁게 · 유형 중 · 이름/휴대폰 넓게(휴대폰이 더 넓음) */
const COL_W = {
  type: 160,
  name: 240,
  phone: 280,
} as const

const TABLE_SCROLL_X =
  TABLE_COLUMN_WIDTHS.checkbox + COL_W.type + COL_W.name + COL_W.phone

type RecipientSelectModalProps = {
  open: boolean
  candidates?: AlimtalkSendRecipient[]
  selectedIds: string[]
  onClose: () => void
  onConfirm: (recipients: AlimtalkSendRecipient[]) => void
  typeColumnTitle: string
  zIndex?: number
}

export function RecipientSelectModal({
  open,
  candidates = ALIMTALK_SEND_RECIPIENT_MOCK,
  selectedIds,
  onClose,
  onConfirm,
  typeColumnTitle,
  zIndex = PICKER_Z_INDEX,
}: RecipientSelectModalProps) {
  const [participationType, setParticipationType] = useState<AlimtalkSendParticipationType | ''>('')
  const [keyword, setKeyword] = useState('')
  const [appliedType, setAppliedType] = useState<AlimtalkSendParticipationType | ''>('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [checkedIds, setCheckedIds] = useState<string[]>(selectedIds)

  useEffect(() => {
    if (!open) return
    setCheckedIds(selectedIds)
    setParticipationType('')
    setKeyword('')
    setAppliedType('')
    setAppliedKeyword('')
    setPage(1)
  }, [open, selectedIds])

  const filtered = useMemo(
    () =>
      filterAlimtalkSendRecipients(candidates, {
        participationType: appliedType,
        keyword: appliedKeyword,
      }),
    [appliedKeyword, appliedType, candidates]
  )

  const totalPages = Math.ceil(filtered.length / ALIMTALK_SEND_PICKER_PAGE_SIZE)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = filtered.slice(
    (currentPage - 1) * ALIMTALK_SEND_PICKER_PAGE_SIZE,
    currentPage * ALIMTALK_SEND_PICKER_PAGE_SIZE
  )
  const hasResults = filtered.length > 0
  const selectedCount = checkedIds.length

  const handleSearch = () => {
    setAppliedType(participationType)
    setAppliedKeyword(keyword.trim())
    setPage(1)
  }

  const handleSelectAll = () => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      for (const recipient of filtered) next.add(recipient.id)
      return [...next]
    })
  }

  const handleConfirm = () => {
    const checked = new Set(checkedIds)
    onConfirm(candidates.filter(item => checked.has(item.id)))
  }

  const columns: ColumnsType<AlimtalkSendRecipient> = [
    {
      title: typeColumnTitle,
      dataIndex: 'participationType',
      key: 'participationType',
      width: COL_W.type,
      align: 'center',
      ellipsis: true,
      render: value => alimtalkSendParticipationTypeLabel(value) || '-',
    },
    {
      title: '수신자명',
      dataIndex: 'name',
      key: 'name',
      width: COL_W.name,
      align: 'center',
      ellipsis: true,
    },
    {
      title: '휴대폰 번호',
      dataIndex: 'phone',
      key: 'phone',
      width: COL_W.phone,
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
          <CmsButton variant="secondary" size="large" type="button" onClick={handleSelectAll}>
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
            value={participationType}
            onChange={value =>
              setParticipationType(
                value === 'participant' || value === 'volunteer' || value === 'instructor'
                  ? value
                  : ''
              )
            }
            options={ALIMTALK_SEND_PARTICIPATION_TYPE_OPTIONS}
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
          총 {filtered.length}명 / 선택{' '}
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
              tableLayout="fixed"
              scroll={{ x: TABLE_SCROLL_X }}
              rowSelection={{
                selectedRowKeys: checkedIds,
                onChange: keys => setCheckedIds(keys.map(String)),
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
              }}
            />
            <div className="mail-send-recipient-select-modal__pagination">
              <CmsCompactPagination
                variant="modal"
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                onPageChange={setPage}
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
