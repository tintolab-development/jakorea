import { useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput, CmsSelect } from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { MAIL_SEND_RECIPIENT_MOCK } from '@/features/notifications/model/mail-send/mock'
import {
  MAIL_SEND_PARTICIPATION_TYPE_OPTIONS,
  filterMailSendRecipients,
  mailSendParticipationTypeLabel,
} from '@/features/notifications/model/mail-send/recipients'
import {
  MAIL_SEND_PICKER_PAGE_SIZE,
  type MailSendParticipationType,
  type MailSendRecipient,
} from '@/features/notifications/model/mail-send/types'
import './recipient-select-modal.css'

const PICKER_Z_INDEX = 1100

type RecipientSelectModalProps = {
  open: boolean
  candidates?: MailSendRecipient[]
  selectedIds: string[]
  onClose: () => void
  onConfirm: (recipients: MailSendRecipient[]) => void
  zIndex?: number
}

export function RecipientSelectModal({
  open,
  candidates = MAIL_SEND_RECIPIENT_MOCK,
  selectedIds,
  onClose,
  onConfirm,
  zIndex = PICKER_Z_INDEX,
}: RecipientSelectModalProps) {
  const [participationType, setParticipationType] = useState<MailSendParticipationType | ''>('')
  const [keyword, setKeyword] = useState('')
  const [appliedType, setAppliedType] = useState<MailSendParticipationType | ''>('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [checkedIds, setCheckedIds] = useState<string[]>(selectedIds)

  const filtered = useMemo(
    () =>
      filterMailSendRecipients(candidates, {
        participationType: appliedType,
        keyword: appliedKeyword,
      }),
    [appliedKeyword, appliedType, candidates]
  )

  const totalPages = Math.ceil(filtered.length / MAIL_SEND_PICKER_PAGE_SIZE)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = filtered.slice(
    (currentPage - 1) * MAIL_SEND_PICKER_PAGE_SIZE,
    currentPage * MAIL_SEND_PICKER_PAGE_SIZE
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

  const columns: ColumnsType<MailSendRecipient> = [
    {
      title: '참여 유형',
      dataIndex: 'participationType',
      key: 'participationType',
      width: 140,
      align: 'center',
      render: value => mailSendParticipationTypeLabel(value) || '-',
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
          총 {filtered.length}명 /{' '}
          <span className="mail-send-recipient-select-modal__count-selected">
            선택 {selectedCount}명
          </span>
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
