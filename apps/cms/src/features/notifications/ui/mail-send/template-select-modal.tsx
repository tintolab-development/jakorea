import { useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput } from '@/shared/ui'
import type { MailTemplateItem } from '@/features/notifications/model/mail-template/types'
import { MAIL_SEND_PICKER_PAGE_SIZE } from '@/features/notifications/model/mail-send/types'
import './template-select-modal.css'

type TemplateSelectModalProps = {
  open: boolean
  templates: MailTemplateItem[]
  onClose: () => void
  onPreview: (template: MailTemplateItem) => void
  onUse: (template: MailTemplateItem) => void
  zIndex?: number
}

function matchesTemplateName(template: MailTemplateItem, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return true
  return (
    template.name.toLowerCase().includes(needle) ||
    template.templateName.toLowerCase().includes(needle)
  )
}

export function TemplateSelectModal({
  open,
  templates,
  onClose,
  onPreview,
  onUse,
  zIndex,
}: TemplateSelectModalProps) {
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => templates.filter(template => matchesTemplateName(template, appliedKeyword)),
    [appliedKeyword, templates]
  )

  const totalPages = Math.ceil(filtered.length / MAIL_SEND_PICKER_PAGE_SIZE)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = filtered.slice(
    (currentPage - 1) * MAIL_SEND_PICKER_PAGE_SIZE,
    currentPage * MAIL_SEND_PICKER_PAGE_SIZE
  )
  const hasResults = filtered.length > 0

  const handleSearch = () => {
    setAppliedKeyword(keyword.trim())
    setPage(1)
  }

  const columns: ColumnsType<MailTemplateItem> = [
    {
      title: '템플릿명',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      className: 'mail-send-template-select-modal__col-name',
      onHeaderCell: () => ({ className: 'mail-send-template-select-modal__col-name' }),
      ellipsis: true,
    },
    {
      title: '관리',
      key: 'actions',
      width: 220,
      align: 'center',
      className: 'mail-send-template-select-modal__col-actions',
      onHeaderCell: () => ({ className: 'mail-send-template-select-modal__col-actions' }),
      render: (_, record) => (
        <div
          className="mail-send-template-select-modal__row-actions"
          onClick={event => event.stopPropagation()}
        >
          <CmsButton
            type="button"
            variant="default"
            size="small"
            width={80}
            className="mail-send-template-select-modal__action-btn mail-send-template-select-modal__action-btn--preview"
            onClick={event => {
              event.stopPropagation()
              onPreview(record)
            }}
          >
            미리보기
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="small"
            width={80}
            className="mail-send-template-select-modal__action-btn mail-send-template-select-modal__action-btn--use"
            onClick={event => {
              event.stopPropagation()
              onUse(record)
            }}
          >
            사용하기
          </CmsButton>
        </div>
      ),
    },
  ]

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="템플릿 선택"
      size="default"
      className="mail-send-template-select-modal"
      titleBodyGap="always"
      zIndex={zIndex}
      footer={
        <CmsButton variant="cancel" size="large" type="button" onClick={onClose}>
          닫기
        </CmsButton>
      }
    >
      <div className="mail-send-template-select-modal__body">
        <div className="mail-send-template-select-modal__search">
          <span className="mail-send-template-select-modal__search-input">
            <CmsInput
              icon={<SearchOutlined />}
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              onPressEnter={handleSearch}
              placeholder="템플릿명을 입력하세요"
              inputSize="large"
              width="100%"
              allowClear
            />
          </span>
          <CmsButton type="button" variant="primary" size="large" onClick={handleSearch}>
            검색
          </CmsButton>
        </div>

        {hasResults ? (
          <>
            <div className="mail-send-template-select-modal__table-section">
              <p className="mail-send-template-select-modal__count">총 {filtered.length}건</p>
              <Table
                className="cms-data-table cms-data-table--skip-auto-no-col mail-send-template-select-modal__table"
                columns={columns}
                dataSource={paged}
                rowKey="id"
                pagination={false}
              />
            </div>
            <div className="mail-send-template-select-modal__pagination">
              <CmsCompactPagination
                variant="modal"
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                onPageChange={setPage}
                ariaLabel="템플릿 선택 페이지 이동"
              />
            </div>
          </>
        ) : (
          <div className="mail-send-template-select-modal__empty" role="status">
            {'검색 결과가 없습니다.\n검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.'}
          </div>
        )}
      </div>
    </ContentModal>
  )
}
